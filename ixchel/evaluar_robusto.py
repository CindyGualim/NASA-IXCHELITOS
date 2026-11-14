"""
Evaluación más dura del modelo de riesgo. Responde: ¿el modelo sirve cuando la situación NO se parece a lo
que vio al entrenar?

Necesita models/dataset_riesgo.csv.gz (lo crea entrenar_riesgo.py).

  python -I evaluar_robusto.py                        # todas las pruebas (~5 min)
  python -I evaluar_robusto.py --secciones cv,umbral  # solo algunas
  python -I evaluar_robusto.py --n-arboles 80         # más rápido

Pruebas (--secciones):
  cv          validación cruzada de 5 grupos por astronauta  -> media ± desviación en vez de un solo corte
  escenarios  entrena SIN un escenario (p. ej. luto) y prueba solo en astronautas que lo tuvieron
  entornos    entrena sin un entorno (ISS / Luna / Marte) y prueba en ese
  ruido       prueba con sensores caídos (valores faltantes) y ruido añadido a los z-scores
  umbral      curva sensibilidad vs falsas alarmas al mover el umbral de decisión
Guarda todo en models/evaluacion_robusta.json
"""
import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GroupKFold, GroupShuffleSplit

sys.path.insert(0, str(Path(__file__).resolve().parent))   # permite ejecutar con python -I
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from entrenar_riesgo import resumen_binario, retraso_deteccion  # noqa: E402
from generador import DOMS  # noqa: E402

MODELS = Path(__file__).resolve().parent.parent / "models"
META = ("astronauta", "dia", "entorno", "escenarios", "reglas_dominio_alerta")


# ---------------------------------------------------------------- utilidades
def cargar():
    f = MODELS / "dataset_riesgo.csv.gz"
    if not f.exists():
        sys.exit(f"Falta {f}. Primero corre:  python -I entrenar_riesgo.py --n 160")
    df = pd.read_csv(f)
    X_cols = [c for c in df.columns if not c.startswith("y_") and c not in META]
    return df, X_cols


def entrenar(dtr, X_cols, n_arboles):
    rf = RandomForestClassifier(n_estimators=n_arboles, min_samples_leaf=3, class_weight="balanced_subsample",
                                n_jobs=-1, random_state=0)
    return rf.fit(dtr[X_cols], dtr[[f"y_{d}" for d in DOMS]])


def puntaje(rf, X):
    """Probabilidad de 'atención o peor' en el dominio más afectado (0 a 1)."""
    p = rf.predict_proba(X)
    peor = np.zeros(len(X))
    for clases, pd_ in zip(rf.classes_, p):
        p0 = pd_[:, list(clases).index(0)] if 0 in clases else np.zeros(len(X))
        peor = np.maximum(peor, 1 - p0)
    return peor


def medir(dte, score, umbral=0.5):
    dte = dte.assign(pred=(score >= umbral).astype(int))
    return {**resumen_binario(dte["y_global"], dte["pred"]), **retraso_deteccion(dte, "pred")}


def reglas(dte):
    d = dte.assign(pred=dte["reglas_dominio_alerta"].astype(int))
    return {**resumen_binario(d["y_global"], d["pred"]), **retraso_deteccion(d, "pred")}


def fila(nombre, m, r=None):
    s = f"  {nombre:28s} sens {m['sensibilidad']:.2f}  falsas/100d {m['falsas_alarmas_por_100_dias_sanos']:5.1f}  " \
        f"detectados {m['detectados']}/{m['episodios']}"
    if r:
        s += f"   | reglas solas: sens {r['sensibilidad']:.2f}  falsas {r['falsas_alarmas_por_100_dias_sanos']:.1f}"
    print(s, flush=True)


