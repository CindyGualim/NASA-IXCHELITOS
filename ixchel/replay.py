"""
Valida el motor con DATOS REALES de una persona (CSV diario).
Uso:  python replay.py datos.csv --dia dia --map sleep_hours=sueno_h,hr_rest=fc_reposo,stress=estres_vas
Las primeras --base días son la línea base; el resto se reproduce día a día.
Con personas sanas, cada alerta de DESVIACION_PERSISTENTE es una falsa alarma candidata.
"""
import argparse, pandas as pd
from ixchel_core import AstronautMonitor


def replay(df, dia_col, mapa, base=30):
    df = df.rename(columns={**mapa, dia_col: "dia"})
    filas = [{k: (None if pd.isna(v) else v) for k, v in r.items()} for r in df.to_dict("records")]
    mon = AstronautMonitor(filas[:base], use_ml=False)
    return [(f["dia"], o["nivel"], [a["codigo"] for a in o["alertas"]])
            for f in filas[base:] for o in [mon.ingest(f)] if o["alertas"]]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("csv"); ap.add_argument("--dia", default="dia")
    ap.add_argument("--map", default=""); ap.add_argument("--base", type=int, default=30)
    a = ap.parse_args()
    mapa = dict(p.split("=") for p in a.map.split(",") if p)
    for d, n, c in replay(pd.read_csv(a.csv), a.dia, mapa, a.base):
        print(d, n, c)
