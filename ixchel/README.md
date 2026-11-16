# Ixchel – motor de monitoreo psicológico y de salud (offline)

Proyecto RoboMinds · NASA Space Apps 2026 · "Health Monitoring Software for Astronauts".
Motor en Python, sin interfaz, que vigila a cada astronauta contra **su propia línea base** y emite
alertas de **apoyo a la decisión** (no diagnostica; confirma el Comandante o el médico de la tripulación).

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `ixchel_core.py` | El motor de reglas (sin cambios). `python ixchel_core.py` corre su simulación original. |
| `monitor.py` | **`IxchelMonitor`**: motor + modelos aprendidos en una sola interfaz. `python -I monitor.py` corre una demo. |
| `datos.py` | Carga los datasets reales de `data/raw/` (NASA OSDR, RadLab, PhysioNet). |
| `generador.py` | Tripulación sintética con verdad conocida, calibrada con los datos reales. |
| `features.py` | Variables del modelo a partir de la salida diaria del motor (igual offline y online). |
| `entrenar_riesgo.py` | Entrena y evalúa el modelo de riesgo (Random Forest + árbol explicable). |
| `modelo_sueno.py` | Entrena y valida el modelo de sueño con datos reales (etapas desde la FC). |
| `autoreporte.py` | **Autorreporte del astronauta**: puntúa escalas, aplica las reglas R01–R26, sugiere formularios y guía protocolos. Ver sección abajo. |
| `conocimiento/` | Base de conocimiento psicológica (JSON + LEEME): preguntas, escalas, reglas y protocolos. Funciona offline. |
| `demo_autoreporte.py` | Simula 60 días de un astronauta que empeora y muestra las alertas del autorreporte. |
| `api.py` | API REST para la web (FastAPI). `uvicorn api:app --reload` |
| `replay.py` | Valida el motor con datos reales de una persona (CSV diario). |
| `requirements.txt` | Dependencias: `pip install -r requirements.txt` |

## Modelos aprendidos (nuevo)

Reproducir desde cero (desde `ixchel/`, con los datos ya descargados por `scripts/download_data.py`):
```bash
python -I modelo_sueno.py          # ~2 min, guarda models/sueno_rf.joblib
python -I entrenar_riesgo.py       # ~4 min, guarda models/riesgo_rf.joblib y models/arbol_semaforo.json
python -I monitor.py               # demo: reglas vs. ML vs. verdad en un astronauta simulado
```

Pruebas automáticas (datos, simulador, modelos, regla de seguridad del ML y API completa):
```bash
pip install -r requirements.txt
python -m pytest tests -q        # 21 pruebas, ~20 s
```

### 1. Modelo de sueño, entrenado con datos reales
Random Forest que estima la etapa de sueño cada 30 s solo con la FC del reloj y de ahí calcula
`sueno_h`, `sueno_eficiencia` y `fc_reposo` para el motor. Datos: PhysioNet BIDSleep (47 personas,
253 noches, etiquetas de un experto). Validación cruzada por persona (nunca se evalúa en alguien visto).

| Métrica | Valor |
|---|---|
| Dormido vs. despierto | 89 % de acierto |
| 4 etapas (despierto/ligero/profundo/REM) | 56 % (κ = 0,39); decir siempre "ligero" da 45 % |
| Horas de sueño por noche | error absoluto medio 0,43 h |
| Eficiencia de sueño por noche | error absoluto medio 6,2 puntos |

### 2. Modelo de riesgo, aprende a monitorear los 4 dominios
Random Forest multi-salida (psico, sueño, físico, social → bien/atención/crítico) que recibe lo que
observa el motor cada día: Z-scores y sus tendencias, puntajes por dominio, alertas de reglas,
Isolation Forest, ambiente y contexto. Se entrena con 160 astronautas simulados (40 días de línea base
+ 180 de misión) y se evalúa en 48 que nunca vio. Resultado (detección de "atención o peor"):

| | Sensibilidad | Precisión | Falsas alarmas / 100 días sanos | Episodios detectados | Retraso mediano |
|---|---|---|---|---|---|
| Reglas del motor solas | 0,72 | 0,81 | 6,3 | 41 de 43 | 2 días |
| Random Forest | 0,92 | 0,98 | 0,7 | 43 de 43 | 1 día |
| Árbol explicable (profundidad 4) | 0,98 | 0,87 | 5,3 | 43 de 43 | 0 días |

