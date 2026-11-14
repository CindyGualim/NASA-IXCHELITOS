"""
Capa de AUTORREPORTE de Ixchel.

El astronauta cuenta cómo se siente (check-in, escalas, selector de estado) y esta capa:
  1. puntúa cada formulario (WHO-5, PHQ-9, GAD-7, PHQ-4, SPANE, PCL-5, ISI, BGQ, AUDIT-C, TLX, ASQ, MDQ…),
  2. aplica las reglas R01–R26 de la base de conocimiento (conocimiento/base_conocimiento_psicologica.json),
  3. propone qué formulario llenar según cómo se siente (selector de estado),
  4. entrega la guía del protocolo (GP1–GP6) cuando una alerta lo pide,
  5. se une al motor existente (AstronautMonitor / IxchelMonitor) con MonitorAutoreporte.

Reglas de oro (vienen del LEEME de la base):
  - Es apoyo a la decisión, NO diagnóstico. Todo requiere confirmación humana.
  - La seguridad (SF1, ASQ, PHQ-9 ítem 9, observadores CO3/CO4) se evalúa aparte y SIEMPRE prevalece.
  - La línea base es personal, no una norma de población.
  - Los protocolos clínicos son "propuesta para revisión clínica": un psicólogo/psiquiatra debe aprobarlos.
  - Las traducciones de los ítems son literales y no están validadas.
  - Las reglas de tendencia (EWMA/CUSUM, umbrales de z) están marcadas "por calibrar" (P28).
"""
from __future__ import annotations

import json
import math
from pathlib import Path

RUTA_KB = Path(__file__).resolve().parent / "conocimiento" / "base_conocimiento_psicologica.json"

AVISO = ("Apoyo a la decisión, no es un diagnóstico. Requiere confirmación de una persona. "
         "Protocolos pendientes de revisión clínica.")

ORDEN_NIVEL = {"VERDE": 0, "AMARILLO": 1, "ROJO": 2}
# nivel de la base de conocimiento -> nivel del motor
NIVEL_MOTOR = {"ambar": "AMARILLO", "firme": "AMARILLO", "causa_ambiental": "AMARILLO",
               "roja": "ROJO", "inmediata": "ROJO"}

_KB = None


def cargar_kb(ruta=None):
    """Carga (una sola vez) el JSON de la base de conocimiento."""
    global _KB
    if ruta is not None:
        return json.loads(Path(ruta).read_text(encoding="utf-8"))
    if _KB is None:
        _KB = json.loads(RUTA_KB.read_text(encoding="utf-8"))
    return _KB


def formulario(banco):
    """Devuelve el formulario (ítems, escalas, textos) para que la app lo dibuje. Ej: formulario('Q_PHQ9')."""
    return cargar_kb()["question_banks"][banco]


# ----------------------------------------------------------------------------------------------
# 1. PUNTUACIÓN
# ----------------------------------------------------------------------------------------------
def _num(resp, ids):
    """Lista de valores numéricos; falla con un mensaje claro si falta un ítem."""
    faltan = [i for i in ids if resp.get(i) is None]
    if faltan:
        raise ValueError(f"Faltan ítems: {', '.join(faltan)}")
    return [float(resp[i]) for i in ids]


def _ids(prefijo, n, ancho=1):
    return [f"{prefijo}{i:0{ancho}d}" for i in range(1, n + 1)]


def invertir(valor, lo, hi):
    """Ítem con reverse_scored: 1..5 -> 5..1. Se invierte ANTES de calcular."""
    return lo + hi - valor


def _banda(v, cortes, etiquetas):
    for c, e in zip(cortes, etiquetas):
        if v <= c:
            return e
    return etiquetas[-1]


def puntuar_who5(r):
    raw = sum(_num(r, [f"W{i}" for i in range(1, 6)]))
    pct = raw * 4
    return {"instrumento": "WHO-5", "puntaje": raw, "porcentaje": pct,
            "positivo": raw < 13 or pct <= 50,
            "detalle": f"WHO-5 {raw:g}/25 ({pct:g}%)" + (": bienestar bajo" if (raw < 13 or pct <= 50) else "")}


def puntuar_phq9(r):
    v = _num(r, _ids("PH", 9))
    t = sum(v)
    sev = _banda(t, [4, 9, 14, 19], ["mínima", "leve", "moderada", "moderadamente grave", "grave"])
    return {"instrumento": "PHQ-9", "puntaje": t, "severidad": sev, "item9": v[8],
            "positivo": t >= 5, "detalle": f"PHQ-9 {t:g}/27 ({sev}); ítem 9 = {v[8]:g}"}


