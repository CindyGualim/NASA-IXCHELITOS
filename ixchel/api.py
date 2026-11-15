"""API REST local para el motor Ixchel + modelos aprendidos. Ejecutar: uvicorn api:app --reload"""
import json
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from monitor import MODELS, IxchelMonitor

@asynccontextmanager
async def _arranque(_app):
    # Simula en segundo plano las misiones de demostración (unos 20 s cada una) para que la web
    # no tenga que esperar en la primera consulta. No bloquea el arranque del servidor.
    threading.Thread(target=lambda: [_demo(k) for k in ("fatiga", "duelo", "nominal")], daemon=True).start()
    yield


app = FastAPI(title="Ixchel - monitoreo de salud de astronautas (offline)", lifespan=_arranque)
# El frontend (fronted/, Vite) corre en otro puerto de la misma máquina: se permite solo localhost.
app.add_middleware(CORSMiddleware, allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
                   allow_methods=["*"], allow_headers=["*"])
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


# ---------------------------------------------------------------- demo para el frontend
# Misiones simuladas (generador.py) que el motor real procesa día por día. Así la web tiene datos
# sin sensores: el frontend pide un día y recibe exactamente lo que el motor produjo ese día.
ESCENARIOS_DEMO = {
    "nominal": {"semilla": 6, "entorno": "Marte", "titulo": "Astronauta sin problemas (toda alerta es falsa alarma)"},
    "fatiga": {"semilla": 227, "entorno": "Marte", "titulo": "Privación de sueño acumulada (d76) y CO₂ alto (d136)"},
    "duelo": {"semilla": 2, "entorno": "Marte", "titulo": "Luto por un familiar directo (d140)"},
}
_DEMO: Dict[str, dict] = {}
_DEMO_LOCKS = {k: threading.Lock() for k in ESCENARIOS_DEMO}   # uno por escenario: no se bloquean entre sí


def _nativo(x):
    """numpy -> tipos JSON nativos (recursivo)."""
    if isinstance(x, dict):
        return {str(k): _nativo(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [_nativo(v) for v in x]
    if hasattr(x, "item"):
        return x.item()
    return x


def _media(vals):
    vals = [v for v in vals if isinstance(v, (int, float)) and not isinstance(v, bool)]
    return round(sum(vals) / len(vals), 3) if vals else None


def _simular_demo(clave: str) -> dict:
    from generador import Astronauta
    cfg = ESCENARIOS_DEMO[clave]
    a = Astronauta(7, seed=cfg["semilla"], entorno=cfg["entorno"])
    base = a.baseline()
    mon = IxchelMonitor(base, seed=7)
    filas, salidas = [], []
    for t in range(a.n_mis):
        for tipo, kw in a.eventos_del_dia(t):
            mon.report_event(tipo, t, **kw)
        fila = a.dia(t)
        filas.append(_nativo(fila))
        salidas.append(_nativo(mon.ingest(fila)))
    aid = f"demo-{clave}"
    MONITORES[aid], ULTIMO[aid] = mon, salidas[-1]
    claves = sorted({k for f in base for k in f if k != "dia"})
    return {"clave": clave, **cfg, "astronauta": aid, "n_dias": a.n_mis,
            "eventos": [{"tipo": e["tipo"], "inicio": int(e["inicio"])} for e in a.esc],
            "base": {k: _media([f.get(k) for f in base]) for k in claves},
            "filas": filas, "salidas": salidas}


def _demo(clave: str) -> dict:
    if clave not in ESCENARIOS_DEMO:
        raise HTTPException(404, f"Escenario desconocido. Opciones: {', '.join(ESCENARIOS_DEMO)}")
    with _DEMO_LOCKS[clave]:    # la primera vez simula la misión completa (unos segundos) y la guarda
        if clave not in _DEMO:
            _DEMO[clave] = _simular_demo(clave)
    return _DEMO[clave]


@app.get("/demo/escenarios")
def demo_escenarios():
    """Escenarios de demostración disponibles (sin simularlos todavía)."""
    from generador import Astronauta
    out = []
    for clave, cfg in ESCENARIOS_DEMO.items():
        a = Astronauta(7, seed=cfg["semilla"], entorno=cfg["entorno"])
        out.append({"clave": clave, **cfg, "n_dias": a.n_mis,
                    "eventos": [{"tipo": e["tipo"], "inicio": int(e["inicio"])} for e in a.esc]})
    return out


@app.get("/demo/{clave}/dia/{t}")
def demo_dia(clave: str, t: int):
    """Lo que el motor produjo el día t de la misión simulada, más el contexto que la web necesita:
    la fila de entrada, el promedio de la línea base, el promedio de los últimos 7 días y la
    tendencia de 7 días del puntaje de cada dominio."""
    d = _demo(clave)
    if not 0 <= t < d["n_dias"]:
        raise HTTPException(422, f"t debe estar entre 0 y {d['n_dias'] - 1}")
    ventana = d["filas"][max(0, t - 6): t + 1]
    claves = set(d["base"]) | {k for f in ventana for k in f}
    salidas7 = d["salidas"][max(0, t - 6): t + 1]
    return {
        "escenario": {k: d[k] for k in ("clave", "titulo", "entorno", "astronauta", "n_dias", "eventos")},
        "dia": t,
        "fila": d["filas"][t],
        "base": d["base"],
        "semana": {k: _media([f.get(k) for f in ventana]) for k in sorted(claves) if k != "dia"},
        "tendencia": {dom: [s["dominios"].get(dom) for s in salidas7] for dom in ("psico", "sueno", "fisico", "social")},
        "salida": d["salidas"][t],
    }
