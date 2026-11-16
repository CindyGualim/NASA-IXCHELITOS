// Simulated on-board analysis server for Care. It stands in for the MCP tool server ARMOR would
// call: every tool is a pure function over the engine's daily payload, so it works with no Earth link.
import { getMockSensorAnomalies, type SensorAnomaly, type SensorChannel } from './content'
import { CARE, type DayPayload, type Dom, type TodayVM } from './ixchel'

export type Situation = 'nominal' | 'fatigue' | 'grief' | 'emergency'

export function situationOf(scenario: string, today: TodayVM | null): Situation {
  if (today?.emergencyDay != null || scenario === 'Emergency') return 'emergency'
  if (today?.griefDay || scenario === 'Grief support') return 'grief'
  if (scenario === 'Cumulative fatigue') return 'fatigue'
  return 'nominal'
}

export type Severity = 'ok' | 'watch' | 'high'
export interface Finding { key: string; label: string; value: string; norm: string; delta: number | null; severity: Severity; note: string }
export type Mood = 'steady' | 'tired' | 'low' | 'strained' | 'isolated' | 'shaken'
export interface Analysis {
  situation: Situation
  physical: Finding[]
  psychological: Finding[]
  mood: Mood
  /** how the body and the mission context explain the mood, in order of weight */
  drivers: string[]
  opening: string
  suggestions: { key: string; title: string; local?: 'breathing' | 'grounding' | 'journal' | 'peer' }[]
  source: 'engine' | 'sample'
}

export const MOOD_LABEL: Record<Mood, string> = {
  steady: 'Steady', tired: 'Running on little rest', low: 'Carrying something heavy', strained: 'Under strain', isolated: 'Far from people', shaken: 'After an incident',
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const fmt = (v: number | null, dec = 1) => (v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }))

interface Spec { key: string; label: string; unit: string; dec: number; higherIsWorse: boolean; watch: number; high: number; note: string }
const PHYSICAL: Spec[] = [
  { key: 'sueno_h', label: 'Sleep', unit: 'h', dec: 1, higherIsWorse: false, watch: 10, high: 20, note: 'Short sleep lowers mood and patience before anything else.' },
  { key: 'sueno_eficiencia', label: 'Sleep efficiency', unit: '%', dec: 0, higherIsWorse: false, watch: 5, high: 10, note: 'Broken sleep does not restore as much as the hours suggest.' },
  { key: 'hrv', label: 'Heart-rate variability', unit: 'ms', dec: 0, higherIsWorse: false, watch: 10, high: 20, note: 'Lower variability means the body is still under load.' },
  { key: 'fc_reposo', label: 'Resting heart rate', unit: 'bpm', dec: 0, higherIsWorse: true, watch: 5, high: 10, note: 'A higher resting pulse goes with poor recovery or stress.' },
  { key: 'ejercicio_min', label: 'Exercise', unit: 'min/day', dec: 0, higherIsWorse: false, watch: 15, high: 30, note: 'Less movement shows up as low energy and low mood within days.' },
]
const PSYCHOLOGICAL: Spec[] = [
  { key: 'pvt_lapses', label: 'Attention errors', unit: '/day', dec: 1, higherIsWorse: true, watch: 20, high: 50, note: 'Attention lapses follow sleep debt closely.' },
  { key: 'estres_vas', label: 'Stress rating', unit: '/100', dec: 0, higherIsWorse: true, watch: 15, high: 30, note: 'Stress above your norm for several days wears down reserves.' },
  { key: 'cohesion', label: 'Crew cohesion', unit: '/100', dec: 0, higherIsWorse: false, watch: 8, high: 15, note: 'Less closeness with the crew is the first sign of isolation up here.' },
  { key: 'msgs_criticos_tierra', label: 'Critical messages from Earth', unit: '/day', dec: 1, higherIsWorse: true, watch: 30, high: 60, note: 'Friction with Earth adds to the sense of distance.' },
]

