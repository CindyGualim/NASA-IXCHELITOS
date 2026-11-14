# Base de conocimiento escrita: monitor psicológico de astronautas (v3.0)

Documento de texto completo, sin depender de enlaces. Contiene todo el contenido de la base de conocimiento: qué se mide, cómo, cada cuánto, con qué preguntas, cómo se interpreta y con qué evidencia. Las referencias aparecen como códigos (S01, F44…) y al final hay una bibliografía con autores y títulos. Es una herramienta de apoyo, no un dispositivo médico; no diagnostica.

## Cómo leer las etiquetas

- **B**: encontrado en una fuente abierta citada aquí.
- **P**: criterio o conocimiento propio del equipo, por verificar antes de citarlo como medido por NASA.
- **D**: decisión de diseño nuestra, no viene de un manual.

## Principios de diseño

- La señal principal es el desempeño y las respuestas del astronauta en juegos y encuestas; la fisiología y el ambiente la corroboran o explican una caída no emocional.
- La referencia principal es la línea base personal, no una norma poblacional (las normas disponibles son preliminares y de pocos astronautas).
- Una mejora por práctica no es bienestar.
- Antes de interpretar emocionalmente una caída, descartar sueño y ambiente.
- Toda medición lleva fecha, hora de la nave y día de misión; el reloj de la nave es la referencia.
- Si una prueba se salta, queda vacía y se cuenta aparte.

## Capas de señal

- Capa 1, Señal principal: filas 6–13, 71–73, 81 de la lista de 85 variables.
- Capa 2, Respaldo fisiológico y conductual: filas 14, 15, 16, 20, 21, 40 (66 candidato opcional) de la lista de 85 variables.
- Capa 3, Contexto y confusores: filas 19, 41, 57, 58 (42, 48, 49 candidatos opcionales) de la lista de 85 variables.
- Capa 4, Fuera del lazo de alerta temprana: filas las demás de la lista de 85 de la lista de 85 variables.

## Módulos

- M1: Reflejos y atención
- M2: Memoria y velocidad mental
- M3: Emociones
- M4: Sueño y ritmo circadiano
- M5: Ánimo, estrés y ansiedad
- M6: Cohesión y aislamiento
- M7: Integración, alertas y escalamiento
- M8: Protocolos clínicos y respuesta (duelo, sospecha, emergencia, terapia)

> Todas las fuentes se consultaron el 14 de noviembre de 2026 por búsqueda web. Para varias solo se leyó el resumen o fragmentos: abrir el original antes de citar cifras.


# PARTE 1. Hechos y cifras (con su evidencia)


## General: General

- **F07** [B encontrado en fuente] En Mars-500 el PVT-B se aplicó 2 veces por semana (al despertar y por la tarde); las escalas visuales, antes o después de cada PVT-B; el POMS corto, semanal por la mañana; el BDI-II y el cuestionario de conflicto, semanales por la tarde; la actigrafía, continua con un dato por minuto; la escala de deseabilidad social SDS-17, una vez antes de la misión. (fuentes: S02)
  - Valores: pvtb_per_week: 2; poms_sf: weekly_morning; bdi2: weekly_afternoon; conflict: weekly_afternoon; actigraphy: continuous_1_per_min; sds17: once_premission
- **F20** [B encontrado en fuente] En Mars-500 las diferencias individuales fueron enormes y surgieron pronto; la actividad bajó gradualmente en los primeros seis meses; el conflicto con control de misión fue unas 5 veces más frecuente que entre tripulantes; no hubo efecto del tercer cuarto en ninguna medida. (fuentes: S02, S46)
  - Valores: conflict_mcc_vs_crew_ratio: 5
- **F21** [B encontrado en fuente] El fenómeno del tercer cuarto tiene evidencia mixta: se propuso en 1991 y en Mir, ISS y Lunar Palace 1 no se observó. En HI-SEAS las condiciones adversas aparecieron sobre todo pasada la mitad de la misión. (fuentes: S34, S11)
- **F32** [B encontrado en fuente] Mars-500: los datos del artículo de PNAS están depositados en un Excel (actigrafía de 4.4 millones de minutos y 888 evaluaciones neuroconductuales semanales de 6 tripulantes). (fuentes: S46)
  - Valores: minutes: 4396000; assessments: 888; crew: 6; verified_access: False

## M1: Reflejos y atención

- **F01** [B encontrado en fuente] El PVT-B dura 3 minutos con unos 60 ensayos. (fuentes: S14, S15)
  - Valores: duration_s: 180; trials_approx: 60
- **F02** [B encontrado en fuente] Un lapso es una respuesta de más de 355 ms en el PVT-B (500 ms en el PVT de 10 minutos). (fuentes: S14)
  - Valores: lapse_ms_pvtb: 355; lapse_ms_pvt10: 500
- **F03** [B encontrado en fuente] Un falso inicio es una respuesta de menos de 100 ms o sin estímulo. (fuentes: S14)
  - Valores: false_start_ms: 100
- **F04** [B encontrado en fuente] La métrica más sensible del PVT-B a la falta de sueño es la velocidad de respuesta (1/TR). (fuentes: S01, S14)
  - Valores: metric: response_speed
- **F05** [B encontrado en fuente] En la ISS el Reaction Self-Test se programó cada cuarto día en vuelo, dos veces por día de prueba (al levantarse y en las 2 h previas a acostarse), y a diario alrededor de cambios de turno de sueño y caminatas espaciales. Antes del vuelo empezó 180 días antes y se repitió cada 30 días. (fuentes: S01)
  - Valores: in_flight_every_n_days: 4; per_test_day: morning_after_waking, evening_2h_before_bed; preflight_start_days: -180; preflight_every_days: 30
- **F13** [B encontrado en fuente] El PVT-B se repitió 16 veces en 45 participantes a intervalos de 10 días o más, 5 días o menos o 4 veces al día: tiempo de reacción medio y mediano, velocidad de respuesta y lapsos no cambiaron de forma sistemática. Las pruebas cognitivas más complejas sí tienen efecto de práctica. (fuentes: S08)
  - Valores: participants: 45; administrations: 16
- **F14** [B encontrado en fuente] El desempeño en el PVT sigue patrones circadianos y de tiempo despierto; comparar cada medición contra la misma franja. (fuentes: S09)
  - Valores: rule: compare_same_time_slot
- **F30** [B encontrado en fuente] El PVT de 3 min mostró validez convergente inadecuada frente al de 10 min: usarlo como alerta relativa a la línea base propia y no como medida absoluta de somnolencia. (fuentes: S43)
- **F44** [B encontrado en fuente] ISS Reaction Self-Test (24 astronautas, misiones de unos 160 días): sesiones cada 4 días en vuelo, por la mañana y en las 2 h previas a dormir; 2.856 sesiones de 3.620 programadas (78,9 %); con 6 h de sueño o menos (34,9 % de las noches) la velocidad de respuesta fue menor; durmieron las 8,5 h programadas solo en el 5,9 % de las noches; el estrés fue mayor en el cuarto cuarto de la misión que en el primero y el segundo. (fuentes: S01)
  - Valores: n: 24; sessions_done: 2856; sessions_scheduled: 3620; completion_pct: 78.9; inflight_every_days: 4; sleep_mean_h: 6.5; sleep_sd_h: 1.4; nights_le_6h_pct: 34.9; nights_scheduled_8_5h_pct: 5.9; vas_points: 11
  - Nota: El artículo usa '≤6 h' y '<6 h' para el mismo corte. Define falso inicio como TR <130 ms; S14 usa 100 ms (ver P23). Los anclajes de las demás escalas visuales están en el suplemento (no leído).
- **F45** [B encontrado en fuente] Los dominios VAS del Reaction Self-Test: calidad del sueño (solo mañana), carga de trabajo (solo noche), estrés, fatiga mental, agotamiento físico, cansancio y somnolencia, todos antes de cada PVT-B. (fuentes: S01)
  - Valores: domains: calidad_de_sueno, carga_de_trabajo, estres, fatiga_mental, agotamiento_fisico, cansancio, somnolencia

## M2: Memoria y velocidad mental

- **F09** [B encontrado en fuente] Batería Cognition en las Standard Measures: L-120 (familiarización), L-90, día 30 de vuelo, R-30, R+10 y R+30. (fuentes: S03, S04)
  - Valores: sessions: L-120 fam, L-90, FD30, R-30, R+10, R+30
- **F10** [B encontrado en fuente] La batería completa de Cognition se administra en menos de 20 minutos; en la ISS tomó 16 minutos en promedio. Hay 15 formas únicas para repetirla. (fuentes: S18, S21)
  - Valores: max_minutes: 20; iss_mean_minutes: 16; unique_forms: 15
  - Nota: El documento base no liga cada cifra a una sola fuente; confirmar en S18 antes de citar.
- **F11** [B encontrado en fuente] Tras una noche sin dormir hubo efectos grandes en atención vigilante (d = 1.00), rendimiento cognitivo (0.68) y razonamiento abstracto (0.65). (fuentes: S18)
  - Valores: d_vigilance: 1.0; d_throughput: 0.68; d_abstract_reasoning: 0.65
  - Nota: Atribuido a S18 por el documento base; confirmar en el original.
- **F12** [B encontrado en fuente] Un modelo con DSST, Abstract Matching y el sesgo de respuesta de Fractal 2-Back explicó el 30 % de la varianza del desempeño de acoplamiento; el DSST fue el que mejor predijo. (fuentes: S23)
  - Valores: variance_explained: 0.3
- **F51** [B encontrado en fuente] Una revisión de estudios cognitivos en vuelo (11 estudios de larga duración, N = 42) no pudo confirmar ni descartar déficits cognitivos específicos en órbita baja; sí es común una mayor variabilidad del desempeño dentro de cada persona y entre personas. (fuentes: S77, S78)
  - Valores: long_duration_studies: 11; subjects: 42; common_finding: mayor variabilidad intra e interindividual
  - Nota: Justifica detectar cambios contra la propia línea base y no contra una norma poblacional.
- **F62** [B encontrado en fuente] PEBL es software libre bajo GPL 2.0 que corre en Windows, Linux, macOS y en navegador (WebAssembly); su batería tiene más de 100 pruebas, incluyendo versiones libres de TOVA, Wisconsin, Iowa Gambling y Conners CPT; la versión 2.3 salió en enero de 2026. (fuentes: S82, S83, S84)
  - Valores: license: GPL-2.0; tests_gt: 100; browser: WebAssembly; latest: 2.3 (enero 2026)
  - Nota: Se debe revisar la licencia GPL si se copia código; las mecánicas se pueden reimplementar.

## M3: Emociones

- **F18** [B encontrado en fuente] La prueba de emociones tuvo de las consistencias más bajas (71 %) en una comparación de baterías; es señal ruidosa. (fuentes: S19)
  - Valores: consistency: 0.71
- **F19** [B encontrado en fuente] Restricción de sueño en análogos de 1 y 2 semanas se asoció con peor reconocimiento emocional, además de atención más lenta e imprecisa. (fuentes: S21)

## M4: Sueño y ritmo circadiano

- **F06** [B encontrado en fuente] El sueño programado en la ISS era de 21:30 a 06:00. (fuentes: S01)
  - Valores: sleep_start: 21:30; sleep_end: 06:00
- **F08** [B encontrado en fuente] Cuestionario de sueño y equipo de NASA: mensual en vuelo; un cuestionario después de despertar sobre calidad y cantidad de sueño, y otro antes de dormir sobre ánimo, cohesión, desempeño y habitabilidad. (fuentes: S03, S05)
  - Valores: frequency: monthly
- **F15** [B encontrado en fuente] Sueño programado 8.5 h por noche; el promedio en la ISS fue de poco más de 6 h y solo el 24 % de las noches llegó a 7 h o más. (fuentes: S24)
  - Valores: scheduled_h: 8.5; mean_h: 6; pct_nights_ge_7h: 24
- **F16** [B encontrado en fuente] Los astronautas reportaron unas 6.5 h de sueño en vuelo en el Reaction Self-Test. (fuentes: S01)
  - Valores: mean_h: 6.5
- **F17** [B encontrado en fuente] Dormir 5 h o menos se asoció con peor atención sostenida en la ISS. Es la única pista de umbral con respaldo en lo recopilado. (fuentes: S21)
  - Valores: sleep_h_le: 5
- **F38** [B encontrado en fuente] En la ISS, por cada 1 mmHg de aumento de CO₂ las probabilidades de que la tripulación reporte cefalea se duplicaron; con el límite operativo de 4 mmHg o menos el riesgo semanal bajó de 3,3 % a 1,6 %, y para bajar de 1 % haría falta un promedio menor de 2 mmHg. (fuentes: S92)
  - Valores: odds_headache_per_mmHg: 2; weekly_risk_pct_before_after: 3.3, 1.6; mmHg_for_risk_lt_1pct: 2; ops_limit_mmHg: 4
- **F39** [B encontrado en fuente] Tripulantes de la ISS reportaron síntomas atribuibles al CO₂ desde 2,3 mmHg: fatiga y cabeza llena entre 2,3 y 2,7; pasos omitidos o procedimientos más largos entre 2,7 y 3,0; cefalea entre 3,0 y 3,4. Se adoptó un límite operativo de 3,0 mmHg y se sugirió que 0,5 a 2,0 mmHg protegería salud y desempeño. (fuentes: S93)
  - Valores: symptoms_from_mmHg: 2.3; bands_mmHg: fatigue_full_headed: 2.3, 2.7; missed_steps: 2.7, 3.0; headache: 3.0, 3.4; ops_limit_mmHg: 3.0; suggested_range_mmHg: 0.5, 2.0
  - Nota: Datos semicuantitativos de reportes en conferencias médicas privadas.
- **F40** [B encontrado en fuente] El SMAC (concentración máxima permitida) de CO₂ para 180 días es 5,3 mmHg; un análisis de NASA no asoció efectos neurocognitivos medidos con los niveles de CO₂ de la ISS. (fuentes: S94)
  - Valores: smac_180d_mmHg: 5.3
  - Nota: Aviso de unidades: el listado de 85 variables del equipo menciona 0,7 a 1 kPa. 1 kPa ≈ 7,5 mmHg, así que 0,7 kPa ≈ 5,3 mmHg (el SMAC) y 1 kPa ≈ 7,5 mmHg. Esos valores son de peligro, mucho más altos que los umbrales de síntomas (2,3 a 3,4 mmHg).
- **F41** [B encontrado en fuente] Ruido en la ISS: requisito NC-50 en trabajo y NC-40 en sueño, con límite de peligro de 85 dBA; los módulos miden 56 a 69 dBA y la caminadora 77 dBA; si el promedio de 24 h es de 67 dBA o más se exige protección auditiva. (fuentes: S95, S96)
  - Valores: nc_awake: 50; nc_sleep: 40; hazard_dBA: 85; module_background_dBA: 56, 69; treadmill_dBA: 77; hearing_protection_24h_dBA: 67
- **F42** [B encontrado en fuente] NC-50 corresponde a 50 dB a 1,5 kHz; el estándar NASA-STD-3001 Vol. 2 pone un límite continuo en áreas de trabajo (NC-50) y límites propios para el sueño, ruido intermitente y alarmas. (fuentes: S62)
  - Valores: nc50_dB_at_1_5kHz: 50; requirements: V2 6078, V2 6079, V2 6080, V2 6081, V2 6082
- **F43** [B encontrado en fuente] Las áreas de dormir de la ISS promedian NC-50 y se recomienda NC-30 o menos para dormir; el ruido con significado (voces) perturba el sueño con niveles más bajos que el ruido aleatorio. (fuentes: S97)
  - Valores: iss_sleep_avg_nc: 50; recommended_sleep_nc: 30
- **F60** [B encontrado en fuente] KSS: 9 puntos, de 1 'extremadamente alerta' a 9 'muy somnoliento, esfuerzo grande para mantenerse despierto'; mide el estado del momento; correlaciona con EEG y con lapsos del PVT (r ≈ 0,56 con lapsos); una revisión lo considera un indicador de somnolencia tan sensible y válido como los objetivos. (fuentes: S79, S80, S81)
  - Valores: range: 1, 9; type: estado; correlation_with_pvt_lapses: 0.56
  - Nota: Términos de uso sin verificar; por eso Q_SLEEP usa redacción propia.

## M5: Ánimo, estrés y ansiedad

- **F29** [B encontrado en fuente] En la Antártida los descensos de emoción positiva no se recuperaron. (fuentes: S57)
- **F36** [B encontrado en fuente] Con gráficos EWMA personales sobre el ítem 'me siento inquieto', se detectó el aumento en el 68,3 % de los participantes que tuvieron recurrencia de síntomas depresivos; no hubo alertas significativas en los que no recayeron en el estudio piloto previo. (fuentes: S89)
  - Valores: detection_rate_pct: 68.3
  - Nota: Población: pacientes previamente deprimidos que redujeron antidepresivos. Es analogía de método, no un valor para astronautas.
- **F48** [B encontrado en fuente] Condiciones conductuales comunes según el brief de NASA: estrés, depresión, ansiedad, problemas de relaciones y duelo. Históricamente, 2 de 7 astronautas estadounidenses del programa Shuttle-Mir (29 %) reportaron síntomas depresivos. (fuentes: S61)
  - Valores: conditions: estrés, depresión, ansiedad, problemas de relaciones, duelo; shuttle_mir_depressive_symptoms: 2 de 7
- **F49** [B encontrado en fuente] El Mental Health Checklist (MHCL) tiene 23 ítems y 3 subescalas (adaptación positiva, autorregulación deficiente, aprensión ansiosa); explicó 53 % de la varianza; en la Antártida (n = 88 en costa e interior = 22) se aplicó mensualmente durante 9 meses. (fuentes: S74, S75)
  - Valores: items: 23; subscales: positive_adaptation, poor_self_regulation, anxious_apprehension; variance_pct: 53; frequency: mensual
- **F50** [B encontrado en fuente] En la Antártida (MHCL), la adaptación positiva disminuyó linealmente durante la misión, la autorregulación deficiente y los síntomas físicos aumentaron, las estrategias de regulación emocional y el DHEA predijeron el puntaje final, los rasgos medidos al inicio predijeron poco, y no se halló el 'efecto del tercer cuarto'. (fuentes: S75)
  - Valores: positive_adaptation: baja linealmente; poor_self_regulation: sube; third_quarter_effect: no encontrado; baseline_trait_predictive_value: bajo
  - Nota: Refuerza usar la línea base de estado en misión, no de rasgo previo.
- **F53** [B encontrado en fuente] El ASQ (NIMH) tiene 4 preguntas de cribado más una pregunta aguda: 1) deseo de estar muerto, 2) familia mejor sin uno, 3) pensamientos de suicidio en la última semana, 4) intento previo; la 5 (pensamientos ahora) solo se pregunta si alguna de 1 a 4 es positiva. Un 'sí' a cualquiera de 1 a 4, o negarse a responder, es cribado positivo. (fuentes: S63)
  - Valores: items: 5; screen_items: 4; acute_item: 5; positive_rule: sí en 1-4 o rechazo a responder
- **F54** [B encontrado en fuente] Tras un ASQ positivo no agudo (no a la pregunta 5) se requiere una breve evaluación de seguridad por un clínico; positivo agudo (sí a la 5) requiere evaluación urgente y no debe quedarse solo hasta evaluarlo; negativo no exige intervención, aunque el juicio clínico puede prevalecer. (fuentes: S63)
  - Valores: non_acute: evaluación breve de seguridad; acute: evaluación urgente, no dejar solo; negative: sin intervención salvo criterio clínico
  - Nota: Flujo pensado para hospitales; su adaptación a la nave es decisión nuestra [D] y debe validarla un clínico.
- **F55** [B encontrado en fuente] El ASQ se describe como herramienta de dominio público y gratuita. El PHQ-9 y el GAD-7 llevan en su formulario la nota 'no se requiere permiso para reproducir, traducir, mostrar o distribuir'. El C-SSRS es gratuito para uso comunitario, sanitario e investigación con fondos federales o sin fines de lucro. (fuentes: S63, S67, S66)
  - Valores: ASQ: dominio público; PHQ-9/GAD-7: sin permiso requerido (1999); C-SSRS: gratuito en contextos comunitario, sanitario y de investigación sin fines de lucro
- **F56** [B encontrado en fuente] PHQ-9 y GAD-7: 'en las últimas 2 semanas', respuestas 0 'nada', 1 'varios días', 2 'más de la mitad de los días', 3 'casi todos los días'; el ítem 9 del PHQ-9 pregunta por pensamientos de estar mejor muerto o de hacerse daño. Los puntos de corte de gravedad no vienen en el formulario consultado. (fuentes: S67)
  - Valores: window_days: 14; response_values: 0, 1, 2, 3; phq9_item9: autolesión o ideación
- **F57** [P por verificar] Cortes habituales de gravedad: PHQ-9 5, 10, 15 y 20 (leve a grave); GAD-7 5, 10 y 15 (leve a grave).
  - Valores: phq9_cutoffs: 5, 10, 15, 20; gad7_cutoffs: 5, 10, 15
  - Nota: Conocimiento propio. Verificar en el artículo original (Kroenke 2001; Spitzer 2006) antes de citarlo. La ventana de 2 semanas no sirve para alertas diarias.
- **F58** [B encontrado en fuente] WHO-5: 5 ítems de 0 a 5 sobre las últimas 2 semanas; puntaje bruto 0 a 25 (×4 para 0 a 100); un bruto menor de 13 (o ≤50 %) indica bienestar bajo y sugiere evaluar depresión; un cambio de 10 puntos porcentuales se considera significativo para seguimiento. (fuentes: S68, S69, S70)
  - Valores: raw_range: 0, 25; percent_range: 0, 100; screen_raw_lt: 13; screen_percent_le: 50; meaningful_change_percent_points: 10; population_mean_percent: 70
  - Nota: Cortes tomados de fuentes secundarias del propio instrumento; no validados en astronautas.
- **F59** [B encontrado en fuente] SPANE: 12 ítems (6 positivos y 6 negativos) sobre las últimas 4 semanas, respuestas 1 a 5; SPANE-P y SPANE-N van de 6 a 30 y SPANE-B (P − N) de −24 a +24; se puede usar con crédito a los autores sin pedir permiso. (fuentes: S71, S72, S73)
  - Valores: items: 12; window_weeks: 4; range_p_n: 6, 30; range_b: -24, 24
  - Nota: La ventana de 4 semanas no es la de un chequeo semanal; cambiarla sin revalidar es decisión de diseño [D].
- **F63** [B encontrado en fuente] C-SSRS (versión de cribado reciente): 6 preguntas sí/no del último mes (1 deseo de estar muerto; 2 pensamientos de matarse; 3 cómo; 4 intención; 5 plan; 6 conducta preparatoria o intento, con 'en los últimos 3 meses'); incluye puntos de triaje de riesgo bajo, moderado y alto. (fuentes: S65, S64)
  - Valores: items: 6; window: último mes; triage: bajo, moderado, alto

## M6: Cohesión y aislamiento

- **F22** [B encontrado en fuente] Suite APEX: desempeño de equipo diario con 4 ítems Likert; funcionamiento de equipo semanal con menos de 18 ítems o diario con más de 40; BDI-2 o CES-D semanal (20 a 21 ítems); POMS y NeuroVAS diarios con más de 40 ítems; instrumento de salud conductual diario de 31 ítems. (fuentes: S07)
- **F52** [B encontrado en fuente] SIRIUS-19 (120 días, retardo de comunicación de 5 min añadido desde el día 11): hubo 320 conversaciones de audio en los primeros 10 días y 34 en los últimos 10 (de 11 h a 77 min); los videomensajes bajaron de 200 en la primera semana a 115 a 120; hubo ráfagas de contacto en eventos clave y la cohesión de la tripulación aumentó. (fuentes: S100, S101)
  - Valores: audio_conversations_first10d: 320; audio_conversations_last10d: 34; audio_minutes_first10d: 660; audio_minutes_last10d: 77; delay_minutes: 5
  - Nota: Interpretación de los autores: 'autonomización' y desapego de Control de Misión; también un riesgo si el aislamiento oculta problemas.

## M7: Integración, alertas y escalamiento

- **F23** [B encontrado en fuente] Retardo de comunicación en una misión a Marte: unos 19 minutos, sin reabastecimiento ni evacuación. (fuentes: S36)
  - Valores: delay_min_approx: 19
- **F24** [B encontrado en fuente] Los astronautas temen que informar datos médicos los descalifique, y ese miedo aumenta la reticencia a reportar; el subreporte limita establecer normas de adaptación psicológica. (fuentes: S51, S52)
- **F25** [B encontrado en fuente] Un 56 % de pilotos de EE. UU. reportó haber evitado atención por miedo a perder su estatus de vuelo. (fuentes: S53)
  - Valores: pct: 56
- **F26** [B encontrado en fuente] En HERA, la calidad de decisiones de equipo llegó a un máximo de 71 % de aciertos en el segundo cuarto y a un mínimo de 17 % en el día 34 (6 tripulaciones de 4 personas, 45 días; tareas en los días -4, 6, 14, 20 y 34). (fuentes: S54)
  - Valores: max_pct: 71; min_pct: 17; task_days: -4, 6, 14, 20, 34
- **F27** [B encontrado en fuente] Más retardo de comunicación predijo peor desempeño en una tarea de gestión de recursos; la alta autonomía mejoró ánimo y autodirección, pero se confunde con el retardo. (fuentes: S55)
- **F28** [B encontrado en fuente] Faltan datos de retardo en el rango lunar. (fuentes: S56)
- **F31** [B encontrado en fuente] Base normativa de Cognition de 25 astronautas, preliminar. (fuentes: S21)
  - Valores: n: 25
- **F33** [B encontrado en fuente] Fórmula del índice de cambio fiable (Jacobson y Truax): SEM = DE·√(1−r); SEdiff = √(SEM1² + SEM2²); el cambio es fiable si supera ±1,96·SEdiff (95 %) o ±1,64·SEdiff (90 %). (fuentes: S85, S86)
  - Valores: sem: SD*sqrt(1-r); sediff: sqrt(SEM1^2+SEM2^2); z_95: 1.96; z_90: 1.64; equivalent_form: 1.96*SD*sqrt(2)*sqrt(1-r)
  - Nota: Con efecto de práctica: se suma la media del efecto de práctica a los límites del intervalo (Chelune et al., 1993; descrito en la fuente).
- **F34** [B encontrado en fuente] El efecto de práctica promedio se estima como M2 − M1 en datos test-retest y se suma a los límites del intervalo para ajustar el cambio fiable. (fuentes: S86, S87)
  - Valores: practice_effect: M2 - M1; adjustment: sumar a los límites inferior y superior del IC
