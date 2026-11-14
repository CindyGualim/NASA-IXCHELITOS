"""
Generador de tripulación sintética con VERDAD CONOCIDA, calibrado con datos reales.

Cada astronauta tiene un estado latente por dominio (psico, sueno, fisico, social) en unidades de
desviación estándar. Los escenarios (deriva, privación de sueño, duelo, CO2 alto...) mueven ese estado;
las variables observadas se generan a partir de él con ruido. La etiqueta verdadera de cada día es:
    0 = bien (latente < 1), 1 = atención (1-2), 2 = crítico (>= 2)
y es lo que el modelo aprende a detectar a partir de lo que el motor observa.

Datos reales usados:
  - Sueño y FC en reposo: media entre personas y variación noche a noche de PhysioNet BIDSleep.
  - CO2, humedad y temperatura de cabina: series diarias reales de la ISS (NASA OSDR EDA).
  - Radiación: dosis diaria real de la ISS (EDA) escalada por entorno con las razones de RadLab.
Supuestos (documentados en el README): factor de calidad Q, efectos del CO2 en el sueño, tasas de pérdida ósea.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

import datos
from ixchel_core import SIM, Z_VARS

MODELS = Path(__file__).resolve().parent.parent / "models"
DOMS = ["psico", "sueno", "fisico", "social"]
Q_FACTOR = 2.0            # supuesto: dosis absorbida (mGy) -> dosis equivalente (mSv)
ENTORNOS = {
    "ISS":   {"gravedad_g": 0.0,  "retardo": (0.0, 0.0)},
    "Luna":  {"gravedad_g": 0.16, "retardo": (0.02, 0.03)},
    "Marte": {"gravedad_g": 0.38, "retardo": (4.0, 22.0)},
}
# Fracción del latente de otro dominio que se filtra a las variables (la fatiga afecta al PVT, etc.)
CRUCE = {"psico": {"sueno": 0.5}, "fisico": {"sueno": 0.3}, "social": {"psico": 0.3}}


# ---------------------------------------------------------------- normas desde datos reales
def calcular_normas():
    n = datos.noches_sueno()
    normas = {}
    for v in ["sueno_h", "sueno_eficiencia", "fc_reposo"]:
        por_sujeto = n.groupby("sujeto")[v]
        normas[v] = {
            "media": float(n[v].mean()),
            "sd_entre_personas": float(por_sujeto.mean().std()),
            "sd_noche_a_noche": float(np.sqrt(np.nanmean(por_sujeto.var(ddof=1)))),
            "fuente": "PhysioNet BIDSleep, 47 sujetos / 253 noches (etiqueta experto)",
        }
    cab = datos.cabina_diaria()
    normas["cabina_iss"] = {c: {"mediana": float(cab[c].median()), "p95": float(cab[c].quantile(0.95))}
                            for c in ["co2_ppm", "temp_c", "humedad_pct"]}
    rad = datos.radiacion_diaria()["total_dose"]
    normas["radiacion_iss"] = {"mediana_dosis_absorbida_dia": float(rad.median()), "q_factor_supuesto": Q_FACTOR}
    normas["entornos_radlab"] = datos.perfiles_radiacion()
    MODELS.mkdir(exist_ok=True)
    (MODELS / "normas.json").write_text(json.dumps(normas, indent=2, ensure_ascii=False), encoding="utf-8")
    return normas


def cargar_normas():
    f = MODELS / "normas.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else calcular_normas()


# ---------------------------------------------------------------- ambiente real
def serie_ambiente(rng, n_dias, entorno):
    """Concatena días reales de cabina y radiación de la ISS a partir de misiones al azar."""
    cab = datos.cabina_diaria()
    rad = datos.radiacion_diaria()
    misiones = cab["mision"].unique()
    filas = []
    while len(filas) < n_dias:
        m = rng.choice(misiones)
        filas.extend(cab[cab["mision"] == m][["co2_ppm", "temp_c", "humedad_pct"]].to_dict("records"))
    filas = filas[:n_dias]
    dosis = rad["total_dose"].to_numpy()
    inicio = rng.integers(0, len(dosis))
    razon = datos.perfiles_radiacion()[entorno]["razon_vs_iss"]
    for i, f in enumerate(filas):
        f["radiacion_msv_dia"] = float(dosis[(inicio + i) % len(dosis)] * Q_FACTOR * razon)
    return filas


# ---------------------------------------------------------------- escenarios
def escenarios_al_azar(rng, n_dias):
    """Lista de escenarios del astronauta; ~25% sin ninguno (control sano)."""
    if rng.random() < 0.25:
        return []
    tipos = ["deriva_psico", "privacion_sueno", "desacondicionamiento", "friccion_social",
             "luto", "co2_alto", "tormenta_solar"]
    out = []
    for t in rng.choice(tipos, size=rng.integers(1, 4), replace=False):
        out.append({"tipo": str(t), "inicio": int(rng.integers(10, n_dias - 30)),
                    "intensidad": float(rng.uniform(0.6, 1.4))})
    return out


def latentes(esc, n_dias):
    """Estado latente por dominio y día (unidades de SD) + modificadores de ambiente."""
    L = {d: np.zeros(n_dias) for d in DOMS}
    amb = {"co2_extra": np.zeros(n_dias), "rad_mult": np.ones(n_dias)}
    t = np.arange(n_dias)
    for e in esc:
        t0, k = e["inicio"], e["intensidad"]
        dt = np.clip(t - t0, 0, None)
        on = t >= t0
        if e["tipo"] == "deriva_psico":
            L["psico"] += on * np.minimum(0.05 * k * dt, 3.0)
        elif e["tipo"] == "privacion_sueno":
            dur = int(8 + 8 * k)
            L["sueno"] += ((t >= t0) & (t < t0 + dur)) * 2.4 * k
        elif e["tipo"] == "desacondicionamiento":
            L["fisico"] += on * np.minimum(0.04 * k * dt, 2.8)
        elif e["tipo"] == "friccion_social":
            L["social"] += on * np.minimum(0.05 * k * dt, 2.8)
        elif e["tipo"] == "luto":
            f = on * 2.6 * k * np.exp(-dt / 20)
            L["psico"] += f
            L["sueno"] += 0.6 * f
        elif e["tipo"] == "co2_alto":
            dur = int(5 + 6 * k)
            ventana = (t >= t0) & (t < t0 + dur)
            amb["co2_extra"] += ventana * 2500 * k
            L["sueno"] += ventana * 1.2 * k        # supuesto: CO2 alto empeora sueño y cefalea
            L["psico"] += ventana * 0.6 * k
        elif e["tipo"] == "tormenta_solar":
            amb["rad_mult"] *= np.where((t >= t0) & (t < t0 + 2), 8 * k, 1.0)
    return L, amb


def verdad(L, i):
    return {d: int(2 if L[d][i] >= 2 else 1 if L[d][i] >= 1 else 0) for d in DOMS}


# ---------------------------------------------------------------- astronauta
class Astronauta:
    def __init__(self, idx, seed, n_pre=40, n_mis=180, entorno=None):
        self.rng = rng = np.random.default_rng(seed)
        self.id, self.n_pre, self.n_mis = f"A{idx:03d}", n_pre, n_mis
        self.entorno = entorno or str(rng.choice(list(ENTORNOS), p=[0.5, 0.25, 0.25]))
        normas = cargar_normas()
        # parámetros personales: sueño y FC con normas reales; el resto con SIM del motor
        self.p = {}
        for v, (mu, sd) in SIM.items():
            if v in normas:
                n = normas[v]
                self.p[v] = (rng.normal(n["media"], n["sd_entre_personas"]), n["sd_noche_a_noche"])
            else:
                self.p[v] = (rng.normal(mu, 0.5 * sd), sd)
        self.esc = escenarios_al_azar(rng, n_mis)
        self.L, self.amb_mod = latentes(self.esc, n_mis)
        self.amb = serie_ambiente(rng, n_mis, self.entorno)
        self.masa, self.osea = 0.0, 0.0

    def _obs(self, t, L):
        row = {"dia": t}
        for v, (mu, sd) in self.p.items():
            dom, pol, fr = Z_VARS[v]
            if fr == "semanal" and t % 7 != 0:
                continue
            carga = L[dom] + sum(f * L[o] for o, f in CRUCE.get(dom, {}).items())
            x = mu + pol * sd * 1.1 * carga + self.rng.normal(0, sd)
            row[v] = float(max(x, 0.0))
        if "sueno_eficiencia" in row:
            row["sueno_eficiencia"] = min(row["sueno_eficiencia"], 100.0)
        if "sueno_h" in row:
            row["sueno_h"] = min(row["sueno_h"], 12.0)
        return row

    def baseline(self):
        cero = {d: 0.0 for d in DOMS}
        return [self._obs(t, cero) for t in range(-self.n_pre, 0)]

    def dia(self, t):
        rng, L = self.rng, {d: self.L[d][t] for d in DOMS}
        row = self._obs(t, L)
        a, ent = self.amb[t], ENTORNOS[self.entorno]
        g = ent["gravedad_g"]
        self.osea += 0.045 * (1 - g / 0.38 * 0.5) * (1 + 0.5 * L["fisico"])   # %/día, supuesto
        self.masa -= 0.02 * (1 + L["fisico"])
        row.update({
            "co2_ppm": a["co2_ppm"] + self.amb_mod["co2_extra"][t],
            "humedad_pct": a["humedad_pct"], "temp_c": a["temp_c"],
            "radiacion_msv_dia": a["radiacion_msv_dia"] * self.amb_mod["rad_mult"][t],
            "o2_pct": float(rng.normal(20.9, 0.1)), "presion_hpa": float(rng.normal(1013, 2)),
            "ruido_dba": float(rng.normal(50, 2)), "masa_pct": self.masa, "perdida_osea_pct": self.osea,
            "gravedad_g": g, "retardo_com_min": float(rng.uniform(*ent["retardo"])), "enlace_activo": True,
            "dia_mision": t, "duracion_mision": self.n_mis, "fase": "durante",
            "conflictos_tierra": int(rng.poisson(0.3 + 0.6 * L["social"])),
            "conflictos_internos": int(rng.poisson(0.4 + 0.2 * L["social"])),
            "horas_vigilia": float(16 + (rng.uniform(16, 22) if L["sueno"] >= 2 and rng.random() < 0.15 else 0)),
        })
        return row

    def eventos_del_dia(self, t):
        """Eventos que la tripulación reportaría al sistema (el duelo se conoce, el resto no)."""
        return [("luto", {"relacion": "familiar_directo"}) for e in self.esc if e["tipo"] == "luto" and e["inicio"] == t]