Por dominio, la mejora mayor es en sueño (sensibilidad 0,46 → 0,86).
Métricas completas en `models/metricas_riesgo.json`.

**Cómo se integra:** `IxchelMonitor.ingest()` devuelve lo mismo que el motor más `ml.riesgo_dominios`,
`ml.explicacion` (el camino del árbol: por qué ese color) y, si se le pasa la FC de la noche,
`sueno_estimado`. Regla de seguridad: el ML solo **adelanta** avisos (VERDE → AMARILLO con
`ALERTA_TEMPRANA_ML`); nunca pone ROJO por sí solo ni quita alertas. Decide el humano.

### Datos reales que usa la simulación
- Sueño y FC en reposo por persona y noche a noche: PhysioNet BIDSleep (6,3 ± 1,2 h; eficiencia 89 %; FC 60 lpm).
- CO2, temperatura y humedad de cabina: días reales de la ISS (NASA OSDR EDA, 14 misiones).
- Radiación diaria: ISS real (EDA), escalada a Luna (×1,27) y Marte superficie (×0,98) con NASA RadLab.

### Límites del modelo de riesgo (decirlo en el pitch)
- La "verdad" sale del simulador: el modelo aprende la estructura que el simulador asume, así que sus
  números son optimistas. Lo que sí demuestra es que combinar tendencias de varias variables detecta
  antes y con menos falsas alarmas que las reglas por separado, con los mismos datos de entrada.
- Supuestos sin validar: factor de calidad Q = 2 (mGy → mSv), efecto del CO2 alto en sueño y ánimo,
  tasas de pérdida ósea por gravedad, unidades de radiación del EDA (coherentes con mGy/día).
- **Hallazgo con datos reales:** la mediana diaria de CO2 en la ISS es ~3.040 ppm, por encima del aviso
  del motor (3.000). Con datos reales el motor da `LIMITE_CO2_PPM` casi la mitad de los días.
  Hay que fijar el umbral con NASA-STD-3001.

## Qué hace el motor
1. **Línea base individual (≥30 días):** Z = (x − μ) / σ, con signo según la variable (positivo = peor).
2. **Regla de persistencia:** alerta si Z > 2.5 en 3 evaluaciones consecutivas dentro de 7 días
   (variables diarias) o en 2 evaluaciones (semanales).
3. **Reglas clínicas:** fatiga crónica, colapso de alerta cognitiva, distrés depresivo-aislacional,
   fricción Tierra/tripulación (≥5:1), 36 h de vigilia, ejercicio <80%.
4. **Ambiente y límites absolutos:** CO2, O2, presión, humedad, ruido, radiación (pico y acumulada),
   pérdida de masa y ósea. Contexto: gravedad, retardo de comunicación (nivel de autonomía).
5. **Eventos:** luto, herida, enfermedad, sospecha de trastorno, tratamiento (mide respuesta), emergencia.
   Cada uno trae protocolo y congela la adaptación de la línea base mientras dura.
6. **Capa ML local (modo sombra):** línea base adaptativa (EWMA), Isolation Forest por astronauta,
   y bandido Thompson Sampling que prioriza contramedidas según la respuesta de cada astronauta.
   Las reglas y la decisión humana siempre prevalecen sobre el ML.

## Variables de entrada (todas opcionales, por día)
Clave `dia` obligatoria. Con Z-score: `pvt_lapses, pvt_rt_ms, estres_vas, poms_tmd, bdi_somatico,
bdi_afectivo, sueno_h, sueno_eficiencia, desfase_circadiano_h, hrv, fc_reposo, ejercicio_min,
cohesion, msgs_criticos_tierra`. Con límites: `co2_ppm, o2_pct, presion_hpa, humedad_pct, ruido_dba,
masa_pct, perdida_osea_pct, radiacion_msv_dia`. Contexto: `gravedad_g, retardo_com_min, enlace_activo,
horas_vigilia, conflictos_tierra, conflictos_internos, fase, dia_mision, duracion_mision`.
Una variable solo se evalúa si hay suficientes datos de línea base (diarias ≥30, semanales ≥4);
el resto aparece en `sin_linea_base`.

## USO CON DATASETS REALES (lo que se necesita ahora)
`replay.py` toma el CSV **de una persona** (una fila por día), usa los primeros 30 días como línea
base y reproduce el resto. En personas sanas, cada alerta `DESVIACION_PERSISTENTE` es una
falsa alarma candidata: sirve para medir la tasa real de falsas alarmas.