- **F35** [B encontrado en fuente] En datos de muestreo de experiencia, los procedimientos EWMA y CUSUM superan a Shewhart y a T² de Hotelling para detectar cambios de media, y se recomienda vigilar promedios diarios y no cada respuesta. (fuentes: S88)
  - Valores: best: EWMA, MEWMA, CUSUM, MCUSUM; input: promedios diarios
  - Nota: Desarrollado para detección de depresión en pacientes, no en astronautas.
- **F37** [B encontrado en fuente] En metaanálisis de EMA, el cumplimiento promedio es de alrededor del 79 %, con unas 6 evaluaciones por día durante 7 días; en adultos con EMA móvil, el cumplimiento estimado es 81,9 %, con mediana de 5 avisos por día y 8 a 10 ítems por aviso. (fuentes: S90, S91)
  - Valores: compliance_pct: 79, 81.9; prompts_per_day: 5, 6; items_per_prompt: 8, 10
- **F46** [B encontrado en fuente] NASA aplica WinSCAT mensual en vuelo y lo compara con una línea base previa al vuelo; una lesión o enfermedad en órbita dispara pruebas adicionales. Para misiones de más de 6 meses o más allá de la órbita baja, el brief pide medidas adicionales 'mínimamente intrusivas'. (fuentes: S61)
  - Valores: winscat_frequency: mensual; beyond_6_months_or_LEO: medidas mínimamente intrusivas adicionales
- **F47** [B encontrado en fuente] Requisitos de NASA-STD-3001 Vol. 1 (en el brief): conferencias médicas privadas de forma rutinaria según el cirujano de vuelo (V1 6002); conferencias psicológicas privadas rutinarias según el proveedor de salud conductual (V1 6010); programas de apoyo conductual para la tripulación (V1 6004); selección y recertificación anual (V1 3001); instalaciones de privacidad individual en misiones de más de 30 días (V2 7071). (fuentes: S61)
  - Valores: V1_6002: PMC rutinarias; V1_6010: PPC rutinarias; V1_6004: programa de apoyo; V1_3001: recertificación anual; V2_7071_days: 30
  - Nota: El brief no da frecuencia numérica de las conferencias.
- **F61** [B encontrado en fuente] NASA-TLX: 6 subescalas (demanda mental, física y temporal, desempeño, esfuerzo, frustración) calificadas de 0 a 100 en pasos de 5; la versión 'Raw TLX' promedia las seis sin la comparación por pares; en la escala de desempeño el extremo alto es 'fracaso', por lo que un número mayor siempre significa más carga. (fuentes: S98, S99)
  - Valores: subscales: mental, physical, temporal, performance, effort, frustration; range: 0, 100; step: 5; raw_tlx: promedio simple

## M8: Protocolos clínicos y respuesta (duelo, sospecha, emergencia, terapia)

- **F64** [B encontrado en fuente] Antes de la misión, la tripulación se reúne con la dirección de la oficina de astronautas para hablar de sus preferencias sobre cómo ser notificada de emergencias familiares; la NASA avisa en vuelo de problemas en Tierra a quienes lo pidieron. (fuentes: S105)
  - Valores: pre_mission_meeting: True; notify_only_if_requested: True
- **F65** [B encontrado en fuente] En 2007 a un astronauta de la ISS le avisaron de la muerte de su madre mediante una conferencia privada con su esposa y un cirujano de vuelo; cada tripulación de la estación tiene su propio cirujano de vuelo y equipo de apoyo. (fuentes: S104, S105)
  - Valores: channel: conferencia privada; who: cirujano de vuelo, familiar
- **F66** [B encontrado en fuente] El astronauta continuó con sus funciones y se le ofreció un enlace confidencial de apoyo psicológico si lo pedía; la muerte de un familiar no es motivo para usar el Soyuz de rescate. (fuentes: S106, S107)
  - Valores: duties_continued: True; confidential_link_offered: True; rescue_not_used: True
- **F67** [B encontrado en fuente] En 2011 el equipo de vuelo de la ESA modificó el horario de trabajo de un astronauta tras la muerte de su madre; la ESA fue el proveedor principal de apoyo psicológico y la preparación previa incluye la posible muerte de familiares. (fuentes: S108)
  - Valores: schedule_modified: True; primary_provider: agencia de origen
- **F68** [B encontrado en fuente] En el programa antártico australiano la capacidad de llevar a alguien a casa ante una emergencia familiar es muy limitada, y las familias tienen acceso a un programa de asistencia al empleado hasta seis meses tras el regreso. (fuentes: S109)
  - Valores: eap_after_return_months: 6
- **F69** [B encontrado en fuente] Guía naval para dar noticias de muerte familiar: que el marino las reciba de la persona al mando y no por el correo; sala privada con línea externa; ser breve y luego guardar silencio; planear quién lo acompañará y con qué frecuencia después. (fuentes: S110)
  - Valores: private_room: True; brief_then_quiet: True; follow_up_plan: True
  - Nota: Contexto militar; la adaptación a la nave es decisión nuestra.
- **F70** [B encontrado en fuente] La muerte de un familiar en la Tierra, sobre todo un hijo, figura entre los eventos de riesgo conductual; el apoyo en vuelo de la NASA incluye conferencias psicológicas privadas cada dos semanas y WinSCAT cada 30 días. (fuentes: S111)
  - Valores: ppc_every_days: 14; winscat_every_days: 30
- **F71** [B encontrado en fuente] Las conferencias psicológicas privadas en la ISS duran unos 15 minutos y son cada dos semanas; antes del vuelo hay tres evaluaciones de 60 minutos (L-12 meses, L-6 meses, L-30 a 60 días). (fuentes: S112)
  - Valores: ppc_minutes: 15; ppc_every_days: 14; preflight_evals_min: 60, 60, 60
- **F72** [B encontrado en fuente] Norma NASA-STD-3001 Vol. 1: las conferencias médicas privadas se programan de forma rutinaria según el cirujano de vuelo (V1 6002); los programas de salud conductual cubren a tripulación, personal clave y familias durante toda la misión (V1 6004); la información psicológica enviada por la nave se trata como comunicación privada (V1 6011). (fuentes: S114, S113)
  - Valores: V1_6002: PMC rutinarias; V1_6004: programas de apoyo; V1_6011: privacidad psicológica
- **F73** [B encontrado en fuente] En una revisión de emergencias conductuales en vuelo, el duelo y el duelo complicado figuran entre los factores con mayor tasa de ideación suicida, y se citó el caso de un astronauta de la ISS cuyo duelo exigió cambios de carga de trabajo. (fuentes: S148)
  - Nota: Lectura por extracción automática; verificar la afirmación en el artículo.
- **F74** [B encontrado en fuente] Ante la muerte de un tripulante, lo primero es la seguridad de los sobrevivientes; el programa debe tener un protocolo integrado de respuesta conductual, comunicaciones privadas con ancho de banda para familia y amigos, y coordinación con la oficina de apoyo familiar y el oficial de asistencia a víctimas. (fuentes: S103)
  - Valores: priority: seguridad de los sobrevivientes; private_comms_with_bandwidth: True
- **F75** [B encontrado en fuente] En un fallecimiento a bordo, el muestreo forense idealmente se hace en 4 horas y a más tardar en 12; la preparación de los restos para almacenaje, en 12 horas como máximo; la descomposición visible puede aparecer dentro de 24 horas y tendría impacto psicológico en los sobrevivientes. (fuentes: S102)
  - Valores: forensic_ideal_h: 4; forensic_max_h: 12; remains_prep_max_h: 12; visible_decomposition_h: 24
  - Nota: Plazos de un plan de contingencia de la ISS; no aplican igual a otras naves.
- **F76** [B encontrado en fuente] Los tripulantes actúan primero como primeros respondientes y confirman la muerte antes de poder hacer el duelo; la compartimentación ayuda al desempeño inmediato pero puede causar duelo y trauma tardíos; se debe atender el duelo natural cuando las circunstancias lo permitan y ajustar horarios para duelo, descanso y uso del apoyo. (fuentes: S102)
  - Valores: compartmentalization_risk: duelo y trauma tardíos
- **F77** [B encontrado en fuente] El cirujano de vuelo evalúa en tiempo real si un tripulante necesita un descanso, reenfocarse o más apoyo psicológico, puede suspender el muestreo forense para proteger a los sobrevivientes, y cada tripulante puede negarse a cualquier procedimiento. (fuentes: S102)
  - Valores: crew_can_opt_out: True
- **F78** [B encontrado en fuente] Tras una catástrofe, el programa de asistencia al empleado de la NASA ofrece manejo de incidentes críticos a toda la plantilla y el seguimiento de largo plazo se considera esencial, aunque no se fija un calendario. (fuentes: S102)
  - Valores: follow_up_schedule: no especificado
- **F79** [B encontrado en fuente] El muestreo de humor vítreo se espera como el procedimiento más estresante psicológicamente; aislar los restos en un compartimento puede dar cierta protección psicológica; recomendar coordinar el apoyo psicológico antes de la misión porque la confianza previa mejora la empatía. (fuentes: S102)
- **F80** [B encontrado en fuente] Los primeros auxilios psicológicos de la OMS se organizan en mirar, escuchar y conectar, y se recomiendan en lugar del debriefing psicológico para personas en angustia severa tras un evento traumático reciente. (fuentes: S116, S117, S118)
  - Valores: principles: mirar, escuchar, conectar; not_recommended: debriefing psicológico
- **F81** [B encontrado en fuente] La guía de postvención laboral del NHS advierte contra iniciativas sin evidencia como el debriefing psicológico, incluso si las ofrecen personas bienintencionadas. (fuentes: S119)
- **F82** [B encontrado en fuente] Duelo prolongado: el DSM-5-TR exige al menos 12 meses desde la muerte en adultos y el ICD-11 al menos 6; la PG-13-R tiene 13 ítems y un puntaje de 30 o más concuerda con el diagnóstico (kappa 0,70 a 0,89) y es indicación de evaluación adicional. (fuentes: S120, S121, S122)
  - Valores: dsm5tr_months: 12; icd11_months: 6; pg13r_items: 13; pg13r_cut: 30
- **F83** [B encontrado en fuente] El duelo prolongado es distinto de PTSD, depresión mayor y ansiedad generalizada (phi 0,12; 0,25; 0,26) pero se asoció con ideación suicida, peor calidad de vida y deterioro funcional. (fuentes: S121)
  - Valores: phi_ptsd: 0.12; phi_mdd: 0.25; phi_gad: 0.26
- **F84** [B encontrado en fuente] El Brief Grief Questionnaire tiene 5 ítems de 0 a 2 (total 0 a 10); la hoja más reciente del VA sugiere duelo complicado con 4 o más y derivar a un especialista, mientras una hoja anterior usaba 5 o más; con 4 o más se sugiere el ICG de 19 ítems. (fuentes: S125, S124, S127)
  - Valores: items: 5; range: 0, 10; cut_va: 4; cut_older: 5
  - Nota: Umbrales discrepantes entre fuentes (P32). El VA indica usarlo en adultos con al menos 12 meses de duelo; otra fuente indica 6 meses.
- **F85** [B encontrado en fuente] PHQ-9: 5, 10, 15 y 20 son los cortes de depresión leve, moderada, moderadamente grave y grave; acciones propuestas: 5 a 9 espera vigilante y repetir; 10 a 14 plan de tratamiento; 15 a 19 tratamiento activo; 20 o más inicio inmediato y derivación urgente. (fuentes: S128, S129)
  - Valores: bands: 0-4: ninguna o mínima; 5-9: leve; 10-14: moderada; 15-19: moderadamente grave; 20-27: grave
- **F86** [B encontrado en fuente] Con corte de 10, el PHQ-9 tuvo sensibilidad y especificidad de 88 % para depresión mayor frente a entrevista (atención primaria y ginecología, 6000 pacientes). (fuentes: S129)
  - Valores: cut: 10; sens: 0.88; spec: 0.88
- **F87** [B encontrado en fuente] GAD-7: cortes de 5, 10 y 15 para ansiedad leve, moderada y grave; con 10 sensibilidad 89 % y especificidad 82 % para trastorno de ansiedad generalizada; con 10 o más se recomienda evaluación adicional. (fuentes: S130, S131)
  - Valores: cuts: 5, 10, 15; sens_10: 0.89; spec_10: 0.82
- **F88** [B encontrado en fuente] PHQ-4: 4 ítems (0 a 12); categorías ninguna 0 a 2, leve 3 a 5, moderada 6 a 8, grave 9 a 12; 3 o más en la subescala de ansiedad (ítems 1 y 2) o de depresión (ítems 3 y 4) es positivo y lleva a GAD-7 o PHQ-9. (fuentes: S132, S133)
  - Valores: bands: 0-2: ninguna; 3-5: leve; 6-8: moderada; 9-12: grave; subscale_cut: 3
- **F89** [B encontrado en fuente] PCL-5: 20 ítems de 0 a 4 (0 a 80), mes pasado; 31 a 33 o más sugiere PTSD probable, con cortes validados entre 28 y 37 según el propósito (menor para detectar, mayor para minimizar falsos positivos); regla DSM: al menos 1 ítem B (1 a 5), 1 C (6 y 7), 2 D (8 a 14) y 2 E (15 a 20) con puntaje de 2 o más; es de dominio público del Centro Nacional de PTSD de EE. UU. (fuentes: S134, S135, S136)
  - Valores: items: 20; range: 0, 80; cut: 31, 33; validated_range: 28, 37; dsm_rule: B>=1, C>=1, D>=2, E>=2 con puntaje >=2; clusters: B: 1, 5; C: 6, 7; D: 8, 14; E: 15, 20
  - Nota: Tamizaje; el diagnóstico requiere entrevista clínica.
- **F90** [B encontrado en fuente] Para el PCL-5 se citan como cambio fiable 5 a 10 puntos y como cambio clínicamente significativo 10 a 20 (evidencia de la versión DSM-IV); el Centro Nacional de PTSD sugiere 10 puntos como indicador de respuesta. (fuentes: S135, S136)
  - Valores: reliable: 5, 10; clinically_significant: 10, 20
- **F91** [B encontrado en fuente] Insomnia Severity Index: 7 ítems de 0 a 4 (0 a 28); 0 a 7 sin insomnio clínico, 8 a 14 subumbral, 15 a 21 moderado, 22 a 28 grave. (fuentes: S137, S138)
  - Valores: bands: 0-7: sin insomnio clínico; 8-14: subumbral; 15-21: moderado; 22-28: grave
  - Nota: Un formulario pide calificar el último mes y otros las últimas dos semanas (P33).
- **F92** [B encontrado en fuente] AUDIT-C: 3 ítems, 0 a 12; convención de atención primaria de EE. UU.: positivo con 4 o más en hombres y 3 o más en mujeres; el VA usa 5 o más; el valor depende del contexto y debe citarse. (fuentes: S139, S140, S141)
  - Valores: range: 0, 12; cut_men: 4; cut_women: 3; cut_va: 5
- **F93** [B encontrado en fuente] MDQ: 13 ítems sí/no más preguntas de co-ocurrencia y de deterioro; positivo con 7 o más síntomas, co-ocurrencia y deterioro moderado o grave; sensibilidad 0,73 y especificidad 0,90 en psiquiatría ambulatoria; explora historia de hipomanía o manía y no sustituye entrevista. (fuentes: S142, S143)
  - Valores: items: 13; cut: 7; sens: 0.73; spec: 0.9
- **F94** [B encontrado en fuente] Trastorno de adaptación: síntomas emocionales o conductuales ante un estresor identificable que empiezan en 3 meses desde el estresor, no cumplen otro trastorno ni son duelo normal y no duran más de 6 meses después de que cese el estresor o sus consecuencias. (fuentes: S144, S145)
  - Valores: onset_months_max: 3; persist_months_max_after: 6
- **F95** [B encontrado en fuente] Estrés agudo: síntomas tras un evento traumático entre 3 días y 1 mes; si pasan de 1 mes se considera PTSD. Depresión: episodio de al menos 2 semanas. Ansiedad generalizada: preocupación de al menos 6 meses. (fuentes: S146, S147)
  - Valores: acute_stress_days: 3, 30; ptsd_over_days: 30; depression_min_weeks: 2; gad_min_months: 6
  - Nota: Fuentes educativas secundarias; confirmar con el DSM-5-TR.
- **F96** [B encontrado en fuente] El resumen técnico de salud conductual de NASA enumera como factores que pueden causar o imitar síntomas conductuales: efectos adversos de fármacos, condiciones médicas, hipoxia, nutrición y exposición a CO2. (fuentes: S61)
  - Valores: factors: fármacos, condiciones médicas, hipoxia, nutrición, CO2
- **F97** [B encontrado en fuente] Registros: 2 de 7 astronautas del programa Shuttle-Mir (29 %) reportaron síntomas depresivos; en Soyuz T14-Salyut 7 (1985) la depresión pudo contribuir al término anticipado; en Soyuz T10-Salyut 7 (1984) se reportaron posibles alucinaciones. (fuentes: S61)
  - Valores: shuttle_mir_depressive_pct: 29
- **F98** [B encontrado en fuente] Un especialista de payload del Shuttle presentó trastorno de adaptación y conducta peligrosa, incluida fijación en abrir la escotilla y comentarios de no regresar; aun así NASA reporta que ninguna misión ha requerido un fármaco de emergencia por agitación, depresión o suicidalidad. (fuentes: S148, S151)
  - Valores: documented_emergency_drug_use: False
- **F99** [B encontrado en fuente] Formulario conductual de la ISS: antidepresivos ISRS e IRSN (sertralina oral), benzodiacepinas (diazepam IM para emergencias), antipsicóticos (aripiprazol y ziprasidona IM para emergencias); el artículo describe como primeros pasos el apoyo emocional y la observación cuidadosa, y luego el fármaco si hace falta por seguridad. (fuentes: S148)
  - Valores: first_line: apoyo emocional y observación; second: psicofármacos del formulario
  - Nota: La ketamina aparece con descripciones contradictorias en el mismo artículo.
- **F100** [B encontrado en fuente] Según prensa de 2007 sobre la lista de verificación de la ISS (cinco páginas en un manual de 1051), un tripulante con crisis conductual puede ser sujetado, se le ofrece medicación oral y, si no coopera, inyectable; la tripulación debe acompañarlo y vigilar signos vitales, explicándole lo que se hace. (fuentes: S149, S150)
  - Valores: checklist_pages: 5; manual_pages: 1051; stay_with_person: True; explain_actions: True
  - Nota: Fuente de prensa antigua y secundaria; el formulario actual figura en F99.
- **F101** [B encontrado en fuente] Desescalada verbal (Project BETA): tres pasos (contacto verbal, relación colaborativa, desescalada) y cuatro objetivos (seguridad, manejar emociones, evitar sujeción, evitar intervenciones coercitivas); diez dominios, entre ellos respetar el espacio, no provocar, un solo interlocutor, ser conciso, identificar deseos y sentimientos, escuchar, acordar o acordar discrepar, poner límites, ofrecer opciones y esperanza, y revisar con el paciente y el equipo después. (fuentes: S152, S153)
  - Valores: domains: 10; steps: 3; objectives: 4
- **F102** [B encontrado en fuente] El plan de seguridad de Stanley y Brown tiene seis pasos: señales de alarma; estrategias internas de afrontamiento; contactos sociales y distracciones; personas a quienes pedir ayuda; profesionales y líneas de crisis; y hacer el ambiente más seguro; se construye de forma colaborativa en las palabras de la persona y suele completarse en 20 a 45 minutos. (fuentes: S154, S155, S156)
  - Valores: steps: 6; minutes: 20, 45
  - Nota: El formulario oficial permite uso clínico individual; para modificarlo o incluirlo en un sistema se necesita permiso de los autores (spi_bast). Aquí se redacta una versión propia de los seis componentes (P34).
- **F103** [B encontrado en fuente] La consejería de medios letales busca reducir el acceso a medios de autolesión, a veces solo de forma temporal, para que pase el momento de crisis y sea más probable que alguien intervenga. (fuentes: S154)
  - Valores: temporary_ok: True
- **F104** [B encontrado en fuente] La guía mhGAP de la OMS incluye para no especialistas protocolos de evaluación, manejo y seguimiento de depresión, psicosis, autolesión o suicidio y otras quejas emocionales; su versión humanitaria incorpora además estrés agudo, duelo y TEPT. (fuentes: S157, S158, S159)
  - Valores: modules: depresión, psicosis, autolesión o suicidio, otras quejas, estrés agudo, duelo, TEPT
- **F105** [B encontrado en fuente] Problem Management Plus (OMS): cinco sesiones semanales de 90 minutos para adultos con angustia, a cargo de no especialistas entrenados y supervisados (también en versión remota); cuatro estrategias: manejo del estrés (respiración lenta, sesión 1), resolución de problemas (sesión 2), activación conductual (sesión 3) y fortalecer el apoyo social (sesión 4); no es adecuado con deterioro grave ni con riesgo inminente de suicidio. (fuentes: S160, S161, S162)
  - Valores: sessions: 5; minutes: 90; excluded: riesgo inminente de suicidio
- **F106** [B encontrado en fuente] La activación conductual es una psicoterapia breve estructurada contra la depresión; se describen cursos de 8 a 24 sesiones semanales y una versión breve (BATD) de 8 a 12 sesiones; sus componentes son registro de actividades, programación de actividades, trabajo sobre la evitación y metas basadas en valores. (fuentes: S163, S164)
  - Valores: sessions_range: 8, 24; batd_sessions: 8, 12
  - Nota: El detalle de duración viene de una fuente secundaria.
- **F107** [B encontrado en fuente] NASA financió un ensayo de 7 semanas con 135 participantes que probó el programa de TCC en línea myCompass solo y con apoyo diferido de terapeuta por texto o video grabado, con retardos de hasta unos 44 minutos para simular la comunicación a Marte. (fuentes: S165)
  - Valores: n: 135; weeks: 7; delay_max_min: 44
- **F108** [B encontrado en fuente] Una tesis de doctorado en un análogo concluyó que una teleterapia con 10 segundos de retardo era inadecuada y que un psicólogo entrenado como astronauta fue el que más redujo el estrés; evidencia preliminar de un solo estudio. (fuentes: S167, S166)
  - Valores: latency_s: 10
  - Nota: Solo evidencia preliminar.


# PARTE 2. Instrumentos (juegos, cuestionarios, datos pasivos)


## I01 · PVT-B (reflejos y atención) (M1)

- Tipo: juego_en_linea. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Tarea de tiempo de reacción simple: un contador de milisegundos aparece en un momento aleatorio y el astronauta toca, hace clic o pulsa espacio lo más rápido posible.
- Filas de la lista de 85 variables que cubre: 6, 7
- Parámetros: duration_s: 180; trials_approx: 60; isi_s: 1, 4; isi_note: El artículo y PsyToolkit no coinciden del todo en el rango entre estímulos; fijarlo y documentarlo.; lapse_ms: 355; false_start_ms: 100
- Métricas: Velocidad media de respuesta (1/TR) (principal); Número de lapsos; Falsos inicios; TR mediano (ms)
- Línea base: rule: mediana de las primeras 5 sesiones del propio astronauta; tag: D; premission: 5 a 10 sesiones en las 2 a 4 semanas previas; se recalcula al inicio de la misión
- Cadencia: ver SCH01 en la Parte 3
- Confusores a revisar (filas): 41, 57
- Respaldo fisiológico (filas): 14
- Licencia: status: mecanica_abierta; note: La mecánica es pública; se construye un juego propio.
- Advertencia: Validez convergente inadecuada frente al PVT de 10 min: usar como alerta relativa, no como medida absoluta (S43).
- Advertencia: Una web no tiene la precisión de temporización de un equipo de laboratorio: mismo dispositivo y comparar solo contra uno mismo [D].
- Advertencia: Umbrales de lapsos de otras tareas (11 y 20 en cribado de equipaje) no son para astronautas (S44).
- Evidencia: (fuentes: S14, S01, S15, S16, S08, S43, S44)

## I02 · DSST (sustitución de dígitos por símbolos) (M2)

- Tipo: juego_en_linea. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Una clave empareja símbolos con dígitos y se completan pares lo más rápido posible. Prioritaria: mejor predictor del desempeño de acoplamiento.
- Filas de la lista de 85 variables que cubre: 71
- Parámetros: minutes_median: 1.6
- Métricas: Tiempo de respuesta promedio; Exactitud
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH08 en la Parte 3
- Confusores a revisar (filas): 41, 58
- Respaldo fisiológico (filas): 14
- Licencia: status: paradigma_clasico; note: El software de Cognition es de NASA y Penn y no lo tenemos; se reimplementa con estímulos propios. Verificar qué estímulos y código se pueden reutilizar antes de copiar.
- Advertencia: Tiene efecto de práctica: randomizar estímulos y modelar la curva de aprendizaje; una mejora por práctica no es bienestar.
- Evidencia: (fuentes: S18, S23, S16, S19)

## I03 · Fractal 2-Back (memoria de trabajo) (M2)

- Tipo: juego_en_linea. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Se muestra una secuencia de imágenes y se pulsa cuando la actual coincide con la de dos pasos atrás.
- Filas de la lista de 85 variables que cubre: 71
- Parámetros: minutes_median: 2.0
- Métricas: Exactitud; Tiempo de respuesta; Sesgo de respuesta conservador (lo usó el modelo de acoplamiento)
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH08 en la Parte 3
- Confusores a revisar (filas): 41, 58
- Respaldo fisiológico (filas): 14
- Licencia: status: paradigma_clasico; note: Igual que I02.
- Advertencia: Efecto de práctica: formas alternas.
- Evidencia: (fuentes: S18, S23, S16)

## I04 · BART (globo de riesgo) (M2)

- Tipo: juego_en_linea. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Se infla un globo para ganar puntos; entre más se infla, más riesgo de que explote.
- Filas de la lista de 85 variables que cubre: 71
- Parámetros: minutes_median: 2.1
- Métricas: Globos inflados antes de cobrar; Explosiones
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH08 en la Parte 3
- Confusores a revisar (filas): 41, 58
- Respaldo fisiológico (filas): 14
- Licencia: status: paradigma_clasico; note: Igual que I02.
- Advertencia: Opcional: no está en la batería corta mensual propuesta.
- Evidencia: (fuentes: S18, S16)

## I05 · Reconocimiento de emociones faciales (M3)

- Tipo: juego_en_linea. Capa: senal_secundaria. Etiqueta: [B encontrado en fuente]
- Qué es: Fotos de adultos de tres cuartos de cabeza, una por una. El astronauta clasifica la expresión entre cinco opciones: feliz, triste, enojado, temeroso o sin emoción. La implementación descrita usa 20 caras y la dificultad cambia con la intensidad de la emoción.
- Filas de la lista de 85 variables que cubre: 71
- Parámetros: faces: 20; options: feliz, triste, enojado, temeroso, sin emoción; minutes_median: 1.7
- Métricas: Exactitud total; Exactitud por emoción; Tiempo de respuesta; Patrón de confusión (p. ej. temeroso con enojado)
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH08 en la Parte 3
- Confusores a revisar (filas): 57, 58
- Respaldo fisiológico (filas): 14
- Licencia: status: pendiente; note: Las caras tienen derechos: usar un banco de imágenes con licencia clara; está sin verificar qué banco y qué términos.
- Advertencia: Señal secundaria y ruidosa (consistencia de 71 %): apoya a otros módulos y no dispara una alerta por sí sola.
- Evidencia: (fuentes: S22, S20, S19, S21)

