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
    threading.Thread(target=lambda: [_sesion(k) for k in ("fatiga", "duelo", "nominal")], daemon=True).start()
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




# ---------------------------------------------------------------- demo para el frontend (misión viva)
# Misiones simuladas (generador.py) que el motor real procesa día por día y que se RECALCULAN con lo que
# la persona hace en la web (check-in, cuestionarios, eventos, decisiones). Ver mision_viva.py.
ESCENARIOS_DEMO = {
    "nominal": {"semilla": 6, "entorno": "Marte", "titulo": "Astronauta sin problemas (toda alerta es falsa alarma)"},
    "fatiga": {"semilla": 227, "entorno": "Marte", "titulo": "Privación de sueño acumulada (d76) y CO₂ alto (d136)"},
    "duelo": {"semilla": 2, "entorno": "Marte", "titulo": "Luto por un familiar directo (d140)"},
}
_SESIONES: Dict[str, Any] = {}
_LOCKS = {k: threading.Lock() for k in ESCENARIOS_DEMO}   # uno por escenario: no se bloquean entre sí


def _media(vals):
    vals = [v for v in vals if isinstance(v, (int, float)) and not isinstance(v, bool)]
    return round(sum(vals) / len(vals), 3) if vals else None


def _sesion(clave: str):
    """Misión viva + acompañamiento de un escenario. La primera vez simula la misión (≈10 s) y aplica
    lo que la persona haya aportado antes (guardado en sesiones/)."""
    if clave not in ESCENARIOS_DEMO:
        raise HTTPException(404, f"Escenario desconocido. Opciones: {', '.join(ESCENARIOS_DEMO)}")
    with _LOCKS[clave]:
        if clave not in _SESIONES:
            from acompanamiento import SesionDemo
            from mision_viva import MisionViva
            m = MisionViva(clave, ESCENARIOS_DEMO[clave])
            m.cargar()
            m.todas()
            _SESIONES[clave] = SesionDemo(m)
    return _SESIONES[clave]


def _dia_valido(clave: str, t: int):
    n = _sesion(clave).m.n_dias
    if not 0 <= t < n:
        raise HTTPException(422, f"dia debe estar entre 0 y {n - 1}")


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


class CheckIn(BaseModel):
    dia: int
    respuestas: Dict[str, Any]           # CK1..CK7 (1-5), CK8 texto opcional
    sf1: float | None = None             # ítem de seguridad: 0 No, 1 algunos días, 2 muchos días
    estados: List[str] = []              # selector de estado ST01..ST11


class Formulario(BaseModel):
    dia: int
    nombre: str                          # phq4, phq9, gad7, asq, who5, duelo_diario, equipo…
    respuestas: Dict[str, Any]
    rechazo: bool = False                # ASQ: negarse a contestar cuenta como positivo


class Decision(BaseModel):
    dia: int
    tarjeta: str
    dominio: str
    titulo: str
    decision: str                        # applied | postponed | discarded
    contramedida: str | None = None
    motivo: str | None = None
    arm: str | None = None               # clave de la contramedida en el motor (siesta_ancla, luz_460nm…)


class Evento(BaseModel):
    dia: int
    tipo: str                            # emergencia, luto, herida… entran al motor; el resto solo al registro
    nota: str | None = None


class PasoProtocolo(BaseModel):
    dia: int
    protocolo: str
    paso: str
    estado: str


class PlanSeguridad(BaseModel):
    dia: int
    plan: Dict[str, str]


class Reporte(BaseModel):
    dia: int
    nota: str | None = None
    motivo: str = "routine"


@app.post("/demo/{clave}/checkin")
def demo_checkin(clave: str, body: CheckIn):
    """Check-in diario + ítem de seguridad + selector de estado. El estrés entra al motor; devuelve
    puntaje, alertas (R01–R26), formularios propuestos y si la seguridad está activa (siempre prevalece)."""
    _dia_valido(clave, body.dia)
    try:
        return _sesion(clave).checkin(body.dia, body.respuestas, body.sf1, body.estados)
    except (ValueError, KeyError) as e:
        raise HTTPException(422, str(e))


@app.post("/demo/{clave}/formulario")
def demo_formulario(clave: str, body: Formulario):
    _dia_valido(clave, body.dia)
    try:
        return _sesion(clave).formulario(body.dia, body.nombre, body.respuestas, body.rechazo)
    except (ValueError, KeyError) as e:
        raise HTTPException(422, str(e))