def puntuar_gad7(r):
    t = sum(_num(r, _ids("GA", 7)))
    sev = _banda(t, [4, 9, 14], ["mínima", "leve", "moderada", "grave"])
    return {"instrumento": "GAD-7", "puntaje": t, "severidad": sev, "positivo": t >= 10,
            "detalle": f"GAD-7 {t:g}/21 ({sev})"}


def puntuar_phq4(r):
    v = _num(r, ["P41", "P42", "P43", "P44"])
    ans, dep = v[0] + v[1], v[2] + v[3]
    return {"instrumento": "PHQ-4", "puntaje": sum(v), "ansiedad": ans, "depresion": dep,
            "positivo": ans >= 3 or dep >= 3,
            "detalle": f"PHQ-4: ansiedad {ans:g}/6, depresión {dep:g}/6"}


def puntuar_spane(r):
    pos = sum(_num(r, [f"SP{i}" for i in (1, 3, 5, 7, 10, 12)]))
    neg = sum(_num(r, [f"SP{i}" for i in (2, 4, 6, 8, 9, 11)]))
    return {"instrumento": "SPANE", "positivo_afecto": pos, "negativo_afecto": neg, "balance": pos - neg,
            "puntaje": pos - neg, "positivo": False,
            "detalle": f"SPANE: P {pos:g}, N {neg:g}, balance {pos - neg:g} (sin corte propio)"}


def puntuar_pcl5(r):
    v = _num(r, _ids("PC", 20, 2))
    t = sum(v)
    cl = {"B": v[0:5], "C": v[5:7], "D": v[7:14], "E": v[14:20]}
    n = {k: sum(1 for x in vals if x >= 2) for k, vals in cl.items()}
    dsm = n["B"] >= 1 and n["C"] >= 1 and n["D"] >= 2 and n["E"] >= 2
    return {"instrumento": "PCL-5", "puntaje": t, "clusters_items_ge2": n, "regla_dsm_provisional": dsm,
            "positivo": t >= 31,
            "detalle": f"PCL-5 {t:g}/80 (corte 31); regla DSM provisional: {'sí' if dsm else 'no'}"}


def puntuar_isi(r):
    t = sum(_num(r, _ids("IS", 7, 2)))
    sev = _banda(t, [7, 14, 21], ["sin insomnio", "subumbral", "moderado", "grave"])
    return {"instrumento": "ISI", "puntaje": t, "severidad": sev, "positivo": t >= 15,
            "detalle": f"ISI {t:g}/28 ({sev})"}


def puntuar_bgq(r):
    t = sum(_num(r, _ids("BG", 5, 2)))
    return {"instrumento": "BGQ", "puntaje": t, "positivo": t >= 4,
            "detalle": f"BGQ {t:g}/10 (corte 4)"}


def puntuar_auditc(r, sexo=None):
    t = sum(_num(r, ["AU1", "AU2", "AU3"]))
    corte = 4 if str(sexo or "").upper().startswith("M") else 3
    nota = "" if sexo else " (sexo no indicado: se usa el corte más sensible, 3)"
    return {"instrumento": "AUDIT-C", "puntaje": t, "corte": corte, "positivo": t >= corte,
            "detalle": f"AUDIT-C {t:g}/12 (corte {corte}){nota}"}


def puntuar_tlx(r):
    v = _num(r, _ids("TL", 6))
    m = sum(v) / 6
    return {"instrumento": "NASA-TLX", "puntaje": round(m, 1), "positivo": False,
            "detalle": f"NASA-TLX crudo {m:.0f}/100 (sin corte)"}


def puntuar_asq(r, rechazo=False):
    v = [r.get(f"AQ{i}") for i in range(1, 5)]
    pos = bool(rechazo) or any(x in (1, True, "si", "sí") for x in v)
    agudo = r.get("AQ5") in (1, True, "si", "sí")
    return {"instrumento": "ASQ", "positivo": pos, "agudo": pos and agudo, "rechazo": bool(rechazo),
            "puntaje": int(pos) + int(pos and agudo),
            "detalle": "ASQ positivo" + (" AGUDO (AQ5 sí)" if (pos and agudo) else (" no agudo" if pos else ": negativo"))}


def puntuar_mdq(r):
    n = sum(1 for i in _ids("MQ", 13, 2) if r.get(i) in (1, True, "si", "sí"))
    co = r.get("MQ14") in (1, True, "si", "sí")
    grave = str(r.get("MQ15", "")).lower() in ("moderado", "grave")
    pos = n >= 7 and co and grave
    return {"instrumento": "MDQ", "puntaje": n, "coocurrencia": co, "deterioro_moderado_grave": grave,
            "positivo": pos,
            "detalle": f"MDQ {n}/13 síntomas, co-ocurrencia {'sí' if co else 'no'}, deterioro {r.get('MQ15', '-')}",
            "nota": "Corte 7 publicado con el texto original; con la redacción adaptada no está validado (P46)."}