```bash
pip install -r requirements.txt
python replay.py persona1.csv --dia fecha_dia_numero \
    --map sleep_hours=sueno_h,hr_rest=fc_reposo,hrv_ms=hrv,stress=estres_vas --base 30
```
- `--map columna_del_dataset=nombre_del_motor` (separados por coma). Las columnas no mapeadas se ignoran.
- La columna de día debe ser numérica y creciente (0, 1, 2…). Si el dataset trae fechas, convertir a número de día.
- Hay que **mapear unidades**: sueño en horas, HRV en ms, estrés en 0–100 (VAS), ejercicio en minutos.
- Para varios sujetos, correr el replay en un bucle por persona y promediar días con alerta / 100 días.

Para entrenar/ajustar con datos reales (siguiente paso): usar muchos sujetos para sacar rangos
normativos de las variables semanales (BDI, POMS, cohesión) y para preentrenar el Isolation Forest.

## API (para la web)
```
POST /astronautas/{id}/baseline   body: lista de filas (≥30 días)
POST /astronautas/{id}/dia        body: una fila del día
POST /astronautas/{id}/evento?tipo=luto&dia=60   body: {"relacion": "familiar_directo"}
GET  /astronautas/{id}/estado
```
Respuesta: `nivel` (VERDE/AMARILLO/ROJO), `dominios`, `z`, `alertas`, `recomendaciones`,
`eventos_activos`, `factores_contexto`, `ml` (score en modo sombra). El estado vive en memoria.
En `eventos_activos`, el campo `dia` son los días transcurridos desde el evento (0 = el mismo día).

### Frontend ARMOR conectado (`fronted/`)
El panel React/Vite pide cada día al motor. Para verlo con datos reales del motor:
```bash
cd ixchel && uvicorn api:app --port 8000      # terminal 1 (precarga las 3 misiones en ~1 min)
cd fronted && pnpm install && pnpm dev        # terminal 2 -> http://localhost:8443
```
Vite reenvía `/api/*` a `http://127.0.0.1:8000` (cambiar con la variable `IXCHEL_API`). La API
también permite CORS desde `localhost`. Si la API no está corriendo, la web muestra
"Engine offline · sample data" y usa sus valores de ejemplo.

Endpoints de demostración (misiones simuladas que el motor real procesa día por día):
```
GET /demo/escenarios          nominal (sano), fatiga (privación de sueño d76), duelo (luto d140)
GET /demo/{escenario}/dia/{t} salida del motor del día t + fila de entrada, promedio de la línea
                              base, promedio de 7 días y tendencia de 7 días por dominio
```
Escenarios de la web → motor: Nominal → `nominal`, Cumulative fatigue → `fatiga`,
Grief support → `duelo` (salta al 4.º día tras la pérdida). Emergency sigue siendo solo de la interfaz.

**Modelo 3D de "My body":** `fronted/public/models/human.glb` (92 KB) sale de `BASEmodel.blend` con
`python -I scripts/modelo3d/blend_a_glb.py BASEmodel.blend fronted/public/models/human.glb`. El script lee el
`.blend` sin Blender, aplica su modificador Mirror y separa el cuerpo en zonas (head, neck, torso, arms,
legs) que la web colorea según el estado del motor. three.js se carga solo al abrir "My body".

Qué viene del motor: contexto de cabina (CO₂, ruido, gravedad, radiación diaria y acumulada,
retardo con la Tierra), semáforo general, los 4 dominios con su tendencia de 7 días, las tarjetas
de decisión (una por dominio con alertas de reglas), el aviso temprano del modelo, el detalle
"Why I am telling you this" (semana vs. su normal y el camino del árbol), las contramedidas
(primero la que eligió el motor), el día del protocolo de duelo y el mapa del cuerpo (cabeza,
torso, brazos, piernas).

