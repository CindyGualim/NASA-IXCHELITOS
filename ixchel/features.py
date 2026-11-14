"""
Convierte la salida diaria del motor en un vector de variables para el modelo de riesgo.
Se usa igual al entrenar (offline) y al monitorear (online), para que el modelo vea lo mismo en ambos casos.
Solo usa información disponible ese día o antes.
"""
import numpy as np

from ixchel_core import DOMS, Z_VARS

NIVEL_NUM = {"VERDE": 0, "AMARILLO": 1, "ROJO": 2}


def _slope(y):
    y = np.asarray(y, float)
    if len(y) < 3 or np.all(np.isnan(y)):
        return np.nan
    x = np.arange(len(y))
    ok = ~np.isnan(y)
    if ok.sum() < 3:
        return np.nan
    return float(np.polyfit(x[ok], y[ok], 1)[0])


class FeatureBuilder:
    def __init__(self):
        self.z_hist = {v: [] for v in Z_VARS}      # z diario (con arrastre del último valor semanal)
        self.dom_hist = {d: [] for d in DOMS}
        self.ultimo_z = {}
        self.conf_tierra = []
        self.dia_evento = None

    def update(self, row, salida):
        f = {}
        for v in Z_VARS:
            z = salida["z"].get(v)
            if z is not None:
                self.ultimo_z[v] = z
            self.z_hist[v].append(self.ultimo_z.get(v, np.nan))
            h = self.z_hist[v]
            f[f"z_{v}"] = h[-1]
            f[f"z3_{v}"] = float(np.nanmean(h[-3:])) if not np.all(np.isnan(h[-3:])) else np.nan
            f[f"z7_{v}"] = float(np.nanmean(h[-7:])) if not np.all(np.isnan(h[-7:])) else np.nan
            f[f"pend7_{v}"] = _slope(h[-7:])
        for d in DOMS:
            x = salida["dominios"].get(d)
            self.dom_hist[d].append(np.nan if x is None else x)
            f[f"dom_{d}"] = self.dom_hist[d][-1]
            f[f"dom7_{d}"] = float(np.nanmean(self.dom_hist[d][-7:]))
            f[f"dom14_{d}"] = float(np.nanmean(self.dom_hist[d][-14:]))
            f[f"reglas_{d}"] = sum(1 for a in salida["alertas"] if a["dominio"] == d)
        f["reglas_nivel"] = NIVEL_NUM[salida["nivel"]]
        ml = salida.get("ml", {}).get("score_anomalia")
        f["iforest"] = np.nan if ml is None else ml
        self.conf_tierra.append(row.get("conflictos_tierra", 0))
        f["conflictos_tierra_7d"] = float(sum(self.conf_tierra[-7:]))
        for v in ["co2_ppm", "radiacion_msv_dia", "gravedad_g", "retardo_com_min", "horas_vigilia"]:
            x = row.get(v)
            f[v] = np.nan if x is None else float(x)
        if any(e["tipo"] == "luto" for e in salida["eventos_activos"]):
            if self.dia_evento is None:
                self.dia_evento = row["dia"]
            f["dias_desde_luto"] = row["dia"] - self.dia_evento
        else:
            f["dias_desde_luto"] = np.nan
        return f
