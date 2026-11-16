"""
Acompañamiento psicológico para la web (ARMOR): une el motor Ixchel (misión viva), la capa de
autorreporte (autoreporte.py, base de conocimiento) y un registro de lo que la persona hace.

Todo es dinámico: lo que la persona aporta entra al motor y cambia lo que ARMOR muestra.
  - check-in diario (CK1–CK8) -> su estrés entra al motor ese día (fila_desde_checkin)
  - ítem de seguridad SF1, ASQ, PHQ-9 ítem 9 -> alerta de seguridad que sube el semáforo a ROJO
  - formularios (PHQ-4, PHQ-9, GAD-7, ASQ, duelo diario, equipo…) -> sus alertas se suman al día;
    el de equipo además aporta la cohesión al motor
  - eventos (emergencia, pérdida…) -> report_event en el motor (protocolos, línea base congelada)
  - decisiones sobre contramedidas -> el bandido del motor aprende de lo que de verdad se aplicó
  - plan de seguridad y reporte asíncrono para Tierra (pensado para el retardo de comunicación)
Se guarda en disco (sesiones/) y sobrevive a un reinicio de la API.

Regla de oro (base de conocimiento): apoyo a la decisión, no diagnóstico. La seguridad (SF1, ASQ,
PHQ-9 ítem 9) se evalúa aparte y siempre prevalece.
"""
from __future__ import annotations

import json
import math
import time
from pathlib import Path

import numpy as np

import autoreporte as ar
from mision_viva import CARPETA, MisionViva

ROOT = Path(__file__).resolve().parent.parent
DOMS = ("psico", "sueno", "fisico", "social")
VENTANA_HISTORIA = 35          # días de check-in previos que se reconstruyen para las tendencias
EVENTOS_MOTOR = {"emergencia", "luto", "herida", "enfermedad", "sospecha_trastorno", "tratamiento"}
ORDEN = {"VERDE": 0, "AMARILLO": 1, "ROJO": 2}


def _clip(x, lo, hi):
    return max(lo, min(hi, x))


def checkin_simulado(fila: dict, base: dict, dia: int, semilla: int = 0) -> dict:
    """Check-in (CK1–CK7, escala 1–5) que habría contestado el astronauta simulado ese día.
    Se deriva de lo que el simulador generó (estrés, sueño, PVT) para que las tendencias del
    autorreporte tengan historia coherente con el motor. Determinista por día."""
    rng = np.random.default_rng(semilla * 1000 + dia)
    estres = fila.get("estres_vas")
    estres_n = _clip((estres if estres is not None else 25) / 100, 0, 1)
    s, sb = fila.get("sueno_h"), base.get("sueno_h") or 6.5
    deficit = _clip((sb - s) / 2, 0, 1) if s is not None else 0.0
    p, pb = fila.get("pvt_lapses"), base.get("pvt_lapses") or 2.0
    pvt_n = _clip((p - pb) / 4, 0, 1) if p is not None else 0.0
    r = lambda v: int(round(_clip(v + rng.normal(0, 0.35), 1, 5)))
    return {"CK1": r(4.3 - 2.0 * estres_n - 1.0 * deficit), "CK2": r(4.2 - 1.6 * estres_n - 1.0 * deficit),
            "CK3": r(1 + 4 * estres_n), "CK4": r(1 + 3.5 * estres_n), "CK5": r(4.3 - 2.2 * deficit - 0.8 * estres_n),
            "CK6": r(2.5), "CK7": r(4.3 - 2.0 * pvt_n - 1.0 * deficit)}


