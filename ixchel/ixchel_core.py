"""
Ixchel core - motor de monitoreo individual (offline, sin interfaz).

Cubre: psicológico, sueño/circadiano, fisiológico (incluye atrofia/masa/ejercicio),
social/comunicación, ambiente del hábitat (aire, ruido, radiación), contexto
(gravedad, distancia/retardo) y eventos (duelo, herida, enfermedad, sospecha de
trastorno, tratamiento, emergencia).

Capas del documento:
  4.1 Z-score individual + regla de persistencia (decide, con confirmación humana)
  4.2 reglas clínicas, límites absolutos y protocolos por evento
  4.4 EWMA adaptativo, Isolation Forest por astronauta (modo sombra),
      bandido contextual Thompson Sampling (prioriza contramedidas)

Interfaz para la web app (JSON dentro / JSON fuera):
    mon = AstronautMonitor(filas_baseline)          # >= 30 días pre-misión
    mon.report_event("luto", dia=60, relacion="familiar_directo")
    salida = mon.ingest({"dia": 61, "pvt_lapses": 2, "sueno_h": 5.8, "co2_ppm": 2800, ...})

Los límites en LIMITES son valores de referencia genéricos: validar con
NASA-STD-3001 antes de usarlos como criterio real.
"""
import json
import numpy as np
from collections import defaultdict
from sklearn.ensemble import IsolationForest

# ---------------------------------------------------------------- configuración
# variable: (dominio, polaridad [+1 = valor alto es malo], frecuencia)
Z_VARS = {
    "pvt_lapses":           ("psico", +1, "diaria"),
    "pvt_rt_ms":            ("psico", +1, "diaria"),
    "estres_vas":           ("psico", +1, "diaria"),
    "poms_tmd":             ("psico", +1, "semanal"),
    "bdi_somatico":         ("psico", +1, "semanal"),
    "bdi_afectivo":         ("psico", +1, "semanal"),
    "sueno_h":              ("sueno", -1, "diaria"),
    "sueno_eficiencia":     ("sueno", -1, "diaria"),
    "desfase_circadiano_h": ("sueno", +1, "diaria"),
    "hrv":                  ("fisico", -1, "diaria"),
    "fc_reposo":            ("fisico", +1, "diaria"),
    "ejercicio_min":        ("fisico", -1, "diaria"),
    "cohesion":             ("social", -1, "semanal"),
    "msgs_criticos_tierra": ("social", +1, "diaria"),
}
DOMS = ["psico", "sueno", "fisico", "social"]
THRESH, ALPHA = 2.5, 0.05
MIN_N = {"diaria": 30, "semanal": 4}
PERSIST = {"diaria": 3, "semanal": 2}     # evaluaciones consecutivas
SPAN = {"diaria": 7, "semanal": 21}       # ventana (días)
FRESH = {"diaria": 2, "semanal": 8}       # antigüedad máx. de la última evaluación

# variable: (aviso, crítico, dirección, etiqueta)   -> referencia, validar con NASA-STD-3001
LIMITES = {
    "co2_ppm":          (3000, 5000, "alto", "CO2 elevado"),
    "o2_pct":           (20.0, 19.5, "bajo", "O2 bajo"),
    "presion_hpa":      (960, 900, "bajo", "Presión de cabina baja"),
    "humedad_pct":      (70, 80, "alto", "Humedad alta"),
    "ruido_dba":        (55, 65, "alto", "Ruido elevado"),
    "masa_pct":         (-5, -7, "bajo", "Pérdida de masa corporal (%)"),
    "perdida_osea_pct": (8, 12, "alto", "Pérdida de densidad ósea (%)"),
}
ACCION_AMBIENTE = {
    "co2_ppm": "Revisar depuradores/ventilación y reducir esfuerzo físico hasta normalizar",
    "o2_pct": "Verificar generación de O2 y fugas; protocolo de soporte vital",
    "presion_hpa": "Inspeccionar fugas de cabina; preparar protocolo de despresurización",
    "humedad_pct": "Revisar control de humedad/condensación",
    "ruido_dba": "Identificar la fuente; zonas silenciosas y protección auditiva; proteger el sueño",
    "masa_pct": "Revisión nutricional y médica; ajustar ingesta y ejercicio",
    "perdida_osea_pct": "Revisión médica; reforzar ejercicio resistivo y nutrición ósea",
}
CARRERA_MSV = 600.0   # límite de carrera de referencia (configurable)

