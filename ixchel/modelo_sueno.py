"""
Modelo de sueño con DATOS REALES: Random Forest que estima la etapa de sueño cada 30 s
(despierto / ligero / profundo / REM) solo con la frecuencia cardiaca del reloj.
De ahí salen las variables del motor: sueno_h, sueno_eficiencia y fc_reposo.

Entrenado y validado con PhysioNet BIDSleep (47 personas, 253 noches, etiquetas de un experto).
La validación separa por persona: el modelo siempre se evalúa en gente que no vio al entrenar.

  python -I modelo_sueno.py         # valida (5 grupos por persona), entrena con todo y guarda models/sueno_rf.joblib

Uso en el monitor:
  from modelo_sueno import noche_desde_fc
  noche_desde_fc(timestamps_unix, fc_lpm)  ->  {"sueno_h": .., "sueno_eficiencia": .., "fc_reposo": .., "etapas": [...]}
"""
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, cohen_kappa_score, confusion_matrix, f1_score
from sklearn.model_selection import GroupKFold

sys.path.insert(0, str(Path(__file__).resolve().parent))   # permite ejecutar con python -I
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")                # tildes en la consola de Windows
import datos  # noqa: E402

MODELS = Path(__file__).resolve().parent.parent / "models"
VENTANAS = [5, 11, 21, 41, 81]           # épocas de 30 s (2.5 a 40 min), centradas


def features_noche(fc, fc_min=None, fc_max=None):
    """Variables por época para UNA noche. fc: FC media por época (puede tener huecos)."""
    s = pd.Series(np.asarray(fc, float)).interpolate(limit_direction="both")
    n = len(s)
    med, sd = s.median(), s.std() or 1.0
    f = {"fc": s, "fc_rel": s - med, "fc_z": (s - med) / sd, "fc_rank": s.rank(pct=True),
         "frac_noche": pd.Series(np.arange(n) / max(n - 1, 1)), "horas": pd.Series(np.arange(n) * 30 / 3600),
         "dif1": s.diff().fillna(0), "dif5": s.diff(5).fillna(0)}
    if fc_min is not None:
        f["rango_epoca"] = pd.Series(np.asarray(fc_max, float) - np.asarray(fc_min, float)).fillna(0)
    for w in VENTANAS:
        r = s.rolling(w, center=True, min_periods=1)
        f[f"media_{w}"] = r.mean() - med
        f[f"sd_{w}"] = r.std().fillna(0)
        f[f"rango_{w}"] = r.max() - r.min()
    return pd.DataFrame(f)


def tabla_entrenamiento():
    ep = datos.epocas_sueno()
    partes = []
    for (s, n), g in ep.groupby(["sujeto", "noche"], sort=False):
        g = g.sort_values("k")
        X = features_noche(g["fc"].to_numpy(), g["fc_min"].to_numpy(), g["fc_max"].to_numpy())
        X["etapa"], X["sujeto"], X["noche"] = g["etapa"].to_numpy(), s, n
        partes.append(X)
    return pd.concat(partes, ignore_index=True)


def metricas_noche(etapas):
    etapas = np.asarray(etapas)
    dormido = etapas > 0
    return {"sueno_h": float(dormido.sum() * 30 / 3600), "sueno_eficiencia": float(100 * dormido.mean())}


_MODELO = None


def noche_desde_fc(timestamps, fc):
    """Convierte la FC cruda de una noche (unix s, lpm) en las variables de sueño del motor."""
    global _MODELO
    if _MODELO is None:
        _MODELO = joblib.load(MODELS / "sueno_rf.joblib")
        _MODELO["modelo"].set_params(n_jobs=1)
    t = np.asarray(timestamps, float)
    k = np.floor((t - t.min()) / 30).astype(int)
    g = pd.DataFrame({"k": k, "fc": np.asarray(fc, float)}).groupby("k")["fc"]
    idx = np.arange(k.max() + 1)
    fc_m, fc_lo, fc_hi = (g.agg(a).reindex(idx).to_numpy() for a in ("mean", "min", "max"))
    X = features_noche(fc_m, fc_lo, fc_hi)[_MODELO["X_cols"]]
    etapas = _MODELO["modelo"].predict(X)
    fc_dormido = pd.Series(fc_m)[etapas > 0].dropna()
    return {**metricas_noche(etapas),
            "fc_reposo": float(np.percentile(fc_dormido, 10)) if len(fc_dormido) > 20 else None,
            "etapas": [datos.NOMBRE_ETAPA[e] for e in etapas]}