function compare(spec: Spec, week: number | null, base: number | null): Finding {
  const delta = week != null && base ? ((week - base) / base) * 100 : null
  const worse = delta == null ? 0 : spec.higherIsWorse ? delta : -delta
  const severity: Severity = worse >= spec.high ? 'high' : worse >= spec.watch ? 'watch' : 'ok'
  return { key: spec.key, label: spec.label, value: `${fmt(week, spec.dec)} ${spec.unit}`, norm: `${fmt(base, spec.dec)} ${spec.unit}`, delta, severity, note: spec.note }
}

// ---------------------------------------------------------------- tools
/** Tool `analyze_physical`: week averages against the personal baseline, plus the cabin. */
export function analyzePhysical(p: DayPayload): Finding[] {
  const out = PHYSICAL.map(s => compare(s, num(p.semana[s.key]), num(p.base[s.key])))
  const co2 = num(p.salida.ambiente.co2_ppm)
  if (co2 != null) out.push({ key: 'co2', label: 'Cabin CO₂', value: `${fmt(co2, 0)} ppm`, norm: '< 3,000 ppm', delta: null, severity: co2 > 5000 ? 'high' : co2 > 3000 ? 'watch' : 'ok', note: 'High CO₂ brings headaches, fog and irritability that feel like mood.' })
  return out
}

/** Tool `analyze_psychological`: cognition, stress and connection, read together with the body. */
export function analyzePsychological(p: DayPayload, today: TodayVM | null): Finding[] {
  const out = PSYCHOLOGICAL.map(s => compare(s, num(p.semana[s.key]), num(p.base[s.key])))
  const delay = num(p.salida.contexto.retardo_com_min) ?? today?.delayMin ?? 0
  out.push({ key: 'delay', label: 'Earth delay', value: `${fmt(delay, 0)} min`, norm: 'each way', delta: null, severity: delay > 15 ? 'high' : delay > 5 ? 'watch' : 'ok', note: 'A long delay makes every exchange slower and more deliberate.' })
  return out
}

const sev = (f: Finding[], key: string) => f.find(x => x.key === key)?.severity ?? 'ok'
const bad = (s: Severity) => s !== 'ok'

/** Tool `infer_mood`: the psychological state, and the physical or mission reasons behind it. */
export function inferMood(situation: Situation, physical: Finding[], psychological: Finding[], today: TodayVM | null): { mood: Mood; drivers: string[] } {
  const drivers: string[] = []
  const sleep = sev(physical, 'sueno_h'), hrv = sev(physical, 'hrv'), move = sev(physical, 'ejercicio_min'), co2 = sev(physical, 'co2')
  const lapses = sev(psychological, 'pvt_lapses'), stress = sev(psychological, 'estres_vas'), cohesion = sev(psychological, 'cohesion'), earth = sev(psychological, 'msgs_criticos_tierra'), delay = sev(psychological, 'delay')
  if (bad(sleep)) drivers.push(`Sleep is below your norm${bad(lapses) ? ' and your attention errors rose with it' : ''}: tiredness, short patience and low mood are expected.`)
  if (bad(move)) drivers.push('Less exercise than usual: in microgravity that turns into low energy and flatter mood within days.')
  if (bad(hrv)) drivers.push('Heart-rate variability is down: the body has not finished recovering, whatever the mind says.')
  if (bad(co2)) drivers.push('Cabin CO₂ is high: part of the fog and irritability is the air, not you.')
  if (bad(cohesion) || bad(earth) || delay === 'high') drivers.push(`Isolation is doing its work: ${[bad(cohesion) && 'less closeness with the crew', bad(earth) && 'friction with Earth', delay === 'high' && 'a long communication delay'].filter(Boolean).join(', ')}.`)
  if (bad(stress)) drivers.push('Stress has stayed above your norm; reserves run down quietly.')
  if (situation === 'grief') drivers.unshift(`Grief, day ${today?.griefDay ?? 4} of 30: everything the body shows is read in that light, not as a disorder.`)
  if (situation === 'emergency') drivers.unshift('An emergency was reported: a 72-hour observation window is open and being shaken is the normal response.')

  let mood: Mood = 'steady'
  if (situation === 'emergency') mood = 'shaken'
  else if (situation === 'grief') mood = 'low'
  else if (bad(cohesion) && (bad(earth) || delay === 'high')) mood = 'isolated'
  else if (sleep === 'high' || hrv === 'high' || (bad(sleep) && bad(lapses))) mood = 'tired'
  else if (bad(stress) || bad(earth)) mood = 'strained'
  else if (bad(move) || bad(sleep)) mood = 'tired'
  if (drivers.length === 0) drivers.push('Body and mood are inside your usual range. Nothing is pulling you down today.')
  return { mood, drivers }
}