def puntuar_pg13r(r):
    vals = [float(v) for k, v in r.items() if str(k).startswith("PG") and v is not None]
    return {"instrumento": "PG-13-R", "puntaje": sum(vals), "positivo": False,
            "detalle": "PG-13-R exploratorio: SIN corte (el de 30 NO aplica a los ítems del equipo).",
            "nota": "Escala de respuesta sin definir; no se usa para alertar."}


def puntuar_checkin(r):
    """Compuesto de bienestar 1–5 (más alto = mejor). CK3, CK4 se invierten. CK6 (carga) se guarda aparte."""
    ck = {i: float(r[i]) for i in ("CK1", "CK3", "CK4", "CK5", "CK7") if r.get(i) is not None}
    faltan = [i for i in ("CK1", "CK3", "CK4", "CK5", "CK7") if i not in ck]
    if faltan:
        raise ValueError(f"Faltan ítems: {', '.join(faltan)}")
    comp = (ck["CK1"] + invertir(ck["CK3"], 1, 5) + invertir(ck["CK4"], 1, 5) + ck["CK5"] + ck["CK7"]) / 5
    out = {"instrumento": "Check-in", "puntaje": round(comp, 3), "positivo": False,
           "animo_motivacion": None, "estres_vas": round((ck["CK3"] - 1) / 4 * 100, 1),
           "detalle": f"Check-in compuesto {comp:.2f}/5 (más alto = mejor)"}
    if r.get("CK1") is not None and r.get("CK2") is not None:
        out["animo_motivacion"] = (float(r["CK1"]) + float(r["CK2"])) / 2
    if r.get("CK8"):
        out["texto_libre"] = r["CK8"]
    return out


def puntuar_seguridad(r):
    v = r.get("SF1")
    if v is None:
        raise ValueError("Falta SF1")
    return {"instrumento": "SF1", "puntaje": float(v), "positivo": float(v) != 0,
            "detalle": "SF1 = %g" % float(v)}


def puntuar_duelo_diario(r):
    gd1, gd2, gd3, gd4 = (float(r[k]) for k in ("GD1", "GD2", "GD3", "GD4"))
    return {"instrumento": "Duelo diario", "puntaje": None, "gd1_crudo": gd1, "gd3_crudo": gd3,
            "gd1_inv": invertir(gd1, 1, 5), "gd3_inv": invertir(gd3, 1, 5), "positivo": False,
            "detalle": f"Duelo diario: tristeza {gd1:g}/5, contacto con otros {gd3:g}/5, sueño {gd4:g}/5"}


def puntuar_equipo(r):
    """Cohesión 0–100 (más alto = mejor). TM2 (tensión) se invierte."""
    v = {i: float(r[i]) for i in ("TM1", "TM2", "TM3", "TM4", "TM5", "TM6") if r.get(i) is not None}
    if len(v) < 6:
        raise ValueError("Faltan ítems de TM1 a TM6")
    v["TM2"] = invertir(v["TM2"], 1, 5)
    coh = (sum(v.values()) / 6 - 1) / 4 * 100
    return {"instrumento": "Equipo", "puntaje": round(coh, 1), "cohesion_vas": round(coh, 1), "positivo": False,
            "detalle": f"Cohesión {coh:.0f}/100"}


def puntuar_observador(r):
    si = lambda k: r.get(k) in (1, True, "si", "sí")
    return {"instrumento": "Observador", "puntaje": sum(si(f"CO{i}") for i in range(1, 7)), "positivo": False,
            "suicida": si("CO3") or si("CO4"), "confusion_agitacion": si("CO5") or si("CO6"),
            "detalle": "Observación de un compañero"}


PUNTUADORES = {
    "who5": puntuar_who5, "phq9": puntuar_phq9, "gad7": puntuar_gad7, "phq4": puntuar_phq4,
    "spane": puntuar_spane, "pcl5": puntuar_pcl5, "isi": puntuar_isi, "bgq": puntuar_bgq,
    "auditc": puntuar_auditc, "tlx": puntuar_tlx, "asq": puntuar_asq, "mdq": puntuar_mdq,
    "pg13r": puntuar_pg13r, "checkin": puntuar_checkin, "seguridad": puntuar_seguridad,
    "duelo_diario": puntuar_duelo_diario, "equipo": puntuar_equipo, "observador": puntuar_observador,
}


def puntuar(nombre, respuestas, **kw):
    """Puntúa un formulario. Ej: puntuar('phq9', {'PH1':1, ... 'PH9':0})."""
    if nombre not in PUNTUADORES:
        raise KeyError(f"Formulario desconocido: {nombre}. Opciones: {', '.join(PUNTUADORES)}")
    return PUNTUADORES[nombre](respuestas, **kw)