ARMS = {
    "sueno":  ["siesta_ancla", "luz_460nm", "reorganizar_turnos"],
    "psico":  ["realidad_virtual", "apoyo_par", "sesion_psicologo", "actividad_recreativa"],
    "fisico": ["ajustar_ejercicio", "revision_medica", "nutricion_hidratacion"],
    "social": ["taller_cohesion", "descompresion_emocional", "autonomia_incrementada"],
}
DURACION = {"luto": 30, "herida": 14, "enfermedad": 14, "emergencia": 3,
            "sospecha_trastorno": 30, "tratamiento": 60}
PROTOCOLOS = {
    "luto": [
        "Comunicar la noticia con acompañamiento del médico/psicólogo de la tripulación",
        "Sesión de apoyo psicológico y apoyo de pares entrenados",
        "Facilitar contacto con la familia (comunicación diferida) y espacio para rituales de duelo",
        "Comandante: ajustar temporalmente carga y tareas críticas",
        "Reevaluar a los 14 días; si la deriva persiste, solicitar evaluación clínica",
    ],
    "herida": ["Atención médica a bordo según protocolo", "Reasignar tareas según capacidad",
               "Seguimiento diario de constantes, dolor y sueño"],
    "enfermedad": ["Valoración por el médico de la tripulación", "Aislar si hay riesgo de contagio",
                   "Reasignar tareas y seguimiento diario"],
    "sospecha_trastorno": [
        "Evaluación estructurada por el médico de la tripulación (no es diagnóstico del software)",
        "Aumentar la frecuencia de muestreo y abrir seguimiento del caso",
        "Informar solo a quien corresponda, protegiendo la privacidad"],
    "tratamiento": ["Registrar inicio y comparar la evolución de los Z-score antes/después"],
    "emergencia": ["Debriefing de la tripulación en 24 h", "Vigilar sueño y estrés durante 72 h",
                   "Pausar la adaptación de la línea base"],
}
URGENTE = ["Escalar de inmediato al médico de la tripulación y al Comandante",
           "Acompañamiento continuo de la persona; no dejarla sola", "Activar el protocolo de emergencia psiquiátrica"]


def _f(x):
    return None if x is None else round(float(x), 3)


