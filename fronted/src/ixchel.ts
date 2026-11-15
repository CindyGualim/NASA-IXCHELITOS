// Connection to the Ixchel engine (ixchel/api.py) and translation of its daily output into
// what ARMOR shows. If the API is not running, every screen keeps its sample values.
import { useEffect, useState } from 'react'

export type StatusKind = 'normal' | 'attention' | 'critical' | 'empty' | 'model' | 'protocol'
export type Dom = 'psico' | 'sueno' | 'fisico' | 'social'
export const DOMS: Dom[] = ['sueno', 'psico', 'fisico', 'social']

const API = (import.meta.env.VITE_IXCHEL_API as string | undefined) ?? '/api'

/** ARMOR scenario -> simulated mission in the engine (null = handled only in the UI). */
export const SCENARIO_KEY: Record<string, string | null> = {
  'Nominal': 'nominal',
  'Cumulative fatigue': 'fatiga',
  'Grief support': 'duelo',
  'Emergency': null,
}

// ---------------------------------------------------------------- engine types
export interface EngineAlert { codigo: string; dominio: string; nivel: 'VERDE' | 'AMARILLO' | 'ROJO'; detalle: string }
export interface EngineRec { tipo: string; accion: string; categoria: string; explicacion?: string }
/** An active event; `dia` = days elapsed since it was reported (not the mission day). */
export interface EngineEvent { tipo: string; dia: number; detalle?: Record<string, unknown> }
export interface EngineOutput {
  dia: number
  nivel: 'VERDE' | 'AMARILLO' | 'ROJO'
  dominios: Record<string, number>
  z: Record<string, number>
  alertas: EngineAlert[]
  ambiente: Record<string, number>
  contexto: { gravedad_g?: number; retardo_com_min?: number; autonomia_requerida?: string; fase?: string }
  factores_contexto: string[]
  eventos_activos: EngineEvent[]
  recomendaciones: EngineRec[]
  sin_linea_base: string[]
  ml?: {
    riesgo_dominios: Record<string, { nivel: string; prob_atencion_o_peor: number }>
    nivel_ml: string
    explicacion: { nivel_arbol: string; pasos: string[] }
  }
}
export interface DayPayload {
  escenario: { clave: string; titulo: string; entorno: string; astronauta: string; n_dias: number; eventos: { tipo: string; inicio: number }[] }
  dia: number
  fila: Record<string, number | boolean | string | null>
  base: Record<string, number | null>
  semana: Record<string, number | null>
  tendencia: Record<Dom, (number | null)[]>
  salida: EngineOutput
}
export interface ScenarioInfo { clave: string; titulo: string; entorno: string; n_dias: number; eventos: { tipo: string; inicio: number }[] }

export type LinkStatus = 'idle' | 'loading' | 'live' | 'offline'

// ---------------------------------------------------------------- data hooks
/** Day of the simulated mission (missionDay is 1-based in ARMOR, t is 0-based in the engine). */
export function useIxchelDay(scenario: string, missionDay: number) {
  const key = SCENARIO_KEY[scenario] ?? null
  const [data, setData] = useState<DayPayload | null>(null)
  const [status, setStatus] = useState<LinkStatus>('idle')
  useEffect(() => {
    if (!key) { setStatus('idle'); return }
    const ctrl = new AbortController()
    setStatus(s => (s === 'offline' ? 'offline' : 'loading'))
    const timer = window.setTimeout(() => {   // small pause so dragging the day slider does not flood the API
      fetch(`${API}/demo/${key}/dia/${missionDay - 1}`, { signal: ctrl.signal })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: DayPayload) => { setData(d); setStatus('live') })
        .catch(err => { if (err?.name !== 'AbortError') { setData(null); setStatus('offline') } })
    }, 120)
    return () => { window.clearTimeout(timer); ctrl.abort() }
  }, [key, missionDay])
  return { data: key ? data : null, status }
}

export function useScenarios() {
  const [list, setList] = useState<ScenarioInfo[]>([])
  useEffect(() => {
    fetch(`${API}/demo/escenarios`).then(r => (r.ok ? r.json() : [])).then(setList).catch(() => setList([]))
  }, [])
  return list
}

