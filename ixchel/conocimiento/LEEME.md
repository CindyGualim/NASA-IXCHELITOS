# Base de conocimiento: monitor psicológico de astronautas (v3.0)

Archivo principal: `base_conocimiento_psicologica.json` (UTF-8). Sale del documento "Documentación base: monitor psicológico de astronautas" (rev 18) y es una herramienta de apoyo, no un dispositivo médico.

## Cómo está organizado

| Clave | Qué contiene |
| --- | --- |
| `meta` | Leyenda de etiquetas, principios de diseño, capas, módulos M1 a M8 |
| `sources` | 168 fuentes (`S01`…`S168`), con título, URL y tipo; `S61`–`S101` llevan `added_in: "2.0"` y `S102`+ llevan `added_in: "3.0"`; ninguna de las dos está en el documento base |
| `facts` | 108 hechos con cifras (`F01`…`F108`); los `F64`+ son de los protocolos clínicos (módulo M8) |
| `instruments` | 40 instrumentos (`I01`…`I40`): juegos, cuestionarios y datos pasivos, con métricas, línea base, cadencia, confusores, respaldo y licencia |
| `question_banks` | 25 bancos con 191 ítems: los propios (`SL`, `CK`, `TM`, `PO`, `SF`) y, nuevos, `Q_WHO5`, `Q_PHQ9`, `Q_GAD7`, `Q_SPANE`, `Q_ASQ`, `Q_CSSRS`, `Q_TLX` con escala, extremos, puntuación y licencia |
| `schedule` | Cadencia por instrumento, semana tipo, reglas de uso e intensificación |
| `alerts` | Orden de evaluación, reglas `R01`–`R26`, reporte asíncrono, contramedidas |
| `variables_85` | Las 22 filas de la lista de 85 variables que se usan, con su rol (señal, respaldo, confusor) |
| `cognition_battery_reference` | Las 10 pruebas de Cognition con dominio y minutos |
| `scales_reference` | Escalas conocidas y estado de licencia |
| `open_data` | Datos abiertos y cómo acceder |
| `record_schemas` | JSON Schema de una medición y del registro diario de eventos |
| `analysis_methods` | **Nuevo.** Línea base, índice de cambio fiable (RCI) con fórmula, EWMA/CUSUM, franja horaria, curva de aprendizaje, cumplimiento esperado |
| `confounder_thresholds` | **Nuevo.** Valores de CO₂, ruido, sueño y carga de trabajo para marcar causas no emocionales |
| `analog_evidence` | **Nuevo.** Mars-500, SIRIUS-19, Antártida (MHCL), HERA, HI-SEAS, ISS Reaction Self-Test, revisión de cognición |
| `standards` | **Nuevo.** Requisitos de NASA-STD-3001 relevantes y brechas de HFBP |
| `safety_protocol` | **Nuevo.** Flujo propuesto ASQ + C-SSRS + PHQ-9 ítem 9, para revisión clínica |
| `face_stimulus_sets`, `candidate_scales` | **Nuevo.** Bancos de caras con licencias y escalas candidatas sin enlace verificado |
| `clinical_protocols` | **v3.** `GP1` duelo por muerte de un tripulante, `GP2` duelo por muerte de un familiar en la Tierra, `GP3` emergencia suicida (niveles A, B, C), `GP4` emergencia conductual, `GP5` sospecha de condiciones básicas (escalón de detección y derivación), `GP6` terapia semanal (formato, plantilla de 45 min y currículo de 8 sesiones), más `meta` con roles y manejo del retardo |
| `conditions_reference` | **v3.** 11 condiciones (depresión, ansiedad, adaptación, estrés agudo, PTSD, duelo prolongado, insomnio, hipomanía, alcohol, riesgo suicida, psicosis o delirium) con duración, escalas, señal del programa, diferenciales y protocolo |
| `forms_by_state` | **v3.** Qué formulario llena la persona según cómo se siente (selector de estado `I35`) |
| `pending` | 46 puntos abiertos (`P31`–`P46` nuevos en v3) |

## Etiquetas de fiabilidad

- **B**: está en una fuente abierta citada.
- **P**: criterio propio del equipo; verificar antes de citarlo como medido por NASA.
- **D**: decisión de diseño nuestra; no viene de un manual.

## Reglas que el programa debe respetar

