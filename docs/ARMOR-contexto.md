# ARMOR — Contexto del proyecto

**ARMOR** · *Autonomous Response and Medical Operations Resource*
Equipo RoboMinds · NASA Space Apps 2026 · reto "Create Health Monitoring Software for Astronauts"

> Documento vivo. Guarda lo acordado para no re-explicarlo en cada sesión.
> Última actualización: 2026-11-14.

---

## 1. Qué es ARMOR

Plataforma de **apoyo a la decisión** médica para astronautas en misiones largas, donde no hay
médico a bordo y la comunicación con la Tierra tarda entre 4 y 24 minutos.

Acompaña **enfermedades físicas y psicológicas**. No diagnostica: propone, explica por qué, y la
persona (o el médico de la tripulación) decide. El motor detecta; ARMOR responde — esa es la "R".

**Entregable para los jueces: una simulación web**, no una app de tablet. Se evalúa en el navegador.

---

## 2. Estado del código (repo `NASA-IXCHELITOS`)

Motor **Ixchel**, en Python, offline, sin interfaz. ARMOR es su cara.

| Pieza | Estado |
|---|---|
| `ixchel/ixchel_core.py` | Motor de reglas: línea base individual (Z-score), persistencia, reglas clínicas, límites ambientales, eventos con protocolo |
| `ixchel/monitor.py` | Motor + modelos aprendidos en una interfaz (`IxchelMonitor.ingest()`) |
| `ixchel/modelo_sueno.py` | Random Forest que deduce etapas de sueño solo con la FC del reloj |
| `ixchel/entrenar_riesgo.py` | Random Forest multi-salida + árbol explicable (profundidad 4) |
| `ixchel/api.py` | FastAPI, 7 endpoints, estado en memoria |
| `ixchel/tests/` | 21 pruebas |
| `models/` | 4 modelos entrenados + métricas, versionados |

### Datos reales descargados (~100 MB)

- **Ambiente de cabina ISS** (NASA OSDR EDA): CO2, temperatura, humedad cada 5 min, 13 misiones 2014–2024.
- **Radiación**: dosis diaria ISS + RadLab por detector (ISS, órbita lunar, superficie de Marte).
- **Sueño**: PhysioNet BIDSleep — 47 sujetos, 253 noches, FC de Apple Watch + etapas etiquetadas por experto.

### Lo que el motor devuelve cada día

`nivel` (VERDE/AMARILLO/ROJO) · `dominios` (psico, sueño, físico, social) · `z` por variable ·
`alertas` con código y detalle · `ambiente` · `factores_contexto` (gravedad, retardo de comunicación,
autonomía requerida, fase) · `eventos_activos` · `recomendaciones` · `ml.riesgo_dominios` ·
`ml.explicacion.pasos` (**el porqué del color, en texto legible**) · `sin_linea_base` ·
`requiere_confirmacion: true`.

### Rendimiento medido (48 astronautas simulados que el modelo nunca vio)

Sensibilidad 0,92 · precisión 0,98 · 0,7 falsas alarmas por 100 días sanos · 43 de 43 episodios
detectados · 1 día de retraso mediano. Las reglas solas: 0,72 / 0,81 / 6,3.

### Regla de seguridad (argumento central del producto)

El ML **solo adelanta** avisos (VERDE → AMARILLO). Nunca pone ROJO por su cuenta ni borra una
alerta. La decisión final es humana. **Debe verse en la interfaz.**

### Huecos conocidos (no esconderlos, diseñarlos)

- No existe interfaz todavía.
- El estado de la API vive en memoria: se pierde al reiniciar.
- Umbral de CO2 (3.000 ppm) por debajo de la mediana real de la ISS (~3.040) → dispara casi a diario.
- Unidades de radiación sin confirmar.
- Variables semanales (POMS, BDI, cohesión) dan falsas alarmas por línea base corta.
- La "verdad" del entrenamiento sale del simulador → métricas optimistas. Decirlo en el pitch.

---

## 3. Alcance clínico

### 3.1 Variables que modulan (capa de contexto, siempre presente)