@app.post("/demo/{clave}/decision")
def demo_decision(clave: str, body: Decision):
    """Decisión sobre una contramedida: queda en el registro y el bandido del motor aprende de ella."""
    _dia_valido(clave, body.dia)
    return _sesion(clave).decision(body.dia, body.tarjeta, body.dominio, body.titulo, body.decision,
                                   body.contramedida, body.motivo, body.arm)


@app.post("/demo/{clave}/evento")
def demo_evento(clave: str, body: Evento):
    _dia_valido(clave, body.dia)
    return _sesion(clave).evento(body.dia, body.tipo, body.nota)


@app.post("/demo/{clave}/protocolo")
def demo_paso(clave: str, body: PasoProtocolo):
    _dia_valido(clave, body.dia)
    return _sesion(clave).paso_protocolo(body.dia, body.protocolo, body.paso, body.estado)


@app.get("/demo/{clave}/plan_seguridad")
def demo_plan_leer(clave: str):
    return {"plan": _sesion(clave).plan_seguridad}


@app.post("/demo/{clave}/plan_seguridad")
def demo_plan(clave: str, body: PlanSeguridad):
    _dia_valido(clave, body.dia)
    return _sesion(clave).guardar_plan(body.dia, body.plan)


@app.post("/demo/{clave}/reporte")
def demo_reporte(clave: str, body: Reporte):
    """Reporte asíncrono para el equipo en Tierra (pensado para el retardo de comunicación)."""
    _dia_valido(clave, body.dia)
    return _sesion(clave).reporte(body.dia, body.nota, body.motivo)


@app.get("/demo/{clave}/registro")
def demo_registro(clave: str):
    """Todo lo que la persona hizo en la sesión: check-ins, formularios, decisiones, eventos, reportes."""
    s = _sesion(clave)
    return {"registro": list(reversed(s.registro)), "version": s.m.version}


@app.post("/demo/{clave}/reiniciar")
def demo_reiniciar(clave: str):
    """Borra todo lo aportado en este escenario y vuelve a la misión simulada original."""
    s = _sesion(clave)
    s.reiniciar()
    return {"ok": True, "version": s.m.version}


@app.get("/demo/{clave}/serie")
def demo_serie(clave: str):
    """La misión completa (recalculada con lo aportado), una fila por día, para Timeline y Environment."""
    return _sesion(clave).serie()


@app.get("/sueno/noche_muestra")
def noche_muestra():
    """Hipnograma de una noche real: etapas del modelo (solo FC del reloj) junto a las del experto."""
    from acompanamiento import noche_muestra as nm
    n = nm()
    if n is None:
        raise HTTPException(404, "Faltan los datos de PhysioNet: python scripts/download_data.py")
    return n


@app.get("/demo/{clave}/dia/{t}")
def demo_dia(clave: str, t: int):
    """Lo que el motor produjo el día t (recalculado con lo que aportó la persona, y con las alertas de su
    autorreporte), más el contexto que la web necesita: la fila de entrada, el promedio de la línea base,
    el promedio de los últimos 7 días y la tendencia de 7 días del puntaje de cada dominio."""
    s = _sesion(clave)
    m = s.m
    if not 0 <= t < m.n_dias:
        raise HTTPException(422, f"t debe estar entre 0 y {m.n_dias - 1}")
    dias7 = range(max(0, t - 6), t + 1)
    ventana = [m.fila(d) for d in dias7]
    claves = set(m.base) | {k for f in ventana for k in f}
    return {
        "escenario": {"clave": clave, **ESCENARIOS_DEMO[clave], "astronauta": f"demo-{clave}", "n_dias": m.n_dias, "eventos": m.eventos},
        "dia": t,
        "version": m.version,
        "fila": m.fila(t),
        "aportado": m.aportes["filas"].get(str(t), {}),
        "base": m.base,
        "semana": {k: _media([f.get(k) for f in ventana]) for k in sorted(claves) if k != "dia"},
        "tendencia": {dom: [m.salida(d)["dominios"].get(dom) for d in dias7] for dom in ("psico", "sueno", "fisico", "social")},
        "salida": s.dia(t),
    }
