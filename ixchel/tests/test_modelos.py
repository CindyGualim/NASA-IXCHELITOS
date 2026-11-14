"""Modelos entrenados: sueño (datos reales) y riesgo integrado en IxchelMonitor."""
import json

import numpy as np
import pandas as pd
import pytest

from conftest import MODELS, NOCHE_REAL, requiere_datos, requiere_modelos

pytestmark = [requiere_datos, requiere_modelos]


def test_metricas_guardadas_superan_minimos():
    s = json.loads((MODELS / "metricas_sueno.json").read_text(encoding="utf-8"))
    assert s["exactitud_dormido_vs_despierto"] >= 0.85
    assert s["exactitud"] > s["exactitud_si_siempre_dice_ligero"]
    assert s["error_por_noche"]["sueno_h_error_absoluto_medio_h"] < 0.6
    r = json.loads((MODELS / "metricas_riesgo.json").read_text(encoding="utf-8"))
    assert r  # existe y no está vacío


@pytest.mark.skipif(not NOCHE_REAL.exists(), reason="falta la noche Bidslab32/3")
def test_sueno_noche_real_cerca_del_experto():
    from modelo_sueno import noche_desde_fc
    hr = pd.read_csv(NOCHE_REAL / "hr.csv", header=None, names=["t", "fc"])
    out = noche_desde_fc(hr["t"], hr["fc"])
    assert abs(out["sueno_h"] - 8.02) < 0.5
    assert abs(out["fc_reposo"] - 71.4) < 3
    assert set(out["etapas"]) <= {"despierto", "ligero", "profundo", "REM"} or len(set(out["etapas"])) <= 4


def test_sueno_entrada_degenerada_no_rompe():
    from modelo_sueno import noche_desde_fc
    t = np.arange(0, 3600, 5.0)
    out = noche_desde_fc(t, np.full(len(t), 65.0))
    assert 0 <= out["sueno_h"] <= 1.01


def test_monitor_regla_de_seguridad(astronauta):
    """El ML nunca pone ROJO por sí solo ni quita alertas de las reglas."""
    from monitor import IxchelMonitor
    mon = IxchelMonitor(astronauta.baseline(), seed=7)
    vistos = set()
    for t in range(astronauta.n_mis):
        for tipo, kw in astronauta.eventos_del_dia(t):
            mon.report_event(tipo, t, **kw)
        out = mon.ingest(astronauta.dia(t))
        assert out["nivel"] in ("VERDE", "AMARILLO", "ROJO")
        ml_alertas = [a for a in out["alertas"] if a["codigo"] == "ALERTA_TEMPRANA_ML"]
        assert all(a["nivel"] == "AMARILLO" for a in ml_alertas)
        if out["nivel"] == "ROJO":
            assert any(a["codigo"] != "ALERTA_TEMPRANA_ML" for a in out["alertas"])
        ml = out["ml"]
        assert set(ml["riesgo_dominios"]) == {"psico", "sueno", "fisico", "social"}
        assert all(0 <= r["prob_atencion_o_peor"] <= 1 for r in ml["riesgo_dominios"].values())
        assert ml["explicacion"]["pasos"]
        vistos.add(out["nivel"])
    assert len(vistos) >= 2


@pytest.mark.skipif(not NOCHE_REAL.exists(), reason="falta la noche Bidslab32/3")
def test_monitor_con_fc_de_la_noche(astronauta):
    from monitor import IxchelMonitor
    mon = IxchelMonitor(astronauta.baseline(), seed=7)
    hr = pd.read_csv(NOCHE_REAL / "hr.csv", header=None, names=["t", "fc"])
    fila = {k: v for k, v in astronauta.dia(0).items() if k not in ("sueno_h", "sueno_eficiencia", "fc_reposo")}
    out = mon.ingest(fila, fc_noche=(hr["t"].to_numpy(), hr["fc"].to_numpy()))
    assert "sueno_estimado" in out
    assert 7 < out["sueno_estimado"]["sueno_h"] < 9


def test_arbol_json_valido():
    arbol = json.loads((MODELS / "arbol_semaforo.json").read_text(encoding="utf-8"))
    assert arbol