def rci(m1, m2, sd, r_fiab, adj_practica=0.0, z=1.96):
    """Cambio fiable (RCI). Solo úsalo con confiabilidad real y línea base propia; si no, usa R01/R02.
    SEM = SD·√(1−r); SEdiff = √(2·SEM²). Devuelve (cambio_fiable, diferencia_ajustada)."""
    sem = sd * math.sqrt(1 - r_fiab)
    se_dif = math.sqrt(2 * sem ** 2)
    dif = (m2 - m1) - adj_practica
    return abs(dif) > z * se_dif, dif


# ----------------------------------------------------------------------------------------------
# 2. SELECTOR DE ESTADO (Q_STATE / forms_by_state)
# ----------------------------------------------------------------------------------------------
# índice en forms_by_state (ver la base): 0 bien, 1 decaído, 2 nervioso, 3 evento<1m, 4 evento>=1m,
# 5 pérdida<6m, 6 pérdida>=6m, 7 duermo mal, 8 energía, 9 carga, 10 solo, 11 alcohol, 12 morir, 13 compañero
_PRIORIDAD = {"ST11": 0, "ST04": 1, "ST05": 1}


def proponer_formularios(estados, dias_desde_evento=None, dias_desde_perdida=None):
    """El astronauta marca uno o más estados (ST01…ST11). Devuelve los formularios en orden de prioridad:
    primero seguridad (ST11), luego trauma/pérdida (ST04/ST05), luego el resto. Nunca descarta una opción marcada."""
    kb = cargar_kb()
    fs = kb["forms_by_state"]
    estados = list(dict.fromkeys(estados))
    items = {i["id"]: i for i in kb["question_banks"]["Q_STATE"]["items"]}
    desconocidos = [e for e in estados if e not in items]
    if desconocidos:
        raise KeyError(f"Estados desconocidos: {desconocidos}")
    plan = []
    for e in sorted(estados, key=lambda s: (_PRIORIDAD.get(s, 2), s)):
        if e == "ST01" and len(estados) > 1:
            continue  # "estoy bien" es opción de cierre; si marcó otras, manda lo demás
        if e == "ST04":
            idx = 3 if (dias_desde_evento is not None and dias_desde_evento < 30) else 4
        elif e == "ST05":
            idx = 5 if (dias_desde_perdida is None or dias_desde_perdida < 180) else 6
        else:
            idx = {"ST01": 0, "ST02": 1, "ST03": 2, "ST06": 7, "ST07": 8, "ST08": 9, "ST09": 10,
                   "ST10": 11, "ST11": 12}[e]
        f = fs[idx]
        plan.append({"estado": e, "texto_estado": items[e]["text"], "formularios": f["forms"],
                     "cadencia": f["cadence"], "siguiente": f["next"],
                     "inmediato": e == "ST11" or f["cadence"] == "inmediata",
                     "seguridad": e == "ST11"})
    return plan


# ----------------------------------------------------------------------------------------------
# 3. PROTOCOLOS (GP1–GP6)
# ----------------------------------------------------------------------------------------------
_GP_POR_REGLA = {"R05": "GP3", "R12": "GP3", "R26": "GP3", "R25": "GP4", "R23": "GP1", "R24": "GP2"}


def guia_protocolo(gp):
    """Devuelve el protocolo completo (fases/pasos, qué NO hacer…) tal como está en la base, con su aviso."""
    cp = cargar_kb()["clinical_protocols"]
    if gp not in cp or gp == "meta":
        raise KeyError(f"Protocolo desconocido: {gp}")
    out = dict(cp[gp])
    out["estado"] = cp["meta"]["status"]
    out["aviso_clinico"] = cp["meta"]["review_note"]
    return out


# ----------------------------------------------------------------------------------------------
# 4. REGLAS Y ESTADO POR ASTRONAUTA
# ----------------------------------------------------------------------------------------------
def _alerta(codigo, dominio, nivel_kb, detalle, accion="", protocolo=None, **extra):
    a = {"codigo": codigo, "dominio": dominio, "nivel": NIVEL_MOTOR[nivel_kb], "nivel_kb": nivel_kb,
         "detalle": detalle, "accion": accion, "fuente": "autorreporte",
         "revision_clinica_pendiente": True}
    if protocolo:
        a["protocolo"] = protocolo
    a.update(extra)
    return a