## I06 · Diario de sueño y somnolencia (M4)

- Tipo: cuestionario. Capa: senal. Etiqueta: [D decisión de diseño]
- Qué es: Tres momentos: al despertar, antes de la prueba de reflejos y antes de dormir. Ítems originales [D].
- Filas de la lista de 85 variables que cubre: 13
- Métricas: Duración del sueño; Latencia; Despertares; Eficiencia (derivada); Regularidad del horario de acostarse y levantarse; Diferencia entre sueño percibido y actigrafía, cuando exista
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH02 en la Parte 3
- Confusores a revisar (filas): 57, 58
- Respaldo fisiológico (filas): 14, 16
- Licencia: status: propio; note: Ítems propios. PSQI, KSS y Samn-Perelli: términos de uso sin verificar antes de copiar sus ítems.
- Advertencia: No hay protocolo de semáforo publicado; cualquier corte propio es [D].
- Preguntas: ver banco Q_SLEEP en la Parte 4
- Evidencia: (fuentes: S01, S03, S05, S24, S25, S26, S27)

## I07 · Check-in diario de ánimo, estrés y ansiedad (M5)

- Tipo: cuestionario. Capa: senal. Etiqueta: [D decisión de diseño]
- Qué es: Check-in corto de escalas 1 a 5. NASA usa un cuestionario breve diario con escala visual, Likert y preguntas abiertas; POMS y BDI-II tienen licencia de pago, así que se usan ítems propios.
- Filas de la lista de 85 variables que cubre: 8, 9, 10, 11, 12
- Métricas: Puntaje por ítem (1 a 5); Texto abierto opcional
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH03 en la Parte 3
- Confusores a revisar (filas): 10
- Respaldo fisiológico (filas): 15, 20, 21, 40
- Licencia: status: propio
- Advertencia: Los ítems 3, 4 y 6 se puntean al revés (una cifra alta es peor).
- Preguntas: ver banco Q_CHECKIN en la Parte 4
- Evidencia: (fuentes: S02, S06, S07, S27, S28)

## I08 · Ítem de seguridad (M5)

- Tipo: cuestionario. Capa: seguridad. Etiqueta: [D decisión de diseño]
- Qué es: Un ítem sobre pensamientos de hacerse daño. Cualquier respuesta distinta de 'No' dispara escalamiento inmediato.
- Cadencia: ver SCH03 en la Parte 3
- Licencia: status: propio
- Advertencia: La redacción y el protocolo deben revisarlos un psicólogo o psiquiatra antes de usarlo con personas reales.
- Preguntas: ver banco Q_SAFETY en la Parte 4
- Evidencia: (fuentes: S30)

## I09 · Escala semanal de ánimo y medidas positivas (M5)

- Tipo: cuestionario. Capa: senal. Etiqueta: [D decisión de diseño]
- Qué es: Resumen semanal del check-in más tres ítems propios de motivación, sentido y aburrimiento. Referencias licenciadas (POMS corto, BDI-II) solo como modelo de frecuencia.
- Filas de la lista de 85 variables que cubre: 11
- Cadencia: ver SCH05 en la Parte 3
- Licencia: status: propio; note: POMS 2 y BDI-II son de pago; PHQ-9 y GAD-7 serían de dominio público según conocimiento propio [P], por verificar.
- Advertencia: Los ítems son propios y sin validar.
- Preguntas: ver banco Q_POSITIVE en la Parte 4
- Evidencia: (fuentes: S02, S57, S10, S28, S29, S30)

## I10 · Cuestionario de equipo y conflicto (M6)

- Tipo: cuestionario. Capa: senal. Etiqueta: [D decisión de diseño]
- Qué es: Siete ítems originales de cohesión, conflicto, apoyo, privacidad y conexión. APEX sirve como modelo de longitud y frecuencia (menos de 18 ítems semanal).
- Filas de la lista de 85 variables que cubre: 73, 81
- Métricas: Puntaje por ítem (1 a 5)
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH05 en la Parte 3
- Confusores a revisar (filas): 19
- Respaldo fisiológico (filas): 73, 81
- Licencia: status: propio
- Advertencia: Ítems propios, sin validar.
- Preguntas: ver banco Q_TEAM en la Parte 4
- Evidencia: (fuentes: S07, S31, S32, S33, S02)

## I11 · Chequeo con compañero (M6)

- Tipo: tarea_guiada. Capa: senal. Etiqueta: [D decisión de diseño]
- Qué es: Tres preguntas guiadas de 5 minutos entre dos tripulantes. El programa registra que se hizo, no el contenido.
- Parámetros: minutes: 5; questions: 3; stores_content: False
- Cadencia: ver SCH04 en la Parte 3
- Licencia: status: propio
- Advertencia: Las tres preguntas guiadas no están redactadas aún.
- Evidencia: (fuentes: S07)

## I12 · Registro de eventos de la misión (M7)

- Tipo: registro. Capa: contexto. Etiqueta: [D decisión de diseño]
- Qué es: Una línea por día para explicar caídas de desempeño; alimenta los chequeos de 12 y 48 h.
- Filas de la lista de 85 variables que cubre: 19
- Cadencia: ver SCH10 en la Parte 3
- Licencia: status: propio
- Evidencia: (fuentes: S10)

## I13 · Tarea de decisión mensual (autonomía bajo retardo) (M7)

- Tipo: juego_en_linea. Capa: senal. Etiqueta: [D decisión de diseño]
- Qué es: Tarea de decisión adaptada de las de HERA, para comparar el resultado con los días de mayor retardo.
- Filas de la lista de 85 variables que cubre: 19
- Cadencia: ver SCH09 en la Parte 3
- Licencia: status: pendiente
- Estado: pendiente_de_definir
- Advertencia: La tarea exacta queda pendiente de definir y de verificar su acceso.
- Evidencia: (fuentes: S54, S55, S56)

## I14 · Escala de deseabilidad social SDS-17 (M7)

- Tipo: cuestionario. Capa: contexto. Etiqueta: [D decisión de diseño]
- Qué es: Aplicada una vez antes de la misión, junto a la línea base, para interpretar el sesgo de respuesta (Mars-500 la usó).
- Cadencia: ver SCH11 en la Parte 3
- Licencia: status: pendiente; note: Términos de uso sin verificar.
- Evidencia: (fuentes: S02, S51)

## I15 · Cuestionario de personalidad (IPIP-NEO) (M7)

- Tipo: cuestionario. Capa: contexto. Etiqueta: [B encontrado en fuente]
- Qué es: Standard Measures aplica un cuestionario de personalidad antes del vuelo (en papel, en cualquier momento). Se usa para línea base y contexto individual.
- Filas de la lista de 85 variables que cubre: 72
- Cadencia: ver SCH11 en la Parte 3
- Licencia: status: pendiente
- Evidencia: (fuentes: S03, S04)

## I16 · Cuestionario mensual de sueño y equipo (NASA) (M4)

- Tipo: cuestionario. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Un cuestionario después de despertar (calidad y cantidad de sueño) y otro antes de dormir (ánimo, cohesión, desempeño, habitabilidad). Permite comparar el sueño percibido con la actigrafía.
- Filas de la lista de 85 variables que cubre: 73
- Cadencia: ver SCH07 en la Parte 3
- Licencia: status: pendiente
- Evidencia: (fuentes: S03, S05)

## I17 · Actigrafía y luz (dato pasivo) (M4)

- Tipo: dato_pasivo. Capa: respaldo. Etiqueta: [B encontrado en fuente]
- Qué es: Reloj de muñeca con movimiento y luz, continuo en vuelo; Mars-500 registró un dato por minuto.
- Filas de la lista de 85 variables que cubre: 14, 15, 16
- Parámetros: sampling: 1 dato por minuto
- Cadencia: ver SCH12 en la Parte 3
- Licencia: status: hardware
- Evidencia: (fuentes: S03, S04, S02)

## I18 · Latencia de comunicación con Tierra (M6)

- Tipo: dato_pasivo. Capa: confusor. Etiqueta: [P por verificar]
- Qué es: Se registra el retardo del día junto a cada medición.
- Filas de la lista de 85 variables que cubre: 19
- Cadencia: ver SCH12 en la Parte 3
- Licencia: status: propio
- Evidencia: (fuentes: S36, S55)

## I19 · WHO-5 (bienestar) (M5)

- Tipo: cuestionario. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Cinco ítems sobre las últimas 2 semanas; bienestar general. Útil como resumen semanal o quincenal; un cambio de 10 puntos porcentuales es relevante para seguimiento.
- Filas de la lista de 85 variables que cubre: 11
- Métricas: Puntaje bruto 0 a 25 (principal); Porcentaje (×4)
- Línea base: rule: línea base personal premisión; tag: D
- Cadencia: ver SCH13 en la Parte 3
- Licencia: status: uso_libre_con_credito; note: El formulario es del Psychiatric Research Unit; PsyToolkit indica que se puede usar en investigación citando a los autores.
- Advertencia: Ventana de 2 semanas: lenta para alerta temprana; sirve como respaldo del check-in diario [D].
- Advertencia: Cortes de depresión (≤50 %) no están validados en astronautas.
- Preguntas: ver banco Q_WHO5 en la Parte 4
- Evidencia: (fuentes: S68, S69, S70)

## I20 · PHQ-9 (síntomas depresivos, 2 semanas) (M5)

- Tipo: cuestionario. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Nueve ítems; el ítem 9 conecta con el flujo de seguridad. Alternativa de dominio libre al BDI-II.
- Filas de la lista de 85 variables que cubre: 11
- Cadencia: ver SCH14 en la Parte 3
- Licencia: status: sin_permiso_requerido; note: Nota en el formulario (S67).
- Advertencia: Cortes de gravedad [P]; no usarlo solo ni como diagnóstico.
- Advertencia: Si PH9 > 0, escalar de inmediato (R05).
- Preguntas: ver banco Q_PHQ9 en la Parte 4
- Evidencia: (fuentes: S67)

## I21 · GAD-7 (ansiedad, 2 semanas) (M5)

- Tipo: cuestionario. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Siete ítems de ansiedad; complementa al PHQ-9 y al check-in diario.
- Filas de la lista de 85 variables que cubre: 11
- Cadencia: ver SCH14 en la Parte 3
- Licencia: status: sin_permiso_requerido
- Advertencia: Cortes de gravedad [P].
- Preguntas: ver banco Q_GAD7 en la Parte 4
- Evidencia: (fuentes: S67)

## I22 · SPANE (afecto positivo y negativo) (M5)

- Tipo: cuestionario. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: Doce ítems de frecuencia de emociones; la Antártida mostró que el afecto positivo es lo primero que cae y no rebota, por eso se vigila el SPANE-P.
- Filas de la lista de 85 variables que cubre: 11
- Métricas: SPANE-P (6 a 30); SPANE-N (6 a 30); SPANE-B (−24 a +24) (principal)
- Cadencia: ver SCH15 en la Parte 3
- Licencia: status: uso_libre_con_credito
- Advertencia: Ventana de 4 semanas del instrumento; usarla mensual como está, o semanal con la ventana acortada como decisión de diseño [D].
- Preguntas: ver banco Q_SPANE en la Parte 4
- Evidencia: (fuentes: S71, S72, S73, S75)

## I23 · Mental Health Checklist (MHCL) (M5)

- Tipo: cuestionario. Capa: senal. Etiqueta: [B encontrado en fuente]
- Qué es: 23 ítems validados en ambientes aislados, confinados y extremos (Antártida); tres subescalas de adaptación positiva, autorregulación deficiente y aprensión ansiosa. Candidato principal si se obtienen los ítems.
- Filas de la lista de 85 variables que cubre: 11
- Cadencia: ver SCH15 en la Parte 3
- Licencia: status: pendiente; note: Los ítems no aparecen en los resúmenes consultados; solicitar a los autores o leer el artículo completo.
- Estado: pendiente_de_obtener_items
- Advertencia: No se pudo ver el listado de ítems; no se reproduce aquí.
- Evidencia: (fuentes: S74, S75, S76)

## I24 · Carga de trabajo percibida (Raw TLX) (M7)

- Tipo: cuestionario. Capa: contexto. Etiqueta: [B encontrado en fuente]
- Qué es: Seis calificaciones 0 a 100 tras una tarea o al cierre de la jornada; separa un mal desempeño por sobrecarga de uno por ánimo.
- Filas de la lista de 85 variables que cubre: 19
- Métricas: Promedio de las 6 subescalas (principal)
- Cadencia: ver SCH16 en la Parte 3
- Confusores a revisar (filas): 19
- Licencia: status: publico_nasa; note: Desarrollado por NASA Ames; manual público (S98). Revisar términos de la app oficial si se usa.
- Preguntas: ver banco Q_TLX en la Parte 4
- Evidencia: (fuentes: S98, S99)

## I25 · ASQ (cribado de riesgo suicida, versión de referencia del ítem de seguridad) (M5)

- Tipo: cuestionario. Capa: seguridad. Etiqueta: [B encontrado en fuente]
- Qué es: Alternativa validada y de dominio público al ítem SF1. Cuatro preguntas de cribado y una aguda; define cribado positivo, agudo y no agudo.
- Cadencia: ver SCH03 en la Parte 3
- Licencia: status: dominio_publico
- Advertencia: Debe revisar y adaptar el flujo un psicólogo o psiquiatra antes de usarlo con personas (P25).
- Advertencia: No sustituye a un clínico.
- Preguntas: ver banco Q_ASQ en la Parte 4
- Evidencia: (fuentes: S63, S66)

## I26 · C-SSRS (seguimiento clínico de cribado) (M5)

- Tipo: tarea_guiada. Capa: seguridad. Etiqueta: [B encontrado en fuente]
- Qué es: Seis preguntas sí/no con triaje bajo, moderado y alto; se aplica por un clínico tras un ASQ positivo.
- Licencia: status: gratuito_condicionado; note: Gratuito para uso comunitario, sanitario y de investigación con fondos federales o sin fines de lucro (S66).
- Advertencia: No es autoencuesta; requiere clínico.
- Preguntas: ver banco Q_CSSRS en la Parte 4
- Evidencia: (fuentes: S65, S64, S66)

## I27 · PEBL: batería abierta como fuente de tareas cognitivas (M2)

- Tipo: juego_en_linea. Capa: referencia. Etiqueta: [B encontrado en fuente]
- Qué es: PEBL es software libre (GPL) con más de 100 pruebas y ejecución en navegador; sirve para estudiar implementaciones de DSST, n-back, BART, Iowa Gambling, Stroop y otras, o para correr tareas tal cual en pruebas del programa.
- Filas de la lista de 85 variables que cubre: 71
- Licencia: status: GPL-2.0; note: Revisar GPL si se copia código; las mecánicas se pueden reimplementar.
- Advertencia: En los resúmenes consultados no se confirmó que el PVT esté en la batería; verificar en el wiki de PEBL (P27).
- Evidencia: (fuentes: S82, S83, S84)

## I28 · PHQ-4 (cribado ultrabreve de ansiedad y depresión) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [B encontrado en fuente]
- Qué es: Cuatro ítems; primer filtro tras el selector de estado o cuando la señal pasiva cae.
- Cadencia: ver SCH17 en la Parte 3
- Licencia: status: uso_libre_probable; note: Mismos autores que PHQ-9 y GAD-7, que indican uso libre (S67); verificar la nota del PHQ-4 (P38).
- Advertencia: Cribado: no diagnostica.
- Preguntas: ver banco Q_PHQ4 en la Parte 4
- Evidencia: (fuentes: S132, S133)

## I29 · PCL-5 (síntomas de estrés postraumático, mes pasado) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [B encontrado en fuente]
- Qué es: Veinte ítems para tras un evento crítico o traumático (por ejemplo, una muerte a bordo) pasado al menos un mes.
- Cadencia: ver SCH18 en la Parte 3
- Licencia: status: dominio_publico; note: Centro Nacional de PTSD de EE. UU. (S134).
- Advertencia: Redacción de ítems por verificar contra el formulario oficial (P35).
- Advertencia: Elevado por depresión y duelo: interpretar con otros datos.
- Advertencia: Tamizaje; no diagnostica.
- Preguntas: ver banco Q_PCL5 en la Parte 4
- Evidencia: (fuentes: S134, S135, S136, S168)

## I30 · ISI (gravedad del insomnio) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [P por verificar]
- Qué es: Siete ítems; sirve cuando el sueño es el problema principal o cuando una escala de ánimo sale alta.
- Cadencia: ver SCH19 en la Parte 3
- Licencia: status: por_verificar; note: El formulario cita permiso de Morin (P31).
- Advertencia: Descartar CO2, ruido y horarios antes de leerlo como psicológico.
- Preguntas: ver banco Q_ISI en la Parte 4
- Evidencia: (fuentes: S137, S138, S168)

## I31 · BGQ (duelo complicado, 5 ítems) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [B encontrado en fuente]
- Qué es: Cribado breve de duelo que no se resuelve.
- Cadencia: ver SCH20 en la Parte 3
- Licencia: status: por_verificar; note: Derechos de los autores (P36).
- Advertencia: No usar antes de los 6 meses de la muerte.
- Advertencia: Umbral discrepante entre fuentes (P32).
- Preguntas: ver banco Q_BGQ en la Parte 4
- Evidencia: (fuentes: S124, S125, S126, S168)

## I32 · PG-13-R (trastorno de duelo prolongado, 13 ítems) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [B encontrado en fuente]
- Qué es: Escala alineada al DSM-5-TR; 30 o más sugiere el trastorno y exige evaluación clínica. Los 13 ítems no se obtuvieron en esta versión.
- Cadencia: ver SCH20 en la Parte 3
- Licencia: status: por_verificar
- Estado: items_aportados_por_el_equipo_sin_validar
- Advertencia: Ítems adaptados: no usar el corte 30 (P46).
- Advertencia: Solo tiene sentido a 6 meses (ICD-11) o 12 meses (DSM-5-TR) de la muerte.
- Preguntas: ver banco Q_PG13R en la Parte 4
- Evidencia: (fuentes: S120, S121, S122, S123, S168)

## I33 · AUDIT-C (consumo de alcohol, 3 ítems) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [B encontrado en fuente]
- Qué es: Tamizaje previo y posterior al vuelo, y en vuelo solo si hay acceso a alcohol.
- Cadencia: ver SCH21 en la Parte 3
- Licencia: status: por_verificar; note: AUDIT de la OMS (P37).
- Advertencia: El corte depende de la convención; citarla.
- Preguntas: ver banco Q_AUDITC en la Parte 4
- Evidencia: (fuentes: S139, S140, S141)

## I34 · MDQ (tamizaje de hipomanía o manía en la vida) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [B encontrado en fuente]
- Qué es: Trece ítems de sí/no más co-ocurrencia y deterioro; se aplica una vez antes de la misión o ante señales de elevación del ánimo.
- Cadencia: ver SCH22 en la Parte 3
- Licencia: status: por_verificar
- Estado: items_aportados_por_el_equipo_sin_validar
- Advertencia: Puede dar falsos positivos con TDAH, ansiedad o sustancias.
- Advertencia: Redacción adaptada: el corte de 7 no está validado con ella (P46).
- Preguntas: ver banco Q_MDQ en la Parte 4
- Evidencia: (fuentes: S142, S143, S168)

## I35 · Selector de estado (cómo me siento) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [D decisión de diseño]
- Qué es: Pantalla de entrada: la persona marca cómo se siente y el programa propone los formularios.
- Cadencia: ver SCH23 en la Parte 3
- Licencia: status: propio
- Advertencia: Siempre se ofrece; la persona puede ignorarlo.
- Preguntas: ver banco Q_STATE en la Parte 4
- Evidencia:

## I36 · Plan de seguridad (seis componentes) (M8)

- Tipo: plan. Capa: protocolo. Etiqueta: [D decisión de diseño]
- Qué es: Documento escrito con las palabras de la persona y un clínico.
- Cadencia: ver SCH24 en la Parte 3
- Licencia: status: propio; note: Redacción propia; el formulario oficial exige permiso de los autores para modificaciones (P34).
- Preguntas: ver banco Q_SAFETY_PLAN en la Parte 4
- Evidencia: (fuentes: S154, S155, S156)

## I37 · Check-in semanal de terapia (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [D decisión de diseño]
- Qué es: Preparación asíncrona de la sesión semanal y control de seguridad.
- Cadencia: ver SCH25 en la Parte 3
- Licencia: status: propio
- Preguntas: ver banco Q_THERAPY_CHECKIN en la Parte 4
- Evidencia: (fuentes: S160, S164)

## I38 · Lista de observación de un compañero (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [D decisión de diseño]
- Qué es: Para quien ve a otro tripulante mal; activa seguridad o emergencia conductual según lo que marque.
- Cadencia: ver SCH26 en la Parte 3
- Licencia: status: propio
- Preguntas: ver banco Q_CREW_OBSERVER en la Parte 4
- Evidencia:

## I39 · Preferencias de notificación y apoyo (previo a la misión) (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [D decisión de diseño]
- Qué es: Se completa antes del lanzamiento para saber cómo y quién debe dar una mala noticia.
- Cadencia: ver SCH27 en la Parte 3
- Licencia: status: propio
- Preguntas: ver banco Q_NOTIFY_PREF en la Parte 4
- Evidencia: (fuentes: S105, S110)

## I40 · Check diario de duelo (M8)

- Tipo: cuestionario. Capa: protocolo. Etiqueta: [D decisión de diseño]
- Qué es: Un minuto al día mientras el duelo es reciente.
- Cadencia: ver SCH28 en la Parte 3
- Licencia: status: propio
- Preguntas: ver banco Q_GRIEF_DAILY en la Parte 4
- Evidencia:


# PARTE 3. Cada cuánto se mide

- **SCH01** · I01: every_days: 2; slot: mañana, poco después de levantarse; same_device: True. Duración: 3 min. Intensificado: trigger: alerta_ambar, alerta_roja; rule: diario, mañana y en las 2 h previas a dormir, por 7 días. Extra: PVT-B antes y después de cambio de turno de sueño o caminata espacial [D decisión de diseño] (fuentes: S01, S02, S08)
- **SCH02** · I06: every_days: 1; slot: al despertar. Duración: 1 min. Intensificado: rule: igual [D decisión de diseño] (fuentes: S05, S13)
- **SCH03** · I07 + I08: every_days: 1; slot: tarde, en las 2 h previas a dormir. Duración: 1, 2 min. Intensificado: trigger: evento_estresante; rule: chequeo extra a las 12 y 48 h tras el evento [D decisión de diseño] (fuentes: S05, S07, S10)
- **SCH04** · I11: every_days: 7; slot: libre. Duración: 5 min. Intensificado: rule: cada 2 a 3 días [D decisión de diseño] (fuentes: S07)
- **SCH05** · I09 + I10: every_days: 7; same_weekday: True; slot: ánimo por la mañana; equipo y conflicto por la tarde. Duración: 5, 6 min. Intensificado: rule: se mantiene semanal y lo revisa una persona [D decisión de diseño] (fuentes: S02, S07)
- **SCH06** · I02 + I03: every_days: 30; slot: mañana, formas alternas. Duración: 6, 8 min. Intensificado: rule: cada 2 semanas. Nota: Batería cognitiva corta (DSST y 2-back); I04 y I05 opcionales. [D decisión de diseño] (fuentes: S03, S12)
- **SCH07** · I16: every_days: 30; slot: antes y después de dormir. Duración: 5 min. Intensificado: rule: igual [B encontrado en fuente] (fuentes: S03, S05)
- **SCH08** · I02-I05: every_days: 30; slot: mañana. Nota: Alias de SCH06 para cada prueba cognitiva individual. [D decisión de diseño] (fuentes: S03, S12)
- **SCH09** · I13: every_days: 30. Nota: Mensual, por definir. [D decisión de diseño] (fuentes: S54, S55)
- **SCH10** · I12: every_days: 1 [D decisión de diseño] (fuentes: S10)
- **SCH11** · I14 + I15: once: previo a la misión, junto a la línea base [D decisión de diseño] (fuentes: S02, S03)
- **SCH12** · I17 + I18: continuous: True [B encontrado en fuente] (fuentes: S02, S03)
- **SCH13** · I19: every_days: 7; slot: mañana, mismo día de la semana que la escala semanal de ánimo. Duración: 1 min. Intensificado: rule: cada 3 días en alerta ámbar o roja [D decisión de diseño] (fuentes: S68, S02)
- **SCH14** · I20 + I21: every_days: 14; slot: tarde. Duración: 3, 4 min. Intensificado: rule: semanal en alerta ámbar o roja. Nota: Ventana de las escalas es de 2 semanas; por eso quincenal. Mars-500 usó BDI-II semanal. [D decisión de diseño] (fuentes: S67, S02)
- **SCH15** · I22 + I23: every_days: 30; slot: mañana. Duración: 4, 6 min. Intensificado: rule: cada 2 semanas. Nota: MHCL se aplicó mensualmente en la Antártida (F49). [D decisión de diseño] (fuentes: S71, S75)
- **SCH16** · I24: every_days: 7; slot: tarde, tras la jornada. Duración: 1 min. Intensificado: rule: tras cada evento estresante o tarea larga [D decisión de diseño] (fuentes: S98)
- **SCH17** · I28: trigger: tras marcar ST02 o ST03 en el selector, o ante R07/R08; else_every_days: 14. Duración: 1 min. Nota: Si hay cribado positivo, PHQ-9 o GAD-7 el mismo día o a más tardar en 24 horas. [D decisión de diseño] (fuentes: S132)
- **SCH18** · I29: trigger: evento crítico o traumático ocurrido hace un mes o más y síntomas persistentes; repeat_every_days: 30. Duración: 5, 8 min. Nota: Antes de un mes se trata como reacción aguda (PFA y vigilancia). [D decisión de diseño] (fuentes: S134, S147)
- **SCH19** · I30: trigger: ST06, o PHQ-9/WHO-5 bajos con mal sueño; else_every_days: 30. Duración: 2 min [D decisión de diseño] (fuentes: S137)
- **SCH20** · I31 + I32: start_after_death_months: 6; repeat_every_days: 30; stop_or_review_at_months: 12. Duración: 2, 5 min. Nota: ICD-11 desde 6 meses; DSM-5-TR desde 12. [D decisión de diseño] (fuentes: S120, S125)
- **SCH21** · I33: when: antes del vuelo y después del vuelo; en vuelo solo si hay acceso a alcohol. Duración: 1 min [D decisión de diseño] (fuentes: S139)
- **SCH22** · I34: when: una vez en la evaluación previa a la misión o ante ST07. Duración: 4 min [D decisión de diseño] (fuentes: S142)
- **SCH23** · I35: every_days: 1; slot: tras el check-in diario, opcional. Duración: 0.5 min [D decisión de diseño]
- **SCH24** · I36: when: al crearse, tras cualquier cribado de seguridad positivo, y cada 4 semanas. Duración: 20, 45 min. Nota: Se completa con un clínico. [D decisión de diseño] (fuentes: S155)
- **SCH25** · I37: every_days: 7; slot: antes de la sesión semanal de terapia. Duración: 3 min [D decisión de diseño] (fuentes: S160)
- **SCH26** · I38: when: en cualquier momento por un compañero preocupado. Duración: 3 min [D decisión de diseño]
- **SCH27** · I39: when: antes del lanzamiento; revisión cada 90 días. Duración: 10 min [D decisión de diseño] (fuentes: S105, S110)
- **SCH28** · I40: phase1: diario los días 0 a 14; phase2: 3 veces por semana hasta el día 30; phase3: semanal después. Duración: 1 min. Nota: Intensidad inicial más alta por el riesgo de duelo tardío (F76). [D decisión de diseño] (fuentes: S102)

