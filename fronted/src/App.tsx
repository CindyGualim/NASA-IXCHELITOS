import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './components/Icon'
import { StatusMark } from './components/StatusMark'
import type { Zone } from './Body3D'

// three.js only loads when "My body" opens, so the Today screen stays light
const Body3D = lazy(() => import('./Body3D').then(m => ({ default: m.Body3D })))
import { buildToday, careFor, logQuietly, reasonsFor, SCENARIO_KEY, supportApi, useEngineVersion, useIxchelDay, useScenarios, type DayPayload, type DecisionVM, type DomainVM, type LinkStatus, type ModelNoticeVM, type StatusKind, type TodayVM } from './ixchel'
import { sensorAnomaliesFor, situationOf, type Situation } from './care'
import { VoiceBar } from './components/VoiceBar'
import { FloatingCompanion } from './components/FloatingCompanion'
import { onOpenCompanion } from './companionStore'
import { commandOf, useVoice } from './voice'
import { FORMS, GRIEF_PHASES, SENSOR_CHANNELS } from './content'
import { CareView } from './views/CareView'
import { CommanderView } from './views/CommanderView'
import { DailyCheckView, FormRunner } from './views/DailyCheckView'
import { DecisionLogView } from './views/DecisionLogView'
import { EnvironmentView } from './views/EnvironmentView'
import { ModelMetrics } from './views/ModelMetrics'
import { TimelineView } from './views/TimelineView'
import type { ViewName, ViewProps } from './views/shared'

// Live connection to the Ixchel engine, shared with the simulation bar.
const EngineCtx = createContext<{ status: LinkStatus; today: TodayVM | null }>({ status: 'idle', today: null })

type Scenario = 'Nominal' | 'Cumulative fatigue' | 'Grief support' | 'Emergency'
type Decision = 'applied' | 'postponed' | 'discarded' | null
type StepState = 'done' | 'postponed' | 'not-applicable' | null
type View = ViewName
type BodyRegion = 'head' | 'eyes' | 'neck' | 'torso' | 'arms' | 'legs'

const navigation = [
  { label: 'Today', icon: 'home' as const, active: true },
  { label: 'Daily check', icon: 'check' as const },
  { label: 'Timeline', icon: 'clock' as const },
  { label: 'My body', icon: 'pulse' as const },
  { label: 'Environment', icon: 'scan' as const },
  { label: 'Care', icon: 'wellness' as const },
  { label: 'Decision log', icon: 'kit' as const },
]

const contextItems = [
  { label: 'Air', value: 'CO₂ 3,180 ppm', meta: 'High', icon: 'air', attention: true },
  { label: 'Noise', value: '58 dBA', meta: 'Last 2 hours', icon: 'sound' },
  { label: 'Gravity', value: '0 g · day 87', meta: 'Microgravity', icon: 'gravity' },
  { label: 'Radiation today', value: '0.62 mSv', meta: 'Daily accumulation', icon: 'radiation' },
  { label: 'Mission radiation', value: '214 of 600 mSv', meta: '36% of limit', icon: 'gauge', progress: 36 },
  { label: 'Communication', value: '12 min', meta: 'Earth delay', icon: 'signal' },
] as const

// Sample values shown when the engine API is not running.
const sampleDomains: DomainVM[] = [
  { key: 'sueno', title: 'Sleep', kind: 'attention', status: 'Attention', description: '5.4 h average this week; your personal norm is 7.1 h.', trend: 'down', values: [] },
  { key: 'psico', title: 'Mood', kind: 'attention', status: 'Attention', description: 'Fewer messages and more tension than your personal average.', trend: 'down', values: [] },
  { key: 'fisico', title: 'Body', kind: 'normal', status: 'Normal', description: 'Exercise and vital signs are within your personal range.', trend: 'stable', values: [] },
  { key: 'social', title: 'Connection', kind: 'empty', status: 'No data yet', description: '11 days remain before your personal baseline is ready.', trend: 'empty', values: [] },
]
const sampleDecisions: DecisionVM[] = [
  { id: 'sample', domain: 'sueno', kind: 'attention', typeLabel: 'MONITORING RULE · SLEEP', title: 'Cumulative fatigue', text: 'You have slept less than 6 hours for 3 days and shown more attention errors. Cabin noise and high CO₂ may be contributing.', careKey: 'siesta_ancla' },
]
const sampleNotice: ModelNoticeVM = { domain: 'sueno', title: 'Early sleep signal', text: 'The model detects a decline in your rest before the rules confirm it. This is not an alert; it is a notice to monitor. The model cannot declare a critical state.', steps: [] }
const sampleReasons = [
  ['Your sleep this week:', '5.4 h average.', 'Your norm:', '7.1 h.'],
  ['Your attention errors:', '4.2 per day.', 'Your norm:', '1.5.'],
  ['Cabin CO₂:', '3,180 ppm,', 'above the notice threshold of', '3,000.'],
]
const sampleCare = [
  { key: 'siesta_ancla', title: 'Anchor nap', duration: '90 min', tag: 'Worked for you 3 of 4 times', copy: 'Creates a protected recovery window before your next duty period.' },
  { key: 'luz_460nm', title: '460 nm blue light', duration: '30 min · morning', tag: '', copy: 'Supports your planned morning light exposure and circadian timing.' },
  { key: 'reorganizar_turnos', title: 'Reorganize shifts', duration: 'Next 24 h', tag: '', copy: 'Moves high-attention tasks away from your lowest-rest period.' },
]
const DOMAIN_UPPER: Record<string, string> = { sueno: 'SLEEP', psico: 'MOOD', fisico: 'BODY', social: 'CONNECTION', ambiente: 'CABIN' }

function ContextIcon({ name }: { name: string }) {
  if (name === 'radiation') return <Icon name="radiation" />
  if (name === 'gauge') return <Icon name="pulse" />
  if (name === 'air') return <><path d="M3 8h10a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h7" /></>
  if (name === 'sound') return <><path d="M5 10v4h3l4 3V7L8 10Z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></>
  if (name === 'gravity') return <><circle cx="12" cy="7" r="3" /><path d="M12 10v10M7 14h10" /></>
  return <><path d="M5 16a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 10a2 2 0 0 1 2 0" /><circle cx="12" cy="19" r="1" /></>
}

function Trend({ direction, empty = false, values = [] }: { direction: 'down' | 'stable'; empty?: boolean; values?: number[] }) {
  if (empty) return <div className="baseline-progress"><span style={{ width: '63%' }} /></div>
  // values = engine domain score for the last days (higher = worse), drawn so that worse goes down
  const top = Math.max(4, ...values)
  const real = values.length > 1 ? values.map((v, i) => [2 + (108 * i) / (values.length - 1), 4 + (36 * Math.max(0, v)) / top] as const) : null
  const points = real ? real.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ') : direction === 'down' ? '2,8 20,11 38,12 56,20 74,24 92,35 110,39' : '2,23 20,21 38,24 56,20 74,22 92,20 110,22'
  const endY = real ? real[real.length - 1][1].toFixed(1) : direction === 'down' ? '39' : '22'
  return (
    <svg className={`trend-line ${direction}`} viewBox="0 0 112 44" role="img" aria-label={direction === 'down' ? 'Downward trend over seven days' : 'Stable trend over seven days'}>
      <path d="M2 42H110" />
      <polyline points={points} />
      <circle cx="110" cy={endY} r="3" />
    </svg>
  )
}