### Todo es dinámico (`mision_viva.py`)
Cada misión de demo es una **misión viva**: el motor la procesa día por día y la **recalcula** cuando la
persona hace algo en la web. Se guarda una copia del motor cada 5 días y se rehace desde la más cercana
(≈50 ms por día), así que un cambio en el día 87 se ve al instante y la misión completa en pocos segundos.
- **Check-in:** su estrés entra al motor ese día; las alertas del autorreporte (R01–R26) se suman al día.
- **Seguridad** (SF1, ASQ, PHQ-9 ítem 9): sube el semáforo a ROJO, va primero en las alertas y en Today.
- **Cuestionario del equipo:** su cohesión entra al motor.
- **Eventos** (emergencia, pérdida, herida…): entran con `report_event`; por ejemplo, la emergencia
  abre la ventana de 72 h y genera `POST_EMERGENCIA` en los días siguientes.
- **Decisiones:** el bandido del motor aprende de la contramedida que de verdad se aplicó; si se pospone
  o descarta, ese día no se aprende nada.
- **Persistencia:** lo aportado se guarda en `ixchel/sesiones/` (fuera de git) y se vuelve a aplicar al
  reiniciar la API. `POST /demo/{escenario}/reiniciar` (botón en Decision log) vuelve a la misión original.
- La web se refresca sola después de cada acción (cada escritura sube la versión del motor).

### Acompañamiento psicológico (`acompanamiento.py`, conectado a todo ARMOR)
Une el motor, la capa de autorreporte (`autoreporte.py` + base de conocimiento) y un registro en memoria
por escenario. Endpoints (todos bajo `/demo/{escenario}`):
```
POST /checkin          check-in CK1–CK8 + ítem de seguridad SF1 + selector de estado ST01–ST11
                       -> puntaje, alertas R01–R26, formularios propuestos, seguridad_activa
POST /formulario       PHQ-4, PHQ-9, GAD-7, WHO-5, ASQ, duelo diario, equipo… (puntuación + reglas)
POST /decision         aplicar / posponer / descartar una contramedida (con motivo)
POST /evento           pedir compañero, conferencia, mensaje a la familia, autocuidado…
POST /protocolo        marcar un paso del protocolo (p. ej. GP2 de duelo)
GET|POST /plan_seguridad   plan de seguridad escrito con las palabras de la persona
POST /reporte          reporte asíncrono para Tierra (campos de alerts.async_report de la base)
GET  /registro         todo lo anterior, en orden
GET  /serie            la misión completa, una fila por día (Timeline y Environment)
GET  /sueno/noche_muestra  hipnograma de una noche real (modelo vs. experto)
```
Para que las tendencias del autorreporte (R01, R04, R08, R11) tengan historia, los check-ins de
los 35 días previos se reconstruyen a partir del simulador (estrés, sueño, PVT); los que contesta la
persona los reemplazan. La web lo indica como "simulated history".

Módulos de ARMOR que lo usan: **Daily check** (check-in, seguridad, selector y cuestionarios en
línea; con seguridad positiva abre la pantalla de apoyo GP3 y manda un reporte), **Care** (respiración
guiada, anclaje 5-4-3-2-1, diario privado, contramedidas del día, hablar con alguien con el retardo,
plan de seguridad, sesión semanal GP6), **Timeline** (misión completa e hipnograma real),
**Environment** (cabina contra límites y "descartar primero el ambiente"), **Decision log** (registro y
reporte a Tierra), protocolo de duelo GP2 por fase y **How to read this** (métricas de los modelos).
Sigue siendo solo de interfaz el escenario Emergency. Los cuestionarios estándar usan su versión
original en inglés (PHQ-4/9, GAD-7, WHO-5 de uso libre; ASQ del NIMH, dominio público); los ítems
propios del equipo están traducidos sin validar y todos los protocolos son propuesta para revisión clínica.

## Autorreporte: lo que el astronauta cuenta (nuevo)

Los sensores no lo ven todo: una persona puede estar mal antes de que cambie su sueño o su ritmo cardíaco.
Esta capa añade **la voz del astronauta** y la une a las alertas del motor.

**Cómo funciona, en 4 pasos**
1. **Check-in diario (1 min):** ánimo, estrés, energía y una pregunta de seguridad. Se compara con la
   **línea base personal** (primeros 14 días), nunca con una norma de población.
2. **Tendencias:** si el check-in baja varios días seguidos avisa (AMARILLO); si la caída es marcada o cae
   en varios módulos a la vez (autorreporte + sueño + actividad…) sube a ROJO. Si hay un confusor
   (CO₂ ≥ 2,3 mmHg, ruido alto, sueño ≤ 5 h) la alerta se marca como **causa ambiental**, no psicológica.