| Variable | Qué comunica | ¿Hay dato? |
|---|---|---|
| Comunicación | Retardo, enlace activo, autonomía exigida, último contacto | Sí |
| Radiación | Dosis de hoy, acumulada, % del límite de carrera (600 mSv), evento solar | Sí |
| Gravedad | Entorno gravitatorio y tiempo en él; causa raíz de la atrofia | Sí |
| Distancia | Traducida a tiempo hasta ayuda y soledad operativa, no a kilómetros | **Derivada** |
| Aire | CO2, O2, presión, humedad, y su efecto en cefalea, cognición y sueño | Sí |
| Ruido | Nivel y su impacto en la calidad del sueño | Sí |

No son el problema: son **lo que explica y agrava** el problema. Deben poder atribuirse a un síntoma.

### 3.2 Dominio físico

- **Radiación** — exposición diaria, acumulada, proyección, umbral de refugio. *Cubierto.*
- **Atrofia** — masa, hueso, adherencia al ejercicio. Escala de semanas y meses, no de días. *Cubierto en parte.*
- **Heridas** — traducir a qué puede y qué no puede hacer hoy (EVA, tareas críticas, ejercicio). *Evento existe.*
- **Enfermedades** — requiere autorreporte de síntomas; no hay sensor de fiebre. **Hueco real.**

### 3.3 Dominio psicológico

- **Aislamiento** — contacto con Tierra, calidad más que cantidad. *Parcial.*
- **Confinamiento** — tiempo en espacio cerrado, monotonía, cohesión. **Hueco**: requiere autorreporte.
- **Sueño** — horas, eficiencia, desfase circadiano, vigilia prolongada. *Bien cubierto.*
- **Trastornos** — deriva sostenida del ánimo. *Parcial, con falsas alarmas conocidas.*

**El sueño es el puente** entre entorno (ruido, CO2), físico (cognición) y psicológico (ánimo).

Regla de redacción: **nunca una palabra diagnóstica como etiqueta de estado**. Se describe lo
observado ("llevas 9 días durmiendo menos y hablando menos"), no lo que significa.

### 3.4 Preguntas de autorreporte (check diario)

Reglas: sin nombres de trastorno en el texto, sin "podrías estar entrando en…", sin pedir que la
persona se clasifique. Son preguntas de observación y de apoyo; sus respuestas alimentan las
contramedidas, no un diagnóstico.

**Check de estado (observación):**
> "Estos días has dormido menos y hablado menos con tu equipo. ¿Cómo te sientes con eso?"
> Opciones: Bien · Regular · Mal · Prefiero no decir

**Pregunta de apoyo (qué ayuda):**
> "¿Qué te ha ayudado a sentirte mejor últimamente?"
> Opciones: Ejercicio en el ergómetro · Hablar con alguien · Música · Estar un rato solo · Otra

Notas:
- "Caminar" o "correr" se traduce a **ejercicio en ergómetro o cinta**, que es lo que usa la tripulación.
- Cualquier nombre de trastorno queda fuera de la interfaz. El lenguaje clínico va en el protocolo
  dirigido al médico de la tripulación.
- "Prefiero no decir" es una opción válida y no se trata como alerta.

---

## 4. Protocolos

Seis eventos ya existen en el motor, con duración y con congelado de la línea base mientras duran:
**luto (30 d) · sospecha de trastorno (30 d) · tratamiento (60 d) · emergencia (3 d) · herida (14 d) ·
enfermedad (14 d)**.

### Plantilla común

Activación (con fricción proporcional) · encabezado de protocolo activo con duración · pasos como
checklist (hecho / pospuesto / no aplica) · aviso de que la medición se pausa, redactado como gesto
de cuidado · hitos de reevaluación · cierre · bitácora de lo decidido y lo omitido.

### Puntos propios de cada uno

- **Luto** — acompañamiento. *El contenido clínico lo aporta una compañera del equipo; el contenedor
  debe ser agnóstico del contenido.* Los primeros días la vista por defecto es de apoyo, no de
  métricas. Contacto diferido con la familia tratado como espacio de duelo, no como limitación
  técnica. Espacio para rituales. Decidir si la app da la noticia o solo acompaña después.
- **Sospecha de trastorno** — el más delicado. Nunca como acusación; no usar "sospecha" ni "indicios"
  como título visible. Encuadre de *abrir seguimiento* con transparencia total hacia la persona.
  Separar lo observado de lo interpretado. Definir qué ve el Comandante. Diseñar el desacuerdo.
- **Tratamiento** — la vista central es *antes vs. después*. Adherencia con mínima fricción. Efectos
  inesperados. Advertencia cruzada tratamiento × tarea programada (ej.: anticoagulante obliga a
  suspender 24 h antes de una EVA).
