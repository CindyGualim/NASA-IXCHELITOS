"""
Datasets reales ADICIONALES de sueño, en el mismo formato que datos.epocas_sueno().

  PhysioNet "Sleep-Accel" (Walch 2019, acceso abierto, ODC-By): Apple Watch + polisomnografía,
  31 personas, 1 noche cada una.  https://physionet.org/content/sleep-accel/1.0.0/

Carpeta esperada (la crea scripts/download_sleep_accel.py):
  data/raw/sueno_actividad/sleep_accel/heart_rate/<id>_heartrate.txt      segundos desde inicio PSG, lpm
  data/raw/sueno_actividad/sleep_accel/labels/<id>_labeled_sleep.txt      segundos desde inicio PSG, etapa

ATENCIÓN con las etapas: aquí REM = 5 (en BIDSleep REM = 4). El código 4 no está definido en la
documentación y el -1 tampoco: esas épocas se descartan y se avisa cuántas fueron.
El formato de los archivos se leyó de la documentación de PhysioNet; no se pudo comprobar contra un archivo
real, así que el lector valida lo que puede (épocas de 30 s) y falla con un mensaje claro si algo no cuadra.
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import datos  # noqa: E402

RUTA_SLEEP_ACCEL = datos.RAW / "sueno_actividad" / "sleep_accel"
# Sleep-Accel -> codificación de BIDSleep (0 Wake, 1 N1, 2 N2, 3 N3, 4 REM)
SA_A_BIDS = {0: 0, 1: 1, 2: 2, 3: 3, 5: 4}


def _leer_pares(f):
    d = pd.read_csv(f, sep=r"[\s,;]+", header=None, engine="python", dtype=str)
    d = d.iloc[:, :2].apply(pd.to_numeric, errors="coerce").dropna()
    d.columns = ["t", "v"]
    return d


def epocas_sleep_accel(ruta=RUTA_SLEEP_ACCEL):
    """Una fila por época de 30 s: FC media/mín/máx y etapa del experto (4 clases). Mismas columnas que epocas_sueno()."""
    ruta = Path(ruta)
    archivos = sorted((ruta / "labels").glob("*_labeled_sleep.txt"))
    if not archivos:
        raise FileNotFoundError(f"Sin datos en {ruta}. Ejecuta: python -I scripts/download_sleep_accel.py")
    filas, descartadas = [], 0
    for f in archivos:
        sid = f.name.split("_")[0]
        f_hr = ruta / "heart_rate" / f"{sid}_heartrate.txt"
        if not f_hr.exists():
            print(f"  aviso: falta {f_hr.name}, se omite")
            continue
        et, hr = _leer_pares(f), _leer_pares(f_hr)
        paso = float(np.median(np.diff(et["t"].to_numpy()))) if len(et) > 2 else float("nan")
        if not np.isfinite(paso) or abs(paso - 30) > 1:
            raise ValueError(f"{f.name}: se esperaban épocas de 30 s y el paso mediano es {paso} s. "
                             "Revisa el formato del archivo antes de seguir.")
        et["k"] = np.round(et["t"] / 30).astype(int)
        et["etapa_raw"] = et["v"].round().astype(int).map(SA_A_BIDS)
        descartadas += int(et["etapa_raw"].isna().sum())
        et = et.dropna(subset=["etapa_raw"])
        et = et[et["k"] >= 0]
        et["etapa_raw"] = et["etapa_raw"].astype(int)
        hr["k"] = np.floor(hr["t"] / 30).astype(int)
        g = hr[hr["k"] >= 0].groupby("k")["v"]
        e = et[["k", "etapa_raw"]].join(g.mean().rename("fc"), on="k").join(
            g.min().rename("fc_min"), on="k").join(g.max().rename("fc_max"), on="k")
        e["sujeto"], e["noche"], e["n_epocas"] = f"SA{sid}", 1, len(et)
        filas.append(e)
    if descartadas:
        print(f"  Sleep-Accel: {descartadas} épocas con etapa no definida (-1, 4, …) descartadas")
    df = pd.concat(filas, ignore_index=True)
    df = df[df["etapa_raw"].isin(datos.ETAPA_4)].copy()
    df["etapa"] = df["etapa_raw"].map(datos.ETAPA_4)
    return df