## Semana tipo

- Lunes: al despertar → sueño, somnolencia, PVT-B; tarde → check-in diario
- Martes: al despertar → sueño, somnolencia; tarde → check-in diario
- Miércoles: al despertar → sueño, somnolencia, PVT-B; tarde → check-in diario
- Jueves: al despertar → sueño, somnolencia; tarde → check-in diario
- Viernes: al despertar → sueño, somnolencia, PVT-B; tarde → check-in diario, cuestionario de equipo, registro de conflictos
- Sábado: al despertar → sueño, somnolencia; tarde → check-in diario, chequeo con compañero
- Domingo: al despertar → sueño, somnolencia, PVT-B, escala semanal de ánimo; tarde → check-in diario

## Reglas de uso

- Cada medición se puede posponer hasta 2 h sin perder su franja; incluso interrupciones breves pueden ser inaceptables durante operaciones críticas.
- Si una prueba se salta, no se rellena con un valor: queda vacía y el programa la cuenta aparte.
- El día de misión y la hora local de la nave, no la de la Tierra, son la referencia de todas las franjas.
- Cada medición se compara contra la misma franja del propio astronauta, no contra el promedio del día.
- Un día al mes, esa mañana se añade la batería cognitiva corta y, antes y después de dormir, el cuestionario completo de sueño y equipo.

## Intensificación

- Si alerta ámbar o roja: PVT-B diario, mañana y en las 2 h previas a dormir, y check-in diario por 7 días. 
- Si evento estresante (emergencia, mala noticia de casa): chequeo de ánimo y estrés a las 12 y 48 h. 
- Si cambio de turno de sueño o actividad extravehicular: PVT-B antes y después. 
- Si segunda mitad de la misión: más seguimiento como precaución. hipótesis, no regla: HI-SEAS lo sugiere (S11), Mars-500 no lo encontró (S02)

Presupuesto de tiempo: unos 5 min diarios en promedio. Tope razonable porque el tiempo de tripulación en vuelo es extremadamente limitado.


# PARTE 4. Bancos de preguntas (texto completo)


## Q_SLEEP (instrumento I06) [D decisión de diseño]

Origen: Ítems originales, no copiados de ningún instrumento.

**Momento: al despertar**
- **SL1** ¿A qué hora te acostaste y a qué hora crees que te dormiste? Nota: Dos horas.
- **SL2** ¿Cuántas veces despertaste durante la noche? Nota: Número entero.
- **SL3** ¿A qué hora despertaste definitivamente y a qué hora te levantaste? Nota: Dos horas.
- **SL4** ¿Cómo calificas la calidad de tu sueño? Escala 1 a 5 (1 = extremadamente buena; 5 = extremadamente mala)
- **SL5** ¿Tomaste alguna ayuda para dormir? Nota: Sí o no.

**Momento: antes de la prueba de reflejos**
- **SL6** Somnolencia ahora. Escala 1 a 9 (1 = extremadamente alerta; 9 = extremadamente somnoliento, luchando contra el sueño) Nota: Modelo: Karolinska; términos de uso sin verificar, por eso la redacción es propia.
- **SL7** Fatiga ahora. Escala 1 a 7 (1 = completamente alerta; 7 = completamente agotado) Nota: Modelo: Samn-Perelli; términos de uso sin verificar.

**Momento: antes de dormir**
- **SL8** ¿Qué tan cargado estuvo tu día? ¿Cuánta luz natural o brillante recibiste? Nota: Dos respuestas.

## Q_CHECKIN (instrumento I07) [D decisión de diseño]

Origen: Ítems originales; todos en escala de 1 a 5 con extremos descritos.
- **CK1** ¿Cómo está tu ánimo hoy? Escala 1 a 5 (1 = muy bajo; 5 = muy bueno)
- **CK2** ¿Cuántas ganas tienes de hacer tus tareas? Escala 1 a 5 (1 = ninguna; 5 = muchas)
- **CK3** ¿Qué nivel de estrés sientes? Escala 1 a 5 (1 = nada; 5 = muchísimo) [puntuación inversa]
- **CK4** ¿Cuánta preocupación o nerviosismo tienes? Escala 1 a 5 (1 = nada; 5 = muchísima) [puntuación inversa]
- **CK5** ¿Cuánta energía tienes? Escala 1 a 5 (1 = agotado; 5 = con energía)
- **CK6** ¿Qué tan cargado está tu trabajo? Escala 1 a 5 (1 = holgado; 5 = desbordado) [puntuación inversa]
- **CK7** ¿Qué tan clara sientes tu mente? Escala 1 a 5 (1 = nublada; 5 = muy clara)
- **CK8** ¿Hay algo que te preocupe hoy? [respuesta abierta] Nota: Opcional.

## Q_SAFETY (instrumento I08) [D decisión de diseño]

Origen: Propuesta; requiere revisión de psicólogo o psiquiatra.
- **SF1** ¿Has pensado que sería mejor no estar vivo o en hacerte daño? Escala 0 a 2 (0 = No; 1 = Algunos días; 2 = Muchos días)

Escalation: Cualquier respuesta distinta de 'No' dispara escalamiento inmediato, sin esperar tendencia ni juego.

## Q_POSITIVE (instrumento I09) [D decisión de diseño]

Origen: Ítems propios, sin validar; escala de 1 a 5.
- **PO1** ¿Qué tan motivado te sentiste esta semana con tu trabajo? Escala 1 a 5
- **PO2** ¿Sentiste que lo que haces tiene sentido para la misión? Escala 1 a 5
- **PO3** ¿Qué tan aburrido o monótono te pareció tu día a día? Escala 1 a 5 [puntuación inversa]

## Q_TEAM (instrumento I10) [D decisión de diseño]

Origen: Ítems originales; escala de 1 a 5 con extremos descritos.
- **TM1** ¿Sientes que la tripulación funciona como equipo hoy? Escala 1 a 5 Nota: Cohesión.
- **TM2** ¿Hubo tensión o conflicto con alguien de la tripulación? Escala 1 a 5 [más alto es peor] Nota: Conflicto; una cifra alta es peor.
- **TM3** ¿Alguien de la tripulación te apoyó cuando lo necesitaste? Escala 1 a 5 Nota: Apoyo.
- **TM4** ¿Tuviste suficiente espacio y tiempo a solas? Escala 1 a 5 Nota: Privacidad.
- **TM5** ¿Pudiste comunicarte con tu familia o amigos esta semana? Escala 1 a 5 Nota: Conexión con casa.
- **TM6** ¿Sientes que Control de Misión te entiende y te apoya? Escala 1 a 5 Nota: Conexión con Tierra.
- **TM7** ¿Qué podría mejorar la convivencia? [respuesta abierta] Nota: Opcional.

## Q_WHO5 (instrumento I19) [B encontrado en fuente]

Origen: WHO-5 (1998). Ítems oficiales; ver F58. Las respuestas 5 a 0 de 'todo el tiempo' a 'nunca' (más alto es mejor).
- **W1** Me he sentido alegre y de buen humor. Escala 0 a 5 (0 = nunca; 5 = todo el tiempo)
- **W2** Me he sentido tranquilo y relajado. Escala 0 a 5 (0 = nunca; 5 = todo el tiempo)
- **W3** Me he sentido activo y con vigor. Escala 0 a 5 (0 = nunca; 5 = todo el tiempo)
- **W4** Me desperté sintiéndome fresco y descansado. Escala 0 a 5 (0 = nunca; 5 = todo el tiempo)
- **W5** Mi vida diaria ha estado llena de cosas que me interesan. Escala 0 a 5 (0 = nunca; 5 = todo el tiempo)

Scoring: suma 0 a 25; ×4 para porcentaje; bruto <13 o porcentaje ≤50 sugiere evaluar más

Note: Traducción literal propia al español; para uso real conviene usar la versión oficial validada en español (verificar P20).

## Q_PHQ9 (instrumento I20) [B encontrado en fuente]

Origen: PHQ-9; sin permiso requerido (S67). 'En las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?'
- **PH1** Poco interés o placer en hacer las cosas. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH2** Sentirse decaído, deprimido o sin esperanza. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH3** Dificultad para dormirse o mantenerse dormido, o dormir demasiado. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH4** Sentirse cansado o con poca energía. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH5** Poco apetito o comer en exceso. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH6** Sentirse mal consigo mismo, o que es un fracaso o que ha decepcionado a su familia o a sí mismo. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH7** Dificultad para concentrarse, por ejemplo al leer o ver televisión. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH8** Moverse o hablar tan despacio que otros lo notarían; o lo contrario, estar tan inquieto que se mueve mucho más de lo normal. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **PH9** Pensamientos de que estaría mejor muerto o de hacerse daño de alguna manera. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días) Nota: Seguridad: cualquier respuesta mayor que 0 dispara el flujo de seguridad (I08/I25), sin esperar tendencia.
- Pregunta de seguimiento: Si marcó algún problema, ¿qué tan difícil le ha resultado hacer su trabajo, atender su casa o llevarse bien con otras personas? Opciones: nada difícil, algo difícil, muy difícil, extremadamente difícil

Note: Traducción literal propia; la versión oficial en español existe y debe preferirse (P20). Los cortes de gravedad son [P] (F57).

## Q_GAD7 (instrumento I21) [B encontrado en fuente]

Origen: GAD-7; sin permiso requerido (S67).
- **GA1** Sentirse nervioso, ansioso o con los nervios de punta. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **GA2** No poder parar o controlar la preocupación. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **GA3** Preocuparse demasiado por diferentes cosas. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **GA4** Dificultad para relajarse. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **GA5** Estar tan inquieto que es difícil quedarse quieto. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **GA6** Molestarse o irritarse con facilidad. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **GA7** Sentir miedo, como si algo terrible pudiera pasar. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)

Note: Traducción literal propia (P20). Cortes habituales 5, 10 y 15 (F57, [P]).

## Q_SPANE (instrumento I22) [B encontrado en fuente]

Origen: SPANE (Diener et al., 2009/2010); uso libre con crédito (S71).
Enunciado: Piense en lo que ha estado haciendo y experimentando durante el período indicado. ¿Con qué frecuencia ha sentido lo siguiente?
- **SP1** Positivo Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-P
- **SP2** Negativo Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-N
- **SP3** Bueno Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-P
- **SP4** Malo Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-N
- **SP5** Agradable Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-P
- **SP6** Desagradable Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-N
- **SP7** Feliz Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-P
- **SP8** Triste Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-N
- **SP9** Con miedo Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-N
- **SP10** Alegre Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-P
- **SP11** Enojado Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-N
- **SP12** Satisfecho Escala 1 a 5 (1 = muy raramente o nunca; 2 = raramente; 3 = a veces; 4 = a menudo; 5 = muy a menudo o siempre) Nota: SPANE-P

Scoring: SPANE-P = SP1+SP3+SP5+SP7+SP10+SP12 (6 a 30); SPANE-N = SP2+SP4+SP6+SP8+SP9+SP11 (6 a 30); SPANE-B = P − N (−24 a +24)

Note: Traducción literal propia de los adjetivos; existe adaptación validada en español que debe preferirse (P20).

## Q_ASQ (instrumento I25) [B encontrado en fuente]

Origen: ASQ del NIMH, de dominio público (S63). Redacción traducida de forma literal; debe validarla un clínico.
- **AQ1** En las últimas semanas, ¿ha deseado estar muerto? Escala 0 a 1 (0 = No; 1 = Sí)
- **AQ2** En las últimas semanas, ¿ha sentido que usted o su familia estarían mejor si usted estuviera muerto? Escala 0 a 1 (0 = No; 1 = Sí)
- **AQ3** En la última semana, ¿ha tenido pensamientos de quitarse la vida? Escala 0 a 1 (0 = No; 1 = Sí)
- **AQ4** ¿Alguna vez ha intentado quitarse la vida? Si es sí, ¿cómo y cuándo? Escala 0 a 1 (0 = No; 1 = Sí)
- **AQ5** ¿Está teniendo pensamientos de quitarse la vida ahora mismo? Escala 0 a 1 (0 = No; 1 = Sí) Nota: Solo se pregunta si alguna de AQ1 a AQ4 es sí.

Scoring: Sí en AQ1 a AQ4, o negarse a contestar = cribado positivo. AQ5 sí = positivo agudo; AQ5 no = positivo no agudo.

Escalation: Agudo: avisar de inmediato; no dejar solo hasta que un clínico evalúe. No agudo: evaluación breve de seguridad por un clínico. En la nave: usar el reporte asíncrono y un compañero de apoyo [D].

## Q_CSSRS (instrumento I26) [B encontrado en fuente]

Origen: C-SSRS, versión de cribado reciente (S65); para clínicos. Preguntas de seguimiento del ASQ positivo.
- **CS1** ¿Ha deseado estar muerto o poder dormirse y no despertar? Escala 0 a 1 (0 = No; 1 = Sí)
- **CS2** ¿Ha tenido realmente pensamientos de quitarse la vida? Escala 0 a 1 (0 = No; 1 = Sí)
- **CS3** ¿Ha estado pensando en cómo podría hacerlo? Escala 0 a 1 (0 = No; 1 = Sí) Nota: Solo si CS2 es sí.
- **CS4** ¿Ha tenido esos pensamientos con alguna intención de actuar? Escala 0 a 1 (0 = No; 1 = Sí) Nota: Solo si CS2 es sí.
- **CS5** ¿Ha empezado a elaborar o ha elaborado los detalles de cómo quitarse la vida? ¿Pensaba llevar a cabo ese plan? Escala 0 a 1 (0 = No; 1 = Sí) Nota: Solo si CS2 es sí.
- **CS6** ¿Ha hecho, empezado a hacer o preparado algo para terminar con su vida? Si es sí: ¿fue en los últimos 3 meses? Escala 0 a 1 (0 = No; 1 = Sí)

Scoring: Ver puntos de triaje (bajo, moderado, alto) en el formulario oficial (S65).

Note: Pensado para que lo aplique un clínico, no como autoencuesta. Se incluye como referencia del flujo de seguimiento.

## Q_TLX (instrumento I24) [B encontrado en fuente]

Origen: NASA-TLX, Raw TLX (S98, S99). Definiciones y redacción propias (P20).
- **TL1** Demanda mental: ¿cuánta actividad mental y perceptiva exigió la tarea? Escala 0 a 100 (0 = muy bajo; 100 = muy alto)
- **TL2** Demanda física: ¿cuánta actividad física exigió la tarea? Escala 0 a 100 (0 = muy bajo; 100 = muy alto)
- **TL3** Demanda temporal: ¿qué tanta presión de tiempo sintió? Escala 0 a 100 (0 = muy bajo; 100 = muy alto)
- **TL4** Desempeño: ¿qué tan exitoso cree que fue? (0 perfecto, 100 fracaso) Escala 0 a 100 (0 = perfecto; 100 = fracaso)
- **TL5** Esfuerzo: ¿cuánto tuvo que esforzarse para lograr ese nivel? Escala 0 a 100 (0 = muy bajo; 100 = muy alto)
- **TL6** Frustración: ¿qué tan inseguro, desanimado, irritado o estresado se sintió? Escala 0 a 100 (0 = muy bajo; 100 = muy alto)

Scoring: Raw TLX = promedio de los 6 puntajes (0 a 100); mostrar también las subescalas

## Q_STATE (instrumento I35) [D decisión de diseño]

Origen: Selector de estado propio: la persona marca cómo se siente y el programa propone el formulario adecuado. Ítems originales.
Enunciado: ¿Qué describe mejor cómo te sientes en estos días? Marca todo lo que aplique.
- **ST01** Estoy bien, sin molestias importantes. Nota: Opción de cierre: no se asigna formulario. Cadencia rutinaria.
- **ST02** Me siento decaído, sin ganas o sin interés en las cosas. Nota: Formulario: PHQ-4 y, si es positivo, PHQ-9 (Q_PHQ4, Q_PHQ9) y WHO-5.
- **ST03** Me siento nervioso, preocupado o tenso. Nota: Formulario: PHQ-4 y, si es positivo, GAD-7.
- **ST04** Vi o viví algo muy fuerte y me sigue afectando (recuerdos, pesadillas, evitar cosas). Nota: Si pasó menos de un mes: apoyo (PFA) y seguimiento; si pasó un mes o más: PCL-5 (Q_PCL5).
- **ST05** Perdí a alguien (en la misión o en la Tierra). Nota: Activa el protocolo de duelo que corresponda; formularios: Q_GRIEF_DAILY, PHQ-9, ISI y, pasado el tiempo, BGQ y PG-13-R.
- **ST06** Duermo mal o me siento agotado. Nota: Formulario: ISI (Q_ISI) y escalas de somnolencia del módulo de sueño; revisar confusores.
- **ST07** Me siento con mucha energía, duermo poco sin sentir cansancio, o muy irritable. Nota: Formulario: MDQ si no se aplicó antes; aviso al equipo clínico si hay deterioro (R21).
- **ST08** Tengo la carga de trabajo o la presión muy alta. Nota: Formulario: NASA-TLX (Q_TLX) y check-in diario.
- **ST09** Me siento solo o distante de la tripulación o de mi familia. Nota: Formularios del módulo de cohesión y aislamiento (M6) y SPANE.
- **ST10** Estoy tomando alcohol u otras sustancias más de lo que quisiera (si hay acceso). Nota: Formulario: AUDIT-C (Q_AUDITC); en la nave solo si hay acceso.
- **ST11** He pensado que sería mejor no estar vivo o en hacerme daño. Nota: Pasa directo al flujo de seguridad: ASQ (Q_ASQ). No depende de otro formulario ni de la hora de la cadencia (R12).

Scoring: Una persona puede marcar varias opciones. El programa propone los formularios en el orden de prioridad: seguridad (ST11) primero, luego evento reciente (ST04, ST05), luego el resto. Nunca se rechaza una opción marcada.

Note: Si la persona no marca nada y la señal pasiva cae (R01, R07, R08), el programa pregunta de forma neutra y ofrece el selector.

## Q_PHQ4 (instrumento I28) [B encontrado en fuente]

Origen: PHQ-4 (Kroenke, Spitzer, Williams y Löwe, 2009); el PHQ-9 y el GAD-7 de los mismos autores indican uso libre (S67). Traducción literal propia, sin validar (P20).
Enunciado: En las últimas 2 semanas, ¿con qué frecuencia te han molestado los siguientes problemas?
- **P41** Sentirse nervioso, ansioso o con los nervios de punta. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **P42** No poder dejar de preocuparse o no poder controlar la preocupación. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **P43** Poco interés o placer en hacer las cosas. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)
- **P44** Sentirse decaído, deprimido o sin esperanza. Escala 0 a 3 (0 = nada; 1 = varios días; 2 = más de la mitad de los días; 3 = casi todos los días)

Scoring: Suma 0 a 12: 0-2 ninguna, 3-5 leve, 6-8 moderada, 9-12 grave. Ansiedad = P41 + P42; depresión = P43 + P44; 3 o más en una subescala es positivo y lleva a GAD-7 o PHQ-9 (F88).

Note: Es un cribado; un puntaje alto no es diagnóstico.

## Q_PCL5 (instrumento I29) [P por verificar]

Origen: Ítems aportados por el equipo (Lui) el 14-nov-2026; son adaptaciones en español, no el texto oficial de cada instrumento, y no están validadas (P46). Sustituye la redacción de memoria de la v3 inicial. Clústeres por posición: B = 1 a 5, C = 6 y 7, D = 8 a 14, E = 15 a 20 (F89).
Enunciado: Durante el último mes, ¿cuánto te han molestado las siguientes situaciones?
- **PC01** ¿Has tenido recuerdos involuntarios de una experiencia muy difícil? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC02** ¿Has tenido sueños desagradables relacionados con esa experiencia? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC03** ¿Has sentido como si estuvieras reviviendo esa experiencia? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC04** ¿Has sentido malestar emocional intenso al recordar lo sucedido? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC05** ¿Has experimentado reacciones físicas al encontrarte con algo que te recuerda esa experiencia? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC06** ¿Has intentado evitar pensamientos relacionados con lo sucedido? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC07** ¿Has evitado personas, lugares o situaciones que te recuerdan lo ocurrido? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC08** ¿Has tenido dificultades para recordar partes importantes de esa experiencia? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC09** ¿Has desarrollado creencias negativas sobre ti mismo, otras personas o el mundo? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC10** ¿Te has culpado a ti mismo o a otras personas por lo sucedido? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC11** ¿Has experimentado emociones negativas intensas como miedo, culpa, vergüenza o enojo? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC12** ¿Has perdido interés en actividades que antes disfrutabas? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC13** ¿Te has sentido distante o desconectado de otras personas? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC14** ¿Has tenido dificultades para experimentar emociones positivas? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC15** ¿Te has sentido irritable o has tenido reacciones de enojo? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC16** ¿Has realizado actividades que podrían ponerte en riesgo? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC17** ¿Has sentido que necesitas estar constantemente alerta? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC18** ¿Te has sobresaltado fácilmente ante ruidos o movimientos inesperados? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC19** ¿Has tenido dificultades para concentrarte? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)
- **PC20** ¿Has tenido problemas para dormir? Escala 0 a 4 (0 = nada; 1 = un poco; 2 = moderadamente; 3 = bastante; 4 = extremadamente)

Scoring: Suma 0 a 80. 31 a 33 o más: PTSD probable (cortes validados 28 a 37). Regla de clústeres: B>=1, C>=1, D>=2, E>=2 con ítems de 2 o más (F89). Cambio de 5 a 10 puntos es fiable y 10 o más se considera respuesta (F90).

Escalation: Aplicar solo si el evento ocurrió hace un mes o más (antes se considera estrés agudo). Un puntaje alto exige entrevista clínica; no diagnostica. Las preguntas 6 y 7 se salteaban si la persona no quiere revivir el evento: se permite 'prefiero no responder'.

Note: El PCL-5 se ancla a un evento concreto: registrar cuál y mantenerlo igual en los seguimientos.

## Q_ISI (instrumento I30) [P por verificar]

Origen: Ítems aportados por el equipo (Lui) el 14-nov-2026; son adaptaciones en español, no el texto oficial de cada instrumento, y no están validadas (P46). Ventana: últimas dos semanas, según el archivo del equipo. El ítem 3 está redactado como frecuencia y no como gravedad, a diferencia del formulario que revisamos; términos de uso del ISI sin verificar (P31).
Enunciado: Considera tus hábitos de sueño durante las últimas dos semanas.
- **IS01** ¿Qué tan difícil te ha resultado quedarte dormido? Escala 0 a 4 Nota: Extremos de la escala 0 a 4 por definir (P46).
- **IS02** ¿Qué tan difícil te ha resultado permanecer dormido durante la noche? Escala 0 a 4 Nota: Extremos de la escala 0 a 4 por definir (P46).
- **IS03** ¿Con qué frecuencia te has despertado antes de la hora deseada? Escala 0 a 4 Nota: Extremos de la escala 0 a 4 por definir (P46).
- **IS04** ¿Qué tan satisfecho estás con tu patrón de sueño actual? Escala 0 a 4 Nota: Extremos de la escala 0 a 4 por definir (P46).
- **IS05** ¿En qué medida consideras que tus problemas de sueño son perceptibles para otras personas? Escala 0 a 4 Nota: Extremos de la escala 0 a 4 por definir (P46).
- **IS06** ¿Qué tan preocupado o angustiado te encuentras por tus dificultades para dormir? Escala 0 a 4 Nota: Extremos de la escala 0 a 4 por definir (P46).
- **IS07** ¿En qué medida tus problemas de sueño interfieren con tus actividades diarias? Escala 0 a 4 Nota: Extremos de la escala 0 a 4 por definir (P46).

Scoring: Suma 0 a 28: 0-7 sin insomnio clínico, 8-14 subumbral, 15-21 moderado, 22-28 grave (F91).

Note: Ventana temporal: unos formularios piden el último mes y otros las últimas dos semanas (P33); usar dos semanas para coherencia con PHQ-9 y GAD-7 [D]. Antes de leer un puntaje alto como psicológico, descartar CO2, ruido y horarios (R09).

## Q_BGQ (instrumento I31) [B encontrado en fuente]

Origen: Ítems aportados por el equipo (Lui) el 14-nov-2026; son adaptaciones en español, no el texto oficial de cada instrumento, y no están validadas (P46). Sustituye la traducción literal anterior; los cinco ítems corresponden a los del BGQ revisados (S124, S125). Derechos de Shear y Essock por confirmar (P36).
Enunciado: Piensa en la pérdida de una persona importante para ti.
- **BG01** ¿Te resulta difícil aceptar la muerte de esa persona? Escala 0 a 2 (0 = nada; 1 = algo; 2 = mucho)
- **BG02** ¿El dolor por su pérdida sigue interfiriendo significativamente en tu vida? Escala 0 a 2 (0 = nada; 1 = algo; 2 = mucho)
- **BG03** ¿Experimentas pensamientos o imágenes relacionadas con su muerte que te resultan perturbadores? Escala 0 a 2 (0 = nada; 1 = algo; 2 = mucho)
- **BG04** ¿Evitas lugares, objetos, conversaciones o actividades que te recuerdan a esa persona? Escala 0 a 2 (0 = nada; 1 = algo; 2 = mucho)
- **BG05** ¿Te has sentido aislado o desconectado de otras personas desde su fallecimiento? Escala 0 a 2 (0 = nada; 1 = algo; 2 = mucho)