1. La referencia es la línea base personal, no una norma poblacional.
2. Cada medición se compara contra la misma franja horaria del mismo astronauta.
3. Una prueba saltada se guarda vacía; no se rellena.
4. Una mejora por práctica no es bienestar.
5. El ítem `SF1` (seguridad) dispara `R05` de inmediato y no espera tendencia.
6. El módulo de emociones (`I05`) nunca dispara una alerta por sí solo.
7. Los ítems con `reverse_scored: true` (`CK3`, `CK4`, `CK6`, `PO3`) se invierten antes de calcular; `TM2` lleva `higher_is_worse: true`.
8. Todas las reglas de alerta son decisión de diseño [D]; no existen umbrales publicados para astronautas (la brecha BH-201 de NASA lo confirma). Hay referencias de síntomas: sueño ≤6 h (`F44`), CO₂ desde 2,3 mmHg (`F39`), ruido NC-40 en sueño (`F41`).
9. Usar el RCI (`A02`) y EWMA (`A03`) solo con fiabilidad y línea base reales; si no, caer en las reglas `R01`/`R02`.
10. Con PHQ-9 ítem 9 > 0, ASQ positivo o `SF1` ≠ 0, escalar de inmediato (`R05`, `R12`).

## Límites

- No se pudo descargar el Excel de Mars-500 desde el entorno de trabajo; está descrito en `open_data` y en `pending` (`P15`).
- **Traducciones**: los ítems de WHO-5, PHQ-9, GAD-7, SPANE, ASQ, C-SSRS y TLX están traducidos de forma literal por nosotros; para uso real hay que usar versiones oficiales validadas en español (`P20`).
- **Cortes de gravedad** de PHQ-9/GAD-7 son [P] (`F57`); los de WHO-5 vienen de fuentes secundarias (`P26`).
- **Unidades de CO₂**: el listado de 85 variables dice 0,7 a 1 kPa (≈5,3 a 7,5 mmHg, nivel de peligro) pero los síntomas aparecen desde 2,3 mmHg (`P24`).
- **MHCL**: no se pudieron ver sus 23 ítems (`P22`). PSS-10, TILS y los bancos de caras vienen de la investigación previa sin enlace verificado (`P21`).
- Hay una discrepancia de definición de falso inicio en PVT-B: 130 ms (ISS) frente a 100 ms (Basner 2011) (`P23`).
- Las filas 11, 20, 41, 57 y 81 de la lista de 85 no tienen link verificado.
- La tarea de decisión mensual (`I13`) y las tres preguntas del chequeo con compañero (`I11`) están por definir.
- Los ítems de los bancos son propios y no están validados.
- El ítem de seguridad y su flujo deben revisarlos un psicólogo o psiquiatra antes de usarlos con personas reales.
- La tabla de capas del documento menciona las filas 42, 48, 49 y 66 como contexto, pero la tabla de uso no las incluye; en el JSON son candidatas opcionales (`variables_85.optional_candidates`).


## Novedades de la v3.0

- Protocolos `GP1` a `GP6`, todos con etiqueta [D] y estado `propuesta_para_revision_clinica`: el programa detecta, avisa y guía; no diagnostica, no trata ni decide la aptitud para trabajar.
- Escalas nuevas con cortes publicados: PHQ-4, PCL-5 (dominio público), ISI, Brief Grief Questionnaire, AUDIT-C; PG-13-R y MDQ solo con cortes y estructura, sin sus ítems (`P39`, `P40`; ahora con ítems del equipo).
- Reglas `R13`–`R26` (cribados, eventos, observación de compañeros) y cadencias `SCH17`–`SCH28`.
- Los ítems del PCL-5 están escritos de memoria y parafraseados; verificar contra el formulario oficial (`P35`). Los del ISI y BGQ son paráfrasis o traducciones literales con licencia por confirmar (`P31`, `P36`).
- Datos de NASA sobre emergencias conductuales (checklist, formulario, ketamina) vienen de prensa y de un artículo leído por extracción automática (`P43`).
- No existe evidencia de que la sesión semanal de 45 minutos funcione en astronautas (`P44`); es propuesta basada en PM+, activación conductual y la práctica actual de la ISS (conferencia de 15 minutos cada 2 semanas).
- No se investigaron delirium, psicosis a fondo, TDAH, trastornos de personalidad ni versiones validadas en español (`P45`).
- **Ítems del equipo (14-nov-2026):** PCL-5 (20), ISI (7), BGQ (5), MDQ (13 + 2) y PG-13-R (13) vienen del archivo que aportó Lui (`S168`). Son adaptaciones: no aplicar el corte de 30 al PG-13-R, faltan los extremos de escala del ISI y del PG-13-R, y el corte de 7 del MDQ solo está validado con el texto original (`P46`).