/** Tool `recommend`: what to try, the engine's learned pick first. */
export function recommend(mood: Mood, p: DayPayload | null): Analysis['suggestions'] {
  const learned = (p?.salida.recomendaciones ?? []).filter(r => r.tipo === 'aprendida').map(r => r.accion)
  const byMood: Record<Mood, string[]> = {
    steady: ['actividad_recreativa', 'luz_460nm'],
    tired: ['siesta_ancla', 'luz_460nm', 'reorganizar_turnos'],
    low: ['apoyo_par', 'actividad_recreativa', 'sesion_psicologo'],
    strained: ['descompresion_emocional', 'realidad_virtual'],
    isolated: ['taller_cohesion', 'realidad_virtual', 'apoyo_par'],
    shaken: ['revision_medica', 'apoyo_par'],
  }
  const keys = [...new Set([...learned.filter(k => byMood[mood].includes(k)), ...byMood[mood]])].slice(0, 3)
  const out: Analysis['suggestions'] = keys.map(k => ({ key: k, title: CARE[k]?.title ?? k }))
  const local: Record<Mood, Analysis['suggestions'][number]> = {
    steady: { key: 'journal', title: 'Three lines in the journal', local: 'journal' },
    tired: { key: 'breathing', title: '3 minutes of breathing', local: 'breathing' },
    low: { key: 'peer', title: 'Ten minutes with your support crewmate', local: 'peer' },
    strained: { key: 'breathing', title: '3 minutes of breathing', local: 'breathing' },
    isolated: { key: 'peer', title: 'Ten minutes with your support crewmate', local: 'peer' },
    shaken: { key: 'grounding', title: '5-4-3-2-1 grounding', local: 'grounding' },
  }
  return [local[mood], ...out]
}

function opening(a: Omit<Analysis, 'opening'>): string {
  const first = a.drivers[0]
  const lead: Record<Mood, string> = {
    steady: 'Your numbers look like you this week.',
    tired: 'Before you say anything: your body has been short on rest.',
    low: 'I am here, and there is no hurry.',
    strained: 'The week has been asking a lot of you.',
    isolated: 'Earth feels far these days; the data agrees.',
    shaken: 'The incident is recent. We go slowly.',
  }
  return `${lead[a.mood]} ${first} How are you, in your own words?`
}

/** Runs the full tool chain for today. Falls back to a sample analysis when the engine is offline. */
export function runAnalysis(p: DayPayload | null, today: TodayVM | null, situation: Situation): Analysis {
  if (!p) return sampleAnalysis(situation)
  const physical = analyzePhysical(p)
  const psychological = analyzePsychological(p, today)
  const { mood, drivers } = inferMood(situation, physical, psychological, today)
  const partial = { situation, physical, psychological, mood, drivers, suggestions: recommend(mood, p), source: 'engine' as const }
  return { ...partial, opening: opening(partial) }
}

