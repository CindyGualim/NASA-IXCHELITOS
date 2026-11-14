"""
Prueba si el modelo de sueño se puede mejorar, SIN tocar models/sueno_rf.joblib.
Compara, con la misma validación por persona que modelo_sueno.py:

  1. base      Random Forest con las variables actuales (debe reproducir ≈0.556 de exactitud y κ ≈0.39)
  2. extras    + 4 variables nuevas de variabilidad de la FC (sd_dif_5, sd_dif_21, fc_sobre_p10, dist_min_h)
  3. HGB       Gradient Boosting (HistGradientBoosting) con las mismas variables extra
  4. suavizado promediar las probabilidades de épocas vecinas (ventana 1, 3, 5, 9 épocas de 30 s)

  python -I modelo_sueno_mejoras.py                      # compara (≈6-8 min)
  python -I modelo_sueno_mejoras.py --extra sleep_accel  # además: prueba en otro dataset real (otro reloj, otro laboratorio)
  python -I modelo_sueno_mejoras.py --guardar            # entrena la mejor combinación y la guarda en models/sueno_mejorado.joblib

Salida: models/comparacion_sueno.json.  La función noche_desde_fc_v2() usa el modelo guardado con --guardar.
"""
import argparse
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy.ndimage import uniform_filter1d
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score, cohen_kappa_score, f1_score
from sklearn.model_selection import GroupKFold
from sklearn.utils.class_weight import compute_sample_weight

sys.path.insert(0, str(Path(__file__).resolve().parent))   # permite ejecutar con python -I
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import datos  # noqa: E402
import modelo_sueno as ms  # noqa: E402

MODELS = ms.MODELS
EXTRAS = ["sd_dif_5", "sd_dif_21", "fc_sobre_p10", "dist_min_h"]
VENTANAS_SUAVIZADO = [1, 3, 5, 9]
META = ("etapa", "sujeto", "noche")


# ---------------------------------------------------------------- variables
def agregar_extras(X):
    s, n = X["fc"], len(X)
    d = s.diff().fillna(0)
    X = X.copy()
    X["sd_dif_5"] = d.rolling(5, center=True, min_periods=1).std().fillna(0)
    X["sd_dif_21"] = d.rolling(21, center=True, min_periods=1).std().fillna(0)
    X["fc_sobre_p10"] = s - s.quantile(0.10)
    suave = s.rolling(41, center=True, min_periods=1).mean().to_numpy()
    X["dist_min_h"] = (np.arange(n) - int(np.argmin(suave))) * 30 / 3600
    return X


def tabla(ep):
    """Variables por época para todas las noches de una tabla de épocas (datos.epocas_sueno() o datos_extra)."""
    partes = []
    for (s, n), g in ep.groupby(["sujeto", "noche"], sort=False):
        g = g.sort_values("k")
        X = agregar_extras(ms.features_noche(g["fc"].to_numpy(), g["fc_min"].to_numpy(), g["fc_max"].to_numpy()))
        X["etapa"], X["sujeto"], X["noche"] = g["etapa"].to_numpy(), s, n
        partes.append(X)
    return pd.concat(partes, ignore_index=True)


# ---------------------------------------------------------------- modelos
def nuevo_modelo(tipo):
    if tipo == "rf":      # idéntico al de modelo_sueno.py
        return RandomForestClassifier(n_estimators=80, min_samples_leaf=60, max_depth=18, max_features="sqrt",
                                      class_weight="balanced_subsample", n_jobs=-1, random_state=0)
    return HistGradientBoostingClassifier(max_iter=200, learning_rate=0.06, max_leaf_nodes=31, min_samples_leaf=200,
                                          l2_regularization=1.0, early_stopping=False, random_state=0)


def ajustar(m, X, y):
    if isinstance(m, HistGradientBoostingClassifier):
        return m.fit(X, y, sample_weight=compute_sample_weight("balanced", y))
    return m.fit(X, y)


def suavizar(P, df, w):
    if w <= 1:
        return P
    out = P.copy()
    for idx in df.groupby(["sujeto", "noche"], sort=False).indices.values():
        out[idx] = uniform_filter1d(P[idx], size=w, axis=0, mode="nearest")
    return out


def metricas(df, P, w):
    y = df["etapa"].to_numpy()
    pred = suavizar(P, df, w).argmax(axis=1)
    err = []
    for idx in df.groupby(["sujeto", "noche"], sort=False).indices.values():
        a, b = ms.metricas_noche(y[idx]), ms.metricas_noche(pred[idx])
        err.append({k: b[k] - a[k] for k in a})
    err = pd.DataFrame(err)
    return {"exactitud": round(accuracy_score(y, pred), 3), "f1_macro": round(f1_score(y, pred, average="macro"), 3),
            "kappa": round(cohen_kappa_score(y, pred), 3),
            "dormido_vs_despierto": round(accuracy_score(y > 0, pred > 0), 3),
            "error_sueno_h_abs": round(float(err["sueno_h"].abs().mean()), 2),
            "error_eficiencia_abs_pct": round(float(err["sueno_eficiencia"].abs().mean()), 1)}


def probas_cv(df, X_cols, tipo):
    """Probabilidades 'fuera de muestra': cada persona se predice con un modelo que no la vio."""
    P = np.zeros((len(df), 4))
    for i, (tr, te) in enumerate(GroupKFold(n_splits=5).split(df, groups=df["sujeto"]), 1):
        m = ajustar(nuevo_modelo(tipo), df.iloc[tr][X_cols], df.iloc[tr]["etapa"])
        P[te] = m.predict_proba(df.iloc[te][X_cols])
        print(f"    grupo {i}/5", flush=True)
    return P