Scoring: Suma 0 a 10. 4 o más sugiere duelo complicado según la hoja del VA (5 o más en una hoja anterior); derivar a especialista y, si se desea, aplicar el ICG de 19 ítems (F84).

Note: Se aplica a partir de los 6 meses (ICD-11) o 12 meses (DSM-5-TR) de la muerte (F82). Antes de eso, un puntaje alto es duelo agudo esperado y no se interpreta como trastorno.

## Q_AUDITC (instrumento I33) [B encontrado en fuente]

Origen: AUDIT-C (Bush et al., 1998), parte del AUDIT de la OMS. Formulado con frases propias basadas en las preguntas descritas en S139 y S141; el AUDIT es de la OMS y de uso amplio, términos por confirmar (P37).
Enunciado: Sobre tu consumo de alcohol en el último año:
- **AU1** ¿Con qué frecuencia tomas una bebida con alcohol? Escala 0 a 4 (0 = nunca; 1 = una vez al mes o menos; 2 = 2 a 4 veces al mes; 3 = 2 a 3 veces por semana; 4 = 4 o más veces por semana)
- **AU2** ¿Cuántas bebidas con alcohol tomas en un día típico en que bebes? Escala 0 a 4 (0 = 1 o 2; 1 = 3 o 4; 2 = 5 o 6; 3 = 7 a 9; 4 = 10 o más) Nota: La opción '0 bebidas' también puntúa 0.
- **AU3** ¿Con qué frecuencia tomas seis o más bebidas en una sola ocasión? Escala 0 a 4 (0 = nunca; 1 = menos de una vez al mes; 2 = mensualmente; 3 = semanalmente; 4 = a diario o casi a diario)

Scoring: Suma 0 a 12. Positivo con 4 o más en hombres y 3 o más en mujeres (convención de atención primaria de EE. UU.); el VA usa 5 o más. Citar siempre la convención (F92).

Note: En misiones sin acceso a alcohol tiene sentido solo antes y después del vuelo, porque la ventana es de un año [D].

## Q_GRIEF_DAILY (instrumento I40) [D decisión de diseño]

Origen: Check-in breve de duelo propio, 1 minuto, escala 1 a 5; ítems originales.
- **GD1** Hoy, ¿qué tan intensa fue la tristeza o el dolor por la pérdida? Escala 1 a 5 (1 = muy leve; 5 = muy intensa) [puntuación inversa]
- **GD2** Hoy, ¿cuánto pudiste concentrarte en tus tareas? Escala 1 a 5 (1 = nada; 5 = mucho)
- **GD3** Hoy, ¿cuánto te cuesta estar con otras personas? Escala 1 a 5 (1 = nada; 5 = muchísimo) [puntuación inversa]
- **GD4** Anoche, ¿cómo dormiste? Escala 1 a 5 (1 = muy mal; 5 = muy bien)
- **GD5** Hoy, ¿tuviste algún momento de calma o de recuerdos buenos? Nota: Sí o no.
- **GD6** ¿Hay algo que quieras que el equipo de apoyo sepa hoy? [respuesta abierta]

Scoring: No hay puntaje diagnóstico. Se vigila la tendencia: GD1 sin bajar tras 2 semanas o aumento de GD3 y empeoramiento del sueño pasa a PHQ-9 e ISI y aviso al equipo clínico [D].

Note: El duelo agudo no es un trastorno: este check mide cómo va el proceso, no busca etiquetarlo.

## Q_NOTIFY_PREF (instrumento I39) [D decisión de diseño]

Origen: Formulario previo a la misión propio, inspirado en la práctica descrita (F64, F69). Ítems originales.
- **NP1** Si ocurre una emergencia grave o la muerte de un familiar mientras estás en misión, ¿quieres ser notificado en el momento o prefieres esperar a un momento acordado? Nota: Opciones: de inmediato / al terminar la tarea crítica en curso / esperar a la siguiente conferencia privada.
- **NP2** ¿Quién prefieres que te dé la noticia? Nota: Opciones: cirujano de vuelo o psicólogo conductual / un familiar acompañado por el equipo médico / el comandante con el equipo médico.
- **NP3** ¿Con quién quieres poder hablar justo después, y en qué canal? [respuesta abierta]
- **NP4** ¿Qué personas en la Tierra deben avisar a la agencia primero si algo le pasa a un familiar tuyo? [respuesta abierta]
- **NP5** ¿Quieres participar a distancia en velatorios, funerales o rituales? ¿Qué tradición religiosa o cultural debe respetarse? [respuesta abierta]
- **NP6** ¿Hay algo que te ayude cuando estás mal y algo que te molesta que hagan los demás? [respuesta abierta]
- **NP7** Si fallece alguien de la tripulación, ¿quién te gustaría que te acompañara y qué te ayudaría a ti en esos días? [respuesta abierta]
- **NP8** ¿Autorizas que el comandante y el cirujano de vuelo sepan estas preferencias? Nota: Sí o no; se guardan como información privada (V1 6011).

Note: Se llena antes del lanzamiento y se revisa cada 3 meses y ante un cambio familiar importante [D].

## Q_THERAPY_CHECKIN (instrumento I37) [D decisión de diseño]

Origen: Check-in semanal de terapia propio; combina escalas libres (WHO-5, PHQ-9, GAD-7) con ítems originales.
- **TC1** Del 1 al 10, ¿cómo ha estado tu semana en general? Escala 1 a 10 (1 = muy mala; 10 = muy buena)
- **TC2** ¿Qué fue lo más difícil de la semana? [respuesta abierta]
- **TC3** ¿Qué salió mejor de lo esperado? [respuesta abierta]
- **TC4** ¿Hiciste la práctica acordada la sesión pasada? ¿Qué pasó? Nota: Opciones: sí completa / parcialmente / no; más texto opcional.
- **TC5** Del 1 al 10, ¿cuánto te ayudó esa práctica? Escala 1 a 10
- **TC6** ¿Qué problema concreto quieres trabajar hoy? [respuesta abierta]
- **TC7** Ítem de seguridad: ¿has pensado en que sería mejor no estar vivo o en hacerte daño? Nota: Se pregunta en cada sesión; cualquier respuesta distinta de 'no' pasa a Q_ASQ y al protocolo de emergencia suicida (R12).

Scoring: Cada 2 semanas se añade PHQ-9 y GAD-7; cada semana WHO-5. Cambio fiable de PHQ-9 y GAD-7: usar RCI con la fiabilidad del instrumento (F33).

Note: Se completa antes de la sesión, de forma asíncrona, y se resume al terapeuta para ahorrar tiempo del canal.

## Q_SAFETY_PLAN (instrumento I36) [D decisión de diseño]

Origen: Redacción propia de los seis componentes del plan de seguridad, que se completa junto con un clínico (F102). No es el formulario oficial de Stanley y Brown (P34).
- **SPL1** Señales de alarma: ¿qué pensamientos, situaciones, estados de ánimo o conductas me avisan de que empiezo a estar en crisis? [respuesta abierta]
- **SPL2** Estrategias propias: ¿qué puedo hacer yo solo para distraerme o calmarme (ejercicio, respiración, música, escribir, tarea concreta)? [respuesta abierta]
- **SPL3** Personas y lugares de la nave que me distraen: ¿con quién o dónde me siento mejor, aunque no hable de lo que pasa? [respuesta abierta]
- **SPL4** Personas a quienes puedo pedir ayuda: ¿a quién de la tripulación o de la Tierra puedo contarle cómo estoy? [respuesta abierta]
- **SPL5** Profesionales y canales de crisis: ¿cómo contacto al cirujano de vuelo, al psicólogo conductual y a la línea de crisis, y qué hago si hay retardo? [respuesta abierta]
- **SPL6** Hacer el ambiente más seguro: ¿qué medios de autolesión están a mi alcance en la nave y qué cambios acordamos para dificultar el acceso? [respuesta abierta]
- **SPL7** Razones para vivir y para seguir: ¿qué me importa y me mantiene? [respuesta abierta]
- **SPL8** ¿Qué pueden hacer los demás para ayudarme cuando me vean mal? [respuesta abierta]

Scoring: No se puntúa. Se revisa en cada recaída, tras cualquier cribado positivo y cada 4 semanas [D].

Note: Se escribe con las palabras de la persona. Debe poder verla en cualquier momento sin conexión.

## Q_CREW_OBSERVER (instrumento I38) [D decisión de diseño]

Origen: Lista de observación para un compañero preocupado, propia; ítems originales basados en conductas observables, sin inferir diagnósticos.
- **CO1** ¿Notaste cambios en cómo come, duerme o cumple con sus tareas? Nota: Sí o no; describir.
- **CO2** ¿Se aisló, evita comer o convivir con la tripulación? Nota: Sí o no; describir.
- **CO3** ¿Ha hablado de no querer seguir, de ser una carga o de no volver? Nota: Sí o no. Cualquier sí pasa al flujo de seguridad y se avisa de inmediato.
- **CO4** ¿Ha regalado o ha puesto en orden sus cosas de forma extraña, o se ha despedido de forma inusual? Nota: Sí o no. Cualquier sí pasa al flujo de seguridad.
- **CO5** ¿Habla o se comporta de forma confusa, ve u oye cosas que otros no, o está muy desconfiado? Nota: Sí o no. Cualquier sí activa el protocolo de emergencia conductual.
- **CO6** ¿Está muy agitado, irritable, agresivo o corre riesgos que ponen en peligro a otros? Nota: Sí o no. Cualquier sí activa el protocolo de emergencia conductual.
- **CO7** ¿Qué hizo usted y qué le respondió? [respuesta abierta]

Note: Lo llena un compañero; se envía de forma privada al equipo clínico. No es una acusación: es información de cuidado.

## Q_MDQ (instrumento I34) [P por verificar]

Origen: Ítems aportados por el equipo (Lui) el 14-nov-2026; son adaptaciones en español, no el texto oficial de cada instrumento, y no están validadas (P46). Estructura: 13 ítems sí/no y 2 complementarios, como el MDQ de Hirschfeld et al. (S142); la redacción difiere de la original.
Enunciado: Responde si alguna vez has experimentado los siguientes estados o comportamientos (Sí / No).
- **MQ01** ¿Has tenido períodos en los que te has sentido tan bien o eufórico que otras personas han notado un cambio en ti? Nota: Sí o no.
- **MQ02** ¿Has estado tan irritable que has discutido o tenido conflictos con otras personas? Nota: Sí o no.
- **MQ03** ¿Has tenido una autoestima mucho más alta de lo habitual? Nota: Sí o no.
- **MQ04** ¿Has necesitado dormir mucho menos sin sentir cansancio? Nota: Sí o no.
- **MQ05** ¿Has hablado mucho más de lo habitual? Nota: Sí o no.
- **MQ06** ¿Has experimentado pensamientos acelerados? Nota: Sí o no.
- **MQ07** ¿Te has distraído fácilmente? Nota: Sí o no.
- **MQ08** ¿Has tenido un aumento inusual de energía? Nota: Sí o no.
- **MQ09** ¿Has estado mucho más activo de lo habitual? Nota: Sí o no.
- **MQ10** ¿Has tenido más ganas de socializar o relacionarte con otras personas? Nota: Sí o no.
- **MQ11** ¿Has mostrado un interés inusual por actividades placenteras o arriesgadas? Nota: Sí o no.
- **MQ12** ¿Has realizado gastos o tomado decisiones impulsivas? Nota: Sí o no.
- **MQ13** ¿Has tenido dificultades para controlar tus comportamientos durante esos períodos? Nota: Sí o no.
- **MQ14** ¿Varios de estos cambios ocurrieron durante el mismo período? Nota: Sí o no. No suma al total de 13.
- **MQ15** ¿Cuánto afectaron estos cambios tu trabajo, estudios, relaciones o vida cotidiana? Nota: Opciones del MDQ publicado: ningún problema, leve, moderado, grave (S143). No suma al total.

Scoring: Positivo si 7 o más de los ítems MQ01 a MQ13 son sí, MQ14 es sí y MQ15 es moderado o grave (F93).

Note: El corte de 7 y su sensibilidad y especificidad se publicaron con el texto original; con esta redacción adaptada no están validados (P46). Un positivo exige entrevista clínica y no es diagnóstico.

## Q_PG13R (instrumento I32) [P por verificar]

Origen: Ítems aportados por el equipo (Lui) el 14-nov-2026; son adaptaciones en español, no el texto oficial de cada instrumento, y no están validadas (P46). Marcada como 'exploratoria' en el archivo del equipo. El PG-13-R oficial tiene 13 ítems y un corte de 30 (S120), pero la escala de respuesta y la redacción de este archivo no coinciden necesariamente con las originales.
Enunciado: Piensa en una persona importante que haya fallecido y en cómo te has sentido desde entonces.
- **PG01** ¿Con qué frecuencia sientes un anhelo intenso por la persona fallecida? Nota: Escala de respuesta por definir (P46).
- **PG02** ¿Con qué frecuencia piensas en esa persona? Nota: Escala de respuesta por definir (P46).
- **PG03** ¿Experimentas dolor emocional intenso relacionado con su ausencia? Nota: Escala de respuesta por definir (P46).
- **PG04** ¿Sientes que una parte importante de tu identidad cambió después de la pérdida? Nota: Escala de respuesta por definir (P46).
- **PG05** ¿Te cuesta aceptar que esa persona haya fallecido? Nota: Escala de respuesta por definir (P46).
- **PG06** ¿Sientes dificultad para volver a confiar en otras personas? Nota: Escala de respuesta por definir (P46).
- **PG07** ¿Experimentas sentimientos de vacío desde su fallecimiento? Nota: Escala de respuesta por definir (P46).
- **PG08** ¿Te resulta difícil continuar con tus actividades habituales? Nota: Escala de respuesta por definir (P46).
- **PG09** ¿Has sentido que la vida perdió parte de su significado? Nota: Escala de respuesta por definir (P46).
- **PG10** ¿Evitas situaciones que te recuerdan a la persona fallecida? Nota: Escala de respuesta por definir (P46).
- **PG11** ¿Te cuesta imaginar un futuro sin esa persona? Nota: Escala de respuesta por definir (P46).
- **PG12** ¿Sientes que te has distanciado de otras personas desde la pérdida? Nota: Escala de respuesta por definir (P46).
- **PG13** ¿Consideras que el duelo ha afectado significativamente tu bienestar? Nota: Escala de respuesta por definir (P46).

Scoring: NO aplicar el corte de 30 a estos ítems: ese corte es del instrumento original (F82). Con esta versión se usa solo como exploración y tendencia, y cualquier resultado alto pasa a un clínico.

Note: Además, el diagnóstico de duelo prolongado exige tiempo desde la muerte (6 o 12 meses) y deterioro funcional; el archivo del equipo no incluye esos criterios, que ya están en F82 y R20.


# PARTE 5. Interpretación y alertas

La alarma inicial es una caída sostenida frente a la línea base personal. Ningún manual de NASA publica un semáforo con estos cortes: todas las reglas son diseño propio [D].

## Orden de evaluación

- 1. Excluir causas ambientales o fisiológicas (CO₂ desde 2,3 mmHg, ruido NC-40 en sueño o 67 dBA en 24 h, iluminación, sueño de 6 h o menos).
- 2. Evaluar caída sostenida y cambio fiable por módulo (RCI, EWMA).
- 3. Combinar módulos y respaldo; no alertar por una sola señal blanda.
- 4. El ítem de seguridad (SF1, ASQ o PHQ-9 ítem 9) se evalúa aparte y siempre prevalece.

## Reglas

- **R01** (nivel ambar) [D decisión de diseño]: si type: sustained_decline_vs_personal_baseline; min_sessions: 3; scope: juegos_o_encuestas → Alerta inicial. Acción: Revisar confusores y sugerir una contramedida.
- **R02** (nivel firme) [D decisión de diseño]: si type: decline_plus_backup_drop; backup: sueño, actividad → Alerta firme. Acción: Sugerir avisar a un compañero y programar apoyo.
- **R03** (nivel causa_ambiental) [D decisión de diseño]: si type: decline_with_confounder; confounders: CO2_alto, ruido_fuerte, sueño_5h_o_menos; sleep_h_le: 5 → Probable causa fisiológica o ambiental. Acción: Corregir primero esa causa; no interpretar como ánimo. Nota: El corte de 5 h tiene respaldo (F17); los de CO₂ y ruido no tienen valor numérico en las fuentes. (fuentes: S21)
- **R04** (nivel roja) [D decisión de diseño]: si type: marked_persistent_or_multi_module_decline → Alerta roja. Acción: Avisar a un compañero o al comandante y pedir apoyo psicológico.
- **R05** (nivel inmediata) [D decisión de diseño]: si type: safety_item; item: SF1; answer_not: 0 → Escalamiento inmediato. Acción: Mensaje de apoyo, avisar ya a un compañero o al comandante, contactar cirujano de vuelo o apoyo psicológico; con retardo, generar el reporte asíncrono de inmediato; sin esperar tendencia. Revisión: Revisión por psicólogo o psiquiatra antes de usar con personas reales.
- **R06** (nivel no_es_bienestar) [D decisión de diseño]: si type: improvement_from_practice → No es bienestar. Acción: Modelar la curva de aprendizaje y no premiar la mejora de rendimiento.
- **R07** (nivel ambar) [D decisión de diseño]: si type: reliable_change_decline; method: RCI con ajuste de práctica (F33, F34); scope: tarea_cognitiva_o_escala_corta → Caída fiable frente a la propia línea base. Acción: Revisar confusores y sugerir contramedida. Nota: Requiere fiabilidad test-retest y DE de la línea base; sin ellas, usar R01. (fuentes: S85, S86)
- **R08** (nivel ambar) [D decisión de diseño]: si type: ewma_or_cusum_signal; input: promedio diario del check-in (CK1, CK3, CK4, CK5, CK7); min_baseline_days: 14 → Cambio sostenido de media en el check-in. Acción: Igual que R01. Nota: Parámetros (λ, límites) por calibrar con datos simulados (P28). (fuentes: S88, S89)
- **R09** (nivel causa_ambiental) [D decisión de diseño]: si type: decline_with_environment_flag; co2_mmHg_ge: 2.3; noise_sleep_nc_gt: 40; noise_dBA_24h_ge: 67 → Posible causa ambiental. Acción: Corregir ambiente primero; marcar los datos del período. Nota: Los valores son referencias de síntomas, no un semáforo validado; ver F39 y F41. (fuentes: S93, S95, S96)
- **R10** (nivel firme) [D decisión de diseño]: si type: withdrawal_from_communication; signal: caída fuerte de mensajes o conversaciones con Tierra y de participación en chequeos; reference: SIRIUS-19: 320 a 34 conversaciones → Desapego o aislamiento; también puede ser autonomía sana. Acción: Contrastar con cohesión de equipo (I10) y ánimo antes de alertar. Nota: En SIRIUS la caída vino con más cohesión (F52); no alertar por ella sola. (fuentes: S100)
- **R11** (nivel firme) [D decisión de diseño]: si type: positive_affect_decline; measure: SPANE-P o adaptación positiva (MHCL) o CK1/CK2 en descenso lineal → Pérdida gradual de afecto positivo. Acción: Sugerir actividades de savoring y reevaluación, y avisar al equipo de apoyo. Nota: En la Antártida el afecto positivo bajó de forma lineal sin rebote (F50). (fuentes: S75)
- **R12** (nivel inmediata) [D decisión de diseño]: si type: asq_or_phq9_item9; asq_positive: True; phq9_item9_gt: 0 → Cribado de riesgo suicida positivo. Acción: Escalamiento inmediato según tipo (agudo o no agudo) como en R05. Revisión: Revisión por psicólogo o psiquiatra antes de uso real. (fuentes: S63, S67)
- **R13** (nivel ambar) [B encontrado en fuente]: si type: phq4_subscale; ge: 3 → Cribado ultrabreve positivo de ansiedad o depresión. Acción: Aplicar GAD-7 o PHQ-9 en 24 horas. (fuentes: S132, S133)
- **R14** (nivel ambar) [B encontrado en fuente]: si type: phq9_total; range: 5, 9 → Depresión leve. Acción: Espera vigilante: repetir PHQ-9 en 2 semanas, revisar confusores y ofrecer autoayuda. (fuentes: S128)
- **R15** (nivel firme) [B encontrado en fuente]: si type: phq9_total; range: 10, 14 → Depresión moderada probable. Acción: Aviso al equipo clínico y plan de tratamiento; iniciar sesiones semanales (protocolo de terapia). Nota: La acción de iniciar terapia semanal es decisión nuestra [D]. (fuentes: S128, S129)
- **R16** (nivel roja) [B encontrado en fuente]: si type: phq9_total; ge: 15 → Depresión moderadamente grave o grave. Acción: Contacto clínico en 24 horas; evaluar riesgo de seguridad; a partir de 20 derivación urgente. Nota: Plazo de 24 horas decisión nuestra [D]. (fuentes: S128)
- **R17** (nivel firme) [B encontrado en fuente]: si type: gad7_total; ge: 10 → Ansiedad moderada a grave. Acción: Evaluación clínica adicional; a partir de 15 clasificar como grave; revisar sueño, CO2 y carga. (fuentes: S130, S131)
- **R18** (nivel firme) [B encontrado en fuente]: si type: pcl5_total; ge: 31; event_age_months_ge: 1 → Estrés postraumático probable. Acción: Entrevista clínica; si el evento tiene menos de un mes, solo vigilar y dar apoyo (PFA). Nota: Cortes entre 28 y 37 según propósito. (fuentes: S134, S146)
- **R19** (nivel ambar) [B encontrado en fuente]: si type: isi_total; ge: 15 → Insomnio clínico moderado o grave. Acción: Descartar ambiente y horario, ofrecer plan de sueño, avisar si dura más de 2 semanas. (fuentes: S137)
- **R20** (nivel firme) [B encontrado en fuente]: si type: grief_screen; bgq_ge: 4; pg13r_ge: 30; months_since_death_ge: 6 → Duelo que no se resuelve. Acción: Derivación a especialista en duelo o psicólogo conductual; vigilar depresión, PTSD y riesgo de seguridad. Nota: Umbral de BGQ discrepante (P32). (fuentes: S125, S120, S121)
- **R21** (nivel firme) [B encontrado en fuente]: si type: mdq_positive; symptoms_ge: 7; cooccurrence: True; impairment: moderado o grave → Posible historia de hipomanía o manía. Acción: Entrevista clínica; no interpretar una depresión sola ni proponer activación o cambios de sueño sin revisar. (fuentes: S142, S143)
- **R22** (nivel ambar) [B encontrado en fuente]: si type: auditc_total; ge_men: 4; ge_women: 3 → Consumo de riesgo de alcohol. Acción: Intervención breve o evaluación con el psicólogo conductual. (fuentes: S139, S140)
- **R23** (nivel inmediata) [D decisión de diseño]: si type: event; name: muerte de un tripulante → Activar protocolo de duelo por muerte a bordo. Acción: Ejecutar GP1 y vigilar a todos los sobrevivientes. (fuentes: S102, S103)
- **R24** (nivel firme) [D decisión de diseño]: si type: event; name: notificación de muerte de un familiar en la Tierra → Activar protocolo de duelo por muerte de un familiar. Acción: Ejecutar GP2. (fuentes: S105, S104, S111)
- **R25** (nivel inmediata) [D decisión de diseño]: si type: observer_report; items: CO5, CO6 → Posible emergencia conductual (confusión, alucinaciones, agitación, agresión). Acción: Ejecutar GP4 (emergencia conductual) y contacto inmediato con cirujano de vuelo. (fuentes: S148, S152)
- **R26** (nivel inmediata) [D decisión de diseño]: si type: observer_report; items: CO3, CO4 → Señales de riesgo suicida observadas por un compañero. Acción: Ejecutar el flujo de emergencia suicida (GP3). (fuentes: S154)

## Reglas blandas

- Si además bajan sueño y actividad, la confianza sube.
- Antes de interpretar emocionalmente una caída de reflejos se revisan sueño y ambiente.
- El módulo de emociones (I05) no dispara alerta por sí solo.

## Reporte asíncrono

Con retardo de comunicación, resumen estructurado para el cirujano de vuelo o el equipo de apoyo psicológico. Campos: mission_day, status_by_module_vs_baseline, sleep_hours_last_7_days, reflex_trend, safety_item_answer, astronaut_notes, countermeasures_used.

## Contramedidas

- nasa_iss [B encontrado en fuente]: conferencias psicológicas y familiares privadas, conectividad, evaluación cognitiva, paquetes de cuidado, manejo de fatiga, mejoras de hábitat.
- autocuidado_general [P por verificar]: respiración guiada, anclaje, diario breve, chequeo con compañero, higiene de sueño, ejercicio. Psicología conductual general, no de un manual de NASA.

## Política de visibilidad

Estado: pendiente. Definir qué ve el médico de vuelo, qué ve el equipo y qué ve solo el astronauta, y mostrárselo antes de que empiece a usar el programa (F24, F25). El ítem de seguridad no depende de esta regla.


# PARTE 6. Métodos de análisis


## A01 · Línea base personal [D decisión de diseño]

- Description: Mediana y dispersión de las primeras sesiones del propio astronauta (previas y de las 2 semanas iniciales); se recalcula al inicio de la misión.
- Why: No hay normas fiables para astronautas y la variabilidad entre personas es grande (F51).
- Evidencia: (fuentes: S01, S77)

## A02 · Índice de cambio fiable con ajuste de práctica [B encontrado en fuente]

- Limitation: La r y el efecto de práctica deben salir de datos con tareas parecidas; no los tenemos para nuestras versiones web.
- Formula: SEM: DE_base·√(1−r); SEdiff: √(SEM1² + SEM2²); limites_90: ±1,64·SEdiff; limites_95: ±1,96·SEdiff; ajuste_practica: sumar la media M2−M1 a los límites
- Inputs required: DE de la línea base, fiabilidad test-retest r por tarea, media del efecto de práctica
- Evidencia: (fuentes: S85, S86, S87)

## A03 · Gráficos EWMA y CUSUM sobre promedios diarios [B encontrado en fuente]

- Description: Control estadístico de procesos: avisa cuando la media se corre de forma sostenida respecto a la línea base.
- Limitation: Desarrollados en pacientes con muestreo frecuente; parámetros por calibrar (P28).
- Inputs required: promedio diario por ítem o compuesto, al menos unas 2 semanas de línea base
- Evidencia: (fuentes: S88, S89)

## A04 · Comparación en la misma franja horaria [D decisión de diseño]

- Description: Cada medición se compara contra mediciones del mismo astronauta a la misma hora del reloj de la nave, por los ritmos circadianos de PVT, ánimo y somnolencia.
- Evidencia: (fuentes: S09, S01)

## A05 · Descartar confusores primero [D decisión de diseño]

- Description: Antes de interpretar emocionalmente, revisar sueño (≤6 h), CO₂, ruido, carga de trabajo (TLX) y turnos.
- Thresholds ref: F38, F39, F41, F44
- Evidencia:

## A06 · Modelo de curva de aprendizaje [B encontrado en fuente]

- Description: En las primeras sesiones de cada tarea la mejora es práctica y no bienestar; se ajusta una curva y se mide el residuo.
- Evidencia: (fuentes: S08, S87)

## A07 · Combinación de señales [D decisión de diseño]

- Description: Alerta firme si coinciden una caída fiable en tarea, otra en encuesta y una señal de respaldo (sueño o actividad) sin confusor; una sola señal blanda no basta.
- Evidencia:

## A08 · Datos faltantes y cumplimiento [B encontrado en fuente]

- Description: Esperar cerca de 79 a 82 % de cumplimiento; tratar la caída de cumplimiento como una señal en sí (en la ISS fue 78,9 %). Los saltos quedan vacíos y se cuentan aparte.
- Reference: expected_compliance_pct: 79, 82; iss_reaction_selftest_pct: 78.9
- Evidencia: (fuentes: S90, S91, S01)

## A09 · Carga de ítems por aviso [B encontrado en fuente]

- Description: Diseño de cada aviso diario: unos 8 a 10 ítems como máximo; el número de avisos por día no predijo el cumplimiento en el metaanálisis.
- Evidencia: (fuentes: S90, S91)


# PARTE 7. Umbrales de confusores (para descartar causas no emocionales)


## co2

- Síntomas desde: 2.3
- Fatiga y cabeza llena: 2.3, 2.7
- Pasos omitidos: 2.7, 3.0
- Cefalea: 3.0, 3.4
- Límite operativo ISS: 3.0, 4.0
- SMAC 180 días: 5.3
- Unit: mmHg
- Conversion: 1 kPa ≈ 7,5 mmHg; el 0,7 a 1 kPa del listado del equipo ≈ 5,3 a 7,5 mmHg (nivel de peligro)
- Note: No hay un umbral validado para 'bajón de ánimo'; son referencias de síntomas.
- Evidencia: (fuentes: S92, S93, S94)

## noise

- NC-50 trabajo: 50 dB @ 1,5 kHz
- NC-40 sueño: 40
- Límite de peligro: 85 dBA
- Protección auditiva con promedio 24 h: ≥67 dBA
- Recomendado para dormir: NC-30
- Módulos ISS: 56 a 69 dBA
- Evidencia: (fuentes: S95, S96, S97, S62)

## sleep

- Recomendado en adultos: >=7 h
- En la ISS, velocidad de respuesta menor con: <=6 h
- Estrés, cansancio y somnolencia mayores con: <6 h
- Todos los estados somáticos peor con: <5 h
- Note: El >=7 h y la subestimación de la propia somnolencia vienen de conocimiento propio [P] (AASM/SRS, Van Dongen 2003); falta enlace verificado.
- Evidencia: (fuentes: S01, S21)

## workload

- Note: Carga de trabajo alta (TLX) con sueño corto explica caídas sin invocar ánimo.
- Instrument: I24


# PARTE 8. Evidencia de misiones y análogos


## Mars-500 (520 días)

- Alteraciones del sueño e hipoquinesia
- PVT-B 2×/semana, POMS-SF semanal, BDI-II, VAS
- Evidencia: (fuentes: S02, S46)

## SIRIUS-19 (120 días)

- Comunicación con Control de Misión: 320 a 34 conversaciones
- Aumento de cohesión
- Retardo de 5 min añadido
- Evidencia: (fuentes: S100, S101)

## Antártida (MHCL, 9 meses, n = 110)

- Afecto positivo baja linealmente sin rebote
- Autorregulación deficiente y síntomas físicos suben
- Sin efecto del tercer cuarto
- Evidencia: (fuentes: S75, S74)

## HERA (confinamiento y restricción de sueño)

- Cognition detecta pérdida de vigilancia y rendimiento con una noche sin dormir
- Evidencia: (fuentes: S41, S50)

## HI-SEAS (tres análogos)

- Estrés biocomportamental; seguimiento en segunda mitad como hipótesis
- Evidencia: (fuentes: S11)

## ISS Reaction Self-Test

- 24 astronautas; cumplimiento 78,9 %
- Sueño ≤6 h en 34,9 % de las noches; peor velocidad de respuesta
- Estrés mayor en el cuarto cuarto
- Evidencia: (fuentes: S01)

## Revisión de cognición en vuelo

- Evidencia no concluyente de déficits; mayor variabilidad
- Evidencia: (fuentes: S77, S78)

## Estándares NASA relevantes


**NASA-STD-3001 Vol. 1 (salud conductual)**
- V1 6002 PMC rutinarias
- V1 6010 PPC rutinarias
- V1 6004 programa de apoyo
- V1 3001 recertificación anual
- V2 7071 privacidad en misiones >30 días
- Sin frecuencia numérica.
- Evidencia: (fuentes: S61)

**NASA-STD-3001 Vol. 2 (acústica)**
- V2 6078 ruido continuo NC-50
- V2 6079 ruido continuo en sueño
- V2 6080 ruido intermitente
- V2 6081 alarmas
- Evidencia: (fuentes: S62)

**HFBP: brechas de evidencia**
- Los umbrales para monitoreo semiautónomo (BH-201) aún no están definidos.
- Evidencia: (fuentes: S40)


# PARTE 9. Protocolo de seguridad (propuesta para revisión clínica)

Estado: propuesta_para_revision_clinica. Etiqueta: [D decisión de diseño]

Opciones de cribado: SF1 (propio); ASQ (fuente S63); PHQ9_item9 (fuente S67)

1. Cuando ASQ AQ1 a AQ4 con algún sí, rechazo a responder, o PHQ-9 ítem 9 > 0, o SF1 distinto de 'No' → Preguntar AQ5 (ahora mismo).
2. Cuando AQ5 sí (agudo) → Mensaje de apoyo, avisar ya al comandante o compañero y al cirujano de vuelo o apoyo psicológico; no dejar solo; reporte asíncrono inmediato.
3. Cuando AQ5 no (no agudo) → Evaluación breve de seguridad por un clínico; aplicar C-SSRS de cribado (I26).
4. Cuando C-SSRS riesgo moderado o alto → Plan de seguridad y vigilancia según protocolo clínico de la misión.
- Advertencia: Flujos tomados de documentos hospitalarios; su adaptación a una nave es decisión nuestra.
- Advertencia: Debe revisarlo y aprobarlo un psicólogo o psiquiatra antes de uso real (P25).
- Advertencia: El programa no diagnostica ni sustituye a un profesional.


# PARTE 10. Referencia de escalas y pruebas

- **PSQI**: Calidad del sueño del último mes, 7 componentes. Formato: cuestionario. Licencia: sin verificar.
- **Karolinska (KSS)**: Somnolencia en el momento. Formato: 9 puntos. Licencia: sin verificar; validez y sensibilidad documentadas [B]. (fuentes: S79, S80, S81)
- **Samn-Perelli**: Fatiga en el momento. Formato: 7 puntos. Licencia: sin verificar.
- **Epworth (ESS)**: Somnolencia diurna. Formato: 8 ítems. Licencia: sin verificar.
- **Índice de severidad del insomnio (ISI)**: Insomnio. Formato: 7 ítems. Licencia: sin verificar.
- **POMS 2**: Estados de ánimo. Formato: estándar; 37 ítems en Standard Measures. Licencia: de pago, MHS propietario; licencia de investigación por solicitud [B]. (fuentes: S29, S06)
- **BDI-II**: Síntomas depresivos. Formato: 21 ítems; semanal en Mars-500. Licencia: copyright, se paga por copia [B]. (fuentes: S30)
- **PANAS**: Afecto positivo y negativo. Formato: lista. Licencia: sin verificar.
- **VAS**: Estrés y fatiga. Formato: escala visual de 11 puntos en el Reaction Self-Test. Licencia: formato genérico, sin licencia propia.
- **PHQ-9**: Depresión. Formato: 9 ítems; 2 semanas. Licencia: sin permiso requerido (nota del formulario) [B]. (fuentes: S67)
- **GAD-7**: Ansiedad. Formato: 7 ítems; 2 semanas. Licencia: sin permiso requerido (nota del formulario) [B]. (fuentes: S67)
- **WHO-5**: Bienestar, 2 semanas. Formato: 5 ítems, 0 a 5. Licencia: uso libre citando a los autores [B]. (fuentes: S68, S70)
- **SPANE**: Afecto positivo y negativo, 4 semanas. Formato: 12 ítems, 1 a 5. Licencia: uso libre con crédito, sin pedir permiso [B]. (fuentes: S71)
- **NASA-TLX (Raw)**: Carga de trabajo. Formato: 6 subescalas, 0 a 100. Licencia: manual público de NASA Ames [B]. (fuentes: S98)
- **ASQ**: Cribado de riesgo suicida. Formato: 4 + 1 ítems sí/no. Licencia: dominio público [B]. (fuentes: S63)
- **C-SSRS (cribado)**: Riesgo suicida con triaje. Formato: 6 ítems sí/no. Licencia: gratuito en contextos comunitarios, sanitarios y de investigación [B]. (fuentes: S66)
- **MHCL**: Adaptación positiva, autorregulación, aprensión. Formato: 23 ítems. Licencia: por verificar [B]. (fuentes: S74)
- **PHQ-4**: Ansiedad y depresión ultrabreve. Formato: 4 ítems, 0 a 3. Licencia: por confirmar [P]. (fuentes: S132)
- **PCL-5**: Síntomas de estrés postraumático. Formato: 20 ítems, 0 a 4; mes pasado. Licencia: dominio público [B]. (fuentes: S134)
- **ISI**: Gravedad del insomnio. Formato: 7 ítems, 0 a 4. Licencia: por verificar [P]. (fuentes: S137)
- **Brief Grief Questionnaire**: Duelo complicado. Formato: 5 ítems, 0 a 2. Licencia: por verificar [P]. (fuentes: S125, S124)
- **PG-13-R**: Duelo prolongado (DSM-5-TR). Formato: 13 ítems; corte 30. Licencia: por verificar [P]. (fuentes: S120)
- **AUDIT-C**: Consumo de alcohol. Formato: 3 ítems, 0 a 12. Licencia: por verificar [P]. (fuentes: S139)
- **MDQ**: Historia de hipomanía o manía. Formato: 13 ítems sí/no + 2. Licencia: por verificar [P]. (fuentes: S142)

## Candidatas sin enlace verificado

- PSS-10 (estrés percibido): candidata; permiso por Mapi ePROVIDE según investigación previa [P por verificar]
- TILS (soledad, 3 ítems; Hughes 2004): candidata; validación en español (Trucharte 2021) según investigación previa [P por verificar]
- NIMH ASQ en español: se incluye en inglés/traducción literal; versión oficial en español por verificar [P por verificar]
- DASS-21, MEQ, ESS, PANAS, C-SSRS completa: no investigadas a fondo (ISI y PCL-5 pasaron a v3) [P por verificar]

## Batería Cognition de NASA/Penn (referencia)

- Motor Praxis (MP): Velocidad sensoriomotora; 0.4 min; uso: Sí, como calibración de la interfaz
- Visual Object Learning (VOLT): Aprendizaje y memoria espacial; 1.7 min; uso: Después
- Fractal 2-Back (F2B): Memoria de trabajo; 2.0 min; uso: Sí
- Abstract Matching (AM): Abstracción; 1.8 min; uso: Después
- Line Orientation (LOT): Orientación espacial; 1.2 min; uso: Después
- Emotion Recognition (ERT): Identificación emocional; 1.7 min; uso: Módulo 3
- Matrix Reasoning (MRT): Razonamiento abstracto; 2.1 min; uso: Opcional
- Digit Symbol Substitution (DSST): Exploración compleja y rastreo visual; 1.6 min; uso: Sí, prioritaria
- Balloon Analog Risk (BART): Decisiones de riesgo; 2.1 min; uso: Opcional
- Psychomotor Vigilance (PVT): Atención vigilante; 3.2 min; uso: Módulo 1

## Bancos de caras (módulo de emociones) [P por verificar]

De la investigación previa, sin enlace verificado en esta versión (P21).
- CFD: no comercial y sin redistribución
- RaFD: uso de investigación con acuerdo
- KDEF: uso de investigación con acuerdo
- NimStim: uso de investigación con acuerdo
- FACES: uso de investigación con acuerdo
- Implicación: Para el hackathon, usar caras propias o generadas y marcar el módulo 3 como señal secundaria (nunca dispara alerta sola).


# PARTE 11. Variables de la lista de 85 que usa el programa

- Fila 6 · Tiempo de reacción PVT-B (3 min): rol senal, módulos M1, estado B. (fuentes: S01)
- Fila 7 · Lapsos de atención PVT-B: rol senal, módulos M1, estado P. Marcada [P] en la lista del equipo; falta confirmar en fuente abierta. (fuentes: S01)
- Fila 8 · Fatiga autorreportada: rol senal, módulos M4, M5, estado B. (fuentes: S01)
- Fila 9 · Estrés autorreportado: rol senal, módulos M5, estado B. (fuentes: S01)
- Fila 10 · Carga de trabajo: rol senal_y_confusor, módulos M5, estado B. También confusor del ánimo. (fuentes: S01)
- Fila 11 · Estado de ánimo: rol senal, módulos M5, estado B. Sin link verificado en la lista del equipo; en análogos, POMS en Mars-500. (fuentes: S02)
- Fila 12 · Estados somáticos: rol respaldo, módulos M5, estado B. (fuentes: S01)
- Fila 13 · Conducta sueño-vigilia: rol senal, módulos M4, estado B. (fuentes: S01)
- Fila 14 · Horas de sueño: rol respaldo, módulos M1, M2, M3, M4, estado B. (fuentes: S03)
- Fila 15 · Nivel de actividad: rol respaldo, módulos M5, estado B. (fuentes: S03)
- Fila 16 · Exposición a luz: rol respaldo, módulos M4, estado B. (fuentes: S04)
- Fila 19 · Latencia de comunicación con Tierra: rol confusor, módulos M6, M7, estado P. Se registra siempre junto a cada medición. (fuentes: S36)
- Fila 20 · Presión arterial: rol respaldo, módulos M5, estado B. Sin link verificado todavía.
- Fila 21 · Frecuencia cardíaca: rol respaldo, módulos M5, estado P. Marcada [P]; el ECG está en el catálogo CHeCS pero no apareció en los estudios de Artemis II.
- Fila 40 · Ejercicio realizado: rol respaldo, módulos M5, estado P.
- Fila 41 · CO₂ de cabina: rol confusor, módulos M1, M2, estado B. Sin link verificado todavía. Objetivo 0.7–1 kPa según la lista.
- Fila 57 · Ruido: rol confusor, módulos M1, M3, M4, estado B. Sin link verificado todavía.
- Fila 58 · Iluminación: rol confusor, módulos M2, M3, M4, estado P.
- Fila 71 · Cognición (batería de pruebas): rol senal, módulos M2, M3, estado B. (fuentes: S03)
- Fila 72 · Cuestionario de personalidad: rol senal, módulos M7, estado B. (fuentes: S03)
- Fila 73 · Calidad de sueño y cuestionario de equipo: rol senal, módulos M4, M6, estado B. (fuentes: S03)
- Fila 81 · Estrés, cognición y trabajo en equipo (ARCHeR, Artemis II): rol senal, módulos M5, M6, estado B. Sin link verificado todavía.

Candidatas opcionales: filas 42, 48, 49, 66. La tabla de capas del documento los menciona como contexto (O₂, temperatura, humedad, ortostática), pero la tabla de uso no los incluye. Se tratan como candidatos opcionales.

No usadas en el lazo de alerta temprana:
- Filas 1-5: radiación
- Filas 17-18: distancia, registros médicos
- Filas 22-39: gravedad: ojos, huesos, músculo, equilibrio, fluidos
- Filas 43-47, 50-56: resto del ambiente, microbiología, agua, inmunidad
- Filas 59-65, 67-70: sangre, ortostática y sensoriomotor
- Filas 74-80, 82-85: orina, saliva, reentrada y hardware

Son datos de salud física que manejan otras personas del equipo. La lista de 85 variables no trae rangos normales ni umbrales de alerta.


# PARTE 12. Datos abiertos disponibles

- Mars-500 (Excel del artículo de Basner et al.): datos reportados en el artículo (actigrafía y evaluaciones neuroconductuales semanales de 6 tripulantes). Acceso verificado: no. Licencia: no mencionada en el artículo.
- Archivo de datos de ciencias de la vida de NASA (LSDA): datos no atribuibles se descargan del sitio; los sensibles o atribuibles se piden por el portal de solicitudes.
- HERA: los datos completos se entregan al archivo de NASA.
- OSDR: sobre todo organismos modelo; poco útil para psicología.
- HI-SEAS: no se encontró un conjunto de datos público; solo el artículo.


# PARTE 13. Estructura de los registros de datos


## measurement_record

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Registro de una medición",
  "type": "object",
  "required": [
    "subject_id",
    "instrument_id",
    "started_at_ship_local",
    "mission_day",
    "session_type",
    "completed"
  ],
  "properties": {
    "subject_id": {
      "type": "string"
    },
    "instrument_id": {
      "type": "string",
      "pattern": "^I[0-9]{2}$"
    },
    "started_at_ship_local": {
      "type": "string",
      "format": "date-time",
      "description": "Hora local de la nave; es la referencia de las franjas."
    },
    "started_at_utc": {
      "type": "string",
      "format": "date-time"
    },
    "mission_day": {
      "type": "integer"
    },
    "time_slot": {
      "enum": [
        "manana",
        "tarde_previa_a_dormir",
        "al_despertar",
        "libre"
      ]
    },
    "session_type": {
      "enum": [
        "familiarizacion",
        "linea_base",
        "rutina",
        "intensificada",
        "evento_post_12h",
        "evento_post_48h"
      ]
    },
    "scheduled_for": {
      "type": "string",
      "format": "date-time"
    },
    "postponed_minutes": {
      "type": "integer",
      "minimum": 0,
      "maximum": 120,
      "description": "Hasta 2 h sin perder la franja."
    },
    "device_id": {
      "type": "string",
      "description": "Siempre el mismo dispositivo para el PVT-B."
    },
    "duration_s": {
      "type": "number"
    },
    "completed": {
      "enum": [
        "si",
        "no",
        "interrumpida"
      ]
    },
    "skip_reason": {
      "type": [
        "string",
        "null"
      ]
    },
    "payload": {
      "type": "object",
      "description": "Puntajes por ítem o métricas del instrumento; una prueba saltada queda vacía, sin valor rellenado."
    },
    "comm_delay_min": {
      "type": [
        "number",
        "null"
      ]
    },
    "confounders_snapshot": {
      "type": "object",
      "properties": {
        "sleep_hours": {
          "type": [
            "number",
            "null"
          ]
        },
        "co2_kpa": {
          "type": [
            "number",
            "null"
          ]
        },
        "noise_db": {
          "type": [
            "number",
            "null"
          ]
        },
        "illuminance_lux": {
          "type": [
            "number",
            "null"
          ]
        },
        "workload_1_5": {
          "type": [
            "integer",
            "null"
          ]
        }
      }
    }
  }
}
```

## event_log

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Registro diario de eventos",
  "type": "object",
  "required": [
    "subject_id",
    "date_ship_local",
    "mission_day"
  ],
  "properties": {
    "subject_id": {
      "type": "string"
    },
    "date_ship_local": {
      "type": "string",
      "format": "date-time"
    },
    "mission_day": {
      "type": "integer"
    },
    "event_type": {
      "enum": [
        "caminata_espacial",
        "emergencia",
        "mantenimiento",
        "conflicto",
        "noticia_de_casa",
        "comunicacion_con_tierra",
        "otro"
      ]
    },
    "workload_1_5": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5
    },
    "comm_delay_min": {
      "type": [
        "number",
        "null"
      ]
    },
    "free_text": {
      "type": [
        "string",
        "null"
      ]
    }
  }
}
```


# PARTE 14. Pendientes y límites conocidos

- **P01** (licencias): Licencia y reutilización del código y los estímulos de la batería Cognition (NASA y Penn).
- **P02** (licencias): Banco de caras con licencia clara para el módulo 3.
- **P03** (licencias): Términos de uso de PSQI y Samn-Perelli antes de copiar sus ítems (SPANE y WHO-5 ya verificados; KSS sigue sin verificar).
- **P04** (licencias) [resuelto_en_v2]: PHQ-9 y GAD-7: el formulario indica 'no se requiere permiso para reproducir, traducir, mostrar o distribuir' (S67). Los cortes de gravedad quedan [P].
- **P05** (licencias): Estado de PANAS y de la versión de 16 ítems del POMS para uso propio (SPANE resuelto como alternativa).
- **P06** (validación): Umbrales de alerta para astronautas en cada instrumento; hoy solo hay pistas aisladas como el corte de 5 h de sueño.
- **P07** (técnico): Rango entre estímulos del PVT-B: el artículo y PsyToolkit no coinciden del todo.
- **P08** (técnico): Precisión de temporización en navegador para el PVT-B y cómo documentarla.
- **P09** (fuentes): Verificar las filas marcadas [P] de la lista de 85 variables (7, 17, 18, 19, 21, 40, 53, 58).
- **P10** (seguridad): Revisión por un psicólogo o psiquiatra del ítem de seguridad y del flujo de escalamiento.
- **P11** (validación): Mapeo validado entre variables fisiológicas y estado de ánimo; hoy es hipótesis de trabajo.
- **P12** (fuentes): Confirmar el dato del PVT de la ISS y la cifra de actividad de Mars-500 en los artículos originales, porque parte salieron de notas de divulgación (S58, S59).
- **P13** (diseño): Definir la tarea de decisión mensual (I13) y verificar su acceso.
- **P14** (diseño): Definir qué ve el médico de vuelo, el equipo y el astronauta (visibility_policy).
- **P15** (validación): Descargar el Excel de Mars-500 y calcular variaciones del PVT-B para proponer umbrales con datos; no se pudo desde el entorno de trabajo.
- **P16** (fuentes): Links verificados para las filas 11, 20, 41, 57 y 81 de la lista de 85 variables.
- **P17** (diseño): Redactar las tres preguntas guiadas del chequeo con compañero (I11).
- **P18** (licencias): Términos de uso de la escala SDS-17 y del cuestionario IPIP-NEO.
- **P19** (validación) [parcial_en_v2]: Los umbrales de CO₂ y ruido ya tienen valores de referencia (F39, F41) pero no están validados para marcar causa ambiental sobre el ánimo.
- **P20** (idioma): Usar versiones oficiales en español validadas de WHO-5, PHQ-9, GAD-7, SPANE, ASQ y NASA-TLX en lugar de las traducciones literales propias de esta base.
- **P21** (fuentes): Enlaces y términos de uso de los bancos de caras (CFD, RaFD, KDEF, NimStim, FACES) y de PSS-10 y TILS: provienen de la investigación previa y no tienen enlace verificado aquí.
- **P22** (licencias): Obtener los 23 ítems del MHCL (artículo completo o autores) y revisar su licencia.
- **P23** (técnico): Discrepancia en la definición de falso inicio del PVT-B: <130 ms en el artículo de la ISS (S01) y <100 ms en Basner 2011 (S14).
- **P24** (validación): Resolver unidades de CO₂ con el equipo: el listado dice 0,7 a 1 kPa (≈5,3 a 7,5 mmHg, nivel de peligro) y los síntomas aparecen desde 2,3 mmHg.
- **P25** (seguridad): Revisión clínica del flujo ASQ + C-SSRS + PHQ-9 ítem 9 (safety_protocol) antes de cualquier uso con personas.
- **P26** (fuentes): Cortes de WHO-5 y PHQ-9/GAD-7 provienen de fuentes secundarias o conocimiento propio; confirmar en los artículos originales.
- **P27** (técnico): Confirmar si la batería PEBL incluye un PVT y leer su wiki; revisar términos de la GPL.
- **P28** (validación): Calibrar parámetros de EWMA/CUSUM (λ, límites) y de RCI (r y efecto de práctica) con datos simulados o del Excel de Mars-500.
- **P29** (fuentes): Leer el suplemento de S01 para los anclajes de las escalas visuales y sus ítems exactos.
- **P30** (fuentes): Enlaces verificados del >=7 h de sueño (AASM/SRS) y de la subestimación de la propia somnolencia (Van Dongen 2003).
- **P31** (licencias): Términos de uso del ISI (Morin) antes de reproducir sus ítems; ahora solo hay paráfrasis.
- **P32** (validación): Umbral del BGQ discrepante (4 o más según el VA, 5 o más en una hoja previa) y edad mínima de duelo (6 o 12 meses): confirmar con la autora o artículo original.
- **P33** (técnico): Ventana temporal del ISI: un formulario dice último mes y otros últimas dos semanas.
- **P34** (licencias): Permiso de los autores para usar o adaptar el formulario oficial del plan de seguridad; ahora es redacción propia.
- **P35** (fuentes): Contrastar los 20 ítems del PCL-5 aportados por el equipo con el formulario oficial y usar una traducción validada al español.
- **P36** (licencias): Términos de uso del BGQ (derechos de Shear y Essock).
- **P37** (licencias): Términos de uso del AUDIT (OMS) y versión en español.
- **P38** (licencias): Nota de licencia del PHQ-4.
- **P39** (licencias): Contrastar los 13 ítems de PG-13-R aportados por el equipo con los originales y definir su escala de respuesta; hasta entonces no aplicar el corte de 30.
- **P40** (licencias): Contrastar los 13 ítems del MDQ aportados por el equipo con los originales; el corte de 7 solo vale con el texto original.
- **P41** (seguridad): Revisión por psicólogo o psiquiatra de GP1 a GP6 (tiempos, umbrales, pasos de emergencia y acciones de la tripulación).
- **P42** (fuentes): Los criterios de depresión, ansiedad, estrés agudo y PTSD vienen de fuentes educativas secundarias (AMBOSS, Lecturio) y del DSM-5-TR citado indirectamente: leer el DSM-5-TR o el ICD-11 para sus textos oficiales.
- **P43** (fuentes): Los datos de NASA sobre emergencias conductuales (checklist de 2001, formulario actual, uso de ketamina) vienen de prensa y de un artículo leído por extracción automática; confirmar con el artículo original.
- **P44** (validación): Evidencia de la eficacia de las sesiones semanales de 45 minutos en astronautas: no existe; el diseño es una propuesta basada en PM+, activación conductual y práctica actual de la ISS.
- **P45** (alcance): No se investigaron: protocolos de delirium, criterios de psicosis, TDAH y trastornos de personalidad, ni escalas validadas en español para cada instrumento.
- **P46** (validación): Los ítems del archivo del equipo son adaptaciones sin validar: faltan los extremos de las escalas del ISI y del PG-13-R, y los cortes publicados (PCL-5 31 a 33, MDQ 7, PG-13-R 30, ISI) solo están demostrados con los textos originales. Para el hackatón sirven como prototipo; para uso real hay que usar las versiones oficiales validadas.