3. **Selector de estado:** el astronauta marca cómo se siente ("decaído", "nervioso", "duermo mal",
   "perdí a alguien"…) y el sistema propone el formulario adecuado: PHQ-4/PHQ-9 (ánimo), GAD-7 (ansiedad),
   ISI (insomnio), PCL-5 (trauma), BGQ (duelo), MDQ, AUDIT-C, NASA-TLX, WHO-5, SPANE.
4. **Protocolos:** según la alerta, entrega la guía paso a paso (GP1 muerte de un tripulante, GP2 muerte de un
   familiar, GP3 riesgo suicida, GP4 confusión/agitación, GP5 cribado y derivación, GP6 terapia con retardo).

**La seguridad siempre manda.** SF1 distinto de 0, ASQ positivo (o negarse a contestar), PHQ-9 ítem 9 > 0 o un
compañero que reporta CO3/CO4 → ROJO inmediato, sin esperar tendencias. Ninguna otra regla lo baja.

**Niveles:** ámbar/firme → AMARILLO · roja/inmediata → ROJO (se conserva `nivel_kb` con el original).

```python
from ixchel_core import AstronautMonitor
from autoreporte import MonitorAutoreporte, proponer_formularios, formulario, guia_protocolo

mon = MonitorAutoreporte(AstronautMonitor(filas_linea_base))      # también envuelve IxchelMonitor
out = mon.ingest(fila_del_dia,
                 autoreporte={"checkin": {"CK1": 4, "CK3": 2, "CK4": 2, "CK5": 4, "CK7": 4},
                              "seguridad": {"SF1": 0}},
                 contexto={"dias_desde_evento": 45, "meses_desde_muerte": 8})
out["nivel"], out["alertas"], out["protocolos"], out["seguridad_activa"]

proponer_formularios(["ST02", "ST06"])  # qué formulario sigue (seguridad y pérdida primero)
formulario("Q_PHQ9")                    # ítems y escalas para dibujar en la app
guia_protocolo("GP3")                   # pasos del protocolo
```
Probar: `python demo_autoreporte.py` · Tests: `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/test_autoreporte.py -q`

**Para la web:** en `api.py` basta envolver el monitor con `MonitorAutoreporte(...)` y pasar `autoreporte={...}`
a `ingest`. Formularios por formulario (`formulario("Q_...")`) devuelven los textos y escalas.

**Reglas implementadas:** R01–R05, R08, R09 (como R03), R11–R26 y la tendencia de duelo. **No implementadas:**
R06 (necesita tareas cognitivas), R07 (necesita fiabilidad real de las escalas) y R10 (necesita datos de comunicación).

### Límites del autorreporte (decirlo en el pitch)
- Es **apoyo a la decisión, no diagnóstico**: toda alerta requiere confirmación humana.
- Los protocolos clínicos son una **propuesta pendiente de revisión** de un psicólogo o psiquiatra con experiencia
  aeroespacial; no usar con personas reales sin ella.
- Las traducciones de los ítems son literales y **no están validadas**. Los ítems de PCL-5, ISI, BGQ, MDQ y PG-13-R
  vienen del archivo del equipo; el corte de 30 del PG-13-R **no** se aplica a esos ítems (PG-13-R no alerta).
- Los umbrales de tendencia (EWMA/CUSUM, z de −1,0 y −1,5, pendiente de R11) son diseño propio, **por calibrar** con
  datos reales; con los parámetros actuales son sensibles (detectan en 1–3 días).
- Las reglas son diseño propio [D]; ningún manual de NASA publica un semáforo con estos cortes.
- La base de conocimiento (168 fuentes, 108 hechos) está en `conocimiento/`; su `LEEME.md` explica las etiquetas de
  confiabilidad (B fuente abierta, P criterio del equipo, D diseño propio).

## Límites conocidos (decirlo en el pitch)
- Los datos de la demo son **simulados**; los límites ambientales (CO2, ruido, presión, 600 mSv)
  son valores de referencia a **validar con NASA-STD-3001**.
- No existe un dataset público de astronautas con estas variables. Los datasets reales validan
  falsas alarmas y variabilidad normal; la respuesta a contramedidas se aprende a bordo.
- En simulación, las variables semanales dieron falsas alarmas (línea base de ~5 puntos). Pendiente
  de resolver con rangos normativos de datos reales.
- La ventaja del bandido sobre elegir al azar fue pequeña en simulación.
