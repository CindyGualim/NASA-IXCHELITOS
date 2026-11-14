# Autorreporte (lo que el astronauta cuenta)

Archivos: `autoreporte.py`, `conocimiento/base_conocimiento_psicologica.json` (+ `LEEME.md`), `tests/test_autoreporte.py`, `demo_autoreporte.py`.

Uso mínimo:
```python
from ixchel_core import AstronautMonitor
from autoreporte import MonitorAutoreporte, proponer_formularios, formulario, guia_protocolo

mon = MonitorAutoreporte(AstronautMonitor(filas_linea_base))     # o IxchelMonitor(...)
out = mon.ingest(fila_del_dia,
                 autoreporte={"checkin": {...}, "seguridad": {"SF1": 0}, "phq9": {...}},
                 contexto={"dias_desde_evento": 45, "meses_desde_muerte": 8})
out["alertas"], out["nivel"], out["protocolos"], out["seguridad_activa"]

proponer_formularios(["ST02", "ST06"])   # qué formulario sigue según cómo se siente
formulario("Q_PHQ9")                     # ítems para dibujar en la app
guia_protocolo("GP3")                    # pasos del protocolo
```
Límites: apoyo a la decisión, no diagnóstico; protocolos pendientes de revisión clínica; traducciones sin validar;
umbrales de tendencia (EWMA/CUSUM, z) por calibrar con datos reales. R06, R07 y R10 no están implementadas
(necesitan tareas cognitivas, fiabilidad real y datos de comunicación).
