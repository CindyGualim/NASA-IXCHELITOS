"""Pruebas de la capa de autorreporte. No necesitan datos ni modelos."""
import numpy as np
import pytest

import autoreporte as ar
from autoreporte import Autoreporte, MonitorAutoreporte, puntuar, proponer_formularios


def resp(prefijo, n, valor, ancho=1, **cambios):
    d = {f"{prefijo}{i:0{ancho}d}": valor for i in range(1, n + 1)}
    d.update(cambios)
    return d


# ---------- puntuación ----------
def test_phq9_y_item9():
    r = puntuar("phq9", resp("PH", 9, 1))
    assert r["puntaje"] == 9 and r["severidad"] == "leve" and r["item9"] == 1
    r = puntuar("phq9", resp("PH", 9, 2, PH9=0))
    assert r["puntaje"] == 16 and r["item9"] == 0


def test_gad7_who5_phq4():
    assert puntuar("gad7", resp("GA", 7, 2))["puntaje"] == 14
    assert puntuar("who5", {f"W{i}": 2 for i in range(1, 6)})["positivo"] is True       # 10 < 13
    assert puntuar("who5", {f"W{i}": 4 for i in range(1, 6)})["positivo"] is False
    r = puntuar("phq4", {"P41": 2, "P42": 1, "P43": 0, "P44": 1})
    assert r["ansiedad"] == 3 and r["depresion"] == 1 and r["positivo"]


def test_spane():
    r = puntuar("spane", resp("SP", 12, 3, ancho=1))
    assert r["balance"] == 0 and r["positivo_afecto"] == 18


def test_pcl5_corte_y_clusters():
    r = puntuar("pcl5", resp("PC", 20, 2, ancho=2))
    assert r["puntaje"] == 40 and r["positivo"] and r["regla_dsm_provisional"]
    assert not puntuar("pcl5", resp("PC", 20, 1, ancho=2))["positivo"]


def test_isi_bgq_auditc():
    assert puntuar("isi", resp("IS", 7, 3, ancho=2))["puntaje"] == 21
    assert puntuar("bgq", resp("BG", 5, 1, ancho=2))["puntaje"] == 5
    mujer = puntuar("auditc", {"AU1": 1, "AU2": 1, "AU3": 1}, sexo="F")
    hombre = puntuar("auditc", {"AU1": 1, "AU2": 1, "AU3": 1}, sexo="M")
    assert mujer["positivo"] and not hombre["positivo"]


def test_asq_rechazo_y_agudo():
    assert puntuar("asq", {"AQ1": 0, "AQ2": 0, "AQ3": 0, "AQ4": 0, "AQ5": 0})["positivo"] is False
    assert puntuar("asq", {"AQ1": 0, "AQ2": 0, "AQ3": 0, "AQ4": 0}, rechazo=True)["positivo"] is True
    r = puntuar("asq", {"AQ1": 1, "AQ5": 1})
    assert r["positivo"] and r["agudo"]


def test_mdq():
    r = {f"MQ{i:02d}": 1 for i in range(1, 8)}
    r.update({"MQ14": 1, "MQ15": "moderado"})
    assert puntuar("mdq", r)["positivo"]
    r["MQ15"] = "leve"
    assert not puntuar("mdq", r)["positivo"]


def test_checkin_invierte_estres():
    # estrés máximo (5) y preocupación máxima (5) bajan el compuesto
    bien = {"CK1": 5, "CK3": 1, "CK4": 1, "CK5": 5, "CK7": 5}
    mal = {"CK1": 1, "CK3": 5, "CK4": 5, "CK5": 1, "CK7": 1}
    assert puntuar("checkin", bien)["puntaje"] == 5.0
    assert puntuar("checkin", mal)["puntaje"] == 1.0
    assert puntuar("checkin", {"CK1": 3, "CK3": 5, "CK4": 3, "CK5": 3, "CK7": 3})["estres_vas"] == 100.0


def test_falta_item_da_error_claro():
    with pytest.raises(ValueError):
        puntuar("phq9", {"PH1": 1})


def test_pg13r_no_alerta():
    r = puntuar("pg13r", {"PG01": 5, "PG02": 5})
    assert r["positivo"] is False


def test_rci():
    fiable, dif = ar.rci(10, 20, sd=5, r_fiab=0.8)
    assert fiable and dif == 10
    fiable, _ = ar.rci(10, 11, sd=5, r_fiab=0.8)
    assert not fiable


