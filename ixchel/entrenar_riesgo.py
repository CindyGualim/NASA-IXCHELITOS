"""
Entrena el modelo de riesgo (Random Forest) que aprende a reconocer el estado real de cada dominio
a partir de lo que observa el motor, y lo compara contra las reglas del motor solas.

  python -I entrenar_riesgo.py --n 160      # genera la tripulación, entrena, evalúa y guarda en models/

Salidas en models/:
  riesgo_rf.joblib        Random Forest multi-salida (psico, sueno, fisico, social -> 0/1/2)
  arbol_semaforo.json     árbol de decisión pequeño y explicable (nivel global) para la web
  metricas_riesgo.json    métricas en astronautas que el modelo nunca vio
"""
import argparse
import json
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit
from sklearn.tree import DecisionTreeClassifier, export_text

sys.path.insert(0, str(Path(__file__).resolve().parent))   # permite ejecutar con python -I
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")                # tildes en la consola de Windows
from features import FeatureBuilder  # noqa: E402
from generador import DOMS, Astronauta, calcular_normas, verdad
from ixchel_core import AstronautMonitor

MODELS = Path(__file__).resolve().parent.parent / "models"


# ---------------------------------------------------------------- dataset
def simular_astronauta(idx, seed=1000):
    a = Astronauta(idx, seed + idx)
    mon = AstronautMonitor(a.baseline(), seed=idx, use_ml=True)
    fb = FeatureBuilder()
    filas = []
    for t in range(a.n_mis):
        for tipo, kw in a.eventos_del_dia(t):
            mon.report_event(tipo, t, **kw)
        row = a.dia(t)
        out = mon.ingest(row)
        f = fb.update(row, out)
        v = verdad(a.L, t)
        f.update({f"y_{d}": v[d] for d in DOMS})
        f["y_global"] = max(v.values())
        f.update({"astronauta": a.id, "dia": t, "entorno": a.entorno,
                  "escenarios": ",".join(e["tipo"] for e in a.esc) or "ninguno",
                  "reglas_dominio_alerta": int(any(a_["dominio"] in DOMS for a_ in out["alertas"]))})
        filas.append(f)
    return filas, {"id": a.id, "entorno": a.entorno, "escenarios": a.esc}


def construir_dataset(n, workers=None):
    """Simula n astronautas en paralelo y muestra una barra de progreso con tiempo estimado."""
    t0, res = time.time(), {}
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(simular_astronauta, i): i for i in range(n)}
        for k, f in enumerate(as_completed(futs), 1):
            res[futs[f]] = f.result()
            el = time.time() - t0
            eta = el / k * (n - k)
            barra = "#" * int(30 * k / n) + "-" * (30 - int(30 * k / n))
            print(f"\r  [{barra}] {k}/{n} astronautas  {el:4.0f} s  faltan ~{eta:3.0f} s", end="", flush=True)
    print()
    res = [res[i] for i in range(n)]
    df = pd.DataFrame([f for filas, _ in res for f in filas])
    return df, [m for _, m in res]


# ---------------------------------------------------------------- evaluación
def retraso_deteccion(df, pred_col):
    """Días desde que la verdad pasa a >=1 hasta la primera alerta, por episodio."""
    retrasos, perdidos = [], 0
    for _, g in df.groupby("astronauta"):
        y, p = g["y_global"].to_numpy(), g[pred_col].to_numpy()
        i = 0
        while i < len(y):
            if y[i] >= 1 and (i == 0 or y[i - 1] == 0):
                j = i
                while j < len(y) and y[j] >= 1:
                    j += 1
                hit = np.where(p[i:j] >= 1)[0]
                if len(hit):
                    retrasos.append(int(hit[0]))
                else:
                    perdidos += 1
                i = j
            else:
                i += 1
    return {"episodios": len(retrasos) + perdidos, "detectados": len(retrasos), "no_detectados": perdidos,
            "retraso_mediano_dias": float(np.median(retrasos)) if retrasos else None}