function DomainCard({ title, kind, status, description, trend, values }: { title: string; kind: StatusKind; status: string; description: string; trend: 'down' | 'stable' | 'empty'; values?: number[] }) {
  return (
    <article className={`domain-card ${kind}`}>
      <div className="domain-card-head">
        <p>{title}</p>
        <StatusMark kind={kind} />
      </div>
      <div className="domain-status"><span>{status}</span></div>
      <p className="domain-description">{description}</p>
      <div className="domain-trend">
        <div><small>{trend === 'empty' ? 'Personal baseline' : 'Last 7 days'}</small><strong>{trend === 'down' ? 'Declining' : trend === 'stable' ? 'Stable' : 'Day 19 of 30'}</strong></div>
        <Trend direction={trend === 'stable' ? 'stable' : 'down'} empty={trend === 'empty'} values={values} />
      </div>
    </article>
  )
}

function App() {
  const [scenario, setScenarioRaw] = useState<Scenario>('Cumulative fatigue')
  const [missionDay, setMissionDay] = useState(87)
  const version = useEngineVersion()          // bumps after every write: everything re-reads the engine
  const { data, status } = useIxchelDay(scenario, missionDay, version)
  const scenarios = useScenarios()
  const today = data ? buildToday(data, missionDay) : null
  const setScenario = (value: Scenario) => {
    setScenarioRaw(value)
    // Grief support: jump to the fourth day after the simulated loss, when the support protocol is active
    const loss = value === 'Grief support' ? scenarios.find(s => s.clave === 'duelo')?.eventos.find(e => e.tipo === 'luto') : undefined
    if (loss) setMissionDay(Math.min(180, loss.inicio + 4))
  }
  return (
    <EngineCtx.Provider value={{ status, today }}>
      <Screens scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} data={data} today={today} version={version} />
      <FloatingCompanion />
    </EngineCtx.Provider>
  )
}

