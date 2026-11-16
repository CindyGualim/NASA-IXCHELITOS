# ARMOR Quick Guide for Space Apps Judges

## 🚀 ARMOR en 2 Minutos

**ARMOR** es un sistema de apoyo a decisiones médicas para astronautas en misiones profundas (12+ minutos de retardo de comunicación con la Tierra).

Lo que evalúan:
1. ✅ **Monitoreo de salud físico + psicológico integrados**
2. ✅ **Companion IA que proporciona soporte emocional**
3. ✅ **Gestión de medicamentos con advertencias críticas**
4. ✅ **Vista del Comandante respetando privacidad**
5. ✅ **Autonomía de tripulación (ARMOR propone, ellos deciden)**

---

## 🎮 Cómo Probar (5 minutos)

### Paso 1: Seleccionar Escenario (1 min)
Top-left dropdown:
- **Nominal:** Operaciones normales
- **Cumulative Fatigue:** Fatiga desarrollándose (hoy el mejor escenario para ver nuevas features)
- **Grief Support:** Protocolo de duelo
- **Emergency:** Emergencia médica

### Paso 2: Ver Dashboard "Today" (2 min)
1. Click en "Today" en sidebar
2. Observa los 4 dominios (Sleep, Mood, Body, Connection)
3. Haz click en una tarjeta de decisión para ver el reasoning

### Paso 3: Explorar Care View (2 min)
1. Click "Care" en sidebar
2. Verás las pestañas:
   - Breathing (existente)
   - Grounding (existente)
   - Journal (existente)
   - Peer Support (existente)
   - **🆕 AI Companion** ← PRUEBA ESTO
   - **🆕 Medications** ← PRUEBA ESTO

### Paso 4: Ver Commander View (1 min)
1. Scroll el sidebar hasta encontrar "Commander view"
2. Nota: Solo ve capacidad operativa, NO detalles privados
3. Compara con "Today" view

---

## 🆕 Nuevas Features Para Evaluar

### Feature 1: AI Companion (Care → AI Companion tab)
**¿Qué hace?**
- Chat que responde según estado emocional
- Puedes subir foto (tuya o familiar)
- Funciona sin conexión

**Pruébalo:**
```
Escribe: "Estoy cansado"
Companion: "El descanso es importante. ¿Te ayudarían ejercicios?"

Escribe: "Extraño a mi familia"
Companion: "La gente te quiere desde la Tierra. ¿Quieres escribirles?"
```

### Feature 2: Medications (Care → Medications tab)
**¿Qué muestra?**
- Registro de 3 medicamentos:
  1. Zaleplon (5 mg) - para sueño
  2. Apixabán (5 mg 2x/día) - anticoagulante ⚠️ CRÍTICO para EVA
  3. Omeprazol (20 mg) - reflujo
- Puedes marcar: "Tomado" o "Omitido"
- Ve efectos secundarios

**Alerta crítica visible:**
- Anticoagulante = "Suspender 24h antes de EVA"
- Si hay EVA planeado → Sistema advierte

### Feature 3: Commander View (Sidebar)
**Vs "Today" view, ¿qué es diferente?**
- Today: Todo (sueño, ánimo, detalles personales)
- Commander: SOLO capacidad operativa + alertas críticas
- Commander: Ve medicamentos para restricciones EVA
- Commander: NO ve detalles psicológicos

**Principio:** Comandante supervisa operaciones, no privacidad.

---

## 📊 Archivos Técnicos

Si quieres profundizar:
- `IMPLEMENTATION_SUMMARY.md` - Deep dive técnico
- `ARMOR-contexto.md` - Diseño médico/UX
- `ixchel/conocimiento/` - Base de conocimiento

---

## ✅ Checklist de Evaluación (5 min)

- [ ] **AI Companion funciona:** Chat responde, se puede subir foto
- [ ] **Medications funciona:** Se ven 3 meds, se puede marcar adherencia
- [ ] **Commander view funciona:** Diferente de "Today", sin detalles privados
- [ ] **Todo offline:** Cierra DevTools Network, tools siguen funcionando
- [ ] **Decisiones auditadas:** Decision log muestra lo que hiciste

---

## 🎯 Lo Importante

**¿Por qué esto importa para Space Apps?**

1. **Medicina en espacio profundo:** 12 min retardo = tripulante debe decidir AHORA
2. **Salud mental importa:** Aislamiento = riesgo psicológico tan real como físico
3. **Medicamentos integrados:** Anticoagulante cambia qué tareas son seguras
4. **Privacidad médica:** Comandante supervisa, no espía
5. **Autonomía:** Tripulante siempre controla

**ARMOR demostraría** esto en la Estación Espacial, en Marte, en misiones a la Luna.

---

**¿Preguntas? Ver JUDGES_GUIDE.md (extenso) o IMPLEMENTATION_SUMMARY.md**

*Team RoboMinds | NASA Space Apps 2026*