class SesionDemo:
    """Estado de acompañamiento de un escenario de demostración, encima de su misión viva."""

    def __init__(self, mision: MisionViva):
        self.m = mision
        self.semilla = mision.cfg["semilla"]
        self.checkins: dict[int, dict] = {}          # día -> respuestas del usuario
        self.seguridad: dict[int, float] = {}        # día -> SF1
        self.alertas_dia: dict[int, dict] = {}       # día -> {codigo: alerta} del autorreporte
        self.plan_seguridad: dict[str, str] = {}
        self.registro: list[dict] = []
        self.cargar()

    # ------------------------------------------------------------------ disco
    def _ruta(self) -> Path:
        return CARPETA / f"{self.m.clave}_sesion.json"

    def guardar(self):
        CARPETA.mkdir(exist_ok=True)
        estado = {"checkins": self.checkins, "seguridad": self.seguridad, "alertas_dia": self.alertas_dia,
                  "plan_seguridad": self.plan_seguridad, "registro": self.registro}
        self._ruta().write_text(json.dumps(estado, ensure_ascii=False), encoding="utf-8")

    def cargar(self):
        if not self._ruta().exists():
            return
        e = json.loads(self._ruta().read_text(encoding="utf-8"))
        self.checkins = {int(k): v for k, v in e.get("checkins", {}).items()}
        self.seguridad = {int(k): v for k, v in e.get("seguridad", {}).items()}
        self.alertas_dia = {int(k): v for k, v in e.get("alertas_dia", {}).items()}
        self.plan_seguridad = e.get("plan_seguridad", {})
        self.registro = e.get("registro", [])

    def reiniciar(self):
        self.checkins, self.seguridad, self.alertas_dia, self.plan_seguridad, self.registro = {}, {}, {}, {}, []
        if self._ruta().exists():
            self._ruta().unlink()
        self.m.reiniciar()

    # ------------------------------------------------------------------ utilidades
    def _apuntar(self, tipo: str, dia: int, resumen: str, **detalle):
        e = {"id": len(self.registro) + 1, "tipo": tipo, "dia": dia, "hora": time.strftime("%H:%M"),
             "resumen": resumen, **detalle}
        self.registro.append(e)
        self.guardar()
        return e

    def _sumar_alertas(self, t: int, alertas: list):
        if alertas:
            d = self.alertas_dia.setdefault(t, {})
            for a in alertas:
                d[a["codigo"]] = a

    def _dias_desde_luto(self, t: int):
        ev = [e["inicio"] for e in self.m.eventos if e["tipo"] == "luto" and e["inicio"] <= t]
        ev += [int(d) for d, lst in self.m.aportes["eventos"].items() if int(d) <= t and any(x["tipo"] == "luto" for x in lst)]
        return t - max(ev) if ev else None

    def _autoreporte_hasta(self, t: int) -> ar.Autoreporte:
        """Autorreporte con la historia de check-ins hasta el día t-1 (usuario si contestó; si no, simulado)."""
        a = ar.Autoreporte()
        for d in range(max(0, t - VENTANA_HISTORIA), t):
            resp = self.checkins.get(d) or checkin_simulado(self.m.fila(d), self.m.base, d, self.semilla)
            a.registrar("checkin", resp, d)
        return a

    # ------------------------------------------------------------------ salida del día con el autorreporte
    def dia(self, t: int) -> dict:
        """Salida del motor del día t (recalculada con lo aportado) + alertas del autorreporte de ese día.
        Igual que MonitorAutoreporte: la seguridad va primero y el nivel es el más alto."""
        out = dict(self.m.salida(t))
        propias = list(self.alertas_dia.get(t, {}).values())
        if propias:
            propias.sort(key=lambda a: (not a.get("seguridad"), -ORDEN[a["nivel"]]))
            motor = [a for a in out.get("alertas", []) if a["codigo"] not in {p["codigo"] for p in propias}]
            seguras = [a for a in propias if a.get("seguridad")]
            out["alertas"] = seguras + motor + [a for a in propias if not a.get("seguridad")]   # seguridad primero
            for a in propias:
                if ORDEN[a["nivel"]] > ORDEN[out["nivel"]]:
                    out["nivel"] = a["nivel"]
        out["seguridad_activa"] = any(a.get("seguridad") for a in propias)
        out["autoreporte"] = {"checkin_hoy": t in self.checkins, "alertas": propias,
                              "protocolos": sorted({a["protocolo"] for a in propias if a.get("protocolo")})}
        return out

    # ------------------------------------------------------------------ check-in diario
    def checkin(self, t: int, respuestas: dict, sf1=None, estados=None) -> dict:
        a = self._autoreporte_hasta(t)
        res, alertas = a.registrar("checkin", respuestas, t)
        if sf1 is not None:
            _, al_s = a.registrar("seguridad", {"SF1": sf1}, t)
            alertas = al_s + alertas
            self.seguridad[t] = float(sf1)
        # lo que contesta la persona entra al motor ese día (y el motor recalcula desde ahí)
        self.m.aportar_fila(t, ar.fila_desde_checkin(res))
        fila, salida = self.m.fila(t), self.m.salida(t)
        ctx = {"co2_ppm": fila.get("co2_ppm"), "ruido_dba_24h": fila.get("ruido_dba"), "sueno_h": fila.get("sueno_h")}
        alertas += a.evaluar_tendencias(t, ctx, salida.get("alertas", []))
        self.checkins[t] = dict(respuestas)
        self.alertas_dia[t] = {}                         # el check-in de hoy reemplaza al anterior del mismo día
        self._sumar_alertas(t, alertas)

        base = a._base()
        serie = [{"dia": d, "compuesto": round(c, 3), "z": round((c - base[0]) / base[1], 2) if base else None,
                  "usuario": d in self.checkins} for d, c, _ in a.checkins[-30:]]
        luto = self._dias_desde_luto(t)
        plan = ar.proponer_formularios(estados, dias_desde_perdida=luto) if estados else []
        seguridad = any(x.get("seguridad") for x in alertas) or any(p["seguridad"] for p in plan)
        out = {"dia": t, "resultado": res, "alertas": alertas, "plan": plan, "seguridad_activa": seguridad,
               "protocolos": sorted({x["protocolo"] for x in alertas if x.get("protocolo")}),
               "base_lista": base is not None, "base": {"media": round(base[0], 3), "sd": round(base[1], 3)} if base else None,
               "serie": serie, "confusores": ar._confusores(ctx), "aviso": ar.AVISO, "nivel_dia": self.dia(t)["nivel"]}
        self._apuntar("checkin", t, f"Daily check: {res['puntaje']:.2f}/5",
                      puntaje=res["puntaje"], alertas=[x["codigo"] for x in alertas], seguridad=seguridad,
                      nota=respuestas.get("CK8") or None, estados=estados or [])
        return out

    # ------------------------------------------------------------------ formularios
    def formulario(self, t: int, nombre: str, respuestas: dict, rechazo: bool = False) -> dict:
        a = ar.Autoreporte()
        kw = {"rechazo": rechazo}
        luto = self._dias_desde_luto(t)
        if luto is not None:
            kw["dias_desde_evento"] = luto
            kw["meses_desde_muerte"] = luto / 30.4
        res, alertas = a.registrar(nombre, respuestas, t, **kw)
        if nombre == "equipo":
            self.m.aportar_fila(t, {"cohesion": res["cohesion_vas"]})       # la cohesión entra al motor
        self._sumar_alertas(t, alertas)
        seguridad = any(x.get("seguridad") for x in alertas)
        self._apuntar("formulario", t, res.get("detalle", nombre), instrumento=res.get("instrumento", nombre),
                      puntaje=res.get("puntaje"), alertas=[x["codigo"] for x in alertas], seguridad=seguridad)
        return {"dia": t, "resultado": res, "alertas": alertas, "seguridad_activa": seguridad,
                "protocolos": sorted({x["protocolo"] for x in alertas if x.get("protocolo")}), "aviso": ar.AVISO,
                "nivel_dia": self.dia(t)["nivel"]}

    # ------------------------------------------------------------------ decisiones, eventos, plan
    def decision(self, t: int, tarjeta: str, dominio: str, titulo: str, decision: str,
                 contramedida: str | None = None, motivo: str | None = None, arm: str | None = None) -> dict:
        self.m.aportar_decision(t, dominio, decision, arm)                # el bandido aprende de esto
        texto = {"applied": f"Applied: {contramedida or titulo}", "postponed": f"Postponed: {titulo}",
                 "discarded": f"Dismissed: {titulo}"}.get(decision, f"{decision}: {titulo}")
        return self._apuntar("decision", t, texto, tarjeta=tarjeta, dominio=dominio, decision=decision,
                             contramedida=contramedida, motivo=motivo, arm=arm)

    def evento(self, t: int, tipo: str, nota: str | None = None) -> dict:
        if tipo in EVENTOS_MOTOR:
            self.m.aportar_evento(t, tipo, **({"nota": nota} if nota else {}))
        return self._apuntar("evento", t, f"Event reported: {tipo}", evento=tipo, nota=nota, motor=tipo in EVENTOS_MOTOR)

    def paso_protocolo(self, t: int, protocolo: str, paso: str, estado: str) -> dict:
        return self._apuntar("protocolo", t, f"{protocolo} · {paso}: {estado}", protocolo=protocolo, paso=paso, estado=estado)

    def guardar_plan(self, t: int, plan: dict) -> dict:
        self.plan_seguridad = {k: str(v) for k, v in plan.items() if k.startswith("SPL") and str(v).strip()}
        self._apuntar("plan_seguridad", t, f"Safety plan updated ({len(self.plan_seguridad)} of 8 sections)")
        return {"plan": self.plan_seguridad}

    # ------------------------------------------------------------------ reporte asíncrono
    def reporte(self, t: int, nota: str | None = None, motivo: str = "routine") -> dict:
        """Resumen estructurado para el equipo en Tierra (campos de la base: alerts.async_report)."""
        salida = self.dia(t)
        ult = [self.m.fila(d) for d in range(max(0, t - 6), t + 1)]
        sueno = [round(f["sueno_h"], 1) for f in ult if f.get("sueno_h") is not None]
        rt = [f["pvt_rt_ms"] for f in ult if f.get("pvt_rt_ms") is not None]
        base_rt = self.m.base.get("pvt_rt_ms")
        alertas = salida.get("alertas", [])
        estado = {d: ("ROJO" if any(x["dominio"] == d and x["nivel"] == "ROJO" for x in alertas)
                      else "AMARILLO" if any(x["dominio"] == d for x in alertas) else "VERDE") for d in DOMS}
        notas = [e["nota"] for e in self.registro if e["tipo"] == "checkin" and e.get("nota")][-3:]
        if nota:
            notas.append(nota)
        usadas = [e["contramedida"] or e["resumen"] for e in self.registro if e["tipo"] == "decision" and e["decision"] == "applied"]
        sf = self.seguridad.get(t)
        retardo = salida.get("contexto", {}).get("retardo_com_min") or 0.0
        rep = {"mission_day": t + 1, "reason": motivo, "status_by_module_vs_baseline": estado,
               "engine_level": salida.get("nivel"), "safety_active": salida.get("seguridad_activa", False),
               "sleep_hours_last_7_days": sueno,
               "reflex_trend": (f"{np.mean(rt):.0f} ms vs baseline {base_rt:.0f} ms" if rt and base_rt else "no data"),
               "safety_item_answer": "not asked today" if sf is None else ("No" if sf == 0 else "positive: escalate"),
               "astronaut_notes": notas, "countermeasures_used": usadas[-5:],
               "eta_minutes": round(retardo, 1)}
        self._apuntar("reporte", t, f"Async report sent ({motivo}); arrives in ~{math.ceil(retardo)} min", reporte=rep)
        return rep

    # ------------------------------------------------------------------ serie de la misión (Timeline / Environment)
    def serie(self) -> dict:
        variables = ("co2_ppm", "ruido_dba", "o2_pct", "presion_hpa", "humedad_pct", "temp_c", "radiacion_msv_dia",
                     "masa_pct", "perdida_osea_pct", "sueno_h", "fc_reposo", "hrv", "estres_vas", "pvt_lapses", "cohesion")
        self.m.todas()
        dias = []
        for t in range(self.m.n_dias):
            f, s = self.m.fila(t), self.dia(t)
            ml = (s.get("ml") or {}).get("riesgo_dominios", {})
            dias.append({
                "dia": t, "nivel": s.get("nivel"),
                "dominios": {d: s.get("dominios", {}).get(d) for d in DOMS},
                "ml": {d: (ml.get(d) or {}).get("prob_atencion_o_peor") for d in DOMS},
                "alertas": [{"codigo": a["codigo"], "dominio": a["dominio"], "nivel": a["nivel"]} for a in s.get("alertas", [])],
                "x": {k: (round(f[k], 3) if isinstance(f.get(k), (int, float)) else None) for k in variables},
                "radiacion_acum_msv": (s.get("ambiente") or {}).get("radiacion_acum_msv"),
                "eventos": [e["tipo"] for e in s.get("eventos_activos", [])],
                "aportado": str(t) in self.m.aportes["filas"] or t in self.checkins,
            })
        return {"escenario": self.m.clave, "base": self.m.base, "eventos": self.m.eventos, "dias": dias, "version": self.m.version}