function Screens({ scenario, setScenario, missionDay, setMissionDay, data, today, version }: {
  scenario: Scenario
  setScenario: (value: Scenario) => void
  missionDay: number
  setMissionDay: (value: number) => void
  data: DayPayload | null
  today: TodayVM | null
  version: number
}) {
  const decisionCards = today ? today.decisions : sampleDecisions
  const modelNotice = today ? today.modelNotice : sampleNotice
  const domainCards = today ? today.domains : sampleDomains
  const { status } = useContext(EngineCtx)
  // support layer: only when the engine answers and the scenario is simulated by the engine
  const scenarioKey = status === 'offline' ? null : SCENARIO_KEY[scenario] ?? null
  const api = scenarioKey ? supportApi(scenarioKey) : null
  const t = missionDay - 1
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const decisionOf = (id: string) => decisions[`${missionDay}:${id}`] ?? null
  const setDecisionFor = (id: string, value: Decision, extra: { contramedida?: string; arm?: string; motivo?: string } = {}) => {
    setDecisions(current => ({ ...current, [`${missionDay}:${id}`]: value }))
    if (!api || !value) return
    const card = decisionCards.find(c => c.id === id)
    const domain = card?.domain ?? (id.startsWith('model:') ? id.slice(6) : 'sueno')
    const first = value === 'applied' && data ? careFor(domain, data)[0] : undefined
    // the engine's bandit learns from the countermeasure that was really applied (arm key)
    logQuietly(api.decision(t, { tarjeta: id, dominio: domain, titulo: card?.title ?? modelNotice?.title ?? id, decision: value,
      contramedida: extra.contramedida ?? first?.title, arm: extra.arm ?? first?.key, motivo: extra.motivo }))
  }
  // the engine says whether today's daily check is in (it survives reloads and API restarts)
  const checkedToday = Boolean(today?.checkinToday)
  const [detailId, setDetailId] = useState<string | null>(null)
  const detailOpen = detailId !== null
  const setDetailOpen = (open: boolean) => setDetailId(open ? (decisionCards[0]?.id ?? null) : null)
  const [notice, setNotice] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('armor-theme') === 'dark')
  const [selectedCare, setSelectedCare] = useState('Anchor nap')
  const [dismissOpen, setDismissOpen] = useState(false)
  const [dismissReason, setDismissReason] = useState('')
  const [protocolPaused, setProtocolPaused] = useState(false)
  const [protocolSteps, setProtocolSteps] = useState<Record<string, StepState>>({})
  const [griefForm, setGriefForm] = useState(false)
  const [view, setView] = useState<View>('Today')
  const [postEmergency, setPostEmergency] = useState(false)
  const [emergencyReported, setEmergencyReported] = useState(false)
  const [bodyRegion, setBodyRegion] = useState<BodyRegion>('torso')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3600) }
  const viewProps: ViewProps = {
    scenarioKey, missionDay, delayMin: today?.delayMin ?? 12, setMissionDay, version,
    goTo: (v: ViewName) => { setView(v); setDetailId(null) }, notify,
  }
  // GP2 phase for the grief protocol (sample data: day 4 = phase N2)
  const griefDay = today ? today.griefDay : 4
  const griefPhase = GRIEF_PHASES.find(p => griefDay != null && griefDay - 1 >= p.from && griefDay - 1 <= p.to) ?? GRIEF_PHASES[1]
  const setStep = (index: number, state: StepState) => {
    const key = `${griefPhase.id}-${index + 1}`
    setProtocolSteps(current => ({ ...current, [key]: state }))
    if (api && state) logQuietly(api.protocolStep(t, 'GP2', key, state))
  }

  // Decision detail: a rule card ("sueno:FATIGA_CRONICA") or the model notice ("model:sueno")
  const detailIsModel = detailId?.startsWith('model:') ?? false
  const detailCard = detailIsModel ? null : decisionCards.find(card => card.id === detailId) ?? null
  const detailDomain = detailIsModel ? detailId!.slice(6) : detailCard?.domain ?? 'sueno'
  const detailReasons = data ? reasonsFor(detailDomain, data).map(r => r.parts) : sampleReasons
  const detailCare = data ? careFor(detailDomain, data) : sampleCare
  const detailKey = detailId ?? 'sample'
  const openDetail = (id: string, domain: string) => {
    setDetailId(id)
    const options = data ? careFor(domain, data) : sampleCare
    if (options[0]) setSelectedCare(options[0].title)
  }

  // leaving the Emergency scenario closes the 72-hour window, so the sidebar and scenarios work again
  useEffect(() => {
    if (scenario !== 'Emergency') { setPostEmergency(false); setEmergencyReported(false) }
  }, [scenario])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem('armor-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const navigate = (label: string) => {
    setView(label as View)
    setDetailOpen(false)
  }
  // tapping the floating companion opens the conversation (outside the emergency checklist)
  useEffect(() => onOpenCompanion(() => { if (scenario === 'Emergency' && !postEmergency) return; setView('Care'); setDetailId(null) }), [scenario, postEmergency])

  if (scenario === 'Emergency' && !postEmergency) {
    // the emergency is reported to the engine (event "emergencia"): it opens the 72-hour window,
    // pauses baseline adaptation and adds the post-emergency protocol to the following days
    const reportEmergency = (nota: string) => {
      if (!api || emergencyReported) return
      setEmergencyReported(true)
      logQuietly(api.event(t, 'emergencia', nota))
      logQuietly(api.report(t, 'Emergency reported on board', 'emergency'))
    }
    return <EmergencyView onComplete={() => { reportEmergency('Emergency steps completed'); setPostEmergency(true) }} onExit={() => setScenario('Cumulative fatigue')}
      onNotify={() => { reportEmergency('Commander notified from emergency mode'); setNotice('Commander notified. An emergency report is on its way to Earth.') }} />
  }

  if (postEmergency && view === 'Today' && !detailOpen) {
    return (
      <StandardShell darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} activeItem="Today" onNavigate={navigate} title="72-Hour Window" code="POST-INCIDENT.MONITOR" center={`RECOVERY OBSERVATION · DAY ${(today?.emergencyDay ?? 0) + 1} OF 3 · ${today?.emergencyDay != null ? 'REPORTED TO IXCHEL' : 'LOCAL ONLY'}`}>
        <PostEmergencyView onClose={() => { setPostEmergency(false); setScenario('Cumulative fatigue'); setView('Today') }} />
      </StandardShell>
    )
  }

  if (scenario === 'Grief support' && view === 'Today' && !detailOpen) {
    return (
      <div className="armor-shell protocol-shell">
        <SystemBar darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} />
        <Sidebar muted activeItem="Today" onNavigate={navigate} />
        <TopSimulation scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} />
        <main className="armor-main protocol-main" id="main">
          <div className="window-titlebar">
            <div className="window-app"><span><Icon name="heart" /></span><div><strong>Active Support</strong><small>ARMOR / SUPPORT.PROTOCOL</small></div></div>
            <div className="window-center">PRIVATE CARE SPACE · CREW MEMBER 04</div>
            <div className="window-controls" aria-label="Window controls"><button aria-label="Minimize">—</button><button aria-label="Fit window">□</button><button aria-label="Active window">●</button></div>
          </div>
          <div className="protocol-accent" />
          <section className="protocol-header">
            <div className="protocol-heart"><Icon name="heart" /></div>
            <div><p className="screen-kicker">SUPPORT PROTOCOL</p><h1>{!today ? 'Active support · day 4 of 30' : today.griefDay ? `Active support · day ${today.griefDay} of 30` : `Active support · starts on mission day ${(data?.escenario.eventos.find(e => e.tipo === 'luto')?.inicio ?? 0) + 1}`}</h1><p>{protocolPaused ? 'Support is paused. Your progress and choices remain saved.' : 'This space keeps the focus on care, not measurement.'}</p></div>
            <button className="secondary-action" onClick={() => setProtocolPaused(value => !value)}>{protocolPaused ? 'Resume' : 'Pause'}</button>
          </section>
          <section className="protocol-message">
            <Icon name="heart" />
            <p>For now, I am not comparing you with your personal norm.<br /><strong>Take all the time you need.</strong></p>
          </section>
          <section className="protocol-content">
            <div className="protocol-checklist">
              <div className="section-title-row"><div><p className="screen-kicker">TODAY'S SUPPORT · PHASE {griefPhase.id} · {griefPhase.window.toUpperCase()}</p><h2>{griefPhase.goal}</h2></div><span className="pending-content">Protocol GP2 · proposal for clinical review</span></div>
              {griefPhase.steps.map((text, index) => {
                const state = protocolSteps[`${griefPhase.id}-${index + 1}`] ?? null
                return (
                  <article className="protocol-step" key={text}>
                    <span className="protocol-step-number">{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{text}</strong><p>{state === 'done' ? 'Done. Thank you.' : state === 'postponed' ? 'Postponed. It will come back tomorrow.' : state === 'not-applicable' ? 'Marked as not applicable.' : 'At your pace. You can skip it.'}</p></div>
                    <div className="step-states" aria-label={`Status for support step ${index + 1}`}>
                      <button className={state === 'done' ? 'active' : ''} onClick={() => setStep(index, 'done')}><Icon name="check" />Done</button>
                      <button className={state === 'postponed' ? 'active' : ''} onClick={() => setStep(index, 'postponed')}><Icon name="clock" />Postponed</button>
                      <button className={state === 'not-applicable' ? 'active' : ''} onClick={() => setStep(index, 'not-applicable')}>— Not applicable</button>
                    </div>
                  </article>
                )
              })}
              <div className="grief-check-row">
                <div><strong>One-minute grief check</strong><span>Follows how the grief is going. Acute grief is not a disorder.</span></div>
                <button className="secondary-action" onClick={() => setGriefForm(open => !open)}>{griefForm ? 'Close' : 'Start grief check'}</button>
              </div>
              {griefForm && <FormRunner form={FORMS.duelo_diario} onClose={() => setGriefForm(false)} onSubmit={async (answers) => {
                if (!api) throw new Error('Ixchel engine offline')
                return api.form(t, 'duelo_diario', answers)
              }} />}
            </div>
            <aside className="family-card">
              <span className="family-icon"><Icon name="users" /></span>
              <p className="screen-kicker">PERSONAL CONNECTION</p>
              <h2>Message your family</h2>
              <p>Your message will arrive in {today ? (today.delayMin < 1 ? 'less than a minute' : `${Math.round(today.delayMin)} minutes`) : '12 minutes'}. This delay is part of the space you share, not a barrier to it.</p>
              <button className="primary-action" onClick={() => { if (api) logQuietly(api.event(t, 'family_message', 'Family message queued')); notify('Family message queued. It travels with the next link window.') }}>Write</button>
              <button className="tertiary-action" onClick={() => setView('Care')}>Open Care</button>
            </aside>
          </section>
          <div className="protocol-reminder"><Icon name="clock" /><strong>Reminder:</strong> we will review this together on day 14.</div>
        </main>
        {notice && <div className="toast" role="status"><Icon name="check" />{notice}</div>}
        <SafetyFooter />
      </div>
    )
  }

  if (detailOpen) {
    return (
      <div className="armor-shell detail-shell">
        <SystemBar darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} />
        <Sidebar activeItem="Today" onNavigate={navigate} />
        <TopSimulation scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} />
        <main className="armor-main detail-main" id="main">
          <div className="window-titlebar">
            <div className="window-app"><span><Icon name="alert" /></span><div><strong>Decision Detail</strong><small>ARMOR / EXPLAIN.DECIDE</small></div></div>
            <div className="window-center">{DOMAIN_UPPER[detailDomain] ?? 'SLEEP'} · {detailIsModel ? 'EARLY MODEL NOTICE' : detailCard?.kind === 'critical' ? 'RULE-BASED CRITICAL' : 'RULE-BASED ATTENTION'}</div>
            <div className="window-controls" aria-label="Window controls"><button aria-label="Minimize">—</button><button aria-label="Fit window">□</button><button aria-label="Active window">●</button></div>
          </div>
          <div className="detail-content">
            <button className="back-button" onClick={() => setDetailOpen(false)}><Icon name="chevron" /> Back to Today</button>
            <header className="detail-header">
              <div><p className="screen-kicker">EXPLAINED DECISION</p><h1>{detailIsModel ? modelNotice?.title ?? 'Early model notice' : detailCard?.title ?? 'Cumulative fatigue'}</h1><p>ARMOR is showing the conditions behind this state. You remain in control of the decision.</p></div>
              <div className="attention-label"><StatusMark kind={detailIsModel ? 'model' : detailCard?.kind ?? 'attention'} size="lg" /><span>{detailIsModel ? 'Early notice' : detailCard?.kind === 'critical' ? 'Critical' : 'Attention'}</span></div>
            </header>

            <section className="why-section" aria-labelledby="why-title">
              <p className="screen-kicker">TRACEABLE REASONING</p>
              <h2 id="why-title">Why I am telling you this</h2>
              <div className="reason-chain">
                {detailReasons.map(([label, value, normLabel, norm], index) => (
                  <div key={label}><span>{index + 1}</span><p>{label} <strong>{value}</strong> {normLabel} <strong>{norm}</strong></p></div>
                ))}
                {detailIsModel && modelNotice?.steps.map((step, index) => (
                  <div key={step}><span>{detailReasons.length + index + 1}</span><p>Model decision path: <strong>{step}</strong></p></div>
                ))}
              </div>
              <div className="reason-result"><Icon name="alert" /><span>Therefore:</span><strong>{detailIsModel ? 'Early notice on' : detailCard?.kind === 'critical' ? 'Critical review of' : 'Attention on'} {(DOMAIN_UPPER[detailDomain] ?? 'SLEEP').toLowerCase()}</strong></div>
            </section>

            <section className="no-action-card">
              <div className="no-action-icon"><Icon name="clock" /></div>
              {detailDomain === 'sueno'
                ? <div><p className="screen-kicker">IF YOU DO NOTHING</p><h2>Fatigue may continue to accumulate</h2><p>Based on your recent pattern, shorter sleep may lead to more attention errors over the next day. This is a trajectory, not a diagnosis, and you can review the decision at any time.</p></div>
                : <div><p className="screen-kicker">IF YOU DO NOTHING</p><h2>This pattern may continue</h2><p>Based on your recent pattern, these measures may keep moving away from your personal norm. This is a trajectory, not a diagnosis, and you can review the decision at any time.</p></div>}
            </section>

            {detailCare.length > 0 && <section className="care-section" aria-labelledby="care-title">
              <div className="section-title-row"><div><p className="screen-kicker">PERSONAL COUNTERMEASURES</p><h2 id="care-title">What you can do</h2></div><span className="updated-label">Select one option</span></div>
              <div className="care-options">
                {detailCare.map(option => (
                  <button key={option.title} className={selectedCare === option.title ? 'care-option selected' : 'care-option'} onClick={() => setSelectedCare(option.title)}>
                    <span className="care-select"><Icon name="check" /></span>
                    {option.tag && <small>{option.tag}</small>}
                    <h3>{option.title}</h3>
                    <strong>{option.duration}</strong>
                    <p>{option.copy}</p>
                  </button>
                ))}
              </div>
            </section>}

            {dismissOpen && (
              <section className="dismiss-panel">
                <div><p className="screen-kicker">REASON REQUIRED</p><h2>Why are you dismissing this recommendation?</h2><p>Your reason becomes part of the decision log and helps preserve clinical context.</p></div>
                <label>Reason<textarea value={dismissReason} onChange={event => setDismissReason(event.target.value)} rows={3} placeholder="Enter a brief reason…" required /></label>
                <div><button className="tertiary-action" onClick={() => setDismissOpen(false)}>Cancel</button><button className="primary-action" disabled={!dismissReason.trim()} onClick={() => { setDecisionFor(detailKey, 'discarded', { motivo: dismissReason }); setDismissOpen(false); setDismissReason(''); setNotice('Recommendation dismissed and reason recorded.') }}>Record dismissal</button></div>
              </section>
            )}
          </div>
          <div className="detail-decision-bar">
            <div><small>SELECTED COUNTERMEASURE</small><strong>{selectedCare}</strong></div>
            <button className="primary-action" onClick={() => { setDecisionFor(detailKey, 'applied', { contramedida: selectedCare, arm: detailCare.find(o => o.title === selectedCare)?.key }); setNotice(`${selectedCare} applied. Ixchel will learn from how you respond.`) }}>Apply</button>
            <button className="secondary-action" onClick={() => { setDecisionFor(detailKey, 'postponed'); setNotice('Decision postponed until tomorrow.') }}>Postpone until tomorrow</button>
            <button className="tertiary-action" onClick={() => setDismissOpen(true)}>Dismiss</button>
          </div>
        </main>
        {notice && <div className="toast" role="status"><Icon name="check" />{notice}</div>}
        <SafetyFooter />
      </div>
    )
  }

  if (view === 'Daily check') {
    return (
      <StandardShell darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} activeItem="Daily check" onNavigate={navigate} title="Daily Check" code="CHECKIN.30SEC" center="PRIVATE SELF-REPORT · CREW MEMBER 04">
        <DailyCheckView {...viewProps} scenario={scenario} today={today} data={data} safetyActive={Boolean(today?.safety)} checkedToday={checkedToday} />
        {notice && <div className="toast" role="status"><Icon name="check" />{notice}</div>}
      </StandardShell>
    )
  }

  const SECTIONS: Partial<Record<View, { title: string; code: string; center: string; body: ReactNode }>> = {
    Timeline: { title: 'Timeline', code: 'MISSION.HISTORY', center: `MISSION DAY ${missionDay} OF 180 · CREW MEMBER 04`, body: <TimelineView {...viewProps} /> },
    Environment: { title: 'Environment', code: 'CABIN.CONTEXT', center: 'CABIN CONDITIONS · RULE OUT FIRST', body: <EnvironmentView {...viewProps} /> },
    Care: { title: 'Care', code: 'SUPPORT.HUB', center: 'PRIVATE CARE SPACE · CREW MEMBER 04', body: <CareView {...viewProps} scenario={scenario} today={today} data={data} /> },
    'Decision log': { title: 'Decision Log', code: 'RECORD.ASYNC', center: 'YOUR DECISIONS · REPORTS TO EARTH', body: <DecisionLogView {...viewProps} /> },
    'Commander view': { title: 'Commander View', code: 'COMMAND.SUMMARY', center: 'OPERATIONAL CAPACITY · CONFIDENTIAL', body: <CommanderView {...viewProps} today={today} data={data} /> },
  }
  const section = SECTIONS[view]
  if (section) {
    return (
      <StandardShell darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} activeItem={view} onNavigate={navigate} title={section.title} code={section.code} center={section.center}>
        {section.body}
        {notice && <div className="toast" role="status"><Icon name="check" />{notice}</div>}
      </StandardShell>
    )
  }

  if (view === 'My body') {
    return (
      <StandardShell darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} activeItem="My body" onNavigate={navigate} title="My Body" code="DIGITAL.TWIN" center="INTERACTIVE BODY MAP · CREW MEMBER 04">
        <BodyView region={bodyRegion} setRegion={setBodyRegion} domains={today?.domains} missionDay={missionDay} situation={situationOf(scenario, today)} data={data} />
      </StandardShell>
    )
  }

  if (view === 'How to read this') {
    return (
      <StandardShell darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} activeItem="How to read this" onNavigate={navigate} title="How to Read ARMOR" code="SYSTEM.GUIDE" center="TRUST, LIMITS, AND SYSTEM STATES">
        <GuideView />
      </StandardShell>
    )
  }

  return (
    <div className="armor-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <SystemBar darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} />
      <Sidebar activeItem="Today" onNavigate={navigate} />

      <TopSimulation scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} />

      <main className="armor-main" id="main">
        <div className="window-titlebar">
          <div className="window-app"><span><Icon name="heart" /></span><div><strong>Health Operations</strong><small>ARMOR / TODAY.OPS</small></div></div>
          <div className="window-center">CREW MEMBER 04 · ELENA VEGA</div>
          <div className="window-controls" aria-label="Window controls"><button aria-label="Minimize">—</button><button aria-label="Fit window">□</button><button aria-label="Active window">●</button></div>
        </div>
        <section className="context-band" aria-labelledby="context-title">
          <div className="context-band-title"><span>CONTEXT</span><strong id="context-title">Conditions that may influence you today</strong></div>
          <div className="context-grid">
            {(today ? today.context : contextItems).map(item => (
              <div className="context-item" key={item.label}>
                <div className="context-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ContextIcon name={item.icon} /></svg></div>
                <div><small>{item.label}</small><strong>{item.value}</strong><span className={'attention' in item && item.attention ? 'context-meta attention' : 'context-meta'}>{'attention' in item && item.attention && <StatusMark kind="attention" size="sm" />}{item.meta}</span>{'progress' in item && <div className="context-progress"><i style={{ width: `${item.progress}%` }} /></div>}</div>
              </div>
            ))}
          </div>
        </section>

        <header className="today-header">
          <div><p className="screen-kicker">DAILY STATUS · {missionDay.toString().padStart(3, '0')}</p><h1>{today ? today.headline[0] : 'Today, sleep and mood'}<br />{today ? today.headline[1] : 'need your attention'}</h1><p>Compared with your personal norm, measured during the {today ? 40 : 30} days before the mission.</p></div>
          <div className={`global-state ${today ? today.overallKind : 'attention'}`}><StatusMark kind={today ? today.overallKind : 'attention'} size="lg" /><div><small>OVERALL STATUS</small><strong>{today ? today.overallLabel : 'Attention'}</strong><span>{today ? today.overallNote : '2 of 4 domains require a decision'}</span></div></div>
        </header>

        <section aria-labelledby="domains-title">
          <div className="section-title-row"><div><p className="screen-kicker">YOUR TRAJECTORY</p><h2 id="domains-title">What changed since yesterday</h2></div><span className="updated-label"><Icon name="clock" /> {today ? `Ixchel engine · day ${missionDay}` : 'Updated 06:40'}</span></div>
          <div className="domain-grid">
            {domainCards.map(card => <DomainCard key={card.key} title={card.title} kind={card.kind} status={card.status} description={card.description} trend={card.trend} values={card.values} />)}
          </div>
        </section>

        <section className="actions-section" aria-labelledby="actions-title">
          <div className="section-title-row"><div><p className="screen-kicker">ONE DECISION AT A TIME</p><h2 id="actions-title">What you can do today</h2></div><span className="action-count">{decisionCards.length + (modelNotice ? 1 : 0)} pending action{decisionCards.length + (modelNotice ? 1 : 0) === 1 ? '' : 's'}</span></div>

          {today?.safety && <article className="decision-card critical safety-banner" onClick={() => setView('Daily check')}>
            <div className="decision-icon"><StatusMark kind="critical" size="lg" /></div>
            <div className="decision-content">
              <span className="decision-type">SAFETY FIRST · PROTOCOL GP3</span>
              <h3>You are not alone. Support is on its way.</h3>
              <p>Your crew medical officer and the flight surgeon have been notified. A crewmate can be with you right now, and your safety plan is one tap away.</p>
            </div>
            <div className="decision-actions compact" onClick={event => event.stopPropagation()}>
              <button className="primary-action" onClick={() => { if (api) logQuietly(api.event(t, 'peer_support_request', 'Asked a crewmate to stay with me')); notify('Your support crewmate has been called.') }}>Ask a crewmate now</button>
              <button className="secondary-action" onClick={() => setView('Daily check')}>Open safety support</button>
            </div>
          </article>}

          {!checkedToday && <article className="decision-card checkin-prompt" onClick={() => setView('Daily check')}>
            <div className="decision-icon"><StatusMark kind="protocol" size="lg" /></div>
            <div className="decision-content">
              <span className="decision-type">YOUR VOICE · ABOUT ONE MINUTE</span>
              <h3>How are you, really?</h3>
              <p>Sensors cannot tell how something feels. Seven quick ratings and one safety question let Ixchel compare you with your own norm and offer the right support.</p>
            </div>
            <div className="decision-actions compact" onClick={event => event.stopPropagation()}>
              <button className="primary-action" onClick={() => setView('Daily check')}>Start daily check</button>
              <button className="tertiary-action" onClick={() => setView('Care')}>Go to Care</button>
            </div>
          </article>}

          {decisionCards.length === 0 && !modelNotice && <p className="domain-description">Nothing to decide today. Ixchel keeps comparing you with your personal norm.</p>}

          {decisionCards.map(card => {
            const decision = decisionOf(card.id)
            const care = data ? careFor(card.domain, data)[0] : sampleCare[0]
            return (
              <article key={card.id} className={`decision-card ${card.kind}`} onClick={() => openDetail(card.id, card.domain)}>
                <div className="decision-icon"><StatusMark kind={card.kind} size="lg" /></div>
                <div className="decision-content">
                  <span className="decision-type">{card.typeLabel}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <button className="why-link" onClick={event => { event.stopPropagation(); openDetail(card.id, card.domain) }}>See why <Icon name="chevron" /></button>
                </div>
                <div className="decision-actions" onClick={event => event.stopPropagation()}>
                  {decision ? <div className="decision-recorded"><Icon name="check" /><div><strong>Decision recorded</strong><span>{decision === 'applied' ? `${care?.title ?? 'Action'} applied` : decision === 'postponed' ? 'Postponed for later review' : 'Dismissed; reason pending'}</span></div><button onClick={() => setDecisionFor(card.id, null)}>Change</button></div> :
                  <>{care ? <button className="primary-action" onClick={() => setDecisionFor(card.id, 'applied')}>Apply {care.title.charAt(0).toLowerCase() + care.title.slice(1)}</button> : <button className="primary-action" onClick={() => setDecisionFor(card.id, 'applied')}>Mark as checked</button>}<button className="secondary-action" onClick={() => setDecisionFor(card.id, 'postponed')}>Postpone</button><button className="tertiary-action" onClick={() => setDecisionFor(card.id, 'discarded')}>Dismiss</button></>}
                </div>
              </article>
            )
          })}

          {modelNotice && <article className="decision-card model">
            <div className="decision-icon"><StatusMark kind="model" size="lg" /></div>
            <div className="decision-content">
              <span className="model-label"><StatusMark kind="model" size="sm" /> EARLY MODEL NOTICE</span>
              <h3>{modelNotice.title}</h3>
              <p>{modelNotice.text}</p>
            </div>
            <div className="decision-actions compact">
              <button className="secondary-action" onClick={() => setNotice('Notice marked as understood.')}>Understood</button>
              <button className="tertiary-action" onClick={() => openDetail(`model:${modelNotice.domain}`, modelNotice.domain)}>View detail</button>
            </div>
          </article>}
        </section>
      </main>
      {notice && <div className="toast" role="status"><Icon name="check" />{notice}</div>}
      <SafetyFooter />
    </div>
  )
}

