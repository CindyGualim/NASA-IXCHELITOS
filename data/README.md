# Datos del proyecto

`data/raw/` no se sube a git. Se regenera con:

```
python -I scripts/download_data.py            # todo
python -I scripts/download_data.py eda radlab # solo NASA
python -I scripts/download_data.py bidsleep   # solo sueño
```

Descargado el 2026-11-14. Total ≈ 100 MB.

## Grupos por lo que miden

| Grupo | Carpeta | Fuente | Qué mide | Formato | Licencia |
|---|---|---|---|---|---|
| Ambiente de cabina | `raw/ambiente_cabina/osdr_eda/` | [NASA OSDR EDA](https://visualization.osdr.nasa.gov/eda/) | Temperatura (°C), humedad relativa (%), CO₂ (ppm) cada 5 min, ISS vs. tierra. 13 misiones Rodent Research (2014–2024) | `RR-N_telemetria.csv` + `misiones.json` (títulos, fechas clave) | NASA, uso público |
| Radiación diaria | `raw/radiacion/osdr_eda/` | NASA OSDR EDA | Dosis diaria de rayos cósmicos (GCR), Anomalía del Atlántico Sur (SAA), total y acumulada. 11 misiones | `RR-N_radiacion_diaria.csv` | NASA, uso público |
| Radiación por detector | `raw/radiacion/radlab/` | [NASA RadLab API](https://visualization.osdr.nasa.gov/radlab/api/) | Tasa de dosis absorbida, 1–30 jun 2024. ISS (DosTel1, DosTel2), órbita lunar (CRaTER-D1D2), superficie de Marte (MSL-RAD-Surface), BPD | `dose_rate_2024-06-01_30d.csv` (timestamp, instrument_id, absorbed_dose_rate) | NASA, uso público |
| Sueño y actividad | `raw/sueno_actividad/bidsleep/` | [PhysioNet BIDSleep 1.0.1](https://physionet.org/content/bidsleep-dataset/) | Frecuencia cardiaca de Apple Watch (~0,2 Hz) + etapas de sueño anotadas por experto. 47 sujetos, 253 noches | `BidslabXX/<noche>/hr.csv` (sin encabezado: unix_s, bpm) + `labels.mat` (`recStart`, `dreem_label`, `expert_label`: 0 Wake, 1 N1, 2 N2, 3 N3, 4 REM, 5 Unknown) | ODC-By 1.0 (citar) |

`raw/_json/osdr_eda/` guarda el JSON original de cada misión tal como lo sirve el EDA.

## Pendiente de verificar
- Unidades de radiación: el EDA no las muestra en la página. Los valores (~0,2 por día en la ISS) son coherentes con mGy/día. Las de RadLab (~5 en DosTel) parecen µGy/h. Confirmar antes de mostrarlas en la app.
- Misiones sin telemetría: RR-4, RR-8, RR-17. Sin radiación: RR-5, RR-10, RR-18, RR-20, RR-22, RR-25, RR-28.
- `motion.csv` de BIDSleep (~27 GB) no se descargó.

## No descargados (opcionales)
- PhysioNet Autonomic Aging: ECG + presión arterial continua (5,9 GB).
- PhysioNet CGMacros: glucosa continua + comidas (~660 MB, CC BY-NC-SA).