# PARTE 15. Protocolos clínicos (propuesta para revisión clínica)

Propuesta para revisión clínica. Debe aprobarla un psicólogo o psiquiatra con experiencia en medicina aeroespacial o ambientes extremos antes de cualquier uso con personas (P41). El programa detecta, avisa y guía; no diagnostica ni trata.

**Papel del programa:** Detectar señales, ofrecer el formulario adecuado, avisar a las personas correctas con el contenido mínimo necesario, recordar los pasos del protocolo y registrar. El juicio clínico, el diagnóstico, la medicación, la capacidad para trabajar y las decisiones de misión corresponden a profesionales y al mando.

**Roles:** BHP = Psicólogo o psiquiatra conductual en tierra (en la ISS, el grupo de salud conductual y desempeño); FS = Cirujano de vuelo asignado a la tripulación; CMO = Oficial médico de la tripulación a bordo; CDR = Comandante; PEER = Compañero de apoyo designado; FAM = Oficina de apoyo familiar en tierra

**Con retardo de comunicación:** Con retardo de comunicación no se espera respuesta en tiempo real. Cada paso crítico tiene una versión que funciona sin respuesta (reporte asíncrono, plan de seguridad escrito, observación por tripulación) y una versión en tiempo real si hay canal [D]. Evidencia de apoyo diferido: myCompass probó apoyo diferido de hasta 44 minutos (F107).


## GP1 · Duelo por la muerte de un tripulante a bordo [D decisión de diseño]

- Propósito: Proteger la seguridad y la salud mental de los sobrevivientes y del personal de tierra tras la muerte de un compañero, cuidando que la compartimentación inicial no se convierta en duelo o trauma tardíos.
- Base de evidencia: El plan se apoya en el artículo de NASA sobre fatalidad de tripulación en la ISS y en el resumen técnico OCHMO-TB-012 (F74, F75, F76, F77, F78). Las ventanas de tiempo de cada fase son nuestras salvo las del muestreo forense.
- Se activa con: R23; Declaración del comandante o del cirujano de vuelo; Cualquier compañero puede activarlo desde el programa

### P0 · primeras 0 a 12 horas: Seguridad y primeras tareas [B/D]
- Primero la seguridad física de los sobrevivientes y la confirmación de la muerte; los tripulantes actúan como primeros respondientes antes de poder hacer el duelo.
- Contacto inmediato con el cirujano de vuelo y el comandante; privacidad de las comunicaciones.
- El cirujano de vuelo evalúa en tiempo real si cada tripulante necesita descanso, reenfocarse o más apoyo, y puede suspender procedimientos que dañen a los sobrevivientes; cada tripulante puede negarse a cualquier procedimiento.
- Alimento, agua, sueño o descanso y turnos cortos: tareas esenciales primero, el resto se difiere.
- Si hay muestreo forense, hacerlo idealmente en 4 horas y a más tardar en 12; preparar los restos para almacenaje en 12 horas como máximo; aislar los restos en un compartimento si es posible (F75, F79).
- No ofrecer debriefing psicológico formal en esta fase: usar primeros auxilios psicológicos (mirar, escuchar, conectar) (F80, F81).
- Qué hace el programa:
  - Mostrar la lista de pasos de GP1
  - Enviar el aviso mínimo al cirujano de vuelo, comandante y psicólogo conductual
  - Suspender las pruebas rutinarias de cadencia para los sobrevivientes durante 24 horas salvo el selector de estado y el ítem de seguridad [D]
  - Registrar quién ya habló con el equipo de apoyo
- Formularios: I35 selector; ítem de seguridad (SF1/ASQ) a todos los sobrevivientes en las primeras 24 horas
- Evidencia: (fuentes: S102, S103, S116)

### P1 · días 1 a 7: Primeros auxilios psicológicos y reorganización del trabajo [D]
- Conferencias privadas diarias con el psicólogo conductual o el cirujano de vuelo para cada sobreviviente (frecuencia propia, más alta que la rutinaria de cada 2 semanas) (F71).
- Reducir la carga: ajustar horarios para duelo, descanso y uso del apoyo (F76).
- Un compañero de apoyo por tripulante; rituales o memoriales según preferencias culturales y religiosas, con participación a distancia de la familia cuando se desee.
- Canal privado con ancho de banda suficiente para hablar con familia y amigos (F74).
- Revisar el tratamiento de los restos con el comandante y el cirujano de vuelo y explicar de forma transparente qué se hará y por qué.
- Vigilar sueño, comida y consumo de medicación; si hay insomnio, aplicar plan de sueño.
- Qué hace el programa:
  - Check diario de duelo (I40) a todos los sobrevivientes
  - ISI si el sueño empeora
  - Aviso al equipo clínico por tendencia en GD1, GD3 y GD4
  - Seguir la señal pasiva con umbrales más sensibles [D]
- Formularios: I40; I35; I30
- Evidencia: (fuentes: S102, S111, S116)

### P2 · semanas 2 a 4: Distinguir duelo esperable de estrés agudo o depresión [D]
- Terapia o conferencia semanal con el psicólogo conductual para los más afectados (protocolo de terapia semanal).
- Reintroducir la carga de trabajo por fases y vigilar errores y fatiga.
- Mantener la ayuda para las tareas con el difunto (por ejemplo, funciones que cubría).
- Aplicar PHQ-9 y GAD-7 a las 2 semanas; si hay síntomas de intrusión, evitación o hiperalerta, vigilar estrés agudo (hasta 1 mes) y luego PTSD (F95).
- Qué hace el programa:
  - PHQ-9 y GAD-7 a los 14 días (SCH14)
  - Si hay síntomas de trauma: vigilar y, al pasar el mes, aplicar PCL-5 (I29)
  - Mantener el check de duelo 3 veces por semana
- Formularios: I20; I21; I29 desde el mes 1
- Evidencia: (fuentes: S102, S146, S134)

### P3 · mes 2 al 12 y después del vuelo: Seguimiento de largo plazo y duelo prolongado [D]
- Seguimiento clínico continuo: el seguimiento de largo plazo es esencial, aunque la NASA no fija un calendario (F78).
- A los 6 meses: BGQ y PG-13-R si el duelo no se resuelve (R20); a los 12 meses se aplica el criterio DSM-5-TR (F82).
- Plan de reintegración tras el vuelo; acceso al programa de asistencia (en tierra) para la tripulación y el equipo de control de misión (F78).
- Cuidar la posible culpa del sobreviviente y los aniversarios.
- Qué hace el programa:
  - SCH20 y SCH18
  - Aviso al equipo clínico si BGQ >= 4 o PG-13-R >= 30
- Formularios: I31; I32; I29; I20
- Evidencia: (fuentes: S120, S125, S102)
- Personal de tierra: El programa de asistencia al empleado ofrece manejo de incidentes críticos a la plantilla; el momento depende del impacto y de la finalización de operaciones e investigaciones (F78).
- Después de la misión: Evaluación posvuelo y acompañamiento; cubrir también a la familia del fallecido por la vía de la oficina de apoyo familiar y del oficial de asistencia a víctimas (F74).
- No hacer:
  - No forzar a hablar ni a participar en procedimientos sobre los restos.
  - No usar el debriefing psicológico formal como respuesta inicial.
  - No dar etiquetas diagnósticas en el duelo agudo.
  - No dejar a un sobreviviente aislado en las primeras 72 horas sin acuerdo explícito.
- Evidencia del protocolo: (fuentes: S102, S103, S116, S119, S120)

## GP2 · Duelo por la muerte de un familiar cercano en la Tierra [D decisión de diseño]

- Propósito: Dar la noticia de forma segura, apoyar al astronauta que no puede volver ni asistir a los ritos y detectar duelo complicado, depresión o riesgo.
- Base de evidencia: Se basa en la práctica descrita para casos reales de la ISS (F64, F65, F66, F67), en la guía naval de noticias (F69) y en la advertencia de la agencia antártica sobre repatriación limitada (F68). Los pasos concretos son nuestra propuesta.
- Se activa con: R24; La agencia recibe la noticia y la verifica con la familia; Un familiar o la oficina de apoyo familiar avisa al cirujano de vuelo
- Antes de la misión:
  - Completar Q_NOTIFY_PREF (I39) antes del lanzamiento; la NASA ya habla las preferencias de notificación con la oficina de astronautas (F64).
  - Hablar con la familia sobre qué haría si un familiar enferma o muere durante la misión y lo limitada que es la repatriación (F68).
  - Designar un contacto en tierra y un compañero de apoyo a bordo.
  - Acordar quién avisa a la agencia primero y cómo se confirma la noticia antes de comunicarla.

### N0 · antes de decirlo: Verificar y preparar [D]
- Confirmar los hechos con la familia y evitar que el astronauta se entere por un correo o un mensaje.
- Consultar las preferencias de notificación del astronauta (NP1 a NP8) y respetarlas; la NASA avisa solo a quien lo pidió (F64).
- Elegir el momento: no durante una tarea crítica ni justo antes de una actividad de riesgo (por ejemplo, una actividad extravehicular), salvo urgencia por salud de la persona; el cirujano de vuelo decide.
- Preparar un canal privado, tiempo sin interrupciones y apoyo disponible justo después (F69).
- Qué hace el programa:
  - Marcar el bloque de comunicación privada
  - Retener las pruebas rutinarias ese día
  - Mostrar las preferencias NP1 a NP8 al cirujano de vuelo
- Evidencia: (fuentes: S105, S110)

### N1 · el momento de la noticia: Dar la noticia con cuidado [D/B]
- Que la dé el cirujano de vuelo o el psicólogo conductual, con un familiar si el astronauta lo prefirió, en conferencia privada (como en un caso real de 2007, F65).
- Ser breve y luego guardar silencio; dejar que la persona reaccione; no minimizar ni dar explicaciones largas (F69).
- Ofrecer tiempo, el canal privado con la familia y compañía de la tripulación; preguntar qué necesita ahora.
- Aclarar con honestidad qué no es posible (por ejemplo, volver antes: la muerte de un familiar no activa la nave de rescate, F66).
- Qué hace el programa:
  - Registro del evento y hora
  - Pregunta de seguridad (SF1/ASQ) a las 24 horas, aunque la persona parezca estable
- Evidencia: (fuentes: S104, S106, S110)

### N2 · días 1 a 7: Apoyo y adaptación de la carga [D]
- Ajustar el horario de trabajo: una agencia modificó el horario de un astronauta tras la muerte de su madre (F67).
- Conferencias privadas más frecuentes de lo rutinario (por ejemplo, 2 a 3 por semana) y canal para hablar con la familia (F71).
- Facilitar participación a distancia en velatorios o funerales y rituales culturales o religiosos.
- La agencia de origen es el proveedor principal de apoyo psicológico (F67).
- Vigilar sueño, apetito y concentración; el astronauta puede continuar sus tareas si se siente capaz (F66).
- Qué hace el programa:
  - Check diario de duelo (I40)
  - ISI si el sueño empeora
  - Alerta temprana con umbrales más sensibles [D]
- Formularios: I40; I35
- Evidencia: (fuentes: S108, S111)

### N3 · semanas 2 a 12: Distinguir duelo esperable de depresión o duelo complicado [D]
- PHQ-9 y GAD-7 a las 2 semanas; sesión semanal si PHQ-9 >= 10.
- Si hay interferencia fuerte tras 6 meses: BGQ y PG-13-R (F84, F82).
- Vigilar riesgo de seguridad: el duelo complicado se vincula con ideación suicida (F73).
- Qué hace el programa:
  - SCH14, SCH28 y SCH20
  - R20 a partir de 6 meses
- Evidencia: (fuentes: S120, S148)
- Casos especiales:
  - Si la persona fallecida es un hijo o la pérdida es repentina o violenta, aumentar la frecuencia de contacto y la vigilancia (F70).
  - Si el astronauta tenía antecedentes de depresión, vigilar depresión desde la primera semana [D].
  - Si se espera la muerte de un familiar enfermo durante la misión, hablar de esa posibilidad con anticipación [D].
- No hacer:
  - No usar el correo o un mensaje no preparado para dar la noticia.
  - No ocultar la noticia para proteger la misión salvo decisión explícita del cirujano de vuelo con el astronauta informado de las preferencias previas.
- Evidencia del protocolo: (fuentes: S105, S104, S106, S107, S108, S110, S109, S111, S120)

## GP3 · Emergencia suicida (riesgo agudo y no agudo) [D decisión de diseño]

- Propósito: Identificar de forma rápida el riesgo de suicidio, evitar que la persona quede sola, activar apoyo profesional con o sin retardo y reducir el acceso a medios, con un plan de seguridad y seguimiento.
- Base de evidencia: Cribado con ASQ y C-SSRS (de v2), plan de seguridad de Stanley y Brown, consejería de medios letales y guía mhGAP (F102, F103, F104). NASA reporta que hasta hoy ninguna misión requirió un fármaco de emergencia por suicidalidad, pero la revisión recomienda incluir ideación suicida en la evaluación (F98, F99).
- Se activa con: R05; R12; R26; Cualquier respuesta positiva a SF1, ASQ, PHQ-9 ítem 9, TC7 o CO3/CO4

### Nivel A · Cribado positivo no agudo (ASQ sí; AQ5 no) [D]
- No dejar pasar: contacto clínico en las próximas horas, no días.
- Aplicar C-SSRS de cribado (I26) con un clínico y evaluar medios y razones para vivir.
- Construir el plan de seguridad (I36) con un clínico.
- Hablar con la persona de la consejería de medios letales: reducir el acceso a medios en la nave, de forma voluntaria y a veces temporal (F103).
- Seguimiento: contacto diario durante 7 días y luego semanal [D].
- Informar a la persona de quiénes sabrán y qué datos se compartirán (V1 6011, F72).
- Evidencia: (fuentes: S63, S65, S154)

### Nivel B · Riesgo agudo (ASQ AQ5 sí, plan, intención o conducta reciente) [D]
- Que un compañero esté con la persona de forma continua desde ya; no dejarla sola.
- Hablar con calma, preguntar de forma directa y escuchar sin juzgar ni prometer secreto.
- Avisar al comandante y contactar de inmediato al cirujano de vuelo o apoyo psicológico; con retardo, enviar un reporte asíncrono de emergencia y mantener la observación continua.
- Retirar o asegurar los medios de autolesión disponibles (por ejemplo, controlar el acceso al botiquín y a objetos peligrosos) con acuerdo de la persona cuando sea posible (F103).
- Turnos de observación entre la tripulación con relevos y descanso para los observadores.
- El cirujano de vuelo decide la aptitud para tareas críticas, el uso de medicación del formulario y la necesidad de cambios de misión (F99).
- Evidencia: (fuentes: S63, S148, S154)

### Nivel C · Intento en curso o riesgo inminente de daño [D]
- Seguridad inmediata de todos; atención médica de lo que haya ocurrido; no dejar sola a la persona.
- Activar la cadena de mando y el contacto médico de emergencia; el comandante coordina con el cirujano de vuelo.
- Si la persona está agitada o es peligrosa: desescalada verbal primero (F101); sujeción y medicación solo bajo indicación de un clínico y con la persona informada (F100, F99).
- Documentar y proteger la información; atender también a los testigos con PFA.
- Evidencia: (fuentes: S148, S152, S150, S149)
- Después de la crisis:
  - Plan de seguridad escrito y actualizado (I36).
  - Sesión semanal de terapia con control del ítem de seguridad en cada una.
  - Revisión de aptitud para el trabajo y de la misión por el cirujano de vuelo y el mando.
  - Apoyo a los compañeros que acompañaron y a la familia según preferencias.
  - Si hay retardo, acordar por adelantado el plan sin respuesta: qué hace la tripulación, qué envía el programa y quién lo recibe.
- No hacer:
  - No prometer confidencialidad total: si hay riesgo hay que avisar.
  - No dejar a una persona en riesgo agudo sola ni en su cuarto cerrado sin observación.
  - No minimizar ni discutir las razones de la persona; no desafiar con 'no lo harías'.
  - No usar solo el programa: es un apoyo, no el responsable de la decisión.
- Nota: Los flujos y el orden de pasos provienen de documentos hospitalarios y comunitarios; su adaptación a una nave es decisión nuestra (P25, P41).
- Nota: El programa no debe informar nunca métodos ni detalles de autolesión.
- Evidencia del protocolo: (fuentes: S63, S65, S66, S154, S155, S157, S158, S148)

## GP4 · Emergencia conductual (agitación, psicosis, delirium, violencia) [D decisión de diseño]

- Propósito: Proteger a la tripulación y a la persona cuando alguien está confuso, alucinando, agitado o violento; no es un cribado por cuestionario sino una respuesta de observación.
- Base de evidencia: NASA tiene lista de verificación para emergencias conductuales (F100) y un formulario con antidepresivos, benzodiacepinas y antipsicóticos (F99). Hay un caso histórico de posibles alucinaciones en una misión Soyuz (F97).
- Se activa con: R25; Observación directa de la tripulación; El comandante o el oficial médico lo declara
- Paso 1 [D]: Evaluar seguridad: alejar objetos peligrosos y retirar al resto de la tripulación del riesgo; avisar al comandante y al cirujano de vuelo ya.
- Paso 2 [B]: Descartar causas médicas y ambientales que imitan o provocan síntomas: CO2, hipoxia, fármacos, condición médica, nutrición (F96).
- Paso 3 [B]: Desescalada verbal con un solo interlocutor, concisa, que respete el espacio, sin provocar, que identifique deseos y sentimientos y ofrezca opciones (F101).
- Paso 4 [B/D]: Si no cede y hay peligro: sujeción física solo como último recurso, explicando lo que se hace, con compañía y vigilancia de signos vitales; medicación oral y luego inyectable solo bajo indicación del cirujano de vuelo (F100, F99).
- Paso 5 [B]: El comandante consulta a tierra si la misión continúa o si hay que regresar; el cirujano de vuelo decide la aptitud para tareas (F100).
- Paso 6 [D]: Debrief con la persona y la tripulación; reevaluar con el psicólogo conductual; seguimiento semanal.
- No hacer:
  - No usar fuerza antes de intentar desescalar.
  - No dejar solo a quien está sujeto o sedado.
  - No asumir causa psicológica antes de descartar CO2, hipoxia, fármacos o enfermedad.
- Evidencia del protocolo: (fuentes: S148, S149, S150, S152, S153, S61)

## GP5 · Sospecha de condición psicológica básica (escalón de detección y derivación) [D decisión de diseño]

- Propósito: Convertir una caída en las señales pasivas o activas en una sospecha ordenada que pase por descarte de causas no psicológicas, cribado con escalas y derivación, sin poner etiquetas.
- Base de evidencia: Cada escalón usa un instrumento con cortes publicados (F88, F85, F87, F89, F91, F93, F92); la secuencia es nuestra.
- Paso 0 · Disparador: R01, R07, R08, R10 o R11 (caída de señal), o la persona marca un estado en el selector (I35), o lo pide. (fuentes: S85, S88)
- Paso 1 · Descartar causas no psicológicas: Sueño (ISI/KSS), CO2, ruido, medicación, enfermedad, hipoxia, nutrición, carga de trabajo (NASA-TLX), horario (F96, R09). (fuentes: S61, S93, S95)
- Paso 2 · Cribado ultrabreve: PHQ-4: si ansiedad o depresión >= 3, pasar a GAD-7 o PHQ-9 en 24 horas (R13). (fuentes: S132)
- Paso 3 · Escalas específicas según el selector: Depresión: PHQ-9 (5/10/15/20). Ansiedad: GAD-7 (5/10/15). Trauma >= 1 mes: PCL-5 (31 a 33). Sueño: ISI (8/15/22). Duelo >= 6 meses: BGQ y PG-13-R. Elevación del ánimo: MDQ. Alcohol: AUDIT-C. (fuentes: S128, S130, S134, S137, S125, S120, S142, S139)
- Paso 4 · Siempre revisar la seguridad: PHQ-9 ítem 9, ASQ o SF1: cualquier respuesta distinta de cero pasa a GP3 (R05, R12). (fuentes: S63, S128)
- Paso 5 · Decidir el nivel: Ámbar: vigilancia y autoayuda (PHQ-9 5 a 9). Firme: aviso al equipo clínico y plan de tratamiento (PHQ-9 10 a 14, GAD-7 >= 10, ISI >= 15, PCL-5 >= 31). Roja: contacto clínico en 24 horas (PHQ-9 >= 15 o seguridad positiva). (fuentes: S128, S131)
- Paso 6 · Derivar y registrar: Enviar reporte asíncrono con escalas, fechas y confusores revisados al psicólogo conductual y al cirujano de vuelo; iniciar el protocolo de terapia semanal si procede (GP6).
- Reglas de tiempo:
  - Un cribado positivo sin duración suficiente (por ejemplo, duelo antes de 6 meses, estrés agudo antes de 1 mes) no se interpreta como trastorno (F95, F82).
  - Trastorno de adaptación: si un estresor identificable precede los síntomas en menos de 3 meses y no cumplen otro trastorno ni duelo normal (F94).
  - Depresión: se evalúa con 2 semanas de síntomas; ansiedad generalizada con 6 meses de preocupación (F95).
- No hacer:
  - No diagnosticar: el programa sugiere la escala y el nivel de atención, no el trastorno.
  - No tomar un cribado de una sola vez como confirmación.
  - No ignorar un cribado por ser 'solo estrés de misión'.
- Evidencia del protocolo: (fuentes: S132, S128, S130, S134, S137, S142, S139, S61)

## GP6 · Terapia semanal (sesión estructurada de apoyo psicológico) [D decisión de diseño]

- Propósito: Dar una sesión semanal breve y estructurada con un clínico en tierra (o una versión guiada si hay retardo), para quien está en vigilancia ámbar o firme, en duelo o por decisión del equipo clínico.
- Punto de partida en NASA: Hoy la ISS usa una conferencia psicológica privada de unos 15 minutos cada 2 semanas y evaluaciones previas de 60 minutos (F71). La sesión semanal de 45 minutos es una propuesta nuestra para casos con indicación, no la rutina para todos (se mantiene el presupuesto diario de unos 5 minutos).
- Formatos:
  - A_realtime: Videollamada o llamada privada con un clínico cuando el retardo lo permite.
  - B_async: Con retardo: la persona completa Q_THERAPY_CHECKIN, el clínico responde con mensajes de texto o video grabados, y se mantiene la tarea semanal (como en el ensayo de myCompass, F107).
  - C_selfguided: Si no hay clínico, sesión guiada con ejercicios (respiración, activación conductual, resolución de problemas) y alerta automática al equipo; evidencia solo preliminar (F108).
- Estructura de la sesión: Check-in y escalas (Q_THERAPY_CHECKIN, WHO-5 semanal, PHQ-9 y GAD-7 cada 2 semanas) (5 min); Revisión de la práctica de la semana (10 min); Habilidad del día (20 min); Plan y tarea de la semana (5 min); Revisión de seguridad y cierre (5 min)
- Currículo: Inspirado en Problem Management Plus (5 sesiones de 90 minutos) y en la activación conductual (8 a 24 sesiones). Las duraciones son nuestras (F105, F106).
  - Sesión 1: Psicoeducación y respiración lenta (manejo del estrés). Tarea: Respiración lenta 5 minutos al día y registro. Origen: PM+ sesión 1 [B].
  - Sesión 2: Resolución de problemas: elegir un problema concreto, ideas, plan. Tarea: Dar un paso del plan. Origen: PM+ sesión 2 [B].
  - Sesión 3: Activación conductual: registro de actividad y ánimo; programar una actividad con sentido o placer. Tarea: Tres actividades programadas. Origen: PM+ sesión 3 y BA [B].
  - Sesión 4: Apoyo social: cuándo y cómo contactar con la tripulación y con la Tierra. Tarea: Un contacto significativo programado. Origen: PM+ sesión 4 [B].
  - Sesión 5: Sueño y ritmo: horarios, luz, ruido, uso de pantallas (ligado a ISI y a los confusores). Tarea: Rutina de sueño de una semana. Origen: Propio [D].
  - Sesión 6: Preocupación y rumiación: tiempo de preocupación y paso a resolución de problemas. Tarea: Dos tiempos de preocupación breves. Origen: Propio, basado en BA [D].
  - Sesión 7: Sentido y duelo, o el estresor específico (pérdida, conflicto, aislamiento); valores y metas. Tarea: Una acción alineada con un valor. Origen: Propio [D].
  - Sesión 8: Revisión, prevención de recaídas, plan de seguridad actualizado y decisión de continuar o espaciar. Tarea: Plan escrito de mantenimiento. Origen: Propio [D].
- Frecuencia:
  - Semanal mientras PHQ-9 >= 10, GAD-7 >= 10 o duelo agudo.
  - Cada 2 semanas (conferencia estándar) cuando PHQ-9 < 10 y GAD-7 < 10 durante 4 semanas.
  - Volver a semanal ante recaída de escalas o evento nuevo.
- Atención escalonada:
  - Nivel 1: vigilancia + autoayuda + conferencia cada 2 semanas.
  - Nivel 2: sesión semanal con curriculum.
  - Nivel 3: sesiones más frecuentes con el psicólogo o psiquiatra y valoración de fármacos del formulario.
  - Nivel 4: emergencia (GP3 o GP4).
- Contraindicaciones:
  - PM+ no es adecuado con deterioro grave o riesgo inminente de suicidio (F105): pasar a GP3.
  - Con riesgo de hipomanía o manía (MDQ positivo), el clínico decide antes de proponer activación o cambios de sueño.
- Outcome tracking: PHQ-9 y GAD-7 cada 2 semanas; WHO-5 semanal; cambio fiable con RCI (F33); mejoras por práctica no significan bienestar (principio de diseño).
- Privacy: La información psicológica enviada por la nave se trata como comunicación privada (V1 6011, F72).
- Evidencia del protocolo: (fuentes: S160, S161, S162, S163, S164, S165, S167, S112, S113)


# PARTE 16. Condiciones psicológicas básicas: duración, escalas y protocolo

Tabla de referencia de duraciones y cribado. Los criterios provienen de fuentes educativas secundarias en varios casos (P42): no sustituyen al DSM-5-TR ni al ICD-11.

