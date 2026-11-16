"""Acompañamiento psicológico (check-in, seguridad, formularios, registro, reporte asíncrono)."""
import pytest
from fastapi.testclient import TestClient

from conftest import NOCHE_REAL, requiere_datos, requiere_modelos

pytestmark = [requiere_datos, requiere_modelos]

BIEN = {"CK1": 4, "CK2": 4, "CK3": 2, "CK4": 2, "CK5": 4, "CK6": 3, "CK7": 4}
MAL = {"CK1": 1, "CK2": 1, "CK3": 5, "CK4": 5, "CK5": 1, "CK6": 5, "CK7": 1}


@pytest.fixture(scope="module")
def client():
    from api import app
    return TestClient(app)


def test_checkin_con_historia_y_base(client):
    r = client.post("/demo/nominal/checkin", json={"dia": 60, "respuestas": BIEN, "sf1": 0, "estados": ["ST01"]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["base_lista"] and d["serie"][-1]["usuario"]
    assert not d["seguridad_activa"]
    assert 1 <= d["resultado"]["puntaje"] <= 5


def test_checkin_bajo_dispara_tendencia(client):
    for t in (100, 101, 102):
        d = client.post("/demo/nominal/checkin", json={"dia": t, "respuestas": MAL, "sf1": 0}).json()
    assert {a["codigo"] for a in d["alertas"]} & {"R01", "R02", "R03", "R04", "R08"}


def test_seguridad_siempre_prevalece(client):
    d = client.post("/demo/nominal/checkin", json={"dia": 30, "respuestas": BIEN, "sf1": 1}).json()
    assert d["seguridad_activa"]
    assert d["alertas"][0]["codigo"] == "R05" and "GP3" in d["protocolos"]
    d = client.post("/demo/nominal/checkin", json={"dia": 31, "respuestas": BIEN, "sf1": 0, "estados": ["ST11"]}).json()
    assert d["seguridad_activa"] and d["plan"][0]["seguridad"]


def test_formularios(client):
    d = client.post("/demo/fatiga/formulario", json={"dia": 90, "nombre": "asq",
                                                     "respuestas": {"AQ1": 1, "AQ2": 0, "AQ3": 0, "AQ4": 0, "AQ5": 0}}).json()
    assert d["seguridad_activa"] and d["alertas"][0]["codigo"] == "R12"
    d = client.post("/demo/fatiga/formulario", json={"dia": 90, "nombre": "phq4",
                                                     "respuestas": {"P41": 2, "P42": 2, "P43": 0, "P44": 0}}).json()
    assert d["alertas"][0]["codigo"] == "R13"
    assert client.post("/demo/fatiga/formulario", json={"dia": 90, "nombre": "phq9", "respuestas": {}}).status_code == 422


def test_registro_decisiones_y_reporte(client):
    client.post("/demo/duelo/decision", json={"dia": 143, "tarjeta": "sueno:X", "dominio": "sueno", "titulo": "Fatigue",
                                              "decision": "applied", "contramedida": "Anchor nap"})
    client.post("/demo/duelo/protocolo", json={"dia": 143, "protocolo": "GP2", "paso": "N2-1", "estado": "done"})
    client.post("/demo/duelo/plan_seguridad", json={"dia": 143, "plan": {"SPL2": "Music and the cupola", "SPL7": "My kids"}})
    rep = client.post("/demo/duelo/reporte", json={"dia": 143, "nota": "Hard day"}).json()
    assert rep["mission_day"] == 144 and "Anchor nap" in rep["countermeasures_used"]
    assert len(rep["sleep_hours_last_7_days"]) == 7
    tipos = [e["tipo"] for e in client.get("/demo/duelo/registro").json()["registro"]]
    assert {"decision", "protocolo", "plan_seguridad", "reporte"} <= set(tipos)
    assert client.get("/demo/duelo/plan_seguridad").json()["plan"]["SPL7"] == "My kids"


def test_serie_mision(client):
    s = client.get("/demo/fatiga/serie").json()
    assert len(s["dias"]) == 180
    assert set(s["dias"][0]["ml"]) == {"psico", "sueno", "fisico", "social"}
    assert s["dias"][100]["x"]["co2_ppm"] > 0


# ---------------------------------------------------------------- todo es dinámico
def test_checkin_entra_al_motor(client):
    antes = client.get("/demo/nominal/dia/120").json()
    client.post("/demo/nominal/checkin", json={"dia": 120, "respuestas": MAL, "sf1": 0})
    despues = client.get("/demo/nominal/dia/120").json()
    assert despues["fila"]["estres_vas"] == 100.0 != antes["fila"]["estres_vas"]
    assert despues["aportado"]["estres_vas"] == 100.0
    assert despues["version"] > antes["version"]


def test_seguridad_sube_el_semaforo(client):
    client.post("/demo/nominal/checkin", json={"dia": 150, "respuestas": BIEN, "sf1": 2})
    d = client.get("/demo/nominal/dia/150").json()["salida"]
    assert d["nivel"] == "ROJO" and d["seguridad_activa"]
    assert d["alertas"][0]["codigo"] == "R05"


def test_emergencia_entra_al_motor(client):
    client.post("/demo/nominal/evento", json={"dia": 40, "tipo": "emergencia", "nota": "fire drill went wrong"})
    d = client.get("/demo/nominal/dia/41").json()["salida"]
    assert any(e["tipo"] == "emergencia" for e in d["eventos_activos"])
    assert any(a["codigo"] == "POST_EMERGENCIA" for a in d["alertas"])


def test_decision_ensena_al_bandido():
    from mision_viva import MisionViva
    from api import ESCENARIOS_DEMO
    m = MisionViva("fatiga_prueba", ESCENARIOS_DEMO["fatiga"])
    t = next(t for t in range(80, 180) if any(r["tipo"] == "aprendida" and r["categoria"] == "sueno"
                                               for r in m.salida(t)["recomendaciones"]))
    m.aportar_decision(t, "sueno", "applied", "reorganizar_turnos")
    m.salida(t + 5)
    snap = max(k for k in m.snaps if k <= t + 5)
    core = m.snaps[snap].core
    assert core.a[("sueno", "reorganizar_turnos")] + core.b[("sueno", "reorganizar_turnos")] > 2   # tiene evidencia


def test_persiste_y_se_reinicia(client):
    from mision_viva import MisionViva
    from api import ESCENARIOS_DEMO
    client.post("/demo/duelo/checkin", json={"dia": 10, "respuestas": MAL, "sf1": 0})
    nueva = MisionViva("duelo", ESCENARIOS_DEMO["duelo"])
    nueva.cargar()
    assert nueva.fila(10)["estres_vas"] == 100.0
    client.post("/demo/duelo/reiniciar")
    assert client.get("/demo/duelo/registro").json()["registro"] == []
    assert client.get("/demo/duelo/dia/10").json()["aportado"] == {}


@pytest.mark.skipif(not NOCHE_REAL.exists(), reason="falta la noche Bidslab32/3")
def test_noche_muestra(client):
    n = client.get("/sueno/noche_muestra").json()
    assert len(n["modelo"]) > 600 and abs(n["sueno_h_modelo"] - n["sueno_h_experto"]) < 0.6