const sample = (key: string, label: string, value: string, norm: string, delta: number | null, severity: Severity, note: string): Finding => ({ key, label, value, norm, delta, severity, note })
function sampleAnalysis(situation: Situation): Analysis {
  const base = {
    physical: [
      sample('sueno_h', 'Sleep', '6.9 h', '7.1 h', -3, 'ok', 'Short sleep lowers mood and patience before anything else.'),
      sample('hrv', 'Heart-rate variability', '58 ms', '60 ms', -3, 'ok', 'Lower variability means the body is still under load.'),
      sample('ejercicio_min', 'Exercise', '88 min/day', '90 min/day', -2, 'ok', 'Less movement shows up as low energy and low mood within days.'),
      sample('co2', 'Cabin CO₂', '2,600 ppm', '< 3,000 ppm', null, 'ok', 'High CO₂ brings headaches, fog and irritability that feel like mood.'),
    ],
    psychological: [
      sample('pvt_lapses', 'Attention errors', '2.1 /day', '2.0 /day', 5, 'ok', 'Attention lapses follow sleep debt closely.'),
      sample('estres_vas', 'Stress rating', '32 /100', '30 /100', 7, 'ok', 'Stress above your norm for several days wears down reserves.'),
      sample('cohesion', 'Crew cohesion', '78 /100', '80 /100', -3, 'ok', 'Less closeness with the crew is the first sign of isolation up here.'),
      sample('delay', 'Earth delay', '12 min', 'each way', null, 'watch', 'A long delay makes every exchange slower and more deliberate.'),
    ],
  }
  if (situation === 'fatigue') {
    base.physical[0] = sample('sueno_h', 'Sleep', '5.2 h', '7.1 h', -27, 'high', 'Short sleep lowers mood and patience before anything else.')
    base.physical[1] = sample('hrv', 'Heart-rate variability', '47 ms', '60 ms', -22, 'high', 'Lower variability means the body is still under load.')
    base.psychological[0] = sample('pvt_lapses', 'Attention errors', '4.6 /day', '2.0 /day', 130, 'high', 'Attention lapses follow sleep debt closely.')
  }
  if (situation === 'grief') {
    base.physical[0] = sample('sueno_h', 'Sleep', '6.0 h', '7.1 h', -15, 'watch', 'Short sleep lowers mood and patience before anything else.')
    base.physical[2] = sample('ejercicio_min', 'Exercise', '62 min/day', '90 min/day', -31, 'high', 'Less movement shows up as low energy and low mood within days.')
    base.psychological[2] = sample('cohesion', 'Crew cohesion', '70 /100', '80 /100', -12, 'watch', 'Less closeness with the crew is the first sign of isolation up here.')
  }
  if (situation === 'emergency') {
    base.physical[1] = sample('hrv', 'Heart-rate variability', '44 ms', '60 ms', -27, 'high', 'Lower variability means the body is still under load.')
    base.physical.splice(2, 0, sample('fc_reposo', 'Resting heart rate', '68 bpm', '58 bpm', 17, 'high', 'A higher resting pulse goes with poor recovery or stress.'))
    base.psychological[1] = sample('estres_vas', 'Stress rating', '66 /100', '30 /100', 120, 'high', 'Stress above your norm for several days wears down reserves.')
  }
  const { mood, drivers } = inferMood(situation, base.physical, base.psychological, situation === 'grief' ? ({ griefDay: 4 } as TodayVM) : null)
  const partial = { situation, ...base, mood, drivers, suggestions: recommend(mood, null), source: 'sample' as const }
  return { ...partial, opening: opening(partial) }
}

// ---------------------------------------------------------------- conversation
type Intent = 'tired' | 'low' | 'worried' | 'alone' | 'body' | 'okay' | 'family' | 'other'
const INTENTS: [Intent, RegExp][] = [
  ['tired', /tired|exhaust|sleep|no energy|drained|fatigue|cansad|sueño|agotad/i],
  ['low', /sad|low|down|cry|empty|miss|grief|hopeless|trist|llor|vac[ií]o|extrañ/i],
  ['worried', /worr|anxi|stress|nervous|afraid|scared|panic|preocup|ansie|estr[eé]s|miedo/i],
  ['alone', /alone|lonely|isolat|far|distance|nobody|sol[oa]\b|aislad|lejos/i],
  ['body', /pain|hurt|dizzy|sick|headache|nause|ache|dolor|mareo|enferm|cabeza/i],
  ['family', /family|home|wife|husband|kids|daughter|son|mother|father|partner|familia|casa|hij|madre|padre/i],
  ['okay', /\b(ok|okay|fine|good|better|well|alright|calm)\b|bien|tranquil|mejor/i],
]
const finding = (a: Analysis, key: string) => [...a.physical, ...a.psychological].find(f => f.key === key)
const worst = (fs: Finding[]) => [...fs].filter(f => f.severity !== 'ok').sort((x, y) => Math.abs(y.delta ?? 0) - Math.abs(x.delta ?? 0))[0]

