"""Demo: 60 días de un astronauta simulado con check-in diario. Imprime solo los días con alertas nuevas.
Uso:  python demo_autoreporte.py"""
import numpy as np
from ixchel_core import AstronautMonitor, gen_row
from autoreporte import MonitorAutoreporte, proponer_formularios

rng = np.random.default_rng(11)
mon = MonitorAutoreporte(AstronautMonitor([gen_row(rng, t, 0.0) for t in range(-40, 0)], seed=11))
previo = None
for t in range(60):
    s = 0.0 if t < 25 else 1.6                      # desde el día 25 el astronauta empeora
    fila = gen_row(rng, t, s)
    ani = float(np.clip(round(4 - s * 0.9 + rng.normal(0, 0.4)), 1, 5))
    est = float(np.clip(round(2 + s * 0.9 + rng.normal(0, 0.4)), 1, 5))
    ck = {"CK1": ani, "CK2": ani, "CK3": est, "CK4": est, "CK5": ani, "CK7": ani}
    ar = {"checkin": ck, "seguridad": {"SF1": 0}}
    if t == 45:                                      # el día 45 se siente mal y marca el selector
        print("Selector:", [p["formularios"] for p in proponer_formularios(["ST02", "ST06"])])
        ar["phq9"] = {f"PH{i}": (2 if i < 9 else 0) for i in range(1, 10)}
    out = mon.ingest(fila, autoreporte=ar)
    clave = (out["nivel"], tuple(sorted(a["codigo"] for a in out["autoreporte"]["alertas"])))
    if clave != previo and out["autoreporte"]["alertas"]:
        print(f"día {t:2d} {out['nivel']:8s}", [(a["codigo"], a["nivel_kb"]) for a in out["autoreporte"]["alertas"]])
    previo = clave