# ---------- seguridad: siempre prevalece ----------
def test_sf1_dispara_r05_inmediata():
    a = Autoreporte()
    _, al = a.registrar("seguridad", {"SF1": 1}, 5)
    assert al[0]["codigo"] == "R05" and al[0]["nivel"] == "ROJO" and al[0]["protocolo"] == "GP3"
    _, al = a.registrar("seguridad", {"SF1": 0}, 6)
    assert al == []


def test_phq9_item9_dispara_r12_aunque_total_bajo():
    a = Autoreporte()
    r = resp("PH", 9, 0, PH9=1)
    _, al = a.registrar("phq9", r, 3)
    assert [x["codigo"] for x in al] == ["R12"]


def test_escalas_por_nivel():
    a = Autoreporte()
    for total, esperado in [(7, "R14"), (12, "R15"), (17, "R16")]:
        v = {f"PH{i}": 0 for i in range(1, 10)}
        v["PH1"], v["PH2"], v["PH3"] = 3, 3, 3
        extra = total - 9
        for k in ("PH4", "PH5", "PH6", "PH7", "PH8"):
            x = min(3, max(0, extra)); v[k] = x; extra -= x
        _, al = a.registrar("phq9", v, 1)
        assert esperado in [x["codigo"] for x in al], (total, al)


def test_pcl5_necesita_un_mes():
    a = Autoreporte()
    _, al = a.registrar("pcl5", resp("PC", 20, 2, ancho=2), 1, dias_desde_evento=10)
    assert al == []
    _, al = a.registrar("pcl5", resp("PC", 20, 2, ancho=2), 1, dias_desde_evento=45)
    assert al[0]["codigo"] == "R18"


def test_bgq_necesita_seis_meses():
    a = Autoreporte()
    _, al = a.registrar("bgq", resp("BG", 5, 1, ancho=2), 1, meses_desde_muerte=3)
    assert al == []
    _, al = a.registrar("bgq", resp("BG", 5, 1, ancho=2), 1, meses_desde_muerte=8)
    assert al[0]["codigo"] == "R20"


def test_observadores():
    a = Autoreporte()
    _, al = a.registrar("observador", {"CO3": 1}, 2)
    assert al[0]["codigo"] == "R26" and al[0]["protocolo"] == "GP3"
    _, al = a.registrar("observador", {"CO5": 1}, 2)
    assert al[0]["codigo"] == "R25" and al[0]["protocolo"] == "GP4"


def test_eventos():
    a = Autoreporte()
    assert a.registrar_evento("muerte_tripulante", 10)[0]["protocolo"] == "GP1"
    assert a.registrar_evento("muerte_familiar_tierra", 10)[0]["protocolo"] == "GP2"


# ---------- selector ----------
def test_selector_orden_seguridad_primero():
    plan = proponer_formularios(["ST02", "ST05", "ST11", "ST06"])
    assert plan[0]["estado"] == "ST11" and plan[0]["seguridad"] and plan[0]["inmediato"]
    assert plan[1]["estado"] == "ST05"
    assert {p["estado"] for p in plan} == {"ST02", "ST05", "ST11", "ST06"}  # no descarta ninguna


def test_selector_tiempos():
    assert "PCL-5" in proponer_formularios(["ST04"], dias_desde_evento=60)[0]["formularios"]
    assert "PCL-5" not in proponer_formularios(["ST04"], dias_desde_evento=5)[0]["formularios"]
    assert "BGQ" in proponer_formularios(["ST05"], dias_desde_perdida=200)[0]["formularios"]


def test_selector_bien_solo_si_no_marca_nada_mas():
    assert len(proponer_formularios(["ST01"])) == 1
    assert [p["estado"] for p in proponer_formularios(["ST01", "ST03"])] == ["ST03"]


def test_protocolos_se_leen():
    for gp in ("GP1", "GP2", "GP3", "GP4", "GP5", "GP6"):
        g = ar.guia_protocolo(gp)
        assert g["estado"] == "propuesta_para_revision_clinica"


# ---------- tendencias ----------
def _checkins(a, valores, d0=0):
    out = []
    for i, c in enumerate(valores):
        r = {"CK1": c, "CK3": 6 - c, "CK4": 6 - c, "CK5": c, "CK7": c, "CK2": c}
        _, al = a.registrar("checkin", r, d0 + i)
        out = al
    return out


def test_no_alerta_sin_linea_base():
    a = Autoreporte()
    _checkins(a, [2] * 10)
    assert a.evaluar_tendencias(10) == []