function StandardShell({ darkMode, toggleTheme, scenario, setScenario, missionDay, setMissionDay, activeItem, onNavigate, title, code, center, children }: {
  darkMode: boolean
  toggleTheme: () => void
  scenario: Scenario
  setScenario: (value: Scenario) => void
  missionDay: number
  setMissionDay: (value: number) => void
  activeItem: string
  onNavigate: (label: string) => void
  title: string
  code: string
  center: string
  children: ReactNode
}) {
  return (
    <div className="armor-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <SystemBar darkMode={darkMode} toggleTheme={toggleTheme} />
      <Sidebar activeItem={activeItem} onNavigate={onNavigate} />
      <TopSimulation scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} />
      <main className="armor-main secondary-main" id="main">
        <div className="window-titlebar">
          <div className="window-app"><span><Icon name="heart" /></span><div><strong>{title}</strong><small>ARMOR / {code}</small></div></div>
          <div className="window-center">{center}</div>
          <div className="window-controls" aria-label="Window controls"><button aria-label="Minimize">—</button><button aria-label="Fit window">□</button><button aria-label="Active window">●</button></div>
        </div>
        {children}
      </main>
      <SafetyFooter />
    </div>
  )
}

const EMERGENCY_STEPS = [
  { title: 'Move to the nearest safe position', copy: 'Stop the current task. Secure yourself and keep one hand free.' },
  { title: 'Confirm breathing and responsiveness', copy: 'Check that the crew member can breathe, respond, and follow a simple instruction.' },
  { title: 'Open the approved emergency protocol', copy: 'Continue with the mission-approved protocol for the observed emergency.' },
]