/** Tool `reply`: a contextual answer that quotes the person's own data, never a generic line. */
export function reply(text: string, a: Analysis, turn: number): string {
  const intent = INTENTS.find(([, re]) => re.test(text))?.[0] ?? 'other'
  const sleep = finding(a, 'sueno_h'), move = finding(a, 'ejercicio_min'), cohesion = finding(a, 'cohesion'), delay = finding(a, 'delay'), stress = finding(a, 'estres_vas')
  const s0 = a.suggestions[0]?.title, s1 = a.suggestions[1]?.title
  const pick = (xs: string[]) => xs[turn % xs.length]
  switch (intent) {
    case 'tired': return pick([
      sleep && sleep.severity !== 'ok' ? `That matches what I see: ${sleep.value} of sleep this week against your norm of ${sleep.norm}. The tiredness is earned, not a weakness. ${s0} is the shortest way back; would you try it now?` : `Your sleep looks close to normal (${sleep?.value ?? '—'}), so the tiredness may be load rather than hours. What has taken the most out of you today?`,
      `Rest is the one countermeasure nothing else replaces. ${s1 ?? 'An anchor nap'} is on your plan today. Should I note that you want a protected window?`,
    ])
    case 'low': return pick([
      a.situation === 'grief' ? 'You do not have to be anywhere else with this. Grief comes in waves, and today may be one of them. Do you want to tell me about them, or just sit here a moment?' : `Thank you for saying it plainly. ${move && move.severity !== 'ok' ? `Your exercise has dropped to ${move.value}; in microgravity that pulls mood down fast, so part of this is physical.` : 'Nothing in your body explains it on its own, so what you feel matters as it is.'} What has been the heaviest part?`,
      `I will not try to fix it in one line. ${s0} is one small thing within reach today. And the ground psychologist can be booked for the next link window if you want a person, not a program.`,
    ])
    case 'worried': return pick([
      `${stress && stress.severity !== 'ok' ? `Your stress rating has been ${stress.value} against a norm of ${stress.norm}, so your body has been carrying this for days.` : 'Your stress numbers are still inside your range, which means we are catching this early.'} Let us make it smaller: what is the one thing you need to handle first?`,
      `Worry grows in the gap between an event and the answer, and up here the gap is ${delay?.value ?? 'long'}. ${s0} slows the body down while the mind catches up. Shall we do it together?`,
    ])
    case 'alone': return pick([
      `${cohesion && cohesion.severity !== 'ok' ? `The data sees it too: crew cohesion at ${cohesion.value}, below your usual ${cohesion.norm}.` : 'The crew numbers look normal, which makes the loneliness more about distance than about them.'} Loneliness in a crew of few is common and it is not a verdict on you. Who up here is easiest to be around for ten minutes?`,
      `A family message written now arrives with the delay, but it still arrives. And your support crewmate can be asked without giving a reason. Which one feels possible today?`,
    ])
    case 'body': return 'Anything physical goes to the crew medical officer, who is on board with no delay. I can notify them now, and we keep talking while you wait. Where does it hurt, and since when?'
    case 'family': return `People on Earth are a real part of your reserve, not a distraction from the mission. ${delay ? `With ${delay.value} of delay each way, ` : ''}a message written now is a conversation that unfolds over the day. Would you like to write one, or tell me about them first?`
    case 'okay': return pick([
      `Good. ${a.drivers[0]} Keeping the routine is the countermeasure when things are fine: sleep, exercise, time with the crew.`,
      'I am glad. If you want, three lines in the journal keep today as a reference for the harder days.',
    ])
    default: return pick([
      `I am listening. ${worst([...a.physical, ...a.psychological])?.note ?? 'Your week looks like you.'} Tell me more about how that lands today.`,
      `Go on. If it helps, ${s0 ?? 'a breathing exercise'} is one tab away and I will stay here.`,
      'I hear you. What would make the next hour a little easier?',
    ])
  }
}

// ---------------------------------------------------------------- wearable sensors (Garmin, ring, suit)
export const PROTOCOL_OF_SITUATION: Record<Situation, string> = { nominal: 'nominal', fatigue: 'fatiga', grief: 'luto', emergency: 'emergencia' }

// engine variable behind each wearable channel: the same numbers the companion and My body read
const CHANNEL_VAR: Partial<Record<SensorChannel, string>> = {
  sleep_h: 'sueno_h', sleep_quality: 'sueno_eficiencia', hrv: 'hrv', hr_rest: 'fc_reposo', exercise_min: 'ejercicio_min', steps: 'ejercicio_min',
}

