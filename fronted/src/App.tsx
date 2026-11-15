import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './components/Icon'

type Scenario = 'Nominal' | 'Cumulative fatigue' | 'Grief support' | 'Emergency'
type Decision = 'applied' | 'postponed' | 'discarded' | null
type StepState = 'done' | 'postponed' | 'not-applicable' | null
type View = 'Today' | 'Daily check' | 'My body' | 'How to read this'
type BodyRegion = 'head' | 'eyes' | 'neck' | 'torso' | 'legs'

const navigation = [
  { label: 'Today', icon: 'home' as const, active: true },
  { label: 'Daily check', icon: 'check' as const },
  { label: 'Timeline', icon: 'clock' as const },
  { label: 'My body', icon: 'heart' as const },
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

type StatusKind = 'normal' | 'attention' | 'critical' | 'empty' | 'model' | 'protocol'

function StatusMark({ kind, size = 'md' }: { kind: StatusKind; size?: 'sm' | 'md' | 'lg' }) {
  const labels: Record<StatusKind, string> = {
    normal: 'Normal',
    attention: 'Attention',
    critical: 'Critical',
    empty: 'No data yet',
    model: 'Early model notice',
    protocol: 'Active support',
  }
  return (
    <span className={`status-mark ${kind} ${size}`} aria-label={labels[kind]}>
      {kind === 'normal' && <Icon name="check" />}
      {kind === 'attention' && <Icon name="alert" />}
      {kind === 'critical' && <strong>!</strong>}
      {kind === 'empty' && <span />}
      {kind === 'model' && <Icon name="spark" />}
      {kind === 'protocol' && <Icon name="heart" />}
    </span>
  )
}

function ContextIcon({ name }: { name: string }) {
  if (name === 'radiation') return <Icon name="radiation" />
  if (name === 'gauge') return <Icon name="pulse" />
  if (name === 'air') return <><path d="M3 8h10a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h7" /></>
  if (name === 'sound') return <><path d="M5 10v4h3l4 3V7L8 10Z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></>
  if (name === 'gravity') return <><circle cx="12" cy="7" r="3" /><path d="M12 10v10M7 14h10" /></>
  return <><path d="M5 16a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 10a2 2 0 0 1 2 0" /><circle cx="12" cy="19" r="1" /></>
}

function Trend({ direction, empty = false }: { direction: 'down' | 'stable'; empty?: boolean }) {
  if (empty) return <div className="baseline-progress"><span style={{ width: '63%' }} /></div>
  const points = direction === 'down' ? '2,8 20,11 38,12 56,20 74,24 92,35 110,39' : '2,23 20,21 38,24 56,20 74,22 92,20 110,22'
  return (
    <svg className={`trend-line ${direction}`} viewBox="0 0 112 44" role="img" aria-label={direction === 'down' ? 'Downward trend over seven days' : 'Stable trend over seven days'}>
      <path d="M2 42H110" />
      <polyline points={points} />
      <circle cx="110" cy={direction === 'down' ? '39' : '22'} r="3" />
    </svg>
  )
}

function DomainCard({ title, kind, status, description, trend }: { title: string; kind: StatusKind; status: string; description: string; trend: 'down' | 'stable' | 'empty' }) {
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
        <Trend direction={trend === 'stable' ? 'stable' : 'down'} empty={trend === 'empty'} />
      </div>
    </article>
  )
}