// ---------------------------------------------------------------- vocabulary
export const DOMAIN_TITLE: Record<Dom, string> = { sueno: 'Sleep', psico: 'Mood', fisico: 'Body', social: 'Connection' }
const DOMAIN_WORD: Record<string, string> = { sueno: 'sleep', psico: 'mood', fisico: 'body', social: 'connection', ambiente: 'cabin environment' }
const DOMAIN_VARS: Record<Dom, string[]> = {
  sueno: ['sueno_h', 'sueno_eficiencia', 'desfase_circadiano_h'],
  psico: ['pvt_lapses', 'pvt_rt_ms', 'estres_vas', 'poms_tmd', 'bdi_somatico', 'bdi_afectivo'],
  fisico: ['hrv', 'fc_reposo', 'ejercicio_min'],
  social: ['cohesion', 'msgs_criticos_tierra'],
}
const VAR_TEXT: Record<string, { label: string; unit: string; dec: number }> = {
  sueno_h: { label: 'Your sleep this week', unit: 'h average', dec: 1 },
  sueno_eficiencia: { label: 'Your sleep efficiency', unit: '%', dec: 0 },
  desfase_circadiano_h: { label: 'Your circadian shift', unit: 'h', dec: 1 },
  pvt_lapses: { label: 'Your attention errors', unit: 'per day', dec: 1 },
  pvt_rt_ms: { label: 'Your reaction time', unit: 'ms', dec: 0 },
  estres_vas: { label: 'Your stress rating', unit: 'of 100', dec: 0 },
  poms_tmd: { label: 'Your mood-disturbance score', unit: 'points', dec: 0 },
  bdi_somatico: { label: 'Your physical low-mood signs', unit: 'points', dec: 1 },
  bdi_afectivo: { label: 'Your emotional low-mood signs', unit: 'points', dec: 1 },
  hrv: { label: 'Your heart-rate variability', unit: 'ms', dec: 0 },
  fc_reposo: { label: 'Your resting heart rate', unit: 'bpm', dec: 0 },
  ejercicio_min: { label: 'Your exercise', unit: 'min per day', dec: 0 },
  cohesion: { label: 'Crew cohesion', unit: 'of 100', dec: 0 },
  msgs_criticos_tierra: { label: 'Critical messages from Earth', unit: 'per day', dec: 1 },
}
const ALERT_TITLE: Record<string, string> = {
  FATIGA_CRONICA: 'Cumulative fatigue',
  COLAPSO_ALERTA_COGNITIVA: 'Attention drop',
  DISTRES_DEPRESIVO_ISOLACIONAL: 'Isolation distress',
  FRICCION_TIERRA_CONTROL: 'Friction with mission control',
  PRIVACION_SUENO_36H: '36 hours without sleep',
  DESVIACION_PERSISTENTE: 'Sustained change from your norm',
  CAPACIDAD_REDUCIDA: 'Reduced exercise capacity',
  MOVILIDAD_RESERVA: 'Mobility reserve',
  DUELO_PERSISTENTE: 'Grief is still weighing on you',
  POST_EMERGENCIA: 'Post-incident observation',
  ESCALAR_MEDICO_URGENTE: 'Urgent medical review',
  EVENTO_RADIACION: 'Radiation event',
  RADIACION_ACUMULADA: 'Accumulated radiation',
  LIMITE_CO2_PPM: 'Cabin CO₂ above notice level',
  LIMITE_RUIDO_DBA: 'Cabin noise above limit',
  LIMITE_MASA_PCT: 'Body-mass loss',
  LIMITE_PERDIDA_OSEA_PCT: 'Bone-loss estimate',
  LIMITE_O2_PCT: 'Cabin oxygen out of range',
  LIMITE_PRESION_HPA: 'Cabin pressure out of range',
  LIMITE_HUMEDAD_PCT: 'Cabin humidity out of range',
}
/** Countermeasures the engine can recommend (ixchel_core.ARMS). */
export const CARE: Record<string, { title: string; duration: string; copy: string }> = {
  siesta_ancla: { title: 'Anchor nap', duration: '90 min', copy: 'Creates a protected recovery window before your next duty period.' },
  luz_460nm: { title: '460 nm blue light', duration: '30 min · morning', copy: 'Supports your planned morning light exposure and circadian timing.' },
  reorganizar_turnos: { title: 'Reorganize shifts', duration: 'Next 24 h', copy: 'Moves high-attention tasks away from your lowest-rest period.' },
  realidad_virtual: { title: 'Virtual nature session', duration: '20 min', copy: 'A short immersive break from the confined cabin.' },
  apoyo_par: { title: 'Peer support', duration: '30 min', copy: 'A conversation with a trained crewmate.' },
  sesion_psicologo: { title: 'Psychologist session', duration: 'Next link window', copy: 'A private session with the ground psychologist.' },
  actividad_recreativa: { title: 'Recreational activity', duration: '45 min', copy: 'Time for something you enjoy, scheduled on purpose.' },
  ajustar_ejercicio: { title: 'Adjust exercise plan', duration: 'This week', copy: 'Rebalances resistive and aerobic sessions with the protocol.' },
  revision_medica: { title: 'Medical review', duration: 'Today', copy: 'A check with the crew medical officer.' },
  nutricion_hidratacion: { title: 'Nutrition and hydration', duration: 'Next 3 days', copy: 'Reviews intake against the mission plan.' },
  taller_cohesion: { title: 'Cohesion workshop', duration: '40 min', copy: 'A structured crew session to reset shared routines.' },
  descompresion_emocional: { title: 'Emotional debrief', duration: '30 min', copy: 'A guided space to talk about what has been building up.' },
  autonomia_incrementada: { title: 'More autonomy', duration: 'Next week', copy: 'More say over your own schedule and task order.' },
}
const ARMS: Record<Dom, string[]> = {
  sueno: ['siesta_ancla', 'luz_460nm', 'reorganizar_turnos'],
  psico: ['apoyo_par', 'sesion_psicologo', 'actividad_recreativa', 'realidad_virtual'],
  fisico: ['ajustar_ejercicio', 'revision_medica', 'nutricion_hidratacion'],
  social: ['taller_cohesion', 'descompresion_emocional', 'autonomia_incrementada'],
}

