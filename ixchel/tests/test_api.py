"""API REST de punta a punta con el cliente de pruebas de FastAPI."""
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from conftest import NOCHE_REAL, a_json, requiere_datos, requiere_modelos

pytestmark = [requiere_datos, requiere_modelos]


@pytest.fixture(scope="module")
def client():
    from api import app
    return TestClient(app)


def test_sin_baseline_da_404(client):
    assert client.get("/astronautas/nadie/estado").status_code == 404
    assert client.post("/astronautas/nadie/dia", json={"dia": 0}).status_code == 404


def test_baseline_corta_da_422(client, astronauta):
    r = client.post("/astronautas/corto/baseline", json=a_json(astronauta.baseline()[:10]))
    assert r.status_code == 422


def test_flujo_completo(client, astronauta):
    r = client.post("/astronautas/A7/baseline", json=a_json(astronauta.baseline()))
    assert r.status_code == 200, r.text
    assert client.get("/astronautas/A7/estado").json()["nivel"] == "SIN_DATOS"

    for t in range(30):
        r = client.post("/astronautas/A7/dia", json=a_json(astronauta.dia(t)))
        assert r.status_code == 200, r.text
    cuerpo = r.json()
    assert cuerpo["nivel"] in ("VERDE", "AMARILLO", "ROJO")
    assert "riesgo_dominios" in cuerpo["ml"]
    assert client.get("/astronautas/A7/estado").json()["nivel"] == cuerpo["nivel"]

    assert client.post("/astronautas/A7/dia", json={"sueno_h": 7}).status_code == 422


def test_eventos(client, astronauta):
    client.post("/astronautas/A8/baseline", json=a_json(astronauta.baseline()))
    r = client.post("/astronautas/A8/evento", params={"tipo": "luto", "dia": 5}, json={"relacion": "familiar_directo"})
    assert r.status_code == 200, r.text
    r = client.post("/astronautas/A8/evento", params={"tipo": "inventado", "dia": 5}, json={})
    assert r.status_code == 422


@pytest.mark.skipif(not NOCHE_REAL.exists(), reason="falta la noche Bidslab32/3")
def test_sueno_y_dia_con_noche(client, astronauta):
    hr = pd.read_csv(NOCHE_REAL / "hr.csv", header=None, names=["t", "fc"])
    noche = {"timestamps": hr["t"].astype(float).tolist(), "fc": hr["fc"].astype(float).tolist()}
    r = client.post("/sueno/estimar", json=noche)
    assert r.status_code == 200, r.text
    assert abs(r.json()["sueno_h"] - 8.02) < 0.5

    client.post("/astronautas/A9/baseline", json=a_json(astronauta.baseline()))
    r = client.post("/astronautas/A9/dia_con_noche", json={"fila": a_json(astronauta.dia(0)), "noche": noche})
    assert r.status_code == 200, r.text
    assert "sueno_estimado" in r.json()


def test_demo_para_frontend(client):
    esc = client.get("/demo/escenarios").json()
    assert {e["clave"] for e in esc} == {"nominal", "fatiga", "duelo"}
    r = client.get("/demo/fatiga/dia/87")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["dia"] == 87 and d["salida"]["nivel"] in ("VERDE", "AMARILLO", "ROJO")
    assert set(d["tendencia"]) == {"psico", "sueno", "fisico", "social"}
    assert 1 <= len(d["tendencia"]["sueno"]) <= 7
    assert d["base"]["sueno_h"] > 0 and d["semana"]["sueno_h"] > 0
    assert "riesgo_dominios" in d["salida"]["ml"]
    duelo = client.get("/demo/duelo/dia/143").json()
    assert any(e["tipo"] == "luto" for e in duelo["salida"]["eventos_activos"])
    assert client.get("/demo/fatiga/dia/999").status_code == 422
    assert client.get("/demo/inventado/dia/1").status_code == 404


def test_cors_localhost(client):
    r = client.get("/demo/escenarios", headers={"Origin": "http://localhost:8443"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:8443"
    r = client.get("/demo/escenarios", headers={"Origin": "https://ejemplo.com"})
    assert "access-control-allow-origin" not in r.headers


def test_modelos(client):
    m = client.get("/modelos/metricas").json()
    assert {"metricas_riesgo", "metricas_sueno"} <= set(m)
    assert client.get("/modelos/arbol_semaforo").status_code == 200