if __name__ == "__main__":
    t0 = time.time()
    df = tabla_entrenamiento()
    X_cols = [c for c in df.columns if c not in ("etapa", "sujeto", "noche")]
    print(f"{len(df)} épocas, {df['sujeto'].nunique()} personas, {df.groupby(['sujeto', 'noche']).ngroups} noches")

    def nuevo_rf():
        # compacto (< 25 MB) para poder versionarlo y cargarlo rápido en la app
        return RandomForestClassifier(n_estimators=80, min_samples_leaf=60, max_depth=18, max_features="sqrt",
                                      class_weight="balanced_subsample", n_jobs=-1, random_state=0)

    pred = np.zeros(len(df), int)
    for i, (tr, te) in enumerate(GroupKFold(n_splits=5).split(df, groups=df["sujeto"])):
        m = nuevo_rf().fit(df.iloc[tr][X_cols], df.iloc[tr]["etapa"])
        pred[te] = m.predict(df.iloc[te][X_cols])
        print(f"  grupo {i + 1}/5 listo")
    y = df["etapa"].to_numpy()
    df["pred"] = pred

    # error por noche en las variables que usa el motor
    err = []
    for _, g in df.groupby(["sujeto", "noche"]):
        a, b = metricas_noche(g["etapa"]), metricas_noche(g["pred"])
        err.append({k: b[k] - a[k] for k in a})
    err = pd.DataFrame(err)
    linea_base = np.full_like(y, np.bincount(y).argmax())
    met = {
        "fuente": "PhysioNet BIDSleep 1.0.1 (etiquetas del experto); validación cruzada 5 grupos por persona",
        "epocas": int(len(df)), "personas": int(df["sujeto"].nunique()),
        "exactitud": round(accuracy_score(y, pred), 3),
        "f1_macro": round(f1_score(y, pred, average="macro"), 3),
        "kappa_cohen": round(cohen_kappa_score(y, pred), 3),
        "exactitud_dormido_vs_despierto": round(accuracy_score(y > 0, pred > 0), 3),
        "exactitud_si_siempre_dice_ligero": round(accuracy_score(y, linea_base), 3),
        "f1_por_etapa": dict(zip(datos.NOMBRE_ETAPA, np.round(f1_score(y, pred, average=None), 3).tolist())),
        "matriz_confusion": {"orden": datos.NOMBRE_ETAPA, "valores": confusion_matrix(y, pred).tolist()},
        "error_por_noche": {
            "sueno_h_error_medio_h": round(float(err["sueno_h"].mean()), 2),
            "sueno_h_error_absoluto_medio_h": round(float(err["sueno_h"].abs().mean()), 2),
            "eficiencia_error_absoluto_medio_pct": round(float(err["sueno_eficiencia"].abs().mean()), 1)},
    }
    print(json.dumps({k: v for k, v in met.items() if k != "matriz_confusion"}, indent=1, ensure_ascii=False))

    final = nuevo_rf().fit(df[X_cols], df["etapa"])
    MODELS.mkdir(exist_ok=True)
    joblib.dump({"modelo": final, "X_cols": X_cols}, MODELS / "sueno_rf.joblib", compress=3)
    (MODELS / "metricas_sueno.json").write_text(json.dumps(met, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Guardado models/sueno_rf.joblib en {time.time() - t0:.0f} s")