def js(x):
    if isinstance(x, dict):
        return {k: js(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [js(v) for v in x]
    return x.item() if hasattr(x, "item") else x


# ---------------------------------------------------------------- pruebas
def prueba_cv(df, X_cols, n_arboles):
    print("\n[cv] Validación cruzada por astronauta (5 grupos)", flush=True)
    res, res_r = [], []
    for i, (tr, te) in enumerate(GroupKFold(n_splits=5).split(df, groups=df["astronauta"]), 1):
        rf = entrenar(df.iloc[tr], X_cols, n_arboles)
        dte = df.iloc[te]
        res.append(medir(dte, puntaje(rf, dte[X_cols])))
        res_r.append(reglas(dte))
        fila(f"grupo {i}", res[-1], res_r[-1])
    out = {}
    for nombre, lst in (("random_forest", res), ("reglas_motor", res_r)):
        out[nombre] = {k: {"media": round(float(np.mean([r[k] for r in lst])), 3),
                           "desv": round(float(np.std([r[k] for r in lst])), 3)}
                       for k in ("sensibilidad", "precision", "falsas_alarmas_por_100_dias_sanos")}
    m = out["random_forest"]
    print(f"  => RF: sensibilidad {m['sensibilidad']['media']} ± {m['sensibilidad']['desv']}, "
          f"falsas/100d {m['falsas_alarmas_por_100_dias_sanos']['media']} ± {m['falsas_alarmas_por_100_dias_sanos']['desv']}")
    out["por_grupo"] = res
    return out


def prueba_grupo_fuera(df, X_cols, n_arboles, columna, valores, titulo, contiene=False):
    """Entrena sin los astronautas que tienen 'valor' y prueba solo en ellos."""
    print(f"\n[{titulo}]", flush=True)
    out = {}
    for v in valores:
        if contiene:
            tiene = df.groupby("astronauta")[columna].first().apply(lambda s: v in str(s).split(","))
        else:
            tiene = df.groupby("astronauta")[columna].first().eq(v)
        ids_te = set(tiene[tiene].index)
        dte, dtr = df[df["astronauta"].isin(ids_te)], df[~df["astronauta"].isin(ids_te)]
        if dte["astronauta"].nunique() < 5 or dtr["astronauta"].nunique() < 20:
            print(f"  {v}: muy pocos astronautas, se omite")
            continue
        rf = entrenar(dtr, X_cols, n_arboles)
        m, r = medir(dte, puntaje(rf, dte[X_cols])), reglas(dte)
        fila(f"sin '{v}' (n={dte['astronauta'].nunique()})", m, r)
        out[v] = {"astronautas_prueba": int(dte["astronauta"].nunique()), "random_forest": m, "reglas_motor": r}
    return out


def prueba_ruido(rf, dte, X_cols):
    print("\n[ruido] Sensores caídos y ruido en los z-scores (aproximación a nivel de variables)", flush=True)
    rng = np.random.default_rng(0)
    zcols = [c for c in X_cols if c.split("_")[0] in ("z", "z3", "z7")]
    out = {}
    for falt, ruido in [(0, 0), (0.1, 0), (0.3, 0), (0.5, 0), (0, 0.5), (0, 1.0), (0.3, 1.0)]:
        X = dte[X_cols].copy()
        if ruido:
            X[zcols] = X[zcols] + rng.normal(0, ruido, size=(len(X), len(zcols)))
        if falt:
            X = X.mask(rng.random(X.shape) < falt)
        m = medir(dte, puntaje(rf, X))
        fila(f"faltantes {falt:.0%}, ruido {ruido}", m)
        out[f"faltantes_{falt}_ruido_{ruido}"] = m
    return out


def prueba_umbral(rf, dte, X_cols):
    print("\n[umbral] Mover el umbral cambia sensibilidad vs falsas alarmas", flush=True)
    sc = puntaje(rf, dte[X_cols])
    out = {}
    for u in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
        m = medir(dte, sc, u)
        fila(f"umbral {u}", m)
        out[str(u)] = m
    ok = [(u, m) for u, m in out.items() if m["falsas_alarmas_por_100_dias_sanos"] <= 1.0]
    if ok:
        u, m = max(ok, key=lambda t: (t[1]["sensibilidad"], -float(t[0])))
        print(f"  => mayor sensibilidad con falsas alarmas <= 1/100 días: umbral {u} (sens {m['sensibilidad']:.2f})")
        out["recomendado_falsas_le_1"] = u
    return out


# ---------------------------------------------------------------- main
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--secciones", default="cv,escenarios,entornos,ruido,umbral")
    ap.add_argument("--n-arboles", type=int, default=150)
    a = ap.parse_args()
    sec = set(a.secciones.split(","))
    t0 = time.time()
    df, X_cols = cargar()
    print(f"{len(df)} días, {df['astronauta'].nunique()} astronautas, {len(X_cols)} variables", flush=True)
    res = {}

    if "cv" in sec:
        res["cv_5_grupos"] = prueba_cv(df, X_cols, a.n_arboles)
    if "escenarios" in sec:
        esc = sorted({e for s in df["escenarios"].unique() for e in str(s).split(",") if e != "ninguno"})
        res["sin_escenario"] = prueba_grupo_fuera(df, X_cols, a.n_arboles, "escenarios", esc,
                                                  "escenarios: entrenar SIN el escenario y probar en él", contiene=True)
    if "entornos" in sec:
        res["sin_entorno"] = prueba_grupo_fuera(df, X_cols, a.n_arboles, "entorno", sorted(df["entorno"].unique()),
                                                "entornos: entrenar SIN el entorno y probar en él")
    if sec & {"ruido", "umbral"}:
        tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=0).split(df, groups=df["astronauta"]))
        rf = entrenar(df.iloc[tr], X_cols, a.n_arboles)
        dte = df.iloc[te]
        if "ruido" in sec:
            res["ruido"] = prueba_ruido(rf, dte, X_cols)
        if "umbral" in sec:
            res["umbral"] = prueba_umbral(rf, dte, X_cols)

    (MODELS / "evaluacion_robusta.json").write_text(json.dumps(js(res), indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nListo en {time.time() - t0:.0f} s. Guardado models/evaluacion_robusta.json")