# ---------------------------------------------------------------- monitor
class AstronautMonitor:
    def __init__(self, baseline_rows, seed=0, use_ml=True, dosis_previa_msv=0.0,
                 ejercicio_prescrito_min=120):
        self.base = {}
        for v, (_, _, fr) in Z_VARS.items():
            vals = np.array([r[v] for r in baseline_rows if r.get(v) is not None], float)
            if len(vals) >= MIN_N[fr]:
                self.base[v] = [vals.mean(), max(vals.std(ddof=1), 1e-6)]
        self.base0 = {v: tuple(b) for v, b in self.base.items()}      # fija (pre-misión)
        self.sin_base = [v for v in Z_VARS if v not in self.base]
        self.zhist = defaultdict(list)
        self.rows, self.dom_hist, self.last_dom = [], [], {}
        self.events, self._nuevos = [], []
        self.rng = np.random.default_rng(seed)
        self.use_ml, self.iforest = use_ml, None
        self.a = defaultdict(lambda: 1.0)
        self.b = defaultdict(lambda: 1.0)
        self.pending = []
        self.dosis = float(dosis_previa_msv)
        self.presc = ejercicio_prescrito_min

    # ----- eventos
    def report_event(self, tipo, dia, **kw):
        ev = {"id": len(self.events) + 1, "tipo": tipo, "inicio": dia,
              "fin": dia + kw.pop("duracion", DURACION[tipo]), "idx": len(self.dom_hist), **kw}
        self.events.append(ev)
        self._nuevos.append(ev)
        return ev

    def _activos(self, dia):
        return [e for e in self.events if e["inicio"] <= dia <= e["fin"]]

    # ----- utilidades
    def _last(self, var, n):
        vals = [r[var] for r in self.rows if r.get(var) is not None]
        return vals[-n:] if len(vals) >= n else []

    def _persist(self, dia):
        out = []
        for v, h in self.zhist.items():
            fr = Z_VARS[v][2]
            k = PERSIST[fr]
            if (len(h) >= k and all(z > THRESH for _, z in h[-k:])
                    and dia - h[-k][0] <= SPAN[fr] and dia - h[-1][0] <= FRESH[fr]):
                out.append(v)
        return out

    def _ml(self):
        n = len(self.dom_hist)
        if not self.use_ml or n < 21:
            return None
        D = np.array(self.dom_hist)
        if self.iforest is None or n % 14 == 0:
            self.iforest = IsolationForest(n_estimators=50, random_state=0).fit(D[:-1])
        return float(-self.iforest.score_samples(D[-1:])[0])

    def _bandit(self, cat):
        s = [self.rng.beta(self.a[(cat, m)], self.b[(cat, m)]) for m in ARMS[cat]]
        return ARMS[cat][int(np.argmax(s))]

    def _resolve_pending(self, dia):
        for p in list(self.pending):
            if len(self.dom_hist) - p["idx"] >= 3:
                post = np.mean([h[DOMS.index(p["cat"])] for h in self.dom_hist[-3:]])
                r = float(post < p["pre"])
                self.a[(p["cat"], p["arm"])] += r
                self.b[(p["cat"], p["arm"])] += 1 - r
                self.pending.remove(p)

    # ----- ingesta diaria
    def ingest(self, row):
        dia = row["dia"]
        self.rows.append(row)
        act = self._activos(dia)
        congelada = any(e["tipo"] != "tratamiento" for e in act)

        # Z individual vs. línea base fija; adaptativa (EWMA) solo si no hay eventos
        zt, za = {}, {}
        for v, (mu0, sd0) in self.base0.items():
            x = row.get(v)
            if x is None:
                continue
            pol = Z_VARS[v][1]
            zt[v] = float(pol * (x - mu0) / sd0)
            self.zhist[v].append((dia, zt[v]))
            mu, sd = self.base[v]
            za[v] = float(pol * (x - mu) / sd)
            if not congelada:
                d = x - mu
                self.base[v][0] = mu + ALPHA * d
                self.base[v][1] = max(np.sqrt((1 - ALPHA) * (sd ** 2 + ALPHA * d ** 2)), 1e-6)

        dom = {}
        for d in DOMS:
            vals = [max(z, 0) for v, z in zt.items() if Z_VARS[v][0] == d]
            dom[d] = float(np.mean(vals)) if vals else self.last_dom.get(d, 0.0)
        self.last_dom = dom
        self.dom_hist.append([dom[d] for d in DOMS])
        self._resolve_pending(dia)

        alertas, recs, ctx = [], [], []

        def A(cod, dominio, nivel, detalle):
            alertas.append({"codigo": cod, "dominio": dominio, "nivel": nivel, "detalle": detalle})

        # 1) desviaciones persistentes (4.1)
        vp = self._persist(dia)
        for v in vp:
            nota = "nivel nuevo estable (adaptación)" if abs(za.get(v, 9)) < 1 else "deriva en curso"
            A("DESVIACION_PERSISTENTE", Z_VARS[v][0], "AMARILLO",
              f"{v}: Z={zt.get(v, self.zhist[v][-1][1]):.1f} sostenido; {nota}")

        # 2) reglas clínicas (4.2)
        l_pvt, l_sue = self._last("pvt_lapses", 3), self._last("sueno_h", 3)
        if l_pvt and l_sue and all(x > 3 for x in l_pvt) and all(x < 6 for x in l_sue):
            A("FATIGA_CRONICA", "sueno", "AMARILLO", "Lapses PVT > 3 y sueño < 6 h por 3 días")
        if "pvt_lapses" in self.base0 and self.base0["pvt_lapses"][0] > 0:
            l2 = self._last("pvt_lapses", 2)
            if l2 and all(x > 3 * self.base0["pvt_lapses"][0] for x in l2):
                A("COLAPSO_ALERTA_COGNITIVA", "psico", "ROJO",
                  "Lapses > 3x la línea base en 2 evaluaciones: riesgo para tareas críticas")
        if "poms_tmd" in vp and "bdi_somatico" in vp:
            A("DISTRES_DEPRESIVO_ISOLACIONAL", "psico", "ROJO",
              "POMS-TMD y BDI somático persistentemente altos; valoración por médico de la tripulación")
        t7 = sum(r.get("conflictos_tierra", 0) for r in self.rows[-7:])
        i7 = sum(r.get("conflictos_internos", 0) for r in self.rows[-7:])
        if t7 >= 5 and t7 / max(i7, 1) >= 5:
            A("FRICCION_TIERRA_CONTROL", "social", "AMARILLO", f"Conflictos Tierra:internos = {t7}:{i7} (>= 5:1)")
        if row.get("horas_vigilia", 0) >= 36:
            A("PRIVACION_SUENO_36H", "sueno", "ROJO", "36 h de vigilia: sugerir suspender tareas críticas")
        ej = self._last("ejercicio_min", 5)
        if ej and np.mean(ej[-7:]) < 0.8 * self.presc:
            A("MOVILIDAD_RESERVA", "fisico", "AMARILLO", f"Ejercicio < 80% de {self.presc} min prescritos")

        # 3) ambiente y límites absolutos
        ambiente = {}
        for v, (aviso, crit, dr, etq) in LIMITES.items():
            x = row.get(v)
            if x is None:
                continue
            ambiente[v] = x
            c = (x >= crit) if dr == "alto" else (x <= crit)
            w = (x >= aviso) if dr == "alto" else (x <= aviso)
            if c or w:
                A("LIMITE_" + v.upper(), "ambiente", "ROJO" if c else "AMARILLO", f"{etq}: {x}")
                recs.append({"tipo": "protocolo", "accion": ACCION_AMBIENTE[v], "categoria": "ambiente"})
                ctx.append(etq)
        if row.get("radiacion_msv_dia") is not None:
            r = float(row["radiacion_msv_dia"])
            prev = [q["radiacion_msv_dia"] for q in self.rows[:-1] if q.get("radiacion_msv_dia") is not None][-14:]
            self.dosis += r
            if len(prev) >= 7 and r > 3 * np.median(prev):
                A("EVENTO_RADIACION", "ambiente", "ROJO", f"Dosis diaria {r:.1f} mSv (> 3x la mediana reciente)")
                recs.append({"tipo": "protocolo", "accion": "Refugio blindado y reducir actividad exterior/EVA", "categoria": "ambiente"})
                ctx.append("Evento de radiación")
            frac = self.dosis / CARRERA_MSV
            if frac >= 0.7:
                A("RADIACION_ACUMULADA", "ambiente", "ROJO" if frac >= 0.9 else "AMARILLO",
                  f"{self.dosis:.0f} mSv acumulados ({frac:.0%} del límite de carrera de referencia)")
            ambiente["radiacion_acum_msv"] = round(self.dosis, 1)

        # 4) contexto: gravedad, distancia/retardo, fase, tercer cuarto
        retardo = row.get("retardo_com_min")
        autonomia = ("total" if row.get("enlace_activo") is False else
                     "alta" if retardo is not None and retardo >= 10 else
                     "media" if retardo is not None and retardo >= 3 else "baja")
        contexto = {"gravedad_g": row.get("gravedad_g"), "retardo_com_min": retardo,
                    "autonomia_requerida": autonomia, "fase": row.get("fase")}
        if row.get("dia_mision") and row.get("duracion_mision"):
            fr = row["dia_mision"] / row["duracion_mision"]
            if 0.5 <= fr < 0.75:
                ctx.append("Ventana del tercer cuarto (mayor riesgo de desánimo/fricción)")
        if row.get("gravedad_g") is not None and row["gravedad_g"] < 0.5:
            ctx.append("Baja gravedad: riesgo de atrofia; sostener ejercicio resistivo")

        # 5) eventos activos y nuevos
        activos = []
        alert_doms = {a["dominio"] for a in alertas if a["dominio"] in DOMS}
        for e in act:
            t = e["tipo"]
            item = {"tipo": t, "dia": dia - e["inicio"], "detalle": {k: v for k, v in e.items()
                    if k not in ("id", "tipo", "inicio", "fin", "idx")}}
            if t == "tratamiento" and len(self.dom_hist) - e["idx"] >= 7 and e["idx"] >= 3:
                pre = np.mean(self.dom_hist[max(0, e["idx"] - 7):e["idx"]])
                post = np.mean(self.dom_hist[-7:])
                item["respuesta"] = "mejora" if post < pre - 0.3 else "empeora" if post > pre + 0.3 else "sin_cambio"
            activos.append(item)
            if e.get("riesgo_seguridad") or e.get("tipo_sospecha") in ("psicosis", "riesgo_autolesion"):
                A("ESCALAR_MEDICO_URGENTE", "evento", "ROJO", "Señal de riesgo para la seguridad de la persona")
            if t == "luto":
                ctx.append("Duelo activo: desviaciones psicosociales esperables, se vigilan en paralelo")
                if dia - e["inicio"] >= 14 and "psico" in alert_doms:
                    A("DUELO_PERSISTENTE", "psico", "AMARILLO", "Deriva psicológica > 14 días tras la pérdida: evaluación clínica")
            if t in ("herida", "enfermedad") and e.get("severidad") == "grave":
                A("CAPACIDAD_REDUCIDA", "fisico", "ROJO", f"{t} grave: reasignar tareas críticas")
            if t == "emergencia":
                A("POST_EMERGENCIA", "psico", "AMARILLO", "Ventana de 72 h: vigilar estrés y sueño")
        for e in self._nuevos:
            for p in PROTOCOLOS[e["tipo"]]:
                recs.append({"tipo": "protocolo", "accion": p, "categoria": e["tipo"]})
            if e.get("riesgo_seguridad") or e.get("tipo_sospecha") in ("psicosis", "riesgo_autolesion"):
                recs = [{"tipo": "protocolo", "accion": p, "categoria": "urgente"} for p in URGENTE] + recs
        self._nuevos = []

        # 6) contramedida aprendida (bandido) sobre el dominio con alerta más fuerte
        alert_doms = {a["dominio"] for a in alertas if a["dominio"] in DOMS}
        if alert_doms:
            cat = max(alert_doms, key=lambda d: dom[d])
            arm = self._bandit(cat)
            self.pending.append({"cat": cat, "arm": arm, "idx": len(self.dom_hist), "pre": dom[cat]})
            recs.append({"tipo": "aprendida", "categoria": cat, "accion": arm,
                         "explicacion": f"mejor respuesta histórica en este astronauta ({', '.join(sorted(alert_doms))} con alerta)"})

        # 7) nivel global
        niveles = [a["nivel"] for a in alertas]
        nivel = "ROJO" if "ROJO" in niveles else "AMARILLO" if (niveles or act) else "VERDE"
        ml = self._ml()
        return {
            "dia": dia, "nivel": nivel,
            "dominios": {d: _f(v) for d, v in dom.items()},
            "z": {v: _f(z) for v, z in zt.items()},
            "alertas": alertas, "ambiente": ambiente, "contexto": contexto,
            "factores_contexto": ctx, "eventos_activos": activos,
            "ml": {"score_anomalia": _f(ml), "modo": "sombra"},
            "recomendaciones": recs,
            "sin_linea_base": self.sin_base,
            "requiere_confirmacion": True,
            "aviso": "Apoyo a la decisión; no es un diagnóstico. Confirma el Comandante o el médico de la tripulación.",
        }