def _confusores(ctx):
    """CO2 >= 2,3 mmHg; ruido >= 67 dBA en 24 h o NC>40 en el sueño; sueño <= 5 h (R03/R09)."""
    c = []
    co2 = ctx.get("co2_mmhg")
    if co2 is None and ctx.get("co2_ppm") is not None:
        co2 = ctx["co2_ppm"] * 0.00076  # 1 ppm ≈ 0,00076 mmHg a 1 atm
    if co2 is not None and co2 >= 2.3:
        c.append(f"CO₂ {co2:.1f} mmHg (≥2,3)")
    if (ctx.get("ruido_dba_24h") or 0) >= 67:
        c.append(f"ruido {ctx['ruido_dba_24h']:.0f} dBA en 24 h (≥67)")
    if (ctx.get("ruido_nc_sueno") or 0) > 40:
        c.append(f"ruido en el sueño NC-{ctx['ruido_nc_sueno']:.0f} (>40)")
    if ctx.get("sueno_h") is not None and ctx["sueno_h"] <= 5:
        c.append(f"sueño {ctx['sueno_h']:.1f} h (≤5)")
    return c


class Autoreporte:
    """Estado de autorreporte de UN astronauta. No guarda nada fuera de memoria (decisión: offline y simple)."""

    MIN_BASE = 14          # días de check-in para fijar la línea base (R08)
    LAMBDA = 0.2           # EWMA, por calibrar (P28)
    L_EWMA = 3.0           # por calibrar (P28)
    K_CUSUM = 0.5          # por calibrar (P28)
    H_CUSUM = 4.0          # por calibrar (P28)
    Z_R01 = -1.0           # z del compuesto para "baja sostenida" (por calibrar)
    Z_R04 = -1.5           # z para "marcada y persistente" (por calibrar)
    SD_MIN = 0.25          # piso de la desviación del compuesto (escala 1–5)

    def __init__(self, sexo=None):
        self.sexo = sexo
        self.checkins = []        # [(dia, compuesto, animo_motivacion)]
        self.duelo = []           # [(dia, gd1_crudo)]
        self.ultimos = {}         # último resultado por formulario
        self.eventos = []

    # ---- registro de formularios -> alertas inmediatas por puntaje
    def registrar(self, nombre, respuestas, dia, **kw):
        """Puntúa, guarda y devuelve (resultado, alertas). kw: sexo, dias_desde_evento, meses_desde_muerte, rechazo."""
        kw_p = {}
        if nombre == "auditc":
            kw_p["sexo"] = kw.get("sexo", self.sexo)
        if nombre == "asq":
            kw_p["rechazo"] = kw.get("rechazo", False)
        res = puntuar(nombre, respuestas, **kw_p)
        res["dia"] = dia
        self.ultimos[nombre] = res
        al = []
        if nombre == "checkin":
            self.checkins.append((dia, res["puntaje"], res["animo_motivacion"]))
        elif nombre == "duelo_diario":
            self.duelo.append((dia, res["gd1_crudo"]))
        al += self._reglas_puntaje(nombre, res, dia, kw)
        return res, al

    def _reglas_puntaje(self, nombre, res, dia, kw):
        a = []
        # --- seguridad primero: prevalece sobre todo
        if nombre == "seguridad" and res["positivo"]:
            a.append(_alerta("R05", "seguridad", "inmediata",
                             "Respuesta distinta de 'No' en SF1: escalar ya, sin esperar tendencia.",
                             "Contacto con el cirujano de vuelo y el equipo clínico; no dejar a la persona sola.",
                             "GP3", seguridad=True))
        if nombre == "asq" and res["positivo"]:
            a.append(_alerta("R12", "seguridad", "inmediata",
                             res["detalle"] + (" (el rechazo a contestar cuenta como positivo)" if res["rechazo"] else ""),
                             "Aviso inmediato; C-SSRS de cribado con un clínico; plan de seguridad."
                             + (" Riesgo AGUDO: no dejar sola a la persona hasta que un clínico evalúe." if res["agudo"] else ""),
                             "GP3", seguridad=True, agudo=res["agudo"]))
        if nombre == "phq9" and res["item9"] > 0:
            a.append(_alerta("R12", "seguridad", "inmediata",
                             f"PHQ-9 ítem 9 = {res['item9']:g} (pensamientos de morir o de hacerse daño).",
                             "Aviso inmediato; aplicar ASQ y C-SSRS con un clínico.", "GP3", seguridad=True))
        if nombre == "observador":
            if res["suicida"]:
                a.append(_alerta("R26", "seguridad", "inmediata",
                                 "Un compañero reporta habla de no querer seguir o de despedirse (CO3/CO4).",
                                 "Aviso inmediato al comandante y cirujano de vuelo; no dejar sola a la persona.",
                                 "GP3", seguridad=True))
            if res["confusion_agitacion"]:
                a.append(_alerta("R25", "psico", "inmediata",
                                 "Un compañero reporta confusión o agitación importante (CO5/CO6).",
                                 "Evaluar seguridad; descartar CO₂, hipoxia, fármacos o enfermedad antes de asumir causa psicológica.",
                                 "GP4"))
        # --- escalas de cribado
        if nombre == "phq4" and res["positivo"]:
            que = "ansiedad" if res["ansiedad"] >= 3 else "depresión"
            if res["ansiedad"] >= 3 and res["depresion"] >= 3:
                que = "ansiedad y depresión"
            a.append(_alerta("R13", "psico", "ambar", f"PHQ-4 positivo en {que}.",
                             "Pasar a GAD-7 o PHQ-9 en 24 horas.", "GP5"))
        if nombre == "phq9":
            t = res["puntaje"]
            if t >= 15:
                a.append(_alerta("R16", "psico", "roja", res["detalle"],
                                 "Contacto clínico en 24 horas." + (" Derivación urgente (≥20)." if t >= 20 else ""),
                                 "GP5", derivacion_urgente=t >= 20))
            elif t >= 10:
                a.append(_alerta("R15", "psico", "firme", res["detalle"],
                                 "Aviso al equipo clínico y plan de tratamiento.", "GP5"))
            elif t >= 5:
                a.append(_alerta("R14", "psico", "ambar", res["detalle"],
                                 "Vigilancia y autoayuda; repetir en 2 semanas.", "GP5"))
        if nombre == "gad7" and res["positivo"]:
            a.append(_alerta("R17", "psico", "firme", res["detalle"],
                             "Aviso al equipo clínico y plan de tratamiento.", "GP5"))
        if nombre == "pcl5":
            ev = kw.get("dias_desde_evento")
            if res["positivo"] and ev is not None and ev >= 30:
                a.append(_alerta("R18", "psico", "firme", res["detalle"] + f"; evento hace {ev} días.",
                                 "Aviso al equipo clínico.", "GP5"))
            elif res["positivo"]:
                res["nota_tiempo"] = ("Sin duración suficiente (evento <1 mes o fecha desconocida): "
                                      "no se interpreta como trastorno (F95). Apoyo y seguimiento.")
        if nombre == "isi" and res["positivo"]:
            a.append(_alerta("R19", "sueno", "ambar", res["detalle"],
                             "Revisar confusores (CO₂, ruido, horario, medicación) y ofrecer contramedidas de sueño.", "GP5"))
        if nombre == "bgq":
            m = kw.get("meses_desde_muerte")
            if res["positivo"] and m is not None and m >= 6:
                a.append(_alerta("R20", "psico", "firme", res["detalle"] + f"; {m:g} meses desde la muerte.",
                                 "Derivar a especialista. NO aplicar el corte de 30 del PG-13-R.", "GP5"))
            elif res["positivo"]:
                res["nota_tiempo"] = "Antes de 6 meses un puntaje alto es duelo agudo esperado: no se interpreta como trastorno."
        if nombre == "mdq" and res["positivo"]:
            a.append(_alerta("R21", "psico", "firme", res["detalle"],
                             "Aviso al equipo clínico: el clínico decide antes de proponer cambios de sueño o activación.", "GP5"))
        if nombre == "auditc" and res["positivo"]:
            a.append(_alerta("R22", "psico", "ambar", res["detalle"],
                             "Conversación breve de apoyo; revisar acceso a alcohol.", "GP5"))
        return a

    # ---- eventos
    def registrar_evento(self, tipo, dia):
        """tipo: 'muerte_tripulante' (R23 -> GP1) o 'muerte_familiar_tierra' (R24 -> GP2)."""
        self.eventos.append((tipo, dia))
        if tipo == "muerte_tripulante":
            return [_alerta("R23", "psico", "inmediata", "Muerte de un tripulante.",
                            "Activar el protocolo de muerte de un tripulante; cirujano de vuelo y comandante ya.", "GP1")]
        if tipo == "muerte_familiar_tierra":
            return [_alerta("R24", "psico", "firme", "Muerte de un familiar en la Tierra.",
                            "Verificar con la familia y respetar las preferencias de notificación (NP1 a NP8) antes de avisar.", "GP2")]
        raise KeyError("tipo debe ser 'muerte_tripulante' o 'muerte_familiar_tierra'")

    # ---- tendencias
    def _base(self):
        if len(self.checkins) < self.MIN_BASE:
            return None
        b = [c[1] for c in self.checkins[: self.MIN_BASE]]
        mu = sum(b) / len(b)
        sd = max(math.sqrt(sum((x - mu) ** 2 for x in b) / (len(b) - 1)), self.SD_MIN)
        return mu, sd

    def _z_serie(self):
        base = self._base()
        if base is None:
            return None, []
        mu, sd = base
        return base, [(d, (c - mu) / sd) for d, c, _ in self.checkins[self.MIN_BASE:]]

    def _ewma_cusum(self, base, serie):
        mu, sd = base
        lam, z, cus, ewma_sig, cus_sig = self.LAMBDA, 0.0, 0.0, False, False
        for t, (_, zz) in enumerate(serie, start=1):
            z = lam * zz + (1 - lam) * z
            lim = self.L_EWMA * math.sqrt(lam / (2 - lam) * (1 - (1 - lam) ** (2 * t)))
            cus = max(0.0, cus + (-zz) - self.K_CUSUM)
            ewma_sig = z < -lim
            cus_sig = cus > self.H_CUSUM
        return ewma_sig, cus_sig

    def evaluar_tendencias(self, dia, ctx=None, alertas_motor=None):
        """R01, R02, R03/R09, R04, R08, R11 y la tendencia de duelo. ctx: co2_mmhg|co2_ppm, ruido_dba_24h,
        ruido_nc_sueno, sueno_h. alertas_motor: alertas del motor ese día (para combinar módulos)."""
        ctx, motor = ctx or {}, alertas_motor or []
        out = []
        base, serie = self._z_serie()
        if base is not None and len(serie) >= 3:
            zs = [z for _, z in serie]
            r01 = all(z <= self.Z_R01 for z in zs[-3:])
            ewma_sig, cus_sig = self._ewma_cusum(base, serie)
            r08 = ewma_sig or cus_sig
            persistente = len(zs) >= 7 and sum(z <= self.Z_R04 for z in zs[-7:]) >= 6  # 6 de 7: evita parpadeo
            dom_motor = {a.get("dominio") for a in motor
                         if a.get("dominio") in ("psico", "sueno", "fisico", "social")
                         and ORDEN_NIVEL.get(a.get("nivel"), 0) >= 1}
            respaldo = bool(dom_motor & {"sueno", "fisico"})
            conf = _confusores(ctx)
            bajada = r01 or r08
            if bajada:
                base_txt = (f"Check-in compuesto bajo su línea base personal (z últimos 3 días: "
                            f"{', '.join(f'{z:.1f}' for z in zs[-3:])}).")
                if persistente or len(dom_motor | {"autorreporte"}) >= 3:
                    out.append(_alerta("R04", "psico", "roja",
                                       base_txt + (" Caída marcada en 6 de los últimos 7 días." if persistente else
                                                   f" Además cae en: {', '.join(sorted(dom_motor))}."),
                                       "Contacto clínico en 24 horas; revisar confusores y seguridad.", "GP5",
                                       confusores=conf))
                elif conf:
                    out.append(_alerta("R03", "ambiente", "causa_ambiental",
                                       base_txt + f" Posible causa ambiental/fisiológica: {'; '.join(conf)}.",
                                       "Corregir el factor ambiental y volver a medir antes de pensar en causa psicológica.",
                                       None, confusores=conf))
                elif respaldo:
                    out.append(_alerta("R02", "psico", "firme",
                                       base_txt + f" Respaldo en {', '.join(sorted(dom_motor & {'sueno', 'fisico'}))}.",
                                       "Aviso al equipo clínico; revisar sueño y actividad; sugerir contramedida.", "GP5"))
                else:
                    if r01:
                        out.append(_alerta("R01", "psico", "ambar", base_txt,
                                           "Revisar confusores y sugerir una contramedida.", "GP5"))
                    if r08:
                        out.append(_alerta("R08", "psico", "ambar",
                                           "EWMA/CUSUM del check-in diario señalan cambio sostenido (por calibrar, P28).",
                                           "Revisar confusores y sugerir una contramedida.", "GP5",
                                           por_calibrar=True))
        # R11: caída de afecto positivo (ánimo+motivación), pendiente de 7 días
        ap = [(d, a) for d, _, a in self.checkins if a is not None]
        if len(ap) >= 7 and not _confusores(ctx):  # con un confusor activo manda R03, no una alerta psicológica
            ult = ap[-7:]
            n = len(ult)
            xs = [d for d, _ in ult]
            ys = [a for _, a in ult]
            mx, my = sum(xs) / n, sum(ys) / n
            den = sum((x - mx) ** 2 for x in xs)
            pend = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / den if den else 0.0
            if pend <= -0.2 and (ys[0] - ys[-1]) >= 1.0:
                out.append(_alerta("R11", "psico", "firme",
                                   f"Ánimo y motivación bajan {abs(pend):.2f} puntos por día en 7 días (por calibrar).",
                                   "Aviso al equipo; ofrecer PHQ-4 y actividades de afecto positivo.", "GP5",
                                   por_calibrar=True))
        # Duelo: GD1 sin bajar tras 2 semanas
        if len(self.duelo) >= 6 and (self.duelo[-1][0] - self.duelo[0][0]) >= 14:
            ini = sum(v for _, v in self.duelo[:3]) / 3
            fin = sum(v for _, v in self.duelo[-3:]) / 3
            if fin >= ini:
                out.append(_alerta("GD_TENDENCIA", "psico", "ambar",
                                   "La tristeza del duelo no baja tras 2 semanas.",
                                   "Pasar a PHQ-9 e ISI y avisar al equipo de apoyo.", "GP5"))
        return out