const LEVEL = { VERDE: 0, AMARILLO: 1, ROJO: 2 } as const
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const fmt = (v: number | null, dec = 1) => (v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }))
const isHealth = (d: string): d is Dom => (DOMS as string[]).includes(d)
const isML = (a: EngineAlert) => a.codigo === 'ALERTA_TEMPRANA_ML'

// ---------------------------------------------------------------- view model
export interface DomainVM { key: Dom; title: string; kind: StatusKind; status: string; description: string; trend: 'down' | 'stable' | 'empty'; values: number[] }
export interface ContextVM { label: string; value: string; meta: string; icon: string; attention?: boolean; progress?: number }
export interface DecisionVM { id: string; domain: string; kind: 'attention' | 'critical'; typeLabel: string; title: string; text: string; careKey: string | null }
export interface ModelNoticeVM { domain: Dom; title: string; text: string; steps: string[] }
export interface ReasonVM { parts: [string, string, string, string] }  // label, value, norm label, norm value
export interface TodayVM {
  headline: [string, string]
  overallKind: StatusKind
  overallLabel: string
  overallNote: string
  domains: DomainVM[]
  context: ContextVM[]
  decisions: DecisionVM[]
  modelNotice: ModelNoticeVM | null
  delayMin: number
  phase: string
  griefDay: number | null
}

function rulesLevel(out: EngineOutput, d: string) {
  return Math.max(0, ...out.alertas.filter(a => !isML(a) && a.dominio === d).map(a => LEVEL[a.nivel] ?? 0))
}

function domainDescription(d: Dom, p: DayPayload): string {
  const w = p.semana, b = p.base
  const pair = (k: string) => [fmt(num(w[k]), VAR_TEXT[k].dec), fmt(num(b[k]), VAR_TEXT[k].dec)]
  if (d === 'sueno') { const [a, n] = pair('sueno_h'); return `${a} h average this week; your personal norm is ${n} h.` }
  if (d === 'psico') { const [a, n] = pair('pvt_lapses'); const [s, sn] = pair('estres_vas'); return `${a} attention errors per day (norm ${n}) and stress ${s}/100 (norm ${sn}).` }
  if (d === 'fisico') { const [e, en] = pair('ejercicio_min'); const [h, hn] = pair('fc_reposo'); return `Exercise ${e} min per day (norm ${en}); resting heart rate ${h} bpm (norm ${hn}).` }
  const [c, cn] = pair('cohesion'); const [m, mn] = pair('msgs_criticos_tierra')
  return `Crew cohesion ${c}/100 (norm ${cn}); ${m} critical messages from Earth per day (norm ${mn}).`
}

/** The measures behind a domain's state: the most deviated variables, week average vs. norm. */
export function reasonsFor(domain: string, p: DayPayload): ReasonVM[] {
  const out: ReasonVM[] = []
  if (isHealth(domain)) {
    const vars = DOMAIN_VARS[domain].filter(k => num(p.salida.z[k]) != null && VAR_TEXT[k])
      .sort((a, b) => (p.salida.z[b] ?? 0) - (p.salida.z[a] ?? 0)).slice(0, 2)
    for (const k of vars) {
      const t = VAR_TEXT[k]
      out.push({ parts: [`${t.label}:`, `${fmt(num(p.semana[k]), t.dec)} ${t.unit}.`, 'Your norm:', `${fmt(num(p.base[k]), t.dec)} ${t.unit.replace(' average', '')}.`] })
    }
  }
  const co2 = num(p.salida.ambiente.co2_ppm)
  if (co2 != null && co2 > 3000) out.push({ parts: ['Cabin CO₂:', `${fmt(co2, 0)} ppm,`, 'above the notice threshold of', '3,000.'] })
  return out
}