- **Emergencia** — modo aparte, no una alerta más. Una sola acción visible a la vez. Redundancia.
  Salida ni accidental ni imposible. Transición a la ventana post-emergencia de 72 h. Distinguir
  emergencia médica de emergencia psiquiátrica.

---

## 5. Principios UX

1. Ninguna alerta sin acción propuesta: **Aplicar / Posponer / Descartar con motivo**.
2. La enfermedad es una trayectoria, no un instante: antes de "cuánto valgo hoy", "¿voy mejor o peor que hace 3 días?".
3. Explicable o no se muestra. Sin jerga: "fallos de atención", no "lapses PVT".
4. El entorno siempre acompaña al síntoma.
5. Físico y psicológico se cruzan; el sueño es el puente.
6. Ante la duda sobre la persona, acompaña; no etiqueta.
7. Una decisión por vista.
8. Dos tonos de voz: clínico en lo físico, cuidadoso en lo psicológico. Nunca lenguaje de fallo ni de rendimiento para el ánimo.
9. Privacidad por capas: la persona ve todo; el Comandante ve capacidad operativa; Tierra ve lo agregado.

---

## 6. Paleta y estados

| Color | Hex | Uso |
|---|---|---|
| Verde azulado | `#376E68` | Títulos, navegación, pasos, información confiable, estado normal |
| Azul espacial | `#0B3D91` | Acciones tranquilas, tarjetas de autocuidado, aviso anticipado del modelo |
| Blanco cálido | `#F7F5EF` | Fondo de páginas, formularios y tarjetas |
| Rojo de acento | `#FC3D21` | Alertas críticas. **Nunca fondo extenso ni único canal** |

**Modo estricto: solo los cuatro colores.** Sin derivados, sin tintes ni opacidades. Cada estado se
distingue por forma, icono, trazo y palabra.

**Contrastes sobre `#F7F5EF`:** `#0B3D91` = 9,38:1 (AAA, sirve para texto) · `#376E68` = 5,46:1 (AA, sirve
para texto) · `#FC3D21` = 3,37:1 — **no sirve para texto**, pero sí para iconos y bordes (umbral no-texto 3:1).

### Estados en modo estricto

| Estado | Color | Forma / icono | Palabra obligatoria |
|---|---|---|---|
| Normal | `#376E68` | Círculo relleno con check | "Normal" |
| Atención | `#FC3D21` | Triángulo en contorno (sin relleno) | "Atención" |
| Crítico | `#FC3D21` | Octágono relleno con "!" + borde izquierdo grueso | "Crítico" |
| Sin datos | `#376E68` | Círculo punteado vacío | "Sin datos todavía · faltan N días" |
| Aviso del modelo | `#0B3D91` | Chispa en contorno, borde punteado | "Aviso anticipado del modelo" |
| Protocolo activo | `#376E68` | Corazón + banda superior ancha | "Acompañamiento activo" |
| Autocuidado / acción | `#0B3D91` | Botón relleno o tarjeta | Verbo de acción |

Reglas:
- Atención y Crítico comparten `#FC3D21`: se separan por forma (triángulo vs. octágono), trazo (contorno
  vs. relleno) y palabra. Nunca el ámbar.
- `#FC3D21` nunca es fondo extenso ni color de texto de párrafo.
- Sin datos y Normal comparten `#376E68`: se separan por relleno (vacío vs. lleno) y palabra.
- Protocolo activo y Normal comparten `#376E68`: se separa por la banda superior y el corazón.
- No hay color de fondo para estados: las tarjetas son siempre `#F7F5EF`.

El estado "Sin datos" aparece con frecuencia en los primeros 30 días: si no se diseña, la interfaz miente.
El "Aviso del modelo" es el diferenciador técnico: que se vea.

El color **nunca** va solo: forma + icono + palabra.

---

## 7. Vistas de la simulación web