/** Sensor deviations for today: from the engine's week vs. baseline when it answers, sample values otherwise. */
export function sensorAnomaliesFor(situation: Situation, p: DayPayload | null, missionDay: number): SensorAnomaly[] {
  if (!p) return situation === 'nominal' ? [] : getMockSensorAnomalies(PROTOCOL_OF_SITUATION[situation], missionDay)
  const out: SensorAnomaly[] = []
  for (const [channel, v] of Object.entries(CHANNEL_VAR) as [SensorChannel, string][]) {
    const week = num(p.semana[v]), base = num(p.base[v])
    if (week == null || !base) continue
    const scale = channel === 'steps' ? 75 : 1   // steps are not measured by the engine: scaled from active minutes
    out.push({ channel, delta_pct: ((week - base) / base) * 100, raw_value: Math.round(week * scale), norm_value: Math.round(base * scale) })
  }
  // suit and ring channels the engine does not simulate (SpO₂, skin temperature, task heart rate) only matter in an emergency
  if (situation === 'emergency') for (const a of getMockSensorAnomalies('emergencia', missionDay)) if (!out.some(o => o.channel === a.channel)) out.push(a)
  return out
}

// ---------------------------------------------------------------- medications
export interface Medication {
  id: string; name: string; generic: string; dosage: string; frequency: string; indication: string; domain: Dom
  sideEffects: string[]; restrictions: string[]; critical?: string; stockDays: number
  /** typical adherence seed before this mission day, so the percentage has history */
  history: { taken: number; total: number }
}
export interface MedicationPlan { med: Medication; status: 'scheduled' | 'as needed' | 'suspended' | 'not today'; note: string }
export interface MedAlert { kind: 'critical' | 'attention' | 'info'; medId: string; title: string; text: string }

export const MEDICATIONS: Medication[] = [
  { id: 'zaleplon', name: 'Zaleplon', generic: 'sleep aid', dosage: '5 mg', frequency: 'At bedtime, as needed', indication: 'Circadian shift', domain: 'sueno', sideEffects: ['Morning grogginess', 'Headache', 'Dizziness'], restrictions: ['No EVA or critical task within 8 h of a dose', 'Never with alcohol or other sedatives'], stockDays: 18, history: { taken: 9, total: 12 } },
  { id: 'apixaban', name: 'Apixaban', generic: 'anticoagulant', dosage: '5 mg', frequency: 'Twice daily', indication: 'Venous thrombosis prophylaxis', domain: 'fisico', sideEffects: ['Bruising', 'Nosebleed', 'Gum bleeding'], restrictions: ['Suspend 24 h before EVA or any invasive procedure', 'Report any bleeding to the CMO at once'], critical: 'Suspend 24 h before EVA', stockDays: 27, history: { taken: 24, total: 24 } },
  { id: 'omeprazole', name: 'Omeprazole', generic: 'proton-pump inhibitor', dosage: '20 mg', frequency: 'Once daily, before breakfast', indication: 'Gastric reflux', domain: 'fisico', sideEffects: ['Nausea', 'Bloating', 'Headache'], restrictions: ['Take 30 min before food'], stockDays: 40, history: { taken: 13, total: 14 } },
]

/** What each medication means today, given the situation and what Ixchel flagged. */
export function medicationPlan(situation: Situation, today: TodayVM | null): MedicationPlan[] {
  const sleepFlag = today?.domains.find(d => d.key === 'sueno')?.kind
  const sleepBad = sleepFlag === 'attention' || sleepFlag === 'critical'
  return MEDICATIONS.map(med => {
    if (med.id === 'zaleplon') {
      if (situation === 'emergency') return { med, status: 'suspended', note: 'Suspended during the 72-hour observation window: you need to be fully alert.' }
      if (situation === 'fatigue' || sleepBad) return { med, status: 'scheduled', note: 'Tonight, only if the anchor nap and light plan did not work. Last dose at least 8 h before duty.' }
      if (situation === 'grief') return { med, status: 'as needed', note: 'Available, but grief sleep usually settles with routine; the CMO prefers to hold it.' }
      return { med, status: 'as needed', note: 'Not scheduled. Your sleep is within your norm.' }
    }
    if (med.id === 'apixaban') {
      if (situation === 'emergency') return { med, status: 'suspended', note: 'Suspended by the CMO until the incident is cleared: bleeding risk with any injury or procedure.' }
      return { med, status: 'scheduled', note: 'Morning and evening dose. No EVA within 24 h of a dose.' }
    }
    return { med, status: 'scheduled', note: situation === 'emergency' ? 'Continue. Stress and irregular meals make reflux worse.' : 'Before breakfast.' }
  })
}

