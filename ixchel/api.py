"""API REST local para el motor Ixchel + modelos aprendidos. Ejecutar: uvicorn api:app --reload"""
import json
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from monitor import MODELS, IxchelMonitor

app = FastAPI(title="Ixchel - monitoreo de salud de astronautas (offline)")
MONITORES: Dict[str, IxchelMonitor] = {}   # en memoria (para producir: guardar en disco cifrado)
ULTIMO: Dict[str, dict] = {}


class Noche(BaseModel):
    timestamps: List[float]    # unix, segundos
    fc: List[float]            # lpm


def _mon(aid: str) -> IxchelMonitor:
    if aid not in MONITORES:
        raise HTTPException(404, "Astronauta sin línea base. Primero POST /astronautas/{id}/baseline")
    return MONITORES[aid]


@app.post("/astronautas/{aid}/baseline")
def crear_baseline(aid: str, filas: List[Dict[str, Any]]):
    if len(filas) < 30:
        raise HTTPException(422, "Se requieren >= 30 días de línea base")
    MONITORES[aid] = IxchelMonitor(filas)
    return {"ok": True, "sin_linea_base": MONITORES[aid].sin_base}


@app.post("/astronautas/{aid}/dia")
def ingesta(aid: str, fila: Dict[str, Any]):
    if "dia" not in fila:
        raise HTTPException(422, "Falta el campo 'dia'")
    ULTIMO[aid] = _mon(aid).ingest(fila)
    return ULTIMO[aid]


@app.post("/astronautas/{aid}/dia_con_noche")
def ingesta_con_noche(aid: str, fila: Dict[str, Any], noche: Noche):
    """Igual que /dia, pero las variables de sueño salen de la FC cruda de la noche (modelo de sueño)."""
    if "dia" not in fila:
        raise HTTPException(422, "Falta el campo 'dia'")
    ULTIMO[aid] = _mon(aid).ingest(fila, fc_noche=(noche.timestamps, noche.fc))
    return ULTIMO[aid]


@app.post("/sueno/estimar")
def estimar_sueno(noche: Noche):
    from modelo_sueno import noche_desde_fc
    return noche_desde_fc(noche.timestamps, noche.fc)


@app.post("/astronautas/{aid}/evento")
def evento(aid: str, tipo: str, dia: int, detalle: Dict[str, Any] = {}):
    try:
        e = _mon(aid).report_event(tipo, dia, **detalle)
    except KeyError:
        raise HTTPException(422, "tipo debe ser: luto, herida, enfermedad, sospecha_trastorno, tratamiento, emergencia")
    return {"ok": True, "evento": e}


@app.get("/astronautas/{aid}/estado")
def estado(aid: str):
    _mon(aid)
    return ULTIMO.get(aid, {"nivel": "SIN_DATOS"})


@app.get("/modelos/metricas")
def metricas():
    out = {}
    for f in ["metricas_riesgo.json", "metricas_sueno.json", "normas.json"]:
        p = Path(MODELS) / f
        if p.exists():
            out[f.removesuffix(".json")] = json.loads(p.read_text(encoding="utf-8"))
    return out


@app.get("/modelos/arbol_semaforo")
def arbol():
    """Árbol de decisión explicable en JSON, para evaluarlo o dibujarlo en la web sin servidor."""
    return json.loads((Path(MODELS) / "arbol_semaforo.json").read_text(encoding="utf-8"))
