"""Tripulación simulada y variables del modelo."""
import numpy as np

from conftest import requiere_datos

pytestmark = requiere_datos


def test_astronauta_reproducible():
    from generador import Astronauta
    a, b = Astronauta(3, seed=99), Astronauta(3, seed=99)
    assert a.dia(10) == b.dia(10)
    assert len(a.baseline()) == a.n_pre >= 30


def test_verdad_en_rango(astronauta):
    from generador import DOMS, verdad
    for t in range(0, astronauta.n_mis, 15):
        v = verdad(astronauta.L, t)
        assert set(v) == set(DOMS)
        assert all(x in (0, 1, 2) for x in v.values())


def test_fila_diaria_tiene_campos_del_motor(astronauta):
    fila = astronauta.dia(0)
    assert "dia" in fila
    for k in ("sueno_h", "fc_reposo", "co2_ppm", "gravedad_g"):
        assert k in fila
    assert np.isclose(fila["gravedad_g"], 0.38)


def test_features_consistentes(astronauta):
    from features import FeatureBuilder
    from ixchel_core import AstronautMonitor
    core = AstronautMonitor(astronauta.baseline())
    fb = FeatureBuilder()
    for t in range(20):
        fila = astronauta.dia(t)
        f = fb.update(fila, core.ingest(fila))
    assert len(f) > 30
    assert all(isinstance(v, (int, float, np.floating, np.integer)) or v is None for v in f.values())