# ---------------------------------------------------------------- simulación
SIM = {"pvt_lapses": (1.5, 0.8), "pvt_rt_ms": (260, 25), "estres_vas": (30, 8), "poms_tmd": (10, 6),
       "bdi_somatico": (5, 2.5), "bdi_afectivo": (4, 2), "sueno_h": (7.0, 0.5), "sueno_eficiencia": (90, 3),
       "desfase_circadiano_h": (0.3, 0.3), "hrv": (60, 7), "fc_reposo": (62, 4), "ejercicio_min": (120, 12),
       "cohesion": (70, 6), "msgs_criticos_tierra": (2, 1.2)}


def gen_row(rng, t, s):
    row = {"dia": t}
    for v, (mu, sd) in SIM.items():
        dom, pol, fr = Z_VARS[v]
        if fr == "semanal" and t % 7 != 0:
            continue
        row[v] = max(mu + pol * sd * s * (0.5 if dom == "social" else 0.9) + rng.normal(0, sd), 0.0)
    row["sueno_eficiencia"] = min(row["sueno_eficiencia"], 100.0)
    return row


def simulate(seed, strategy="bandit", drift=True, escenario=False, n_pre=40, n_mis=100, d0=40):
    rng = np.random.default_rng(seed)
    eff = {}
    for cat, arms in ARMS.items():
        best = rng.integers(len(arms))
        for i, m in enumerate(arms):
            eff[(cat, m)] = 0.25 if i == best else rng.uniform(0.0, 0.05)
    mon = AstronautMonitor([gen_row(rng, t, 0.0) for t in range(-n_pre, 0)], seed=seed, use_ml=escenario)
    rnd = np.random.default_rng(seed + 999)
    s, detect, falsas, stress, log, ejemplo = 0.0, None, 0, [], [], None
    prev = None
    for t in range(n_mis):
        grief = 1.8 * np.exp(-(t - 60) / 15) if (escenario and t >= 60) else 0.0
        row = gen_row(rng, t, s + grief)
        row.update({"co2_ppm": rng.normal(2500, 150), "o2_pct": 20.8, "presion_hpa": 1010, "humedad_pct": 45,
                    "ruido_dba": rng.normal(50, 2), "radiacion_msv_dia": abs(rng.normal(1.0, 0.1)),
                    "gravedad_g": 0.0, "retardo_com_min": 12, "masa_pct": -0.03 * t,
                    "perdida_osea_pct": 0.045 * t, "dia_mision": t, "duracion_mision": n_mis, "fase": "durante",
                    "conflictos_tierra": int(rng.poisson(0.3 + 0.5 * s)), "conflictos_internos": int(rng.poisson(0.4))})
        if escenario:
            if 20 <= t <= 30:
                row["co2_ppm"] += 2800
            if t == 35:
                row["radiacion_msv_dia"] = 6.0
            if t == 60:
                mon.report_event("luto", t, relacion="familiar_directo")
            if t == 75:
                mon.report_event("sospecha_trastorno", t, tipo_sospecha="depresion", fuente="autoreporte")
            if t == 78:
                mon.report_event("tratamiento", t, descripcion="plan de apoyo psicológico")
        out = mon.ingest(row)
        cods = {a["codigo"] for a in out["alertas"]}
        if "DESVIACION_PERSISTENTE" in cods:
            if drift and t >= d0 and detect is None:
                detect = t
            if not drift:
                falsas += 1
        if escenario:
            key = (out["nivel"], tuple(sorted(cods)))
            if key != prev:
                log.append((t, out["nivel"], sorted(cods)))
                prev = key
            if t == 60:
                ejemplo = out
        rec = next((r for r in out["recomendaciones"] if r["tipo"] == "aprendida"), None)
        eff_t = 0.0
        if rec and strategy != "none":
            arm = rec["accion"] if strategy == "bandit" else ARMS[rec["categoria"]][rnd.integers(len(ARMS[rec["categoria"]]))]
            eff_t = eff[(rec["categoria"], arm)]
        s = max(0.0, s + (0.08 if (drift and t >= d0) else 0.0) - eff_t)
        stress.append(s)
    return {"detect": detect, "falsas": falsas, "estres": float(np.mean(stress[d0:])),
            "estres_ult20": float(np.mean(stress[-20:])), "log": log, "ejemplo": ejemplo}