function EmergencyView({ onComplete, onExit, onNotify }: { onComplete: () => void; onExit: () => void; onNotify: () => void }) {
  const steps = EMERGENCY_STEPS
  const [step, setStep] = useState(0)
  const [holding, setHolding] = useState(false)
  const [notified, setNotified] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // hands may be busy or hurt: every step is read aloud and answered by voice
  const voice = useVoice(true)
  const stepRef = useRef(step)
  stepRef.current = step
  const advance = () => { if (stepRef.current === steps.length - 1) onComplete(); else setStep(v => v + 1) }
  const readStep = (i: number) => voice.say(`Step ${i + 1} of ${steps.length}. ${steps[i].title}. ${steps[i].copy} Say "done" when you are ready, or "repeat".`)
  useEffect(() => { readStep(step) }, [step, voice.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    voice.listen(text => {
      const cmd = commandOf(text)
      if (cmd === 'next') advance()
      else if (cmd === 'repeat') readStep(stepRef.current)
      else if (cmd === 'back') setStep(v => Math.max(0, v - 1))
      else if (cmd === 'notify') { setNotified(true); onNotify(); voice.say('Commander notified. An emergency report is on its way to Earth.') }
    })
    return voice.stopListening
  }, [voice.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  const startExit = () => {
    setHolding(true)
    holdTimer.current = setTimeout(onExit, 3000)
  }
  const cancelExit = () => {
    setHolding(false)
    if (holdTimer.current) clearTimeout(holdTimer.current)
  }
  return (
    <div className="emergency-view">
      <header className="emergency-header"><span className="critical-octagon">!</span><strong>EMERGENCY</strong><span>IMMEDIATE DANGER · FOLLOW ONE STEP AT A TIME</span></header>
      <main className="emergency-stage">
        <div className="emergency-progress">STEP {step + 1} OF {steps.length}</div>
        <section className="emergency-current">
          <span>{String(step + 1).padStart(2, '0')}</span>
          <h1>{steps[step].title}</h1>
          <p>{steps[step].copy}</p>
          <button className="emergency-next" onClick={advance}><Icon name="check" /> Done, next step</button>
          <VoiceBar voice={voice} hint='Say "done", "repeat", "back" or "notify commander"' onRepeat={() => readStep(step)} />
        </section>
        <div className="emergency-upcoming" aria-label="Upcoming emergency steps">
          {steps.slice(step + 1).map((item, index) => <div key={item.title}><span>{String(step + index + 2).padStart(2, '0')}</span><strong>{item.title}</strong></div>)}
        </div>
      </main>
      <div className="emergency-utilities">
        <button onClick={() => { setNotified(true); onNotify() }}><Icon name="users" />{notified ? 'Commander notified' : 'Notify Commander'}</button>
        <button className={holding ? 'hold-exit holding' : 'hold-exit'} onPointerDown={startExit} onPointerUp={cancelExit} onPointerLeave={cancelExit} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') startExit() }} onKeyUp={cancelExit}><Icon name="shield" />Hold 3 seconds to exit emergency mode</button>
      </div>
    </div>
  )
}

function PostEmergencyView({ onClose }: { onClose: () => void }) {
  return (
    <div className="post-emergency-view">
      <header className="post-emergency-header">
        <div className="post-icon"><Icon name="heart" /></div>
        <div><p className="screen-kicker">POST-INCIDENT CARE</p><h1>72-hour observation window</h1><p>The immediate danger has passed. ARMOR will now help you notice changes in sleep and stress without treating them as a diagnosis.</p></div>
        <button className="secondary-action" onClick={onClose}>Close window</button>
      </header>
      <div className="post-message"><Icon name="shield" /><p><strong>You do not need to return to normal immediately.</strong><br />The next three days prioritize rest, brief check-ins, and a gradual return to demanding tasks.</p></div>
      <section className="observation-grid">
        <article><span>01</span><p className="screen-kicker">SLEEP</p><h2>Morning check-in</h2><p>Record sleep duration and how rested you feel. ARMOR looks for direction over time, not a single score.</p><strong>Next check · 07:00</strong></article>
        <article><span>02</span><p className="screen-kicker">STRESS</p><h2>Brief self-report</h2><p>Describe what you notice in plain language. Choosing “prefer not to say” never becomes an alert.</p><strong>Next check · 18:00</strong></article>
        <article><span>03</span><p className="screen-kicker">OPERATIONS</p><h2>Gradual return</h2><p>Review high-attention tasks with the Commander before resuming the full schedule.</p><strong>Review · hour 24</strong></article>
      </section>
      <div className="observation-timeline"><span className="active">Now</span><i /><span>24 h</span><i /><span>48 h</span><i /><span>72 h · review</span></div>
    </div>
  )
}

function GuideView() {
  const states: { title: string; kind?: StatusKind; copy: string; action?: boolean }[] = [
    { title: 'Normal', kind: 'normal', copy: 'Within your personal range.' },
    { title: 'Attention', kind: 'attention', copy: 'A rule needs your review.' },
    { title: 'Critical', kind: 'critical', copy: 'Immediate danger. Follow the approved protocol.' },
    { title: 'No data yet', kind: 'empty', copy: 'ARMOR is still building your baseline.' },
    { title: 'Model notice', kind: 'model', copy: 'An early signal; never a critical declaration.' },
    { title: 'Active protocol', kind: 'protocol', copy: 'You are being supported, not evaluated.' },
    { title: 'Action', action: true, copy: 'A calm step you can choose to take.' },
  ]
  return (
    <div className="guide-view">
      <header className="compact-view-header"><div><p className="screen-kicker">START HERE</p><h1>How to read ARMOR</h1><p>You do not need medical or technical knowledge to use this system.</p></div></header>
      <section className="guide-intro">
        <article><span>1</span><p>ARMOR compares you with <strong>your own pre-mission baseline</strong>, not with an average astronaut.</p></article>
        <article><span>2</span><p>ARMOR explains <strong>why a state changed</strong> and always offers a decision you control.</p></article>
        <article><span>3</span><p>ARMOR <strong>does not diagnose</strong>. It supports you when Earth is minutes away.</p></article>
      </section>
      <section><div className="section-title-row"><div><p className="screen-kicker">SYSTEM LANGUAGE</p><h2>Seven states, always shown with shape and words</h2></div></div>
        <div className="state-library">{states.map(state => <article key={state.title}>{state.action ? <span className="action-sample"><Icon name="check" /></span> : <StatusMark kind={state.kind!} size="lg" />}<div><h3>{state.title}</h3><p>{state.copy}</p></div></article>)}</div>
      </section>
      <section className="truth-block"><div className="truth-icon"><Icon name="shield" /></div><div><p className="screen-kicker">HONEST LIMITS</p><h2>What is real and what is simulated</h2><p><strong>Real in this prototype:</strong> the Ixchel engine and its rules, the learned models, the sleep model (validated on real people), real ISS cabin CO₂, temperature, humidity and radiation (NASA OSDR), the self-report scoring and safety flow from the team’s knowledge base, and every decision you record.</p><p><strong>Simulated here:</strong> the astronaut’s daily physiological and psychological readings, and the earlier check-in history. Protocols and questionnaire thresholds are proposals pending clinical review. ARMOR is not a medical device or an emergency operating system.</p></div></section>
      <ModelMetrics />
    </div>
  )
}

// sample state of each region when the engine is offline, per scenario (the engine overrides it when live)
const BODY_SAMPLE: Record<Situation, Partial<Record<BodyRegion, { kind: StatusKind; status: string; lines: string[] }>>> = {
  nominal: {},
  fatigue: {
    head: { kind: 'attention', status: 'Attention', lines: ['Sleep · 5.2 h average, declining', 'Attention errors · above personal norm'] },
    torso: { kind: 'attention', status: 'Attention', lines: ['HRV · 47 ms, below your 60 ms norm', 'Resting heart rate · stable'] },
  },
  grief: {
    head: { kind: 'protocol', status: 'Active support', lines: ['Mood · grief support, day 4 of 30', 'Sleep · lighter than usual'] },
    legs: { kind: 'attention', status: 'Attention', lines: ['Exercise · 62 min/day, below plan', 'Movement · optional during grief'] },
  },
  emergency: {
    torso: { kind: 'critical', status: 'Critical', lines: ['Heart rate · elevated during tasks', 'SpO₂ · below your norm', 'Observation · 72-hour window open'] },
    head: { kind: 'attention', status: 'Attention', lines: ['Sleep aid · suspended', 'Stress · above your norm'] },
  },
}
// which wearable channels belong to each region (same numbers the daily check asks about)
const REGION_CHANNELS: Partial<Record<BodyRegion, (keyof typeof SENSOR_CHANNELS)[]>> = { head: ['sleep_h', 'sleep_quality'], torso: ['hr_rest', 'hrv', 'hr_elevated', 'o2_sat', 'temperature'], legs: ['steps', 'exercise_min'] }

function BodyView({ region, setRegion, domains, missionDay, situation, data }: { region: BodyRegion; setRegion: (value: BodyRegion) => void; domains?: DomainVM[]; missionDay: number; situation: Situation; data: DayPayload | null }) {
  const details: Record<BodyRegion, { title: string; kind: StatusKind; status: string; lines: string[]; sensor?: string }> = {
    head: { title: 'Head', kind: 'normal', status: 'Normal', lines: ['Sleep · within your norm', 'Attention and mood · within your norm'] },
    eyes: { title: 'Eyes', kind: 'empty', status: 'No data yet', lines: ['We do not measure this yet.'], sensor: 'Requires a validated ocular imaging sensor.' },
    neck: { title: 'Neck', kind: 'empty', status: 'No data yet', lines: ['We do not measure this yet.'], sensor: 'Requires a validated neck fluid-shift sensor.' },
    torso: { title: 'Torso', kind: 'normal', status: 'Normal', lines: ['Vital signs · within personal range', 'Cardiovascular trend · stable'] },
    arms: { title: 'Arms', kind: 'normal', status: 'Normal', lines: ['Upper-body exercise · within plan', 'Long-term trend · stable'] },
    legs: { title: 'Legs', kind: 'normal', status: 'Normal', lines: ['Exercise adherence · within plan', 'Long-term trend · stable'] },
  }
  for (const [r, s] of Object.entries(BODY_SAMPLE[situation]) as [BodyRegion, { kind: StatusKind; status: string; lines: string[] }][]) details[r] = { ...details[r], ...s }
  if (domains) {
    // Head = sleep + mood, torso and legs = body domain, straight from the Ixchel engine
    const get = (key: string) => domains.find(d => d.key === key)
    const order: StatusKind[] = ['normal', 'model', 'attention', 'critical']
    const worst = (...list: (DomainVM | undefined)[]) => list.filter((d): d is DomainVM => !!d).sort((a, b) => order.indexOf(b.kind) - order.indexOf(a.kind))[0]
    const state = (d?: DomainVM) => (d ? `${d.status.toLowerCase()}${d.trend === 'down' ? ', declining' : ''}` : 'no data')
    const sleep = get('sueno'), mood = get('psico'), body = get('fisico')
    const head = worst(sleep, mood)
    if (head) details.head = { title: 'Head', kind: situation === 'grief' && head.kind === 'normal' ? 'protocol' : head.kind, status: situation === 'grief' && head.kind === 'normal' ? 'Active support' : head.status, lines: [`Sleep · ${state(sleep)}`, `Attention and mood · ${state(mood)}`, ...(sleep ? [sleep.description] : [])] }
    if (body) {
      const torsoKind: StatusKind = situation === 'emergency' ? 'critical' : body.kind
      details.torso = { title: 'Torso', kind: torsoKind, status: situation === 'emergency' ? 'Critical' : body.status, lines: [`Heart rate and HRV · ${state(body)}`, body.description, ...(situation === 'emergency' ? ['Observation · 72-hour window open'] : [])] }
      details.arms = { title: 'Arms', kind: body.kind, status: body.status, lines: [`Upper-body exercise · ${state(body)}`] }
      details.legs = { title: 'Legs', kind: body.kind, status: body.status, lines: [`Exercise and bone loading · ${state(body)}`] }
    }
  }
  // wearable readings for the region, the same ones the daily check asks about
  const anomalies = sensorAnomaliesFor(situation, data, missionDay)
  const wearables = (REGION_CHANNELS[region] ?? []).flatMap(ch => { const a = anomalies.find(x => x.channel === ch); return a ? [{ ch, a }] : [] })
  const current = details[region]
  const zoneKinds: Record<Zone, StatusKind> = { head: details.head.kind, neck: details.neck.kind, torso: details.torso.kind, arms: details.arms.kind, legs: details.legs.kind }
  const regionList: BodyRegion[] = ['head', 'eyes', 'neck', 'torso', 'arms', 'legs']
  return (
    <div className="body-view">
      <header className="compact-view-header"><div><p className="screen-kicker">INTERACTIVE DIGITAL TWIN</p><h1>My body</h1><p>Select a region to see what ARMOR measures—and what it does not.</p></div><span className="updated-label">Personal baseline · day {domains ? missionDay : 87}</span></header>
      <div className="body-layout">
        <section className="body-map body-map-3d" aria-label="Interactive 3D body model. Drag to rotate, click a zone to open it.">
          <Suspense fallback={<div className="body3d"><p className="body3d-note">Loading 3D model…</p></div>}>
            <Body3D zones={zoneKinds} selected={region === 'eyes' ? 'head' : region} onSelect={zone => setRegion(zone)} />
          </Suspense>
          <p className="body3d-hint">Drag to rotate · scroll to zoom · click a zone</p>
          <div className="body-zone-list" role="group" aria-label="Body regions">
            {regionList.map(r => <BodyPoint key={r} label={details[r].title} kind={details[r].kind} active={region === r} onClick={() => setRegion(r)} />)}
          </div>
        </section>
        <aside className={`body-panel ${current.kind}`}>
          <div className="body-panel-state"><StatusMark kind={current.kind} size="lg" /><span>{current.status}</span></div>
          <p className="screen-kicker">SELECTED REGION</p><h2>{current.title}</h2>
          <div className="body-metrics">{current.lines.map(line => { const [label, value] = line.split(' · '); return <div key={line}><small>{label}</small>{value && <strong>{value}</strong>}</div> })}</div>
          {wearables.length > 0 && <div className="body-wearables"><p className="screen-kicker">FROM YOUR WEARABLES · THIS WEEK VS. YOUR NORM</p>
            {wearables.map(({ ch, a }) => <div key={ch} className={Math.abs(a.delta_pct) >= 10 ? 'off' : ''}><small>{SENSOR_CHANNELS[ch].label}</small><strong>{a.raw_value != null ? `${a.raw_value.toLocaleString('en-US')} ${SENSOR_CHANNELS[ch].unit}` : '—'}</strong><span>{a.delta_pct < 0 ? '↓' : '↑'} {Math.abs(Math.round(a.delta_pct))}%{a.norm_value != null ? ` · norm ${a.norm_value.toLocaleString('en-US')}` : ''}</span></div>)}
          </div>}
          {current.sensor && <div className="sensor-needed"><Icon name="scan" /><div><strong>Not instrumented</strong><p>{current.sensor}</p></div></div>}
          <p className="body-panel-note">ARMOR only shows measurements supported by an available, validated source.</p>
        </aside>
      </div>
    </div>
  )
}

function BodyPoint({ label, kind, active, onClick }: { label: string; kind: StatusKind; active: boolean; onClick: () => void }) {
  return <button className={`body-map-point ${active ? 'active' : ''}`} onClick={onClick} aria-label={`Open ${label} data`} aria-pressed={active}><StatusMark kind={kind} size="sm" /><span>{label}</span></button>
}

function Sidebar({ muted = false, activeItem, onNavigate }: { muted?: boolean; activeItem: string; onNavigate: (label: string) => void }) {
  return (
    <aside className={muted ? 'armor-sidebar muted' : 'armor-sidebar'}>
      <button className="armor-logo" aria-label="ARMOR, go to Today">
        <span className="logo-shield"><i /></span>
        <span><strong>ARMOR</strong><small>MEDICAL OPERATIONS</small></span>
      </button>
      <nav aria-label="Main navigation">
        <p className="nav-section-label">MISSION HEALTH</p>
        {navigation.map(item => {
          const active = item.label === activeItem
          return <button key={item.label} className={active ? 'armor-nav active' : 'armor-nav'} aria-current={active ? 'page' : undefined} onClick={() => active ? undefined : onNavigate(item.label)}>
            <Icon name={item.icon} /><span>{item.label}</span>{active && <i />}
          </button>
        })}
      </nav>
      <button className={activeItem === 'How to read this' ? 'read-guide active' : 'read-guide'} onClick={() => onNavigate('How to read this')}><Icon name="shield" /><span>How to read this</span></button>
      <div className="sidebar-identity"><span>EV</span><div><strong>Elena Vega</strong><small>Medical officer · Crew 04</small></div></div>
    </aside>
  )
}

function SystemBar({ darkMode, toggleTheme }: { darkMode: boolean; toggleTheme: () => void }) {
  return (
    <div className="os-system-bar">
      <div className="os-identity"><span className="os-mark">A</span><strong>ARMOR OS</strong><span>MEDICAL OPERATIONS ENVIRONMENT</span></div>
      <div className="os-session"><span>VESSEL · HERMES</span><span>TRANSIT · SOL 087</span><span className="os-online"><i /> SYSTEM NOMINAL</span><strong>06:42 MET</strong><button className="theme-toggle" onClick={toggleTheme} aria-pressed={darkMode}><Icon name={darkMode ? 'spark' : 'moon'} />{darkMode ? 'LIGHT MODE' : 'NIGHT MODE'}</button></div>
    </div>
  )
}

function TopSimulation({ scenario, setScenario, missionDay, setMissionDay }: { scenario: Scenario; setScenario: (value: Scenario) => void; missionDay: number; setMissionDay: (value: number) => void }) {
  const { status, today } = useContext(EngineCtx)
  const delay = today ? (today.delayMin < 1 ? '< 1 min' : `${Math.round(today.delayMin)} min`) : '12 min'
  const engineText = status === 'live' ? 'Ixchel engine live' : status === 'loading' ? 'Asking Ixchel engine…' : status === 'offline' ? 'Engine offline · sample data' : 'Scripted scenario'
  return (
    <header className="simulation-bar">
      <div className="simulation-label"><span>SIM</span><div><strong>Simulation</strong><small>Demonstration controls</small></div></div>
      <label className="scenario-control"><span>Scenario</span><select value={scenario} onChange={event => setScenario(event.target.value as Scenario)}><option>Nominal</option><option>Cumulative fatigue</option><option>Grief support</option><option>Emergency</option></select></label>
      <label className="day-control"><span>Mission day</span><input type="range" min="1" max="180" value={missionDay} onChange={event => setMissionDay(Number(event.target.value))} /><output>{missionDay}</output></label>
      <div className="mission-phase"><small>DAY {missionDay} OF 180</small><strong>{today ? today.phase : 'Mars transit'}</strong></div>
      <div className={status === 'offline' ? 'link-state offline' : 'link-state'} title={status === 'offline' ? 'Start the API: cd ixchel && uvicorn api:app --port 8000' : undefined}><i /><div><strong>{engineText}</strong><span>Earth response in {delay}</span></div></div>
    </header>
  )
}

function SafetyFooter() {
  return <footer className="safety-footer"><Icon name="shield" /><span><strong>ARMOR proposes.</strong> The decision belongs to the person or the crew medical officer.</span><span className="footer-mode">DECISION SUPPORT · NOT A DIAGNOSIS</span></footer>
}

export default App
