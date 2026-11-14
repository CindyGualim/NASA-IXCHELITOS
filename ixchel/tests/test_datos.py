"""Carga de los datasets reales (NASA OSDR EDA, RadLab, PhysioNet BIDSleep)."""
import numpy as np

from conftest import requiere_datos

pytestmark = requiere_datos


def test_cabina_diaria_rangos_fisicos():
    import datos
    c = datos.cabina_diaria()
    assert len(c) > 100
    assert c["co2_ppm"].between(300, 10000).all()
    assert c["temp_c"].dropna().between(15, 32).all()
    assert c["humedad_pct"].dropna().between(10, 90).all()
    assert c["mision"].nunique() >= 5


def test_radiacion_diaria_positiva():
    import datos
    r = datos.radiacion_diaria()
    assert len(r) > 50
    assert (r["total_dose"].dropna() >= 0).all()


def test_perfiles_radiacion():
    import datos
    p = datos.perfiles_radiacion()
    assert set(p) >= {"ISS", "Luna", "Marte"} or len(p) >= 3


def test_noches_sueno_realistas():
    import datos
    n = datos.noches_sueno()
    assert len(n) > 200
    assert n["sueno_h"].between(0, 14).all()
    assert n["sueno_eficiencia"].between(0, 100).all()
    assert n["fc_reposo"].dropna().between(35, 110).all()
    assert 5 < n["sueno_h"].median() < 8


def test_epocas_sueno_etapas_validas():
    import datos
    e = datos.epocas_sueno()
    assert set(np.unique(e["etapa"])) <= {0, 1, 2, 3}
    assert e["sujeto"].nunique() >= 40