# ---------------------------------------------------------------- noche real de muestra (hipnograma)
_NOCHE = None


def noche_muestra() -> dict | None:
    """Una noche REAL (PhysioNet BIDSleep, Bidslab32 noche 3): etapas que estima el modelo de sueño solo
    con la FC del reloj, junto a las del experto. None si los datos no están descargados."""
    global _NOCHE
    if _NOCHE is not None:
        return _NOCHE
    carpeta = ROOT / "data" / "raw" / "sueno_actividad" / "bidsleep" / "Bidslab32" / "3"
    if not (carpeta / "hr.csv").exists():
        return None
    import pandas as pd
    import scipy.io as sio
    import datos
    from modelo_sueno import noche_desde_fc
    hr = pd.read_csv(carpeta / "hr.csv", header=None, names=["t", "fc"])
    m = sio.loadmat(carpeta / "labels.mat")
    etq = m["expert_label"].ravel().astype(int)
    inicio = pd.Timestamp(str(m["recStart"][0])).tz_localize("America/New_York").timestamp()
    hr = hr[(hr["t"] >= inicio) & (hr["t"] < inicio + len(etq) * datos.EPOCA_S)]
    est = noche_desde_fc(hr["t"].to_numpy(), hr["fc"].to_numpy())
    experto = [datos.NOMBRE_ETAPA[datos.ETAPA_4[e]] if e in datos.ETAPA_4 else None for e in etq]
    dormido = [e is not None and e != datos.NOMBRE_ETAPA[0] for e in experto]
    _NOCHE = {"fuente": "PhysioNet BIDSleep 1.0.1 · Bidslab32, night 3 (real wrist heart rate)",
              "epoca_s": datos.EPOCA_S, "modelo": est["etapas"], "experto": experto,
              "sueno_h_modelo": round(est["sueno_h"], 2), "sueno_h_experto": round(sum(dormido) * datos.EPOCA_S / 3600, 2),
              "eficiencia_modelo": round(est["sueno_eficiencia"], 1), "fc_reposo": est["fc_reposo"]}
    return _NOCHE