/** Alerts that cross the medication list with the day's recommendations and situation. */
export function medicationAlerts(plan: MedicationPlan[], today: TodayVM | null, situation: Situation, data: DayPayload | null): MedAlert[] {
  const out: MedAlert[] = []
  const recs = new Set((data?.salida.recomendaciones ?? []).map(r => r.accion))
  const body = today?.domains.find(d => d.key === 'fisico')?.kind
  for (const { med, status } of plan) {
    if (med.id === 'apixaban') {
      if (status === 'suspended') out.push({ kind: 'critical', medId: med.id, title: 'Apixaban suspended', text: 'Do not take the anticoagulant until the crew medical officer clears the incident. Any bleeding or bruise goes to the CMO now.' })
      else if (recs.has('ajustar_ejercicio') || body === 'attention' || body === 'critical') out.push({ kind: 'attention', medId: med.id, title: 'Apixaban and the exercise plan', text: 'Ixchel suggests adjusting exercise this week. Keep resistive sessions moderate: bruising and bleeding risk rise on the anticoagulant.' })
      else out.push({ kind: 'attention', medId: med.id, title: 'Apixaban: EVA rule', text: 'Suspend 24 h before any EVA. No EVA is planned today; two doses scheduled.' })
    }
    if (med.id === 'zaleplon' && status === 'scheduled') out.push({ kind: 'attention', medId: med.id, title: 'Zaleplon tonight, after the countermeasures', text: recs.has('siesta_ancla') || recs.has('luz_460nm') ? 'Ixchel put an anchor nap and 460 nm light on your plan first. Take the dose only if you are still awake 30 min after lights out.' : 'Take the dose only if needed, at least 8 h before your next duty block.' })
    if (med.id === 'zaleplon' && status === 'suspended') out.push({ kind: 'critical', medId: med.id, title: 'No sleep aid during observation', text: 'Zaleplon is held for 72 h after the incident. Use breathing or grounding for sleep tonight; the CMO can review tomorrow.' })
    if (med.stockDays < 20) out.push({ kind: 'info', medId: med.id, title: `${med.name}: ${med.stockDays} days of stock`, text: 'Below the 20-day margin. The resupply request goes in the next report to Earth.' })
  }
  if (situation === 'grief') out.push({ kind: 'info', medId: 'zaleplon', title: 'Grief and sedatives', text: 'The GP2 protocol keeps sleep aids as a last option during the first 30 days: they blunt what needs to be felt.' })
  const order = { critical: 0, attention: 1, info: 2 }
  return out.sort((a, b) => order[a.kind] - order[b.kind])
}

// adherence and side effects stay on this device; the log entry is what travels to Earth
const MED_KEY = 'armor-medications'
export interface MedRecord { taken: Record<string, Record<number, 'taken' | 'skipped'>>; effects: Record<string, { day: number; effect: string }[]> }
export function loadMedRecord(): MedRecord {
  try { return { taken: {}, effects: {}, ...JSON.parse(localStorage.getItem(MED_KEY) ?? '{}') } } catch { return { taken: {}, effects: {} } }
}
export function saveMedRecord(r: MedRecord) { try { localStorage.setItem(MED_KEY, JSON.stringify(r)) } catch { /* private mode */ } }
export function adherenceOf(med: Medication, r: MedRecord): number {
  const days = Object.values(r.taken[med.id] ?? {})
  const taken = med.history.taken + days.filter(v => v === 'taken').length
  const total = med.history.total + days.length
  return total ? Math.round((taken / total) * 100) : 0
}
