"""Exporta data/derivado/ambiente_iss.json: copia compacta de las tablas de ambiente (cabina y radiación
de la ISS) que usa el generador, para que la API pueda desplegarse sin descargar data/raw.
Ejecutar tras scripts/download_data.py:  python -I scripts/export_derivado.py"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ixchel"))
import datos  # noqa: E402

cab = datos.cabina_diaria().copy()
cab["fecha"] = cab["fecha"].dt.strftime("%Y-%m-%d")
rad = datos.radiacion_diaria().copy()
rad["date"] = rad["date"].dt.strftime("%Y-%m-%d")
snap = {"cabina_diaria": cab.to_dict(orient="list"), "radiacion_diaria": rad.to_dict(orient="list"),
        "perfiles_radiacion": datos.perfiles_radiacion()}
datos.DERIVADO.parent.mkdir(parents=True, exist_ok=True)
datos.DERIVADO.write_text(json.dumps(snap, ensure_ascii=False), encoding="utf-8")
print("escrito", datos.DERIVADO, f"({len(cab)} días de cabina, {len(rad)} de radiación)")
