"""Descarga Sleep-Accel (PhysioNet, acceso abierto) en data/raw/sueno_actividad/sleep_accel/.

Solo baja heart_rate/ y labels/ (62 archivos pequeños). NO baja motion/ (aceleración, ~1 GB) ni steps/.
Uso (desde la raíz del repo):  python -I scripts/download_sleep_accel.py
Solo usa la librería estándar. PhysioNet redirige a un bucket de Amazon S3; urllib lo sigue solo.
Cita: Walch, O. (2019). Motion and heart rate from a wrist-worn wearable and labeled sleep from
polysomnography (v1.0.0). PhysioNet. https://doi.org/10.13026/hmhs-py35  (licencia ODC-By 1.0)
"""
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "raw" / "sueno_actividad" / "sleep_accel"
BASE = "https://physionet.org/files/sleep-accel/1.0.0/"
UA = {"User-Agent": "Mozilla/5.0 (space-apps-health-monitor)"}

# 31 identificadores, tal como los lista la página de PhysioNet (carpeta labels/)
IDS = """1066528 1360686 1449548 1455390 1818471 2598705 2638030 3509524 3997827 4018081 4314139 4426783 46343
5132496 5383425 5498603 5797046 6220552 759667 7749105 781756 8000685 8173033 8258170 844359 8530312 8686948
8692923 9106476 9618981 9961348""".split()


def bajar(url, destino):
    if destino.exists() and destino.stat().st_size > 0:
        return "ya estaba"
    destino.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        destino.write_bytes(r.read())
    return f"{destino.stat().st_size / 1024:.0f} KB"


if __name__ == "__main__":
    fallos = 0
    for i, sid in enumerate(IDS, 1):
        for carpeta, nombre in (("heart_rate", f"{sid}_heartrate.txt"), ("labels", f"{sid}_labeled_sleep.txt")):
            try:
                print(f"[{i}/{len(IDS)}] {carpeta}/{nombre}: {bajar(BASE + carpeta + '/' + nombre, OUT / carpeta / nombre)}",
                      flush=True)
            except Exception as e:  # noqa: BLE001
                fallos += 1
                print(f"[{i}/{len(IDS)}] {carpeta}/{nombre}: FALLÓ ({e})", flush=True)
    print(f"Listo en {OUT}" + (f" con {fallos} fallos: vuelve a correrlo (salta lo ya descargado)" if fallos else ""))
    sys.exit(1 if fallos else 0)