def test_baja_sostenida_r01_o_r08():
    rng = np.random.default_rng(1)
    a = Autoreporte()
    _checkins(a, [4 + int(x) * 0 for x in rng.integers(0, 1, 14)] )  # base estable en 4
    # ruido pequeño no alerta
    _checkins(a, [4, 4, 4], 14)
    assert a.evaluar_tendencias(17) == []
    # bajan a 2 durante 3 días
    _checkins(a, [2, 2, 2], 17)
    cods = {x["codigo"] for x in a.evaluar_tendencias(20)}
    assert cods & {"R01", "R08"}


def test_confusor_baja_nivel_a_causa_ambiental():
    a = Autoreporte()
    _checkins(a, [4] * 14)
    _checkins(a, [2, 2, 2], 14)
    al = a.evaluar_tendencias(17, {"co2_ppm": 5300})
    assert [x["codigo"] for x in al] == ["R03"]
    assert al[0]["nivel_kb"] == "causa_ambiental"


def test_caida_persistente_r04_roja():
    a = Autoreporte()
    _checkins(a, [4] * 14)
    _checkins(a, [1] * 7, 14)
    al = a.evaluar_tendencias(21)
    assert any(x["codigo"] == "R04" and x["nivel"] == "ROJO" for x in al)


def test_respaldo_sueno_r02():
    a = Autoreporte()
    _checkins(a, [4] * 14)
    _checkins(a, [2, 2, 2], 14)
    al = a.evaluar_tendencias(17, {}, [{"dominio": "sueno", "nivel": "AMARILLO", "codigo": "X"}])
    assert "R02" in [x["codigo"] for x in al]


def test_r11_afecto_positivo_baja():
    a = Autoreporte()
    for i, c in enumerate([5, 5, 4, 4, 3, 3, 2, 2]):
        a.registrar("checkin", {"CK1": c, "CK2": c, "CK3": 3, "CK4": 3, "CK5": 3, "CK7": 3}, i)
    assert any(x["codigo"] == "R11" for x in a.evaluar_tendencias(8))


# ---------- unión con el motor ----------
def _monitor(seed=3):
    from ixchel_core import AstronautMonitor, gen_row
    rng = np.random.default_rng(seed)
    return AstronautMonitor([gen_row(rng, t, 0.0) for t in range(-40, 0)], seed=seed), rng


def test_integracion_seguridad_pone_rojo_y_pide_confirmacion():
    from ixchel_core import gen_row
    mon, rng = _monitor()
    m = MonitorAutoreporte(mon)
    fila = gen_row(rng, 0, 0.0)
    out = m.ingest(fila, autoreporte={"seguridad": {"SF1": 1}})
    assert out["nivel"] == "ROJO" and out["seguridad_activa"] and "GP3" in out["protocolos"]
    assert out["requiere_confirmacion"] is True and "no es un diagnóstico" in out["aviso"]
    assert out["alertas"][0]["codigo"] == "R05"  # la seguridad va primero


def test_integracion_dia_normal_no_sube_nivel():
    from ixchel_core import gen_row
    mon, rng = _monitor(5)
    m = MonitorAutoreporte(mon)
    out = m.ingest(gen_row(rng, 0, 0.0), autoreporte={"seguridad": {"SF1": 0},
                   "checkin": {"CK1": 4, "CK3": 2, "CK4": 2, "CK5": 4, "CK7": 4}})
    assert out["autoreporte"]["alertas"] == []
    assert out["alertas"] is not None and out["requiere_confirmacion"] is True


def test_integracion_checkin_rellena_estres():
    from ixchel_core import gen_row
    mon, rng = _monitor(7)
    m = MonitorAutoreporte(mon)
    fila = gen_row(rng, 0, 0.0)
    fila.pop("estres_vas", None)
    out = m.ingest(fila, autoreporte={"checkin": {"CK1": 3, "CK3": 5, "CK4": 3, "CK5": 3, "CK7": 3}})
    assert out["autoreporte"]["resultados"]["checkin"]["estres_vas"] == 100.0


def test_integracion_evento_muerte_registra_luto_en_motor():
    mon, _ = _monitor(9)
    m = MonitorAutoreporte(mon)
    al = m.reportar_evento("muerte_tripulante", 3)
    assert al[0]["codigo"] == "R23"
    assert any(e["tipo"] == "luto" for e in mon.events)