/** Countermeasure options for a domain, the engine's own pick first. */
export function careFor(domain: string, p: DayPayload | null) {
  if (!isHealth(domain)) return []
  const picked = new Set((p?.salida.recomendaciones ?? []).filter(r => r.tipo === 'aprendida' && r.categoria === domain).map(r => r.accion))
  return [...ARMS[domain]].sort((a, b) => Number(picked.has(b)) - Number(picked.has(a))).slice(0, 3)
    .map(k => ({ key: k, ...CARE[k], tag: picked.has(k) ? 'Ixchel’s pick: best past response for you' : '' }))
}

export function buildToday(p: DayPayload, missionDay: number): TodayVM {
  const out = p.salida
  const ml = out.ml?.riesgo_dominios ?? {}
  const domains: DomainVM[] = DOMS.map(d => {
    const lv = rulesLevel(out, d)
    const prob = ml[d]?.prob_atencion_o_peor ?? 0
    const noBase = DOMAIN_VARS[d].every(k => out.sin_linea_base.includes(k))
    const kind: StatusKind = noBase ? 'empty' : lv === 2 ? 'critical' : lv === 1 ? 'attention' : prob >= 0.5 ? 'model' : 'normal'
    const values = (p.tendencia[d] ?? []).map(v => v ?? 0)
    // declining = the domain score (higher = worse) rose over the week; 3-day averages so one noisy day does not count
    const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / Math.max(1, xs.length)
    const rising = values.length >= 4 && avg(values.slice(-3)) - avg(values.slice(0, 3)) > 0.4
    return {
      key: d, title: DOMAIN_TITLE[d], kind,
      status: { normal: 'Normal', attention: 'Attention', critical: 'Critical', empty: 'No data yet', model: 'Early notice', protocol: 'Active support' }[kind],
      description: noBase ? 'Your personal baseline for this domain is not ready yet.' : domainDescription(d, p),
      trend: noBase ? 'empty' : rising ? 'down' : 'stable', values,
    }
  })

  const amb = out.ambiente, fila = p.fila
  const hasAlert = (code: string) => out.alertas.some(a => a.codigo === code)
  const g = num(out.contexto.gravedad_g) ?? num(fila.gravedad_g) ?? 0
  const delay = num(out.contexto.retardo_com_min) ?? num(fila.retardo_com_min) ?? 0
  const acc = num(amb.radiacion_acum_msv) ?? 0
  const context: ContextVM[] = [
    { label: 'Air', value: `CO₂ ${fmt(num(amb.co2_ppm), 0)} ppm`, meta: hasAlert('LIMITE_CO2_PPM') ? 'High' : 'Within range', icon: 'air', attention: hasAlert('LIMITE_CO2_PPM') },
    { label: 'Noise', value: `${fmt(num(amb.ruido_dba), 0)} dBA`, meta: hasAlert('LIMITE_RUIDO_DBA') ? 'Above limit' : 'Today', icon: 'sound', attention: hasAlert('LIMITE_RUIDO_DBA') },
    { label: 'Gravity', value: `${fmt(g, 2)} g · day ${missionDay}`, meta: g === 0 ? 'Microgravity' : g < 0.2 ? 'Lunar gravity' : 'Martian gravity', icon: 'gravity' },
    { label: 'Radiation today', value: `${fmt(num(fila.radiacion_msv_dia), 2)} mSv`, meta: hasAlert('EVENTO_RADIACION') ? 'Radiation event' : 'Daily accumulation', icon: 'radiation', attention: hasAlert('EVENTO_RADIACION') },
    { label: 'Mission radiation', value: `${fmt(acc, 0)} of 600 mSv`, meta: `${fmt(acc / 6, 0)}% of limit`, icon: 'gauge', progress: Math.min(100, acc / 6), attention: hasAlert('RADIACION_ACUMULADA') },
    { label: 'Communication', value: delay < 1 ? '< 1 min' : `${fmt(delay, 0)} min`, meta: 'Earth delay', icon: 'signal' },
  ]

  // one decision card per domain with rule alerts (the strongest, clinical rules before generic deviations)
  const rank = (a: EngineAlert) => (LEVEL[a.nivel] ?? 0) * 10 + (a.codigo === 'DESVIACION_PERSISTENTE' ? 0 : 1)
  const byDomain = new Map<string, EngineAlert[]>()
  for (const a of out.alertas.filter(a => !isML(a))) byDomain.set(a.dominio, [...(byDomain.get(a.dominio) ?? []), a])
  const decisions: DecisionVM[] = [...byDomain.entries()]
    .map(([dom, list]) => {
      const top = [...list].sort((a, b) => rank(b) - rank(a))[0]
      const title = ALERT_TITLE[top.codigo] ?? top.codigo.replace(/_/g, ' ').toLowerCase()
      const off = isHealth(dom) ? DOMAIN_VARS[dom].filter(k => (out.z[k] ?? 0) > 2.5).map(k => VAR_TEXT[k].label.replace(/^Your /, '').toLowerCase()) : []
      const text = isHealth(dom)
        ? `${off.length ? `Outside your personal range for several days: ${off.join(', ')}.` : domainDescription(dom, p)}${amb.co2_ppm > 3000 ? ' High cabin CO₂ may be contributing.' : ''}`
        : 'A cabin limit was crossed. Check the life-support readings and the approved procedure.'
      return {
        id: `${dom}:${top.codigo}`, domain: dom, kind: top.nivel === 'ROJO' ? 'critical' as const : 'attention' as const,
        typeLabel: `${isHealth(dom) ? 'MONITORING RULE' : 'ENVIRONMENT LIMIT'} · ${(DOMAIN_WORD[dom] ?? dom).toUpperCase()}`,
        title, text, careKey: careFor(dom, p)[0]?.key ?? null,
        _order: (LEVEL[top.nivel] ?? 0) * 100 + (isHealth(dom) ? 10 : 0) + (top.codigo === 'DESVIACION_PERSISTENTE' ? 0 : 5),
      }
    })
    .sort((a, b) => b._order - a._order)
    .map(({ _order, ...d }) => d)

  // early model notice: the model sees a domain at risk that the rules have not flagged yet
  const candidates = DOMS.filter(d => (ml[d]?.prob_atencion_o_peor ?? 0) >= 0.5 && rulesLevel(out, d) === 0)
    .sort((a, b) => (ml[b]?.prob_atencion_o_peor ?? 0) - (ml[a]?.prob_atencion_o_peor ?? 0))
  const md = candidates[0]
  const modelNotice: ModelNoticeVM | null = md ? {
    domain: md, title: `Early ${DOMAIN_WORD[md]} signal`,
    text: `The model estimates a ${Math.round((ml[md]?.prob_atencion_o_peor ?? 0) * 100)}% chance that your ${DOMAIN_WORD[md]} is declining before the rules confirm it. This is not an alert; it is a notice to monitor. The model cannot declare a critical state.`,
    steps: out.ml?.explicacion.pasos ?? [],
  } : null

  const flagged = domains.filter(d => d.kind === 'attention' || d.kind === 'critical')
  const names = flagged.map(d => DOMAIN_WORD[d.key])
  const list = names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  const critical = flagged.some(d => d.kind === 'critical')
  const headline: [string, string] = names.length
    ? [`Today, ${list}`, critical ? (names.length > 1 ? 'need an urgent review' : 'needs an urgent review') : (names.length > 1 ? 'need your attention' : 'needs your attention')]
    : decisions.length ? ['Today you are within', 'your range; check the cabin'] : ['Today you are within', 'your personal range']
  const overallKind: StatusKind = out.nivel === 'ROJO' ? 'critical' : out.nivel === 'AMARILLO' ? 'attention' : 'normal'
  const healthDecisions = decisions.filter(d => isHealth(d.domain)).length
  const overallNote = healthDecisions ? `${healthDecisions} of 4 domains require a decision`
    : decisions.length ? 'Cabin conditions need a check' : modelNotice ? 'One early model notice to watch' : 'No decisions pending'

  const grief = out.eventos_activos.find(e => e.tipo === 'luto')
  return {
    headline, overallKind, overallLabel: { VERDE: 'Normal', AMARILLO: 'Attention', ROJO: 'Critical' }[out.nivel],
    overallNote, domains, context, decisions, modelNotice, delayMin: delay,
    phase: { Marte: 'Mars surface', Luna: 'Lunar surface', ISS: 'Low Earth orbit' }[p.escenario.entorno] ?? p.escenario.entorno,
    griefDay: grief ? grief.dia + 1 : null,   // the engine reports days elapsed since the event (0 = the day itself)
  }
}