# ----------------------------------------------------------------------------------------------
# 5. UNIÓN CON EL MOTOR
# ----------------------------------------------------------------------------------------------
def fila_desde_checkin(resultado_checkin, equipo=None):
    """Convierte el check-in al formato del motor: estres_vas = (CK3−1)/4·100; cohesion desde TM si se tiene.
    Solo rellena lo que el astronauta realmente contestó."""
    f = {"estres_vas": resultado_checkin["estres_vas"]}
    if equipo is not None:
        f["cohesion"] = equipo["cohesion_vas"]
    return f


def nivel_max(*niveles):
    return max(niveles, key=lambda n: ORDEN_NIVEL.get(n, 0))


class MonitorAutoreporte:
    """Envuelve AstronautMonitor o IxchelMonitor y suma el autorreporte a su salida.

    out = mon.ingest(fila, autoreporte={'checkin': {...}, 'seguridad': {'SF1': 0}, 'phq9': {...}},
                     contexto={'dias_desde_evento': 45, 'meses_desde_muerte': 8})
    La salida conserva todo lo del motor y añade: alertas (fusionadas), nivel (el más alto), autoreporte,
    protocolos, seguridad_activa. Un 'ROJO' por seguridad nunca se baja. Siempre requiere confirmación.
    """

    def __init__(self, monitor, sexo=None):
        self.monitor = monitor
        self.ar = Autoreporte(sexo=sexo)

    def __getattr__(self, k):  # delega lo demás (report_event, sin_base…)
        return getattr(self.monitor, k)

    def reportar_evento(self, tipo, dia, **kw):
        """Eventos del autorreporte. 'muerte_tripulante' y 'muerte_familiar_tierra' además registran 'luto' en el motor."""
        al = self.ar.registrar_evento(tipo, dia)
        rel = "tripulante" if tipo == "muerte_tripulante" else "familiar_directo"
        try:
            self.monitor.report_event("luto", dia, relacion=rel, **kw)
        except Exception:
            pass
        return al

    def ingest(self, fila, autoreporte=None, contexto=None, **kw):
        fila = dict(fila)
        ctx = dict(contexto or {})
        resultados, alertas = {}, []
        autoreporte = autoreporte or {}
        # 1) puntuar formularios (puede rellenar la fila del motor antes de ingerir)
        dia = fila.get("dia")
        for nombre, resp in autoreporte.items():
            res, al = self.ar.registrar(nombre, resp, dia,
                                        **{k: v for k, v in ctx.items()
                                           if k in ("sexo", "dias_desde_evento", "meses_desde_muerte", "rechazo")})
            resultados[nombre] = res
            alertas += al
        if "checkin" in resultados:
            for k, v in fila_desde_checkin(resultados["checkin"], resultados.get("equipo")).items():
                fila.setdefault(k, v)
        # 2) motor
        out = self.monitor.ingest(fila, **kw)
        dia = out.get("dia", dia)
        # 3) tendencias con contexto del motor
        ctx_amb = {"co2_ppm": fila.get("co2_ppm"), "ruido_dba_24h": fila.get("ruido_dba"),
                   "sueno_h": fila.get("sueno_h")}
        ctx_amb.update({k: v for k, v in ctx.items() if k in ("co2_mmhg", "ruido_dba_24h", "ruido_nc_sueno", "sueno_h")})
        alertas += self.ar.evaluar_tendencias(dia, ctx_amb, out.get("alertas", []))
        # 4) fusionar (sin duplicar códigos) y recalcular nivel
        vistos, unicas = set(), []
        for a in alertas:
            if a["codigo"] not in vistos:
                vistos.add(a["codigo"])
                unicas.append(a)
        seguridad = any(a.get("seguridad") for a in unicas)
        unicas.sort(key=lambda a: (not a.get("seguridad"), -ORDEN_NIVEL[a["nivel"]]))
        nivel = out.get("nivel", "VERDE")
        for a in unicas:
            nivel = nivel_max(nivel, a["nivel"])
        out = dict(out)
        out["alertas"] = list(out.get("alertas", [])) + unicas
        out["nivel"] = nivel
        out["seguridad_activa"] = seguridad
        out["protocolos"] = sorted({a["protocolo"] for a in unicas if a.get("protocolo")})
        out["autoreporte"] = {"resultados": resultados, "alertas": unicas,
                              "base_lista": self.ar._base() is not None,
                              "dias_checkin": len(self.ar.checkins)}
        out["requiere_confirmacion"] = True
        out["aviso"] = AVISO
        return out