def mostrar(nombre, m):
    print(f"  {nombre:26s} exactitud {m['exactitud']:.3f}  κ {m['kappa']:.3f}  f1 {m['f1_macro']:.3f}  "
          f"dormido/despierto {m['dormido_vs_despierto']:.3f}  error sueño {m['error_sueno_h_abs']:.2f} h", flush=True)


# ---------------------------------------------------------------- uso del modelo guardado
_V2 = None


def noche_desde_fc_v2(timestamps, fc):
    """Igual que modelo_sueno.noche_desde_fc pero con el modelo de models/sueno_mejorado.joblib."""
    global _V2
    if _V2 is None:
        _V2 = joblib.load(MODELS / "sueno_mejorado.joblib")
        if hasattr(_V2["modelo"], "set_params") and "n_jobs" in _V2["modelo"].get_params():
            _V2["modelo"].set_params(n_jobs=1)
    t = np.asarray(timestamps, float)
    k = np.floor((t - t.min()) / 30).astype(int)
    g = pd.DataFrame({"k": k, "fc": np.asarray(fc, float)}).groupby("k")["fc"]
    idx = np.arange(k.max() + 1)
    fc_m, fc_lo, fc_hi = (g.agg(a).reindex(idx).to_numpy() for a in ("mean", "min", "max"))
    X = agregar_extras(ms.features_noche(fc_m, fc_lo, fc_hi))[_V2["X_cols"]]
    P = _V2["modelo"].predict_proba(X)
    if _V2["suavizado"] > 1:
        P = uniform_filter1d(P, size=_V2["suavizado"], axis=0, mode="nearest")
    etapas = P.argmax(axis=1)
    fc_dormido = pd.Series(fc_m)[etapas > 0].dropna()
    return {**ms.metricas_noche(etapas),
            "fc_reposo": float(np.percentile(fc_dormido, 10)) if len(fc_dormido) > 20 else None,
            "etapas": [datos.NOMBRE_ETAPA[e] for e in etapas]}


# ---------------------------------------------------------------- main
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--extra", choices=["sleep_accel"], help="dataset real adicional para probar/entrenar")
    ap.add_argument("--guardar", action="store_true", help="entrena la mejor combinación y la guarda")
    a = ap.parse_args()
    t0 = time.time()

    df = tabla(datos.epocas_sueno())
    base_cols = [c for c in df.columns if c not in META and c not in EXTRAS]
    ext_cols = base_cols + EXTRAS
    print(f"{len(df)} épocas, {df['sujeto'].nunique()} personas (BIDSleep)", flush=True)

    configs = [("rf", "base", base_cols), ("rf", "extras", ext_cols), ("hgb", "extras", ext_cols)]
    res, mejor = {}, None
    for tipo, vars_, cols in configs:
        print(f"\n[{tipo} / variables {vars_}] validación por persona…", flush=True)
        P = probas_cv(df, cols, tipo)
        for w in VENTANAS_SUAVIZADO:
            m = metricas(df, P, w)
            nombre = f"{tipo}-{vars_}-suavizado{w}"
            res[nombre] = m
            mostrar(nombre, m)
            if mejor is None or m["kappa"] > mejor[0]:
                mejor = (m["kappa"], tipo, vars_, cols, w)

    _, tipo, vars_, cols, w = mejor
    ref = res["rf-base-suavizado1"]
    print(f"\nMejor: {tipo} + variables {vars_} + suavizado {w}  (κ {mejor[0]:.3f} vs base {ref['kappa']:.3f}, "
          f"exactitud {res[f'{tipo}-{vars_}-suavizado{w}']['exactitud']:.3f} vs {ref['exactitud']:.3f})", flush=True)

    ep_extra = None
    if a.extra == "sleep_accel":
        import datos_extra
        ep_extra = datos_extra.epocas_sleep_accel()
        dx = tabla(ep_extra)
        print(f"\n[{a.extra}] {len(dx)} épocas, {dx['sujeto'].nunique()} personas — OTRO reloj, laboratorio y etiquetador", flush=True)
        m_ent = ajustar(nuevo_modelo(tipo), df[cols], df["etapa"])          # entrena con BIDSleep, prueba en el otro
        Px = m_ent.predict_proba(dx[cols])
        res["generalizacion_a_sleep_accel"] = {"modelo": f"{tipo}-{vars_}-suavizado{w}", **metricas(dx, Px, w)}
        mostrar("entrena BIDSleep → Sleep-Accel", res["generalizacion_a_sleep_accel"])
        comb = pd.concat([df, dx], ignore_index=True)
        print("  validación por persona con ambos datasets juntos:", flush=True)
        Pc = probas_cv(comb, cols, tipo)
        res["cv_ambos_datasets"] = {"modelo": f"{tipo}-{vars_}-suavizado{w}", **metricas(comb, Pc, w)}
        mostrar("BIDSleep + Sleep-Accel (CV)", res["cv_ambos_datasets"])

    (MODELS / "comparacion_sueno.json").write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")

    if a.guardar:
        print("\nEntrenando el modelo final…", flush=True)
        todo = pd.concat([df, tabla(ep_extra)], ignore_index=True) if ep_extra is not None else df
        final = ajustar(nuevo_modelo(tipo), todo[cols], todo["etapa"])
        joblib.dump({"modelo": final, "X_cols": cols, "suavizado": w, "tipo": tipo, "variables": vars_},
                    MODELS / "sueno_mejorado.joblib", compress=3)
        print("Guardado models/sueno_mejorado.joblib (el modelo original no se tocó)")
    print(f"\nListo en {time.time() - t0:.0f} s. Resultados en models/comparacion_sueno.json")