1. **Entrada** — qué es ARMOR en una frase, por qué importa, botón a la simulación.
2. **Hoy** — estado del día, banda de contexto, cuatro dominios, acciones pendientes.
3. **Detalle y decisión** — qué pasó, por qué, qué pasa si no hago nada, tres botones.
4. **Modo protocolo activo** — una plantilla, seis contenidos.
5. **Línea de tiempo de misión** — alertas, eventos, protocolos y decisiones; cruce de dos variables.
6. **Gemelo digital** — silueta con regiones clicables, incluidas las no instrumentadas.
7. **Contexto ambiental** — las seis variables con su acumulación.
8. **Contramedidas** — catálogo con qué funcionó en esta persona.
9. **Check diario** — autorreporte en menos de 30 s, con dos preguntas (ver 3.4): check de estado
   (Bien · Regular · Mal · Prefiero no decir) y pregunta de apoyo sobre qué le ha ayudado. Opción
   "Prefiero no decir" siempre disponible. Sin lenguaje diagnóstico.
10. **Bitácora de decisiones**.
11. **Vista Comandante** — capacidad operativa, sin detalle íntimo.
12. **Confianza y límites** — qué está validado, qué es simulado.

Prioridad para el hackathon: **1, 2, 3, 4** en alta fidelidad; el resto, navegables.

### Controles propios de una simulación evaluada por jueces

- Selector de **escenario**: Nominal · Fatiga acumulada · Duelo · Emergencia.
- Control de **día de misión** (1–180) para avanzar en el tiempo y ver evolucionar el estado.
- Un panel breve de **"cómo leer esto"**, porque el jurado entra sin contexto.
- Pie permanente: *"ARMOR propone. La decisión es de la persona o del médico de la tripulación."*

---

## 8. Datos canónicos de la demo

Usar siempre los mismos para que la demo sea coherente:

- Misión: **día 87 de 180, tránsito a Marte**. Gravedad 0 g. Retardo 12 min. Enlace activo.
- Ambiente: CO2 **3.180 ppm** (alto) · O2 20,9 % · presión 1.012 hPa · humedad 46 % · ruido **58 dBA**.
- Radiación: **0,62 mSv** hoy · **214 de 600 mSv** acumulados.
- Dominios: Sueño **ATENCIÓN** · Ánimo **ATENCIÓN** · Cuerpo **NORMAL** · Vínculos **SIN DATOS** (63 %, faltan 11 días).
- Sueño: **5,4 h** de media esta semana; lo habitual en esta persona, **7,1 h**.
- Atención: **4,2** fallos al día; su normal, **1,5**.
- Alerta activa: *fatiga acumulada* — 3 días durmiendo menos de 6 h con más fallos de atención.
- Aviso del modelo: deterioro en sueño con probabilidad **0,78**, antes que las reglas.
- Contramedidas sugeridas: siesta ancla 90 min (*le funcionó 3 de 4 veces*) · luz azul 460 nm · reorganizar turnos.

---

## 9. Decisiones abiertas

1. ¿Usuario primario, el astronauta o el Comandante? → **recomendado: el astronauta**.
2. En sospecha de trastorno, ¿la persona sabe que está en seguimiento? → **recomendado: sí, transparencia total**.
3. ¿Incluimos inventario médico (dosis restantes) en tratamiento? Suma al pitch, cuesta datos que no hay.
4. ¿Qué hacemos con lo no instrumentado (fiebre, confinamiento, SANS, trombosis)? → **recomendado: estados vacíos educativos**.
5. ¿La app comunica la noticia de un fallecimiento o solo acompaña después? → preguntar a la compañera que trae el protocolo de luto.
6. ¿Fondo claro `#F7F5EF` o variante oscura para uso nocturno en cabina? La paleta es clara por diseño.
7. ~~¿El índigo de protocolo entra en la identidad?~~ **Resuelto:** modo estricto, sin índigo.
8. Atención y Crítico comparten `#FC3D21`. Si el jurado no distingue bien las dos formas en la demo,
   la alternativa es admitir un quinto color, y eso rompe el modo estricto. Probar primero con usuarios.

---

## 10. Registro

- **2026-11-14** — Creado. Recoge: resumen del repo, taxonomía clínica (variables moduladoras, físico,
  psicológico), los cuatro protocolos a diseñar, principios UX, paleta con contrastes verificados,
  vistas de la web, datos canónicos de la demo y decisiones abiertas.
  Cambio de alcance: el entregable es **simulación web para jueces**, no app de tablet.
- **2026-11-14 (later)** — Paleta en **modo estricto**: solo los cuatro colores del equipo. Se
  eliminaron los derivados (ámbar, gris, índigo). Los estados se diferencian por forma y palabra.