if __name__ == "__main__":
    S = 30
    print(f"=== Comparación con {S} astronautas simulados ===")
    fa = [simulate(i, "none", drift=False)["falsas"] for i in range(S)]
    print(f"Sin deriva: días con alerta de desviación (100 días): media {np.mean(fa):.1f}; "
          f"astronautas con alguna: {sum(f > 0 for f in fa)}/{S}")
    det = [simulate(i, "none")["detect"] for i in range(S)]
    d = [x - 40 for x in det if x is not None]
    print(f"Con deriva desde el día 40: detectada en {len(d)}/{S}; retraso mediano {np.median(d):.0f} días")
    print("Estrés latente medio (menor = mejor): días 40-100 / últimos 20")
    for st in ["none", "random", "bandit"]:
        r = np.array([[x["estres"], x["estres_ult20"]] for x in (simulate(i, st) for i in range(S))])
        print(f"  {st:7s} {r[:, 0].mean():.2f} / {r[:, 1].mean():.2f}")

    print("\n=== Escenario completo (semilla 7): CO2 d20-30, radiación d35, deriva d40, luto d60, sospecha d75, tratamiento d78 ===")
    r = simulate(7, "bandit", escenario=True)
    for t, nivel, cods in r["log"]:
        print(f"  día {t:3d}  {nivel:9s} {', '.join(cods) or '-'}")
    print("\nEjemplo de salida JSON (día 60, extracto):")
    e = r["ejemplo"]
    print(json.dumps({k: e[k] for k in ("dia", "nivel", "dominios", "factores_contexto", "eventos_activos")},
                     ensure_ascii=False, indent=1))
    print("recomendaciones:", [x["accion"] for x in e["recomendaciones"]][:4])