- **C01 Depresión** [B encontrado en fuente]: duración o ventana: episodio de al menos 2 semanas. Cribado: PHQ-4, PHQ-9, WHO-5. Señal para el programa: PHQ-9 >= 10; ítem 9 > 0. Descartar antes: duelo normal, insomnio, CO2 e hipoxia, fármacos, hipomanía previa. Protocolos: GP5, GP6, GP3. (fuentes: S128, S146)
- **C02 Ansiedad generalizada** [B encontrado en fuente]: duración o ventana: preocupación de al menos 6 meses (diagnóstico); cribado con GAD-7. Cribado: PHQ-4, GAD-7. Señal para el programa: GAD-7 >= 10. Descartar antes: estrés agudo, cafeína, CO2, hipoxia, dolor, fármacos. Protocolos: GP5, GP6. (fuentes: S130, S147)
- **C03 Trastorno de adaptación** [B encontrado en fuente]: duración o ventana: inicio en 3 meses desde el estresor; no más de 6 meses tras cesar el estresor. Cribado: PHQ-4, PHQ-9, GAD-7. Señal para el programa: síntomas con estresor identificable que no cumplen otro trastorno. Descartar antes: duelo normal, depresión, ansiedad. Protocolos: GP5, GP6. (fuentes: S144, S145, S148)
- **C04 Estrés agudo** [B encontrado en fuente]: duración o ventana: de 3 días a 1 mes tras un evento traumático. Cribado: observación y apoyo; PCL-5 si pasa de un mes. Señal para el programa: síntomas de intrusión, evitación o hiperalerta tras un evento. Descartar antes: duelo agudo, privación de sueño. Protocolos: GP1, GP5. (fuentes: S146, S147)
- **C05 Estrés postraumático** [B encontrado en fuente]: duración o ventana: más de 1 mes tras el evento. Cribado: PCL-5. Señal para el programa: PCL-5 >= 31 a 33. Descartar antes: depresión, duelo, insomnio. Protocolos: GP1, GP5, GP6. (fuentes: S134, S135, S146)
- **C06 Duelo prolongado** [B encontrado en fuente]: duración o ventana: 6 meses (ICD-11) o 12 meses (DSM-5-TR) desde la muerte. Cribado: BGQ, PG-13-R. Señal para el programa: BGQ >= 4 o PG-13-R >= 30. Descartar antes: duelo normal, depresión, PTSD. Protocolos: GP1, GP2, GP6. (fuentes: S120, S121, S125)
- **C07 Insomnio** [B encontrado en fuente]: duración o ventana: cribado con ISI. Cribado: ISI, KSS. Señal para el programa: ISI >= 15. Descartar antes: ruido, luz, horario de turnos, CO2, ansiedad. Protocolos: GP5, GP6. (fuentes: S137, S97)
- **C08 Hipomanía o manía (historia)** [B encontrado en fuente]: duración o ventana: tamizaje de historia en la vida. Cribado: MDQ. Señal para el programa: MDQ positivo. Descartar antes: TDAH, sustancias, ansiedad. Protocolos: GP5, GP4. (fuentes: S142, S143)
- **C09 Consumo de alcohol de riesgo** [B encontrado en fuente]: duración o ventana: ventana de un año. Cribado: AUDIT-C. Señal para el programa: AUDIT-C >= 4 hombres o >= 3 mujeres. Descartar antes: no aplica sin acceso. Protocolos: GP5. (fuentes: S139, S140)
- **C10 Riesgo suicida** [B encontrado en fuente]: duración o ventana: no depende de duración. Cribado: SF1, ASQ, C-SSRS (cribado), PHQ-9 ítem 9. Señal para el programa: cualquier respuesta positiva. Descartar antes: no se descarta nunca por otra causa. Protocolos: GP3. (fuentes: S63, S65, S128)
- **C11 Psicosis o delirium** [B encontrado en fuente]: duración o ventana: no se tamiza por cuestionario. Cribado: observación por la tripulación (I38) y evaluación médica. Señal para el programa: CO5 o CO6. Descartar antes: CO2, hipoxia, fármacos, enfermedad médica. Protocolos: GP4. (fuentes: S148, S61)


# PARTE 17. Qué formulario llenar según cómo se siente

- **Estoy bien** [D decisión de diseño]: formularios: Check-in diario (I07), WHO-5 semanal (I19). Cadencia: rutina. Siguiente paso: ninguno.
- **Decaído o sin interés** [B encontrado en fuente]: formularios: PHQ-4, PHQ-9 si es positivo, WHO-5, ISI si hay mal sueño. Cadencia: PHQ-9 cada 2 semanas mientras dure. Siguiente paso: R14 a R16; GP5; GP6. (fuentes: S132, S128)
- **Nervioso o preocupado** [B encontrado en fuente]: formularios: PHQ-4, GAD-7 si es positivo. Cadencia: GAD-7 cada 2 semanas. Siguiente paso: R17; GP5; GP6. (fuentes: S132, S130)
- **Evento fuerte reciente (menos de 1 mes)** [B encontrado en fuente]: formularios: Selector, Check de duelo si hay pérdida, ISI. Cadencia: diaria al inicio. Siguiente paso: PFA y vigilancia; GP1 o GP2. (fuentes: S116, S146)
- **Evento fuerte hace 1 mes o más** [B encontrado en fuente]: formularios: PCL-5, PHQ-9, ISI. Cadencia: PCL-5 cada 30 días. Siguiente paso: R18; GP5. (fuentes: S134, S146)
- **Pérdida de alguien (menos de 6 meses)** [D decisión de diseño]: formularios: Check diario de duelo, PHQ-9 a las 2 semanas, ISI. Cadencia: ver SCH28. Siguiente paso: GP1 o GP2. (fuentes: S102, S105)
- **Pérdida de alguien (6 meses o más)** [B encontrado en fuente]: formularios: BGQ, PG-13-R, PHQ-9. Cadencia: mensual hasta los 12 meses. Siguiente paso: R20. (fuentes: S120, S125)
- **Duermo mal** [B encontrado en fuente]: formularios: ISI, KSS y Samn-Perelli del módulo de sueño. Cadencia: ISI cada 14 a 30 días. Siguiente paso: R19; revisar confusores. (fuentes: S137)
- **Mucha energía, poco sueño sin cansancio, irritable** [B encontrado en fuente]: formularios: MDQ (si no se aplicó), check-in, observación de compañero. Cadencia: inmediata. Siguiente paso: R21; aviso clínico. (fuentes: S142)
- **Mucha carga de trabajo** [B encontrado en fuente]: formularios: NASA-TLX, check-in. Cadencia: tras la tarea. Siguiente paso: ajuste de carga; GP5 si persiste. (fuentes: S98)
- **Solo o distante** [B encontrado en fuente]: formularios: M6 cohesión y aislamiento, SPANE, PHQ-4. Cadencia: SCH15. Siguiente paso: R10; R11. (fuentes: S71, S75)
- **Alcohol o sustancias** [B encontrado en fuente]: formularios: AUDIT-C. Cadencia: ver SCH21. Siguiente paso: R22. (fuentes: S139)
- **Pensamientos de morir o de hacerme daño** [B encontrado en fuente]: formularios: ASQ, C-SSRS de cribado con un clínico, Plan de seguridad. Cadencia: inmediata. Siguiente paso: GP3 (R12). (fuentes: S63, S65, S154)
- **Un compañero está mal** [D decisión de diseño]: formularios: Lista de observación (I38). Cadencia: inmediata. Siguiente paso: R25, R26; GP3 o GP4. (fuentes: S154, S148)


# BIBLIOGRAFÍA (códigos usados arriba)

- **S01** Jones et al. (2022). Reaction Self-Test en la ISS: sueño, escalas visuales y PVT-B (paper)
- **S02** Basner et al. (2014). Mars-500: cambios psicológicos y conductuales en 520 días (PLoS ONE) (paper)
- **S03** Zwart (2018). Spaceflight Standard Measures (NTRS 20180002943) (nasa)
- **S04** Clement et al. Spaceflight Standard Measures (NTRS 20200001281) (nasa)
- **S05** NASA. Spaceflight Standard Measures: Characterizing How Humans Adapt in Space (nasa)
- **S06** BHP Laboratory Standard Measures, hoja informativa (NTRS 20170005421) (nasa)
- **S07** Bell (2026). Suite APEX, HRP Investigators' Workshop (nasa)
- **S08** Basner et al. (2018). Efectos de administración repetida en el PVT (Sleep) (paper)
- **S09** Patrones circadianos del PVT, ánimo y somnolencia (PMC3248591) (paper)
- **S10** Revisión de Ecological Momentary Assessment en ambientes ICE (Front. Physiol. 2026) (paper) — Mini-revisión conceptual; sin cifras de cumplimiento, longitud ni horario.
- **S11** Dunn Rosenberg et al. (2022). Estrés biocomportamental en 3 análogos HI-SEAS (paper)
- **S12** Estudio de cognición espacial en vuelo (NTRS 20200001355) (nasa)
- **S13** Diarios de emociones en análogos MDRS y AMADEE24 (OeWF) (web)
- **S14** Basner, Mollicone y Dinges (2011). Validez y sensibilidad del PVT-B (paper)
- **S15** PsyToolkit. PVT-B (web)
- **S16** Penn Medicine. Cognition Test Battery (web)
- **S17** Penn Medicine. Astronaut Behavioral Health (web)
- **S18** Basner et al. (2015). Cognition Test Battery for Spaceflight (AMHP) (paper)
- **S19** WinSCAT y Cognition (NTRS 20180003970) (nasa)
- **S20** Consentimiento del estudio de cognición en vuelo (NCT04856410) (web)
- **S21** Dev et al. (2024). Cognición en astronautas de la ISS (Front. Physiol.) (paper) — Base normativa preliminar de 25 astronautas.
- **S22** Beard et al. (2019). Fine Motor Skills y Cognition (NTRS 20190025239) (nasa)
- **S23** DSST y desempeño de acoplamiento en simulador (AMHP 91(11)) (paper)
- **S24** Barger et al. (2014). Sueño y uso de hipnóticos en astronautas (Lancet Neurology) (paper)
- **S25** NASA HRP. Evidence Report: pérdida de sueño, desincronización circadiana y sobrecarga (nasa)
- **S26** Flynn-Evans et al. Requisitos del ambiente de sueño (NTRS 20190002008) (nasa)
- **S27** Medidas estándar internacionales, IAC 2022 (NTRS 20220013722) (nasa)
- **S28** Petrowski et al. (2021). Versión corta del POMS de 16 ítems (paper)
- **S29** Pearson. Profile of Mood States, 2.ª edición (POMS 2) (web)
- **S30** BDI-II, formulario con copyright de A. T. Beck (web)
- **S31** Group Living Skills Survey (Front. Psychol. 2024) (paper)
- **S32** Bell et al. (2019). Dinámica y desempeño de equipos en misiones largas (paper)
- **S33** Lunar Palace 1: tercer cuarto y clima de grupo (AMHP 86(9)) (paper)
- **S34** Kanas, Gushin y Yusupova (2021). Whither the Third Quarter Phenomenon? (paper)
- **S35** Bell (2024). Behavioral Health and Performance for Future Space Exploration (nasa)
- **S36** Whitmire (2024). Retos conductuales de una misión a Marte (nasa)
- **S37** Roma et al. (2020). TRISH Red Risk School (web)
- **S38** Sistemas de monitoreo digital y contramedidas (JMIR Form Res 2023) (paper)
- **S39** Contramedidas de realidad virtual para salud conductual (Front. VR 2023) (paper)
- **S40** HFBP Overview, HRP IWS 2026 (NTRS 20260002656) (nasa)
- **S41** Nasrini et al. (2020). Cognición en confinamiento y restricción de sueño en HERA (paper)
- **S42** NASA. Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders (nasa)
- **S43** Validez convergente del PVT de 3 min frente al de 10 min (PMC8885985) (paper)
- **S44** Basner y Rubinstein (2011). Fitness for duty: PVT de 3 min (cribado de equipaje) (paper) — Umbrales de 11 y 20 lapsos para otra población; no son para astronautas.
- **S45** Estudio clínico de fatiga con PSQI, KSS y Samn-Perelli (NCT05524441) (web)
- **S46** Basner et al. (2013). Mars-500: hipoquinesia y alteraciones del sueño (PNAS), con apéndice (paper)
- **S47** NASA Life Sciences Data Archive (archivo público de estudios de vuelo y análogos) (nasa)
- **S48** NASA Open Science Data Repository (OSDR) (nasa)
- **S49** OSDR: preguntas frecuentes (nasa)
- **S50** Paquete de información de experimentos de HERA (nasa)
- **S51** Safe Passage: Astronaut Care for Exploration Missions (Academias Nacionales, 2001) (report)
- **S52** Safe Passage, edición en nap.edu (mismo informe) (report)
- **S53** Air & Space Forces: pilotos y ocultamiento de información médica (press) — Prensa que cita un estudio; no es la fuente primaria.
- **S54** DeChurch et al. (2019). Deciding on Mars: decisiones de equipo en HERA (paper)
- **S55** Revisión de retardo de comunicación del HRP (2025) (nasa)
- **S56** Holden et al. (2026). Estudio de retardo de comunicación: métodos (nasa)
- **S57** Antártida: descensos de emoción positiva sin recuperación (nota de prensa) (press) — Nota de prensa; el estudio original es Alfano et al. (2021), Acta Astronautica.
- **S58** WHYY. Psychological hazards of exploration: lessons from a mock Mars mission (press) — Divulgación; confirmar cifras en el artículo original.
- **S59** Wired. Future Mars Astronauts May Be Sleepy, Bored and Crabby (press) — Divulgación; confirmar cifras en el artículo original.
- **S60** Rating scales for depression (copia de Wikipedia) (secondary) — Referencia secundaria; verificar licencias en la fuente.
- **S61** NASA OCHMO-TB-016. Resumen técnico de salud conductual (NASA-STD-3001) (nasa)
- **S62** NASA OCHMO-TB-035. Resumen técnico de acústica (NASA-STD-3001 Vol. 2) (nasa)
- **S63** SPRC. Kit de herramientas ASQ (NIMH), ítems, puntuación y pasos siguientes (web) — Describe el ASQ como herramienta de dominio público.
- **S64** Columbia Lighthouse Project. Acerca de la escala C-SSRS (web)
- **S65** C-SSRS, versión de cribado reciente con puntos de triaje (2023) (web)
- **S66** Columbia Psychiatry. C-SSRS: escala y entrenamiento gratuitos para uso comunitario, sanitario e investigación sin fines de lucro (web)
- **S67** PHQ-9 y GAD-7, formulario con pie de licencia (Spitzer, Williams, Kroenke) (web) — Pie del formulario: no se requiere permiso para reproducir, traducir, mostrar o distribuir.
- **S68** WHO-5 (versión 1998), formulario con puntuación e interpretación (web) — Copia del formulario del Psychiatric Research Unit alojada por un tercero.
- **S69** INSPQ. Ficha del WHO-5 (web)
- **S70** PsyToolkit. WHO-5 (web) — Indica que se puede usar en investigación citando a los autores.
- **S71** Ed Diener. Escalas de bienestar subjetivo y permisos de uso (SPANE, FS, SWLS) (web)
- **S72** Diener et al. (2010). New well-being measures: Flourishing Scale y SPANE (paper)
- **S73** SPANE: ítems y puntuación (formulario) (web)
- **S74** Bower et al. (2019). Validación del Mental Health Checklist (MHCL) para ambientes aislados, confinados y extremos (paper)
- **S75** Alfano et al. (2021). Salud mental, síntomas físicos y biomarcadores de estrés en la Antártida (Acta Astronautica) (paper)
- **S76** MHCL en confinamiento por COVID-19: estructura factorial y validez convergente (paper)
- **S77** Strangman, Sipes y Beven (2014). Desempeño cognitivo humano en vuelo espacial y análogos (AMHP) (paper)
- **S78** Strangman y Bevan (2012). Review of Human Cognitive Performance in Spaceflight (NTRS 20120017374) (nasa)
- **S79** Karolinska Sleepiness Scale (resumen enciclopédico) (secondary) — Fuente secundaria; los originales son Åkerstedt y Gillberg (1990) y Kaida et al. (2006).
- **S80** Kaida et al. (2006). Validación del KSS frente a desempeño y EEG (paper) — Enlace de catálogo bibliotecario con el resumen; abrir el artículo original.
- **S81** Åkerstedt et al. (2014). La somnolencia subjetiva es un indicador sensible de sueño insuficiente (J Sleep Res) (paper) — Solo resumen.
- **S82** PEBL: Psychology Experiment Building Language (sitio oficial) (web)
- **S83** Mueller y Piper (2014). PEBL y la batería de pruebas PEBL (paper)
- **S84** PEBL Test Battery (web)
- **S85** PSYCTC. Cambio fiable y clínicamente significativo (RCSC) (web)
- **S86** Cortes de cambio fiable del NIH Toolbox Cognition (SEM, SEdiff, IC 90 % y efecto de práctica) (paper)
- **S87** Cambio fiable con efectos de práctica en baterías NAB y WMS-IV (paper)
- **S88** Schat et al. (2023). Detección de cambios de media en datos de muestreo de experiencia: control estadístico de procesos (Psychological Methods) (paper)
- **S89** Smit y Snippe (2023). Monitoreo en tiempo real del aumento de inquietud con gráficos EWMA (Psychological Medicine) (paper)
- **S90** Wrzus y Neubauer (2022). Metaanálisis de diseño y cumplimiento en EMA (paper)
- **S91** Williams et al. (2021). Cumplimiento en EMA móvil en adultos (JMIR) (paper)
- **S92** Law et al. (2014). CO2 y cefaleas en la ISS (resumen divulgativo de J Occup Environ Med) (press) — Divulgación; el artículo original es J Occup Environ Med 56(5):477-83.
- **S93** CO2 en la ISS: actualización operativa (NTRS 20150019624) (nasa)
- **S94** James (2012). Riesgos de salud y desempeño con CO2 reducido (NTRS 20160014530) (nasa)
- **S95** Ruido en la ISS: límites y mediciones (NTRS 20100031889) (nasa)
- **S96** Dosimetría acústica en la ISS (NTRS 20110013006) (nasa)
- **S97** Recomendaciones acústicas para sueño y desempeño (NTRS 20190025346) (nasa)
- **S98** NASA-TLX v1.0, versión computarizada (NTRS 20000021487) (nasa)
- **S99** Hart (2006). NASA-TLX, 20 años después (nasa)
- **S100** Supolkina et al. (2021). Comunicación externa de tripulaciones autónomas en SIRIUS (Front. Physiol.) (paper)
- **S101** Frontiers. Comunicación con Control de Misión en SIRIUS (nota de prensa) (press) — Divulgación; las cifras provienen del artículo (ver S del paper).
- **S102** Stepaniak et al. (2023). Operational Considerations for Crew Fatality on the ISS (Aerosp Med Hum Perform 94:705) (paper) — Leído mediante extracción automática del PDF; verificar cifras en el original.
- **S103** NASA OCHMO-TB-012. Mortalidad relacionada con el vuelo espacial (NASA-STD-3001) (nasa)
- **S104** LiveScience/Space.com. Astronauta de la estación recibe apoyo desde la Tierra tras una pérdida familiar (caso Tani, 2007) (press)
- **S105** Universe Today. ¿Cómo maneja la NASA la entrega de noticias trágicas? (press)
- **S106** HeraldNet. Astronauta se entera de la muerte de su madre (press)
- **S107** Universe Today. Madre del astronauta Dan Tani muere (declaración de NASA sobre apoyo y Soyuz) (press)
- **S108** Space.com. Astronauta italiano llora a su madre desde la estación (caso Nespoli, 2011) (press)
- **S109** Australian Antarctic Division. Mensaje para familia y amigos de expedicionarios (web)
- **S110** Clarity (2017). Esté preparado para dar malas noticias (USNI Proceedings) (web)
- **S111** Picano. Behavioral Risk in Spaceflight (NTRS 20240000994) (nasa)
- **S112** Whitmire. Space Psychology (NTRS 20230010798) (nasa)
- **S113** NASA-STD-3001 Vol. 1, sección 6.3 (salud conductual y comunicación psicológica privada) (nasa)
- **S114** NASA-STD-3001 Vol. 1, sección 6.0 (operaciones médicas) (nasa)
- **S115** NASA HRP. Evidence Report: riesgo de cambios cognitivos o conductuales y trastornos psiquiátricos (2025) (nasa) — Solo se vieron fragmentos del índice; el informe completo no se leyó.
- **S116** OMS (2011). Primeros auxilios psicológicos: guía para trabajadores de campo (web)
- **S117** Guía de bolsillo de primeros auxilios psicológicos de la OMS (copia de CRS) (web)
- **S118** OMS. Primeros auxilios psicológicos durante brotes de Ébola (adaptación; incluye la recomendación frente al debriefing) (web)
- **S119** NHS Employers. Postvención del suicidio en el lugar de trabajo (2024) (web)
- **S120** Prigerson et al. (2021). Validación de los criterios DSM-5-TR de duelo prolongado y la PG-13-R (World Psychiatry) (paper)
- **S121** Prigerson et al. (2021). Resumen con umbral PG-13-R de 30 (Oxford) (paper)
- **S122** JAMA Psychiatry. Criterios DSM-5-TR de duelo prolongado y PG-13-R (comentario) (paper)
- **S123** Weill Cornell. Comparación de criterios ICD-11 y DSM-5-TR de duelo prolongado y escalas PG-13-R, PG-13 e ICG (web)
- **S124** Cuestionario breve de duelo (Shear y Essock), copia de PTTC (web)
- **S125** VA Whole Health. Cribado de duelo complicado (usa el BGQ) (web)
- **S126** Ito et al. (2012). Medida breve para cribar duelo complicado (PLoS ONE) (paper)
- **S127** BGQ con recomendación de seguimiento con el ICG de 19 ítems (web)
- **S128** Kroenke y Spitzer (2002). El PHQ-9: puntos de corte y acciones propuestas (paper)
- **S129** Kroenke, Spitzer y Williams (2001). Validez del PHQ-9 (J Gen Intern Med) (paper) — Solo resumen.
- **S130** Univ. de Washington. GAD-7 y GAD-2: instrucciones y características operativas (web)
- **S131** Folleto con puntuación del GAD-7 (cortes 5, 10, 15; sensibilidad 89 % y especificidad 82 % en 10) (web)
- **S132** McGill. PHQ-4: ítems y puntuación (web)
- **S133** Löwe et al. (2010). PHQ-4 en población general (J Affect Disord) (paper)
- **S134** ISTSS. PTSD Checklist for DSM-5 (PCL-5): puntuación y cortes (web)
- **S135** ISTSS. PCL-5: clústeres y rangos de corte (28 a 37) (web)
- **S136** Guía técnica del PCL-5: regla DSM de clústeres y cambio fiable (secondary)
- **S137** Insomnia Severity Index (formulario con puntuación; Morin) (web) — El formulario cita permiso de Morin; verificar términos de uso (P31).
- **S138** Defense Health Agency. Insomnia Severity Index (referencia Bastien, Vallières y Morin, 2001) (web)
- **S139** Frank et al. (2008). AUDIT-C como cribado en tres grupos étnicos (puntos de corte ≥4 hombres, ≥3 mujeres) (paper)
- **S140** Estudio de puntos de corte del AUDIT-C (≥3 mujeres y ≥4 hombres recomendados en 2007; otros valores según contexto) (paper)
- **S141** Flinders. AUDIT-C: puntuación e interpretación (web)
- **S142** Hirschfeld et al. (2000). Mood Disorder Questionnaire (Am J Psychiatry 157:1873) (paper)
- **S143** Resumen de puntuación del MDQ (7 o más síntomas, co-ocurrencia y deterioro moderado o grave) (secondary)
- **S144** Criterios DSM-5 de trastorno de adaptación (formulario) (secondary)
- **S145** Johns Hopkins Psychiatry Guide. Trastorno de adaptación (web)
- **S146** AMBOSS. Trastornos relacionados con trauma y estrés (duraciones diferenciales) (secondary) — Fuente educativa secundaria; confirmar en DSM-5-TR.
- **S147** Lecturio. Trastorno de adaptación (duraciones, estrés agudo 3 días a 1 mes, GAD ≥6 meses) (secondary) — Fuente educativa secundaria; confirmar en DSM-5-TR.
- **S148** Revisión: ketamina y emergencias conductuales en vuelo espacial (Aerosp Med Hum Perform 96:509) (paper) — Leído mediante extracción automática; verificar.
- **S149** The Daily Record (2007). Plan de NASA para astronautas inestables: sujeción y medicación (press) — Prensa de 2007 sobre la lista de verificación de la ISS; la formulación actual puede diferir (ver F102).
- **S150** Mental Floss. Plan de NASA si un astronauta pierde el control (press)
- **S151** Scientific American. Salud mental en el espacio (informe de evidencia de NASA) (press)
- **S152** Richmond et al. (2012). Desescalada verbal del paciente agitado, consenso Project BETA (West J Emerg Med) (paper)
- **S153** Los 10 dominios de la desescalada (Project BETA), resumen (web)
- **S154** AFSP. Intervenciones breves para manejar crisis suicidas (plan de seguridad, consejería de medios letales) (web)
- **S155** Brown. Safety Planning Intervention (material de taller) (web)
- **S156** Plan de seguridad: definición y estructura de seis pasos (nota de licencia del formulario oficial) (secondary) — Indica que el formulario oficial permite uso clínico individual pero exige permiso de los autores para cambios o uso en historia clínica electrónica.
- **S157** OMS. mhGAP Intervention Guide v2.0 (módulos de depresión, autolesión/suicidio y otros) (web)
- **S158** OMS (2022). mhGAP Humanitarian Intervention Guide: manual de capacitación (estrés agudo, duelo, depresión, autolesión, TEPT) (web)
- **S159** OMS. Identificación temprana, evaluación, manejo y seguimiento de personas afectadas por suicidio y autolesión (web)
- **S160** MHPSS.net. Problem Management Plus (PM+): formato, estrategias, restricciones (web)
- **S161** UNHCR/STRENGTHS. Resumen de política de PM+ (cinco sesiones de 90 minutos) (web)
- **S162** ISRCTN. Protocolo STRENGTHS: contenido de las sesiones de PM+ (web)
- **S163** Dimidjian et al. (2011). Orígenes y estado actual de la activación conductual (Annu Rev Clin Psychol) (paper)
- **S164** Mentalyc. Activación conductual para la depresión (duraciones de 8 a 24 sesiones; BATD de 8 a 12) (secondary)
- **S165** Phys.org (2017). Herramienta de salud mental electrónica myCompass para astronautas (ensayo NASA con apoyo diferido) (press)
- **S166** Smith (2024). Psicoterapia automatizada en el entorno de vuelo espacial (Interact J Med Res) (paper) — Solo comentario editorial leído.
- **S167** Laham (2023). Psicólogos entrenados como astronautas frente a teleterapia con retardo (tesis doctoral) (paper) — Tesis doctoral; evidencia preliminar de análogo.
- **S168** Archivo del equipo con ítems de PCL-5, ISI, BGQ, MDQ y PG-13-R (aporte propio) (aporte_del_equipo) — Sin enlace: documento proporcionado por el usuario.
