"""Descarga los datasets ligeros del proyecto en data/raw/, agrupados por lo que miden.

Grupos:
  ambiente_cabina/osdr_eda   Temperatura, humedad y CO2 de la ISS (NASA OSDR EDA, misiones Rodent Research)
  radiacion/osdr_eda         Dosis diaria GCR/SAA/total y acumulada (NASA OSDR EDA)
  radiacion/radlab           Tasa de dosis absorbida por detector: ISS, orbita lunar, superficie de Marte (NASA RadLab API)
  sueno_actividad/bidsleep   Frecuencia cardiaca + etapas de sueno, Apple Watch (PhysioNet BIDSleep, sin motion.csv)

Uso (desde la raiz del repo):  python -I scripts/download_data.py
Solo usa la libreria estandar.
"""

import csv
import hashlib
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
UA = {"User-Agent": "Mozilla/5.0 (space-apps-health-monitor)"}

EDA_BASE = "https://visualization.osdr.nasa.gov/eda/"
RADLAB_API = "https://visualization.osdr.nasa.gov/radlab/api/"
BIDSLEEP = "https://physionet.org/files/bidsleep-dataset/1.0.1/"

RADLAB_START = date(2024, 6, 1)
RADLAB_DAYS = 30


def get(url, retries=3, timeout=120):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            if attempt == retries - 1:
                raise
            print(f"  reintento {attempt + 1} ({e})")
            time.sleep(2 * (attempt + 1))


def write_csv(path, header, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


# ---------------------------------------------------------------- OSDR EDA
def download_eda():
    print("== NASA OSDR EDA (cabina + radiacion)")
    page = get(EDA_BASE).decode("utf-8")
    missions = sorted(set(re.findall(r'id="dash_(RR-\d+)"', page)), key=lambda m: int(m.split("-")[1]))
    print(f"  misiones: {', '.join(missions)}")
    cab_dir = RAW / "ambiente_cabina" / "osdr_eda"
    rad_dir = RAW / "radiacion" / "osdr_eda"
    meta = []
    for m in missions:
        html = get(EDA_BASE + "dashboard_" + urllib.parse.quote(m)).decode("utf-8")
        found = re.search(r'id="data"[^>]*>(.*?)</script>', html, re.S)
        if not found:
            print(f"  {m}: sin datos embebidos, se omite")
            continue
        d = json.loads(found.group(1))
        if isinstance(d, str):
            d = json.loads(d)
        def as_dict(v):
            # Algunas misiones traen el JSON doblemente codificado o vacio
            for _ in range(3):
                if isinstance(v, dict):
                    return v
                if not isinstance(v, str) or not v.strip():
                    return {}
                try:
                    v = json.loads(v)
                except json.JSONDecodeError:
                    return {}
            return v if isinstance(v, dict) else {}

        tel, rad = as_dict(d.get("telemetry_data")), as_dict(d.get("radiation_data"))

        (RAW / "_json" / "osdr_eda").mkdir(parents=True, exist_ok=True)
        (RAW / "_json" / "osdr_eda" / f"{m}.json").write_text(json.dumps(d), encoding="utf-8")

        n_tel = n_rad = 0
        if tel.get("time"):
            cols = ["temperature_iss", "temperature_ground", "rh_iss", "rh_ground", "co2_iss", "co2_ground"]
            cols = [c for c in cols if c in tel]
            rows = zip(tel["time"], *[tel[c] for c in cols])
            header = ["time_gmt"] + [
                c.replace("temperature", "temp_degC").replace("rh", "rh_percent").replace("co2", "co2_ppm") for c in cols
            ]
            write_csv(cab_dir / f"{m}_telemetria.csv", header, rows)
            n_tel = len(tel["time"])
        if rad.get("time"):
            cols = [c for c in ["gcr", "saa", "total", "accumulated"] if c in rad]
            write_csv(rad_dir / f"{m}_radiacion_diaria.csv", ["date"] + [f"{c}_dose" for c in cols],
                      zip(rad["time"], *[rad[c] for c in cols]))
            n_rad = len(rad["time"])
        meta.append({"mission": m, "title": d.get("mission_title"), "link": d.get("mission_link"),
                     "telemetry_rows": n_tel, "radiation_days": n_rad,
                     "milestones": (tel.get("milestones") or rad.get("milestones"))})
        print(f"  {m}: {n_tel} filas telemetria, {n_rad} dias radiacion")
    cab_dir.mkdir(parents=True, exist_ok=True)
    (cab_dir / "misiones.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------------------------------------------------------------- RadLab
def download_radlab():
    print(f"== NASA RadLab ({RADLAB_DAYS} dias desde {RADLAB_START})")
    out = RAW / "radiacion" / "radlab"
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"dose_rate_{RADLAB_START}_{RADLAB_DAYS}d.csv"
    total = 0
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["timestamp", "instrument_id", "absorbed_dose_rate"])
        for i in range(RADLAB_DAYS):
            a, b = RADLAB_START + timedelta(days=i), RADLAB_START + timedelta(days=i + 1)
            q = (f"timestamp&instrument_id&absorbed_dose_rate"
                 f"&timestamp>={a}T00:00&timestamp<{b}T00:00&format=csv")
            text = get(RADLAB_API + "?" + q, timeout=300).decode("utf-8")
            rows = list(csv.reader(text.splitlines()))[1:]
            w.writerows(rows)
            total += len(rows)
            print(f"  {a}: {len(rows)} filas")
    print(f"  total {total} filas -> {path.relative_to(ROOT)}")


# ---------------------------------------------------------------- BIDSleep
def download_bidsleep():
    print("== PhysioNet BIDSleep (hr.csv + labels.mat)")
    out = RAW / "sueno_actividad" / "bidsleep"
    out.mkdir(parents=True, exist_ok=True)
    sums = get(BIDSLEEP + "SHA256SUMS.txt").decode("utf-8")
    (out / "SHA256SUMS.txt").write_text(sums, encoding="utf-8")
    for name in ["README.md", "LICENSE.txt"]:
        (out / name).write_bytes(get(BIDSLEEP + name))
    wanted = []
    for line in sums.splitlines():
        parts = line.split()
        if len(parts) == 2 and re.search(r"/(hr\.csv|labels\.mat)$", parts[1]):
            wanted.append((parts[0], parts[1]))
    print(f"  {len(wanted)} archivos")
    bad = 0
    for i, (sha, rel) in enumerate(wanted, 1):
        dest = out / rel
        if dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest() == sha:
            continue
        data = get(BIDSLEEP + rel)
        if hashlib.sha256(data).hexdigest() != sha:
            print(f"  checksum incorrecto: {rel}")
            bad += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        if i % 50 == 0:
            print(f"  {i}/{len(wanted)}")
    print(f"  listo ({bad} con checksum incorrecto)")


if __name__ == "__main__":
    steps = {"eda": download_eda, "radlab": download_radlab, "bidsleep": download_bidsleep}
    chosen = sys.argv[1:] or list(steps)
    for s in chosen:
        steps[s]()
    print("Descargas completas.")
