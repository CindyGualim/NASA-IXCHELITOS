"""
Misión viva: una misión simulada que el motor Ixchel procesa día por día y que se RECALCULA cuando la
persona hace algo en la web (check-in, cuestionario, evento, decisión sobre una contramedida).

- Los datos de sensores salen del simulador (generador.py); lo que la persona aporta se mezcla encima
  (por ejemplo, el estrés del check-in reemplaza al simulado ese día).
- Los eventos que reporta (emergencia, pérdida…) entran al motor con report_event: activan protocolos,
  congelan la línea base y generan alertas como POST_EMERGENCIA.
- Las decisiones sobre contramedidas enseñan al bandido del motor: si se aplicó otra contramedida se
  aprende de esa; si se pospuso o descartó, no se aprende nada de ese día.
- Para no recalcular 180 días por cada clic se guarda una copia del motor cada K días y se rehace desde
  la copia más cercana al día que cambió (≈50 ms por día).
- Lo aportado se guarda en disco (sesiones/<escenario>.json) y se vuelve a aplicar al reiniciar.
"""
from __future__ import annotations

import copy
import json
import os
import threading
from pathlib import Path

from generador import Astronauta
from monitor import IxchelMonitor

CARPETA = Path(os.environ.get("IXCHEL_SESIONES", Path(__file__).resolve().parent / "sesiones"))
DOMS = ("psico", "sueno", "fisico", "social")


def nativo(x):
    """numpy -> tipos JSON nativos (recursivo)."""
    if isinstance(x, dict):
        return {str(k): nativo(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [nativo(v) for v in x]
    if hasattr(x, "item"):
        return x.item()
    return x


def _media(vals):
    vals = [v for v in vals if isinstance(v, (int, float)) and not isinstance(v, bool)]
    return round(sum(vals) / len(vals), 3) if vals else None


class MisionViva:
    K = 5                                   # una copia del motor cada K días

    def __init__(self, clave: str, cfg: dict):
        self.clave, self.cfg = clave, cfg
        a = Astronauta(7, seed=cfg["semilla"], entorno=cfg["entorno"])
        self.n_dias = a.n_mis
        self.base_filas = a.baseline()
        self.filas_sim = [nativo(a.dia(t)) for t in range(self.n_dias)]
        self.eventos_sim = {t: a.eventos_del_dia(t) for t in range(self.n_dias) if a.eventos_del_dia(t)}
        self.eventos = [{"tipo": e["tipo"], "inicio": int(e["inicio"])} for e in a.esc]
        claves = sorted({k for f in self.base_filas for k in f if k != "dia"})
        self.base = {k: _media([f.get(k) for f in self.base_filas]) for k in claves}
        # lo que aporta la persona (se guarda en disco)
        self.aportes: dict = {"filas": {}, "eventos": {}, "decisiones": {}}
        self.lock = threading.RLock()
        self.version = 0
        self._reiniciar_calculo()

    # ------------------------------------------------------------------ cálculo
    def _reiniciar_calculo(self):
        self.salidas: list = [None] * self.n_dias
        self.snaps = {0: IxchelMonitor(self.base_filas, seed=7)}     # estado ANTES de procesar el día k

    def fila(self, t: int) -> dict:
        return {**self.filas_sim[t], **self.aportes["filas"].get(str(t), {})}

    def _calcular_hasta(self, hasta: int):
        pendiente = next((i for i in range(hasta + 1) if self.salidas[i] is None), None)
        if pendiente is None:
            return
        desde = max(k for k in self.snaps if k <= pendiente)
        mon = copy.deepcopy(self.snaps[desde])
        for t in range(desde, hasta + 1):
            if t % self.K == 0 and t not in self.snaps:
                self.snaps[t] = copy.deepcopy(mon)
            for tipo, kw in self.eventos_sim.get(t, []):
                mon.report_event(tipo, t, **kw)
            for ev in self.aportes["eventos"].get(str(t), []):
                try:
                    mon.report_event(ev["tipo"], t, **ev.get("detalle", {}))
                except KeyError:
                    pass                                    # tipo que el motor no conoce: solo queda en el registro
            out = mon.ingest(self.fila(t))
            self._aplicar_decisiones(mon, t)
            self.salidas[t] = nativo(out)

    def _aplicar_decisiones(self, mon, t: int):
        """La persona decidió sobre la contramedida que el motor recomendó hoy."""
        pend = mon.core.pending
        if not pend:
            return
        hoy = max(p["idx"] for p in pend)
        for d in self.aportes["decisiones"].get(str(t), []):
            for p in [p for p in pend if p["idx"] == hoy and p["cat"] == d["dominio"]]:
                if d["decision"] == "applied" and d.get("arm"):
                    p["arm"] = d["arm"]                     # aprende de lo que realmente se hizo
                elif d["decision"] in ("postponed", "discarded"):
                    pend.remove(p)                          # no se aplicó: no hay nada que aprender

    def salida(self, t: int) -> dict:
        with self.lock:
            self._calcular_hasta(t)
            return self.salidas[t]

    def todas(self) -> list:
        with self.lock:
            self._calcular_hasta(self.n_dias - 1)
            return list(self.salidas)

    def _invalidar(self, t: int):
        t = max(0, min(t, self.n_dias))
        for i in range(t, self.n_dias):
            self.salidas[i] = None
        for k in [k for k in self.snaps if k > t]:
            del self.snaps[k]
        self.version += 1

    # ------------------------------------------------------------------ aportes de la persona
    def aportar_fila(self, t: int, campos: dict):
        with self.lock:
            self.aportes["filas"].setdefault(str(t), {}).update({k: v for k, v in campos.items() if v is not None})
            self._invalidar(t)
            self.guardar()

    def aportar_evento(self, t: int, tipo: str, **detalle):
        with self.lock:
            self.aportes["eventos"].setdefault(str(t), []).append({"tipo": tipo, "detalle": detalle})
            self._invalidar(t)
            self.guardar()

    def aportar_decision(self, t: int, dominio: str, decision: str, arm: str | None):
        if dominio not in DOMS:
            return
        with self.lock:
            self.aportes["decisiones"].setdefault(str(t), []).append({"dominio": dominio, "decision": decision, "arm": arm})
            self._invalidar(t)          # se aplica al cierre del día t: la copia del día t+1 ya no sirve
            self.guardar()

    # ------------------------------------------------------------------ disco
    def ruta(self) -> Path:
        return CARPETA / f"{self.clave}_mision.json"

    def guardar(self):
        CARPETA.mkdir(exist_ok=True)
        self.ruta().write_text(json.dumps(self.aportes, ensure_ascii=False), encoding="utf-8")

    def cargar(self):
        if self.ruta().exists():
            with self.lock:
                self.aportes = json.loads(self.ruta().read_text(encoding="utf-8"))
                self._reiniciar_calculo()
                self.version += 1

    def reiniciar(self):
        with self.lock:
            self.aportes = {"filas": {}, "eventos": {}, "decisiones": {}}
            self._reiniciar_calculo()
            self.version += 1
            if self.ruta().exists():
                self.ruta().unlink()
