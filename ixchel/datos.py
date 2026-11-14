"""
Carga los datasets reales de data/raw/ y los convierte en tablas que el motor entiende.

  cabina_diaria()        NASA OSDR EDA  -> co2_ppm, temp_c, humedad_pct por día (ISS)
  radiacion_diaria()     NASA OSDR EDA  -> dosis diaria absorbida por día (ISS)
  perfiles_radiacion()   NASA RadLab    -> dosis media por entorno (ISS, órbita lunar, superficie de Marte)
  noches_sueno()         PhysioNet BIDSleep -> una fila por noche: sueno_h, sueno_eficiencia, fc_reposo
  epocas_sueno()         PhysioNet BIDSleep -> una fila por época de 30 s con FC y etapa (para el modelo de sueño)
"""
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

RAW = Path(__file__).resolve().parent.parent / "data" / "raw"

# Etapas BIDSleep: 0 Wake, 1 N1, 2 N2, 3 N3, 4 REM, 5 Unknown -> 4 clases del monitor
ETAPA_4 = {0: 0, 1: 1, 2: 1, 3: 2, 4: 3}
NOMBRE_ETAPA = ["despierto", "ligero", "profundo", "REM"]
EPOCA_S = 30


# ---------------------------------------------------------------- ambiente de cabina
@lru_cache(maxsize=1)
def cabina_diaria():
    """Promedio diario por misión. CO2 en ppm, temperatura en °C, humedad relativa en %."""
    partes = []
    for f in sorted((RAW / "ambiente_cabina" / "osdr_eda").glob("RR-*_telemetria.csv")):
        df = pd.read_csv(f, dtype=str)
        if "co2_ppm_iss" not in df:
            continue
        # Los datos del EDA traen 'none', 'null', ceros, texto basura y filas vacías: se limpian
        # con rangos físicamente plausibles para una cabina habitada.
        df["time_gmt"] = pd.to_datetime(df["time_gmt"], errors="coerce")
        for c, (lo, hi) in {"co2_ppm_iss": (300, 10000), "temp_degC_iss": (15, 32), "rh_percent_iss": (10, 90)}.items():
            df[c] = pd.to_numeric(df[c], errors="coerce")
            df.loc[(df[c] < lo) | (df[c] > hi), c] = np.nan
        df = df.dropna(subset=["time_gmt", "co2_ppm_iss", "temp_degC_iss", "rh_percent_iss"])
        df["fecha"] = df["time_gmt"].dt.floor("D")
        d = df.groupby("fecha").agg(co2_ppm=("co2_ppm_iss", "mean"), co2_ppm_max=("co2_ppm_iss", "max"),
                                    temp_c=("temp_degC_iss", "mean"), humedad_pct=("rh_percent_iss", "mean"),
                                    n=("co2_ppm_iss", "size")).reset_index()
        d = d[d["n"] >= 200]                    # días con cobertura casi completa (288 muestras = 24 h)
        d["mision"] = f.name.split("_")[0]
        partes.append(d.drop(columns="n"))
    if not partes:
        raise FileNotFoundError("Sin telemetría. Ejecuta: python -I scripts/download_data.py eda")
    return pd.concat(partes, ignore_index=True).dropna()


@lru_cache(maxsize=1)
def radiacion_diaria():
    """Dosis diaria total (GCR + SAA) por misión. Unidad sin confirmar en la fuente; coherente con mGy/día."""
    partes = []
    for f in sorted((RAW / "radiacion" / "osdr_eda").glob("RR-*_radiacion_diaria.csv")):
        d = pd.read_csv(f, parse_dates=["date"])
        d["mision"] = f.name.split("_")[0]
        partes.append(d)
    return pd.concat(partes, ignore_index=True)


@lru_cache(maxsize=1)
def perfiles_radiacion():
    """Tasa media de dosis absorbida por entorno (RadLab, jun 2024) y su razón respecto a la ISS."""
    f = next((RAW / "radiacion" / "radlab").glob("dose_rate_*.csv"))
    d = pd.read_csv(f)
    media = d.groupby("instrument_id")["absorbed_dose_rate"].median()
    iss = media[["DosTel1", "DosTel2"]].mean()
    return {
        "ISS": {"tasa": float(iss), "razon_vs_iss": 1.0, "instrumento": "DosTel1/2"},
        "Luna": {"tasa": float(media.get("CRaTER-D1D2", np.nan)),
                 "razon_vs_iss": float(media.get("CRaTER-D1D2", np.nan) / iss), "instrumento": "CRaTER-D1D2 (órbita lunar)"},
        "Marte": {"tasa": float(media.get("MSL-RAD-Surface", np.nan)),
                  "razon_vs_iss": float(media.get("MSL-RAD-Surface", np.nan) / iss), "instrumento": "MSL-RAD (superficie)"},
    }


# ---------------------------------------------------------------- sueño (PhysioNet BIDSleep)
def _noches():
    import scipy.io as sio
    for lab in sorted((RAW / "sueno_actividad" / "bidsleep").glob("Bidslab*/*/labels.mat")):
        m = sio.loadmat(lab)
        etiquetas = m["expert_label"].ravel().astype(int)
        inicio = pd.Timestamp(str(m["recStart"][0])).tz_localize("America/New_York").timestamp()
        hr = pd.read_csv(lab.with_name("hr.csv"), header=None, names=["t", "fc"])
        yield lab.parent.parent.name, int(lab.parent.name), etiquetas, inicio, hr


@lru_cache(maxsize=1)
def epocas_sueno():
    """Una fila por época de 30 s: FC media/mín/máx en la época y etapa del experto (4 clases)."""
    filas = []
    for sujeto, noche, etq, inicio, hr in _noches():
        k = np.floor((hr["t"].to_numpy() - inicio) / EPOCA_S).astype(int)
        ok = (k >= 0) & (k < len(etq))
        g = pd.DataFrame({"k": k[ok], "fc": hr["fc"].to_numpy()[ok]}).groupby("k")["fc"]
        e = pd.DataFrame({"k": np.arange(len(etq)), "etapa_raw": etq})
        e = e.join(g.mean().rename("fc"), on="k").join(g.min().rename("fc_min"), on="k").join(
            g.max().rename("fc_max"), on="k")
        e["sujeto"], e["noche"], e["n_epocas"] = sujeto, noche, len(etq)
        filas.append(e)
    df = pd.concat(filas, ignore_index=True)
    df = df[df["etapa_raw"].isin(ETAPA_4)].copy()
    df["etapa"] = df["etapa_raw"].map(ETAPA_4)
    return df


@lru_cache(maxsize=1)
def noches_sueno():
    """Una fila por noche con las variables del motor, calculadas con la etiqueta del experto."""
    df = epocas_sueno()
    filas = []
    for (s, n), g in df.groupby(["sujeto", "noche"]):
        dormido = g["etapa"] > 0
        fc_dormido = g.loc[dormido, "fc"].dropna()
        filas.append({"sujeto": s, "noche": n,
                      "sueno_h": dormido.sum() * EPOCA_S / 3600,
                      "sueno_eficiencia": 100 * dormido.mean(),
                      "fc_reposo": float(np.percentile(fc_dormido, 10)) if len(fc_dormido) > 20 else np.nan,
                      "pct_profundo": 100 * (g["etapa"] == 2).mean(),
                      "pct_rem": 100 * (g["etapa"] == 3).mean()})
    return pd.DataFrame(filas)