def resumen_binario(y, p):
    y, p = np.asarray(y) >= 1, np.asarray(p) >= 1
    tp, fp, fn, tn = (y & p).sum(), (~y & p).sum(), (y & ~p).sum(), (~y & ~p).sum()
    return {"sensibilidad": round(tp / max(tp + fn, 1), 3), "precision": round(tp / max(tp + fp, 1), 3),
            "falsas_alarmas_por_100_dias_sanos": round(100 * fp / max(fp + tn, 1), 1)}


# ---------------------------------------------------------------- árbol explicable -> JSON
def arbol_a_json(tree, nombres, clases):
    t = tree.tree_

    def nodo(i):
        if t.children_left[i] == -1:
            v = t.value[i][0]
            return {"hoja": True, "nivel": clases[int(np.argmax(v))], "confianza": round(float(v.max() / v.sum()), 3),
                    "n": int(t.n_node_samples[i])}
        return {"hoja": False, "variable": nombres[t.feature[i]], "umbral": round(float(t.threshold[i]), 3),
                "nan_va_a": "si" if t.missing_go_to_left[i] else "no",
                "si": nodo(t.children_left[i]), "no": nodo(t.children_right[i])}
    return nodo(0)


# ---------------------------------------------------------------- main
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=160, help="astronautas simulados")
    ap.add_argument("--workers", type=int, default=None)
    args = ap.parse_args()
    MODELS.mkdir(exist_ok=True)

    t0 = time.time()
    print("[1/5] Normas desde datos reales...", flush=True)
    calcular_normas()
    print(f"[2/5] Simulando {args.n} astronautas (motor Ixchel completo, 40 días de línea base + 180 de misión)...", flush=True)
    df, meta = construir_dataset(args.n, args.workers)
    df.to_csv(MODELS / "dataset_riesgo.csv.gz", index=False)
    print(f"  {len(df)} días simulados en {time.time() - t0:.0f} s", flush=True)

    X_cols = [c for c in df.columns if not c.startswith("y_") and c not in
              ("astronauta", "dia", "entorno", "escenarios", "reglas_dominio_alerta")]
    Y_cols = [f"y_{d}" for d in DOMS]
    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=0).split(df, groups=df["astronauta"]))
    dtr, dte = df.iloc[tr], df.iloc[te]
    print(f"[3/5] Entrenando Random Forest. Entrenamiento: {dtr['astronauta'].nunique()} astronautas / prueba: {dte['astronauta'].nunique()} (nunca vistos)")

    rf = RandomForestClassifier(n_estimators=300, min_samples_leaf=3, class_weight="balanced_subsample",
                                n_jobs=-1, random_state=0, verbose=1)
    rf.fit(dtr[X_cols], dtr[Y_cols])
    print("[4/5] Evaluando en astronautas nunca vistos y entrenando el árbol explicable...", flush=True)
    rf.set_params(verbose=0)
    P = np.column_stack(rf.predict(dte[X_cols]).T) if False else rf.predict(dte[X_cols])
    dte = dte.copy()
    for i, d in enumerate(DOMS):
        dte[f"rf_{d}"] = P[:, i]
    dte["rf_global"] = P.max(axis=1)
    dte["reglas_global"] = dte["reglas_dominio_alerta"]

    metricas = {"astronautas_entrenamiento": int(dtr["astronauta"].nunique()),
                "astronautas_prueba": int(dte["astronauta"].nunique()), "dias_prueba": int(len(dte)),
                "global": {"reglas_motor": {**resumen_binario(dte["y_global"], dte["reglas_global"]),
                                            **retraso_deteccion(dte, "reglas_global")},
                           "random_forest": {**resumen_binario(dte["y_global"], dte["rf_global"]),
                                             **retraso_deteccion(dte, "rf_global")}},
                "por_dominio": {}}
    for d in DOMS:
        reglas_d = (dte[f"reglas_{d}"] > 0).astype(int)
        metricas["por_dominio"][d] = {
            "reglas_motor": resumen_binario(dte[f"y_{d}"], reglas_d),
            "random_forest": resumen_binario(dte[f"y_{d}"], dte[f"rf_{d}"]),
            "rf_3_clases": classification_report(dte[f"y_{d}"], dte[f"rf_{d}"], labels=[0, 1, 2],
                                                 target_names=["bien", "atencion", "critico"],
                                                 output_dict=True, zero_division=0),
            "matriz_confusion": confusion_matrix(dte[f"y_{d}"], dte[f"rf_{d}"], labels=[0, 1, 2]).tolist()}
    imp = pd.Series(rf.feature_importances_, index=X_cols).sort_values(ascending=False)
    metricas["importancia_top15"] = {k: round(float(v), 4) for k, v in imp.head(15).items()}

    # árbol pequeño y explicable sobre el nivel global, con pocas variables legibles
    expl_cols = [f"dom7_{d}" for d in DOMS] + [f"z7_{v}" for v in ["pvt_lapses", "estres_vas", "sueno_h",
                 "fc_reposo", "hrv", "ejercicio_min"]] + ["conflictos_tierra_7d", "co2_ppm", "iforest"]
    arbol = DecisionTreeClassifier(max_depth=4, min_samples_leaf=40, class_weight="balanced", random_state=0)
    arbol.fit(dtr[expl_cols], dtr["y_global"])
    p_arbol = arbol.predict(dte[expl_cols])
    dte["arbol_global"] = p_arbol
    metricas["arbol_explicable"] = {"profundidad": 4, **resumen_binario(dte["y_global"], p_arbol),
                                    **retraso_deteccion(dte, "arbol_global"), "reglas_texto": export_text(arbol, feature_names=expl_cols)}

    print("[5/5] Guardando modelos y métricas en models/ ...", flush=True)
    clases = ["VERDE", "AMARILLO", "ROJO"]
    joblib.dump({"modelo": rf, "X_cols": X_cols, "dominios": DOMS}, MODELS / "riesgo_rf.joblib", compress=3)
    joblib.dump({"modelo": arbol, "X_cols": expl_cols}, MODELS / "arbol_semaforo.joblib")
    (MODELS / "arbol_semaforo.json").write_text(json.dumps(
        {"variables": expl_cols, "clases": clases, "arbol": arbol_a_json(arbol, expl_cols, clases)},
        indent=1, ensure_ascii=False), encoding="utf-8")
    (MODELS / "metricas_riesgo.json").write_text(json.dumps(metricas, indent=2, ensure_ascii=False), encoding="utf-8")
    (MODELS / "tripulacion_simulada.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False), encoding="utf-8")

    g = metricas["global"]
    print("\n=== Astronautas nunca vistos: detección de 'atención o peor' (cualquier dominio) ===")
    for k in ["reglas_motor", "random_forest"]:
        print(f"  {k:14s} {g[k]}")
    print(f"  arbol (prof 4) { {k: v for k, v in metricas['arbol_explicable'].items() if k != 'reglas_texto'} }")
    print("\nPor dominio (sensibilidad / falsas alarmas por 100 días sanos):")
    for d, m in metricas["por_dominio"].items():
        r, f = m["reglas_motor"], m["random_forest"]
        print(f"  {d:7s} reglas {r['sensibilidad']:.2f} / {r['falsas_alarmas_por_100_dias_sanos']:5.1f}   "
              f"RF {f['sensibilidad']:.2f} / {f['falsas_alarmas_por_100_dias_sanos']:5.1f}")
    print("\nVariables más importantes:", list(metricas["importancia_top15"])[:8])
    print(f"\nListo en {time.time() - t0:.0f} s. Modelos en {MODELS}")