function App() {
  const [scenario, setScenario] = useState<Scenario>('Cumulative fatigue')
  const [missionDay, setMissionDay] = useState(87)
  const [decision, setDecision] = useState<Decision>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('armor-theme') === 'dark')
  const [selectedCare, setSelectedCare] = useState('Anchor nap')
  const [dismissOpen, setDismissOpen] = useState(false)
  const [dismissReason, setDismissReason] = useState('')
  const [protocolPaused, setProtocolPaused] = useState(false)
  const [protocolSteps, setProtocolSteps] = useState<StepState[]>([null, null, null, null])
  const [view, setView] = useState<View>('Today')
  const [postEmergency, setPostEmergency] = useState(false)
  const [dailyAnswers, setDailyAnswers] = useState({ feeling: '', support: '' })
  const [bodyRegion, setBodyRegion] = useState<BodyRegion>('torso')

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem('armor-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const showPlanned = (label: string) => {
    setNotice(`${label} will be available in the next prototype screen.`)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const navigate = (label: string) => {
    if (label === 'Today' || label === 'Daily check' || label === 'My body' || label === 'How to read this') {
      setView(label as View)
      setDetailOpen(false)
      return
    }
    showPlanned(label)
  }

  if (scenario === 'Emergency' && !postEmergency) {
    return <EmergencyView onComplete={() => setPostEmergency(true)} onExit={() => setScenario('Cumulative fatigue')} onNotify={() => setNotice('Commander notification sent through the local mission channel.')} />
  }

  if (postEmergency) {
    return (
      <StandardShell darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} activeItem="Today" onNavigate={navigate} title="72-Hour Window" code="POST-INCIDENT.MONITOR" center="RECOVERY OBSERVATION · HOUR 01 OF 72">
        <PostEmergencyView onClose={() => { setPostEmergency(false); setScenario('Cumulative fatigue'); setView('Today') }} />
      </StandardShell>
    )
  }

  if (scenario === 'Grief support') {
    return (
      <div className="armor-shell protocol-shell">
        <SystemBar darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} />
        <Sidebar muted activeItem="Care" onNavigate={navigate} />
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
            <div><p className="screen-kicker">SUPPORT PROTOCOL</p><h1>Active support · day 4 of 30</h1><p>{protocolPaused ? 'Support is paused. Your progress and choices remain saved.' : 'This space keeps the focus on care, not measurement.'}</p></div>
            <button className="secondary-action" onClick={() => setProtocolPaused(value => !value)}>{protocolPaused ? 'Resume' : 'Pause'}</button>
          </section>
          <section className="protocol-message">
            <Icon name="heart" />
            <p>For now, I am not comparing you with your personal norm.<br /><strong>Take all the time you need.</strong></p>
          </section>
          <section className="protocol-content">
            <div className="protocol-checklist">
              <div className="section-title-row"><div><p className="screen-kicker">TODAY'S SUPPORT</p><h2>Steps at your pace</h2></div><span className="pending-content">Content pending</span></div>
              {[1, 2, 3, 4].map((step, index) => (
                <article className="protocol-step" key={step}>
                  <span className="protocol-step-number">{String(step).padStart(2, '0')}</span>
                  <div><strong>Support step {step}</strong><p>Content pending · This step will be loaded from the approved care protocol.</p></div>
                  <div className="step-states" aria-label={`Status for support step ${step}`}>
                    <button className={protocolSteps[index] === 'done' ? 'active' : ''} onClick={() => setProtocolSteps(current => current.map((value, i) => i === index ? 'done' : value))}><Icon name="check" />Done</button>
                    <button className={protocolSteps[index] === 'postponed' ? 'active' : ''} onClick={() => setProtocolSteps(current => current.map((value, i) => i === index ? 'postponed' : value))}><Icon name="clock" />Postponed</button>
                    <button className={protocolSteps[index] === 'not-applicable' ? 'active' : ''} onClick={() => setProtocolSteps(current => current.map((value, i) => i === index ? 'not-applicable' : value))}>— Not applicable</button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="family-card">
              <span className="family-icon"><Icon name="users" /></span>
              <p className="screen-kicker">PERSONAL CONNECTION</p>
              <h2>Message your family</h2>
              <p>Your message will arrive in 12 minutes. This delay is part of the space you share, not a barrier to it.</p>
              <button className="primary-action" onClick={() => setNotice('Private message space opened.')}>Write</button>
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
            <div className="window-center">SLEEP · RULE-BASED ATTENTION</div>
            <div className="window-controls" aria-label="Window controls"><button aria-label="Minimize">—</button><button aria-label="Fit window">□</button><button aria-label="Active window">●</button></div>
          </div>
          <div className="detail-content">
            <button className="back-button" onClick={() => setDetailOpen(false)}><Icon name="chevron" /> Back to Today</button>
            <header className="detail-header">
              <div><p className="screen-kicker">EXPLAINED DECISION</p><h1>Cumulative fatigue</h1><p>ARMOR is showing the conditions behind this state. You remain in control of the decision.</p></div>
              <div className="attention-label"><StatusMark kind="attention" size="lg" /><span>Attention</span></div>
            </header>

            <section className="why-section" aria-labelledby="why-title">
              <p className="screen-kicker">TRACEABLE REASONING</p>
              <h2 id="why-title">Why I am telling you this</h2>
              <div className="reason-chain">
                <div><span>1</span><p>Your sleep this week: <strong>5.4 h average.</strong> Your norm: <strong>7.1 h.</strong></p></div>
                <div><span>2</span><p>Your attention errors: <strong>4.2 per day.</strong> Your norm: <strong>1.5.</strong></p></div>
                <div><span>3</span><p>Cabin CO₂: <strong>3,180 ppm</strong>, above the notice threshold of 3,000.</p></div>
              </div>
              <div className="reason-result"><Icon name="alert" /><span>Therefore:</span><strong>Attention on sleep</strong></div>
            </section>

            <section className="no-action-card">
              <div className="no-action-icon"><Icon name="clock" /></div>
              <div><p className="screen-kicker">IF YOU DO NOTHING</p><h2>Fatigue may continue to accumulate</h2><p>Based on your recent pattern, shorter sleep may lead to more attention errors over the next day. This is a trajectory, not a diagnosis, and you can review the decision at any time.</p></div>
            </section>

            <section className="care-section" aria-labelledby="care-title">
              <div className="section-title-row"><div><p className="screen-kicker">PERSONAL COUNTERMEASURES</p><h2 id="care-title">What you can do</h2></div><span className="updated-label">Select one option</span></div>
              <div className="care-options">
                {[
                  { title: 'Anchor nap', duration: '90 min', tag: 'Worked for you 3 of 4 times', copy: 'Creates a protected recovery window before your next duty period.' },
                  { title: '460 nm blue light', duration: '30 min · morning', tag: '', copy: 'Supports your planned morning light exposure and circadian timing.' },
                  { title: 'Reorganize shifts', duration: 'Next 24 h', tag: '', copy: 'Moves high-attention tasks away from your lowest-rest period.' },
                ].map(option => (
                  <button key={option.title} className={selectedCare === option.title ? 'care-option selected' : 'care-option'} onClick={() => setSelectedCare(option.title)}>
                    <span className="care-select"><Icon name="check" /></span>
                    {option.tag && <small>{option.tag}</small>}
                    <h3>{option.title}</h3>
                    <strong>{option.duration}</strong>
                    <p>{option.copy}</p>
                  </button>
                ))}
              </div>
            </section>

            {dismissOpen && (
              <section className="dismiss-panel">
                <div><p className="screen-kicker">REASON REQUIRED</p><h2>Why are you dismissing this recommendation?</h2><p>Your reason becomes part of the decision log and helps preserve clinical context.</p></div>
                <label>Reason<textarea value={dismissReason} onChange={event => setDismissReason(event.target.value)} rows={3} placeholder="Enter a brief reason…" required /></label>
                <div><button className="tertiary-action" onClick={() => setDismissOpen(false)}>Cancel</button><button className="primary-action" disabled={!dismissReason.trim()} onClick={() => { setDecision('discarded'); setDismissOpen(false); setNotice('Recommendation dismissed and reason recorded.') }}>Record dismissal</button></div>
              </section>
            )}
          </div>
          <div className="detail-decision-bar">
            <div><small>SELECTED COUNTERMEASURE</small><strong>{selectedCare}</strong></div>
            <button className="primary-action" onClick={() => { setDecision('applied'); setNotice(`${selectedCare} applied.`) }}>Apply</button>
            <button className="secondary-action" onClick={() => { setDecision('postponed'); setNotice('Decision postponed until tomorrow.') }}>Postpone until tomorrow</button>
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
        <DailyCheck answers={dailyAnswers} setAnswers={setDailyAnswers} onSave={() => setNotice('Daily check saved privately.')} />
        {notice && <div className="toast" role="status"><Icon name="check" />{notice}</div>}
      </StandardShell>
    )
  }

  if (view === 'My body') {
    return (
      <StandardShell darkMode={darkMode} toggleTheme={() => setDarkMode(value => !value)} scenario={scenario} setScenario={setScenario} missionDay={missionDay} setMissionDay={setMissionDay} activeItem="My body" onNavigate={navigate} title="My Body" code="DIGITAL.TWIN" center="INTERACTIVE BODY MAP · CREW MEMBER 04">
        <BodyView region={bodyRegion} setRegion={setBodyRegion} />
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
            {contextItems.map(item => (
              <div className="context-item" key={item.label}>
                <div className="context-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><ContextIcon name={item.icon} /></svg></div>
                <div><small>{item.label}</small><strong>{item.value}</strong><span className={'attention' in item && item.attention ? 'context-meta attention' : 'context-meta'}>{'attention' in item && item.attention && <StatusMark kind="attention" size="sm" />}{item.meta}</span>{'progress' in item && <div className="context-progress"><i style={{ width: `${item.progress}%` }} /></div>}</div>
              </div>
            ))}
          </div>
        </section>

        <header className="today-header">
          <div><p className="screen-kicker">DAILY STATUS · {missionDay.toString().padStart(3, '0')}</p><h1>Today, sleep and mood<br />need your attention</h1><p>Compared with your personal norm, measured during the 30 days before the mission.</p></div>
          <div className="global-state"><StatusMark kind="attention" size="lg" /><div><small>OVERALL STATUS</small><strong>Attention</strong><span>2 of 4 domains require a decision</span></div></div>
        </header>

        <section aria-labelledby="domains-title">
          <div className="section-title-row"><div><p className="screen-kicker">YOUR TRAJECTORY</p><h2 id="domains-title">What changed since yesterday</h2></div><span className="updated-label"><Icon name="clock" /> Updated 06:40</span></div>
          <div className="domain-grid">
            <DomainCard title="Sleep" kind="attention" status="Attention" description="5.4 h average this week; your personal norm is 7.1 h." trend="down" />
            <DomainCard title="Mood" kind="attention" status="Attention" description="Fewer messages and more tension than your personal average." trend="down" />
            <DomainCard title="Body" kind="normal" status="Normal" description="Exercise and vital signs are within your personal range." trend="stable" />
            <DomainCard title="Connection" kind="empty" status="No data yet" description="11 days remain before your personal baseline is ready." trend="empty" />
          </div>
        </section>

        <section className="actions-section" aria-labelledby="actions-title">
          <div className="section-title-row"><div><p className="screen-kicker">ONE DECISION AT A TIME</p><h2 id="actions-title">What you can do today</h2></div><span className="action-count">2 pending actions</span></div>

          <article className="decision-card attention" onClick={() => setDetailOpen(true)}>
            <div className="decision-icon"><StatusMark kind="attention" size="lg" /></div>
            <div className="decision-content">
              <span className="decision-type">MONITORING RULE · SLEEP</span>
              <h3>Cumulative fatigue</h3>
              <p>You have slept less than 6 hours for 3 days and shown more attention errors. Cabin noise and high CO₂ may be contributing.</p>
              <button className="why-link" onClick={event => { event.stopPropagation(); setDetailOpen(true) }}>See why <Icon name="chevron" /></button>
            </div>
            <div className="decision-actions" onClick={event => event.stopPropagation()}>
              {decision ? <div className="decision-recorded"><Icon name="check" /><div><strong>Decision recorded</strong><span>{decision === 'applied' ? 'Anchor nap applied' : decision === 'postponed' ? 'Postponed for later review' : 'Dismissed; reason pending'}</span></div><button onClick={() => setDecision(null)}>Change</button></div> :
              <><button className="primary-action" onClick={() => setDecision('applied')}>Apply anchor nap</button><button className="secondary-action" onClick={() => setDecision('postponed')}>Postpone</button><button className="tertiary-action" onClick={() => setDecision('discarded')}>Dismiss</button></>}
            </div>
          </article>

          <article className="decision-card model">
            <div className="decision-icon"><StatusMark kind="model" size="lg" /></div>
            <div className="decision-content">
              <span className="model-label"><StatusMark kind="model" size="sm" /> EARLY MODEL NOTICE</span>
              <h3>Early sleep signal</h3>
              <p>The model detects a decline in your rest before the rules confirm it. This is not an alert; it is a notice to monitor. The model cannot declare a critical state.</p>
            </div>
            <div className="decision-actions compact">
              <button className="secondary-action" onClick={() => setNotice('Notice marked as understood.')}>Understood</button>
              <button className="tertiary-action" onClick={() => setDetailOpen(true)}>View detail</button>
            </div>
          </article>
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

function EmergencyView({ onComplete, onExit, onNotify }: { onComplete: () => void; onExit: () => void; onNotify: () => void }) {
  const steps = [
    { title: 'Move to the nearest safe position', copy: 'Stop the current task. Secure yourself and keep one hand free.' },
    { title: 'Confirm breathing and responsiveness', copy: 'Check that the crew member can breathe, respond, and follow a simple instruction.' },
    { title: 'Open the approved emergency protocol', copy: 'Continue with the mission-approved protocol for the observed emergency.' },
  ]
  const [step, setStep] = useState(0)
  const [holding, setHolding] = useState(false)
  const [notified, setNotified] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
          <button className="emergency-next" onClick={() => step === steps.length - 1 ? onComplete() : setStep(value => value + 1)}><Icon name="check" /> Done, next step</button>
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

function DailyCheck({ answers, setAnswers, onSave }: { answers: { feeling: string; support: string }; setAnswers: (value: { feeling: string; support: string }) => void; onSave: () => void }) {
  const feelingOptions = ['Good', 'So-so', 'Not good', 'Prefer not to say']
  const supportOptions = ['Ergometer exercise', 'Talking with someone', 'Music', 'Time alone', 'Something else']
  return (
    <div className="daily-check-view">
      <header className="compact-view-header"><div><p className="screen-kicker">PRIVATE · ABOUT 20 SECONDS</p><h1>Daily check</h1><p>Two short questions. Your words add context that sensors cannot measure.</p></div><span className="check-timer"><Icon name="clock" /> Under 30 sec</span></header>
      <div className="check-progress"><i style={{ width: answers.feeling && answers.support ? '100%' : answers.feeling ? '50%' : '8%' }} /></div>
      <section className="question-card">
        <span className="question-number">01</span>
        <div><p className="screen-kicker">HOW THIS FEELS TO YOU</p><h2>You have slept less and spoken less with your crew lately. How do you feel about that?</h2>
          <div className="answer-options">{feelingOptions.map(option => <button key={option} className={answers.feeling === option ? 'selected' : ''} onClick={() => setAnswers({ ...answers, feeling: option })}>{answers.feeling === option && <Icon name="check" />}{option}</button>)}</div>
          <p className="privacy-copy"><Icon name="shield" />“Prefer not to say” is always valid and is never treated as an alert.</p>
        </div>
      </section>
      <section className="question-card">
        <span className="question-number">02</span>
        <div><p className="screen-kicker">WHAT HAS HELPED</p><h2>What has helped you feel better lately?</h2>
          <div className="answer-options support">{supportOptions.map(option => <button key={option} className={answers.support === option ? 'selected' : ''} onClick={() => setAnswers({ ...answers, support: option })}>{answers.support === option && <Icon name="check" />}{option}</button>)}</div>
        </div>
      </section>
      <div className="check-save"><div><strong>{answers.feeling && answers.support ? 'Ready to save' : 'Answer both questions to continue'}</strong><span>Your answers stay in the private medical record.</span></div><button className="primary-action" disabled={!answers.feeling || !answers.support} onClick={onSave}>Save</button></div>
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
      <section className="truth-block"><div className="truth-icon"><Icon name="shield" /></div><div><p className="screen-kicker">HONEST LIMITS</p><h2>What is real and what is simulated</h2><p><strong>Real in this prototype:</strong> the decision logic, state language, personal-baseline approach, human control, and interaction flows.</p><p><strong>Simulated here:</strong> crew readings, environmental values, mission events, model notices, and protocol content. ARMOR is not a medical device or an emergency operating system.</p></div></section>
    </div>
  )
}

function BodyView({ region, setRegion }: { region: BodyRegion; setRegion: (value: BodyRegion) => void }) {
  const details: Record<BodyRegion, { title: string; kind: StatusKind; status: string; lines: string[]; sensor?: string }> = {
    head: { title: 'Head', kind: 'attention', status: 'Attention', lines: ['Sleep trend · declining', 'Attention errors · above personal norm'] },
    eyes: { title: 'Eyes', kind: 'empty', status: 'No data yet', lines: ['We do not measure this yet.'], sensor: 'Requires a validated ocular imaging sensor.' },
    neck: { title: 'Neck', kind: 'empty', status: 'No data yet', lines: ['We do not measure this yet.'], sensor: 'Requires a validated neck fluid-shift sensor.' },
    torso: { title: 'Torso', kind: 'normal', status: 'Normal', lines: ['Vital signs · within personal range', 'Cardiovascular trend · stable'] },
    legs: { title: 'Legs', kind: 'normal', status: 'Normal', lines: ['Exercise adherence · within plan', 'Long-term trend · stable'] },
  }
  const current = details[region]
  return (
    <div className="body-view">
      <header className="compact-view-header"><div><p className="screen-kicker">INTERACTIVE DIGITAL TWIN</p><h1>My body</h1><p>Select a region to see what ARMOR measures—and what it does not.</p></div><span className="updated-label">Personal baseline · day 87</span></header>
      <div className="body-layout">
        <section className="body-map" aria-label="Front-facing interactive human silhouette">
          <svg viewBox="0 0 300 560" role="img" aria-label="Front-facing human body outline"><circle cx="150" cy="58" r="39" /><path d="M111 104Q150 88 189 104L213 255 188 282 178 520H132L122 282 87 255Z" /><path d="m108 117-57 177 27 10 53-130M192 117l57 177-27 10-53-130M133 519l-8 26M177 519l8 26" /></svg>
          <BodyPoint label="Head" className="head" kind="attention" active={region === 'head'} onClick={() => setRegion('head')} />
          <BodyPoint label="Eyes" className="eyes" kind="empty" active={region === 'eyes'} onClick={() => setRegion('eyes')} />
          <BodyPoint label="Neck" className="neck" kind="empty" active={region === 'neck'} onClick={() => setRegion('neck')} />
          <BodyPoint label="Torso" className="torso" kind="normal" active={region === 'torso'} onClick={() => setRegion('torso')} />
          <BodyPoint label="Legs" className="legs" kind="normal" active={region === 'legs'} onClick={() => setRegion('legs')} />
        </section>
        <aside className={`body-panel ${current.kind}`}>
          <div className="body-panel-state"><StatusMark kind={current.kind} size="lg" /><span>{current.status}</span></div>
          <p className="screen-kicker">SELECTED REGION</p><h2>{current.title}</h2>
          <div className="body-metrics">{current.lines.map(line => { const [label, value] = line.split(' · '); return <div key={line}><small>{label}</small>{value && <strong>{value}</strong>}</div> })}</div>
          {current.sensor && <div className="sensor-needed"><Icon name="scan" /><div><strong>Not instrumented</strong><p>{current.sensor}</p></div></div>}
          <p className="body-panel-note">ARMOR only shows measurements supported by an available, validated source.</p>
        </aside>
      </div>
    </div>
  )
}

function BodyPoint({ label, className, kind, active, onClick }: { label: string; className: string; kind: StatusKind; active: boolean; onClick: () => void }) {
  return <button className={`body-map-point ${className} ${active ? 'active' : ''}`} onClick={onClick} aria-label={`Open ${label} data`}><StatusMark kind={kind} size="sm" /><span>{label}</span></button>
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
  return (
    <header className="simulation-bar">
      <div className="simulation-label"><span>SIM</span><div><strong>Simulation</strong><small>Demonstration controls</small></div></div>
      <label className="scenario-control"><span>Scenario</span><select value={scenario} onChange={event => setScenario(event.target.value as Scenario)}><option>Nominal</option><option>Cumulative fatigue</option><option>Grief support</option><option>Emergency</option></select></label>
      <label className="day-control"><span>Mission day</span><input type="range" min="1" max="180" value={missionDay} onChange={event => setMissionDay(Number(event.target.value))} /><output>{missionDay}</output></label>
      <div className="mission-phase"><small>DAY {missionDay} OF 180</small><strong>Mars transit</strong></div>
      <div className="link-state"><i /><div><strong>Link active</strong><span>Response in 12 min</span></div></div>
    </header>
  )
}

function SafetyFooter() {
  return <footer className="safety-footer"><Icon name="shield" /><span><strong>ARMOR proposes.</strong> The decision belongs to the person or the crew medical officer.</span><span className="footer-mode">DECISION SUPPORT · NOT A DIAGNOSIS</span></footer>
}

export default App
