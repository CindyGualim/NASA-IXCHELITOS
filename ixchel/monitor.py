"""
IxchelMonitor: el motor de reglas Ixchel + los modelos aprendidos, en una sola interfaz.

  mon = IxchelMonitor(filas_baseline)                  # >= 30 días pre-misión
  salida = mon.ingest(fila_del_dia)                     # igual que AstronautMonitor.ingest
  salida = mon.ingest(fila, fc_noche=(timestamps, fc))  # opcional: FC cruda de la noche -> variables de sueño

Qué añade a la salida del motor:
  salida["ml"]["riesgo_dominios"]   nivel 0/1/2 y probabilidad por dominio (Random Forest)
  salida["ml"]["explicacion"]       camino del árbol de decisión pequeño: por qué ese color
  salida["sueno_estimado"]          si se pasó la FC de la noche (modelo de sueño con datos reales)

Regla de seguridad: el ML solo puede ADELANTAR un aviso (VERDE -> AMARILLO con ALERTA_TEMPRANA_ML).
Nunca pone ROJO por sí solo ni quita alertas de las reglas. La decisión final es humana.

  python -I monitor.py      # demo: un astronauta simulado, reglas vs. ML vs. verdad
"""
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))   # permite ejecutar con python -I
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")                # tildes y símbolos en la consola de Windows
from features import FeatureBuilder  # noqa: E402
from ixchel_core import AstronautMonitor  # noqa: E402

MODELS = Path(__file__).resolve().parent.parent / "models"
NIVELES = ["VERDE", "AMARILLO", "ROJO"]
NOMBRE_DOM = {"psico": "psicológico", "sueno": "sueño", "fisico": "físico", "social": "social"}


def _legible(var):
    if var.startswith("dom7_"):
        return f"puntaje {NOMBRE_DOM.get(var[5:], var[5:])} (prom. 7 días)"
    if var.startswith("z7_"):
        return f"{var[3:]} (Z prom. 7 días)"
    return {"conflictos_tierra_7d": "conflictos con Tierra (7 días)", "co2_ppm": "CO2 de cabina (ppm)",
            "iforest": "anomalía Isolation Forest"}.get(var, var)


class IxchelMonitor:
    _rf = _arbol = None

    def __init__(self, baseline_rows, **kw):
        self.core = AstronautMonitor(baseline_rows, **kw)
        self.fb = FeatureBuilder()
        if IxchelMonitor._rf is None and (MODELS / "riesgo_rf.joblib").exists():
            IxchelMonitor._rf = joblib.load(MODELS / "riesgo_rf.joblib")
            IxchelMonitor._rf["modelo"].set_params(n_jobs=1)   # 1 fila por día: sin hilos es más rápido
            IxchelMonitor._arbol = joblib.load(MODELS / "arbol_semaforo.joblib")

    @property
    def sin_base(self):
        return self.core.sin_base

    def report_event(self, tipo, dia, **kw):
        return self.core.report_event(tipo, dia, **kw)

    def _explicar(self, X):
        arbol, cols = self._arbol["modelo"], self._arbol["X_cols"]
        x = X[cols]
        t = arbol.tree_
        pasos = []
        for nodo in arbol.decision_path(x).indices:
            if t.children_left[nodo] == -1:
                break
            var, umbral, val = cols[t.feature[nodo]], t.threshold[nodo], x.iloc[0][cols[t.feature[nodo]]]
            if pd.isna(val):
                pasos.append(f"{_legible(var)}: sin dato")
            else:
                pasos.append(f"{_legible(var)} = {val:.2f} {'≤' if val <= umbral else '>'} {umbral:.2f}")
        return {"nivel_arbol": NIVELES[int(arbol.predict(x)[0])], "pasos": pasos}

    def ingest(self, row, fc_noche=None):
        sueno = None
        if fc_noche is not None:
            from modelo_sueno import noche_desde_fc
            sueno = noche_desde_fc(*fc_noche)
            row = {**{k: sueno[k] for k in ("sueno_h", "sueno_eficiencia", "fc_reposo") if sueno.get(k) is not None},
                   **{k: v for k, v in row.items() if v is not None}}
        out = self.core.ingest(row)
        f = self.fb.update(row, out)
        if sueno is not None:
            out["sueno_estimado"] = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in sueno.items() if k != "etapas"}
        if self._rf is None:
            return out

        rf, cols = self._rf["modelo"], self._rf["X_cols"]
        X = pd.DataFrame([f])[cols].astype(float)
        probas = rf.predict_proba(X)
        riesgo = {}
        for d, p, clases in zip(self._rf["dominios"], probas, rf.classes_):
            p = dict(zip(clases.astype(int), p[0]))
            nivel = int(max(p, key=p.get))
            riesgo[d] = {"nivel": NIVELES[nivel], "prob_atencion_o_peor": round(float(p.get(1, 0) + p.get(2, 0)), 3)}
        nivel_ml = max(NIVELES.index(r["nivel"]) for r in riesgo.values())

        if nivel_ml >= 1 and out["nivel"] == "VERDE":
            doms = [d for d, r in riesgo.items() if r["nivel"] != "VERDE"]
            out["nivel"] = "AMARILLO"
            for d in doms:
                out["alertas"].append({"codigo": "ALERTA_TEMPRANA_ML", "dominio": d, "nivel": "AMARILLO",
                                       "detalle": f"El modelo aprendido ve deterioro en {NOMBRE_DOM[d]} "
                                                  f"(p={riesgo[d]['prob_atencion_o_peor']:.2f}) antes que las reglas"})
        out["ml"] = {**out.get("ml", {}), "modo": "activo", "riesgo_dominios": riesgo,
                     "nivel_ml": NIVELES[nivel_ml], "explicacion": self._explicar(X),
                     "regla": "El ML solo adelanta avisos (máx. AMARILLO); las reglas y el humano deciden ROJO"}
        return out


# ---------------------------------------------------------------- demo
if __name__ == "__main__":
    from generador import Astronauta, verdad
    a = Astronauta(7, seed=4242, entorno="Marte")
    print(f"Astronauta {a.id} en {a.entorno}. Escenarios: "
          + ", ".join(f"{e['tipo']} (día {e['inicio']})" for e in a.esc) or "ninguno")
    mon = IxchelMonitor(a.baseline(), seed=7)
    print("\n día | verdad   | reglas   | final (reglas+ML) | dominios ML con aviso")
    prev = None
    for t in range(a.n_mis):
        for tipo, kw in a.eventos_del_dia(t):
            mon.report_event(tipo, t, **kw)
        out = mon.ingest(a.dia(t))
        v = NIVELES[max(verdad(a.L, t).values())]
        reglas = "AMARILLO" if any(x["codigo"] != "ALERTA_TEMPRANA_ML" and x["dominio"] in NOMBRE_DOM
                                  for x in out["alertas"]) else "VERDE"
        doms = [d for d, r in out["ml"]["riesgo_dominios"].items() if r["nivel"] != "VERDE"]
        fila = (v, reglas, out["nivel"], tuple(doms))
        if fila != prev:
            print(f" {t:3d} | {v:8s} | {reglas:8s} | {out['nivel']:17s} | {', '.join(doms) or '-'}")
            prev = fila
    print("\nÚltimo día, explicación del semáforo:")
    for p in out["ml"]["explicacion"]["pasos"]:
        print("  -", p)
    print("  =>", out["ml"]["explicacion"]["nivel_arbol"])
