// Care: the psychological-support hub. Everything here works with the Earth link delayed or down.
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { StatusMark } from '../components/StatusMark'
import { MOOD_LABEL, medicationAlerts, medicationPlan, runAnalysis, situationOf } from '../care'
import { SAFETY_PLAN, SELF_CARE } from '../content'
import { careFor, logQuietly, supportApi, type DayPayload, type TodayVM } from '../ixchel'
import { AICompanion, BreathingGuide, Grounding, Journal, MedicationLog } from './SupportTools'
import { DOMAIN_LABEL, delayText, type ViewProps } from './shared'

const SITUATION_LABEL = { nominal: 'Nominal mission', fatigue: 'Cumulative fatigue', grief: 'Grief support', emergency: '72-hour observation window' }

export function CareView({ scenarioKey, scenario, missionDay, delayMin, goTo, notify, today, data }: ViewProps & { scenario: string; today: TodayVM | null; data: DayPayload | null }) {
  const api = scenarioKey ? supportApi(scenarioKey) : null
  const t = missionDay - 1
  const situation = situationOf(scenario, today)
  const analysis = useMemo(() => runAnalysis(data, today, situation), [data, today, situation])
  const meds = useMemo(() => medicationPlan(situation, today), [situation, today])
  const medAlerts = useMemo(() => medicationAlerts(meds, today, situation, data), [meds, today, situation, data])
  const [tool, setTool] = useState<string>(situation === 'emergency' ? 'grounding' : situation === 'nominal' ? 'breathing' : 'companion')
  const [plan, setPlan] = useState<Record<string, string>>({})
  const [planSaved, setPlanSaved] = useState(false)
  const [applied, setApplied] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!api) return
    api.getPlan().then(r => setPlan(r.plan)).catch(() => undefined)
  }, [scenarioKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const flagged = (today?.domains ?? []).filter(d => d.kind === 'attention' || d.kind === 'critical' || d.kind === 'model')
  const nextSession = Math.ceil(missionDay / 7) * 7 || 7
  const talk = (tipo: string, label: string, report = false) => {
    if (api) {
      logQuietly(api.event(t, tipo, label))
      if (report) logQuietly(api.report(t, label, 'conference_request'))
    }
    notify(`${label}. It reaches Earth in ${delayText(delayMin)}.`)
  }

  return (
    <div className="care-view">
      <header className="compact-view-header"><div><p className="screen-kicker">PSYCHOLOGICAL SUPPORT · WORKS WITHOUT EARTH</p><h1>Care</h1><p>Tools you can use right now, the countermeasures Ixchel suggests for you today, and people you can reach. Earth answers in {delayText(delayMin)}; everything on this page works before that.</p></div>
        {today?.griefDay && <span className="updated-label"><StatusMark kind="protocol" size="sm" /> Grief support active · day {today.griefDay} of 30</span>}</header>

      <section className="care-block care-situation">
        <article className={`situation-card ${situation}`}>
          <small>TODAY · {SITUATION_LABEL[situation].toUpperCase()} · DAY {missionDay}</small>
          <strong>{MOOD_LABEL[analysis.mood]}</strong>
          <p>{analysis.drivers[0]}</p>
          <button className="tertiary-action" onClick={() => setTool('companion')}>Talk it through with the companion</button>
        </article>
        <div className="med-strip">
          <small>MEDICATION TODAY</small>
          {meds.map(({ med, status }) => <span key={med.id} className={`med-pill ${status.replace(' ', '-')}`}><b>{med.name}</b> {status}</span>)}
          {medAlerts[0] && <p className={`med-strip-alert ${medAlerts[0].kind}`}><strong>{medAlerts[0].title}.</strong> {medAlerts[0].text}</p>}
          <button className="tertiary-action" onClick={() => setTool('medications')}>Log doses and side effects</button>
        </div>
      </section>

      <section className="care-block">
        <div className="section-title-row"><div><p className="screen-kicker">RIGHT NOW</p><h2>Something to do in the next few minutes</h2></div></div>
        <div className="tool-tabs" role="tablist">
          <button key="companion" role="tab" aria-selected={tool === 'companion'} className={tool === 'companion' ? 'active' : ''} onClick={() => setTool('companion')}><strong>Companion</strong><small>Any time · Reads your day and listens</small></button>
          {SELF_CARE.map(s => <button key={s.key} role="tab" aria-selected={tool === s.key} className={tool === s.key ? 'active' : ''} onClick={() => setTool(s.key)}><strong>{s.title}</strong><small>{s.minutes} min · {s.copy}</small></button>)}
          <button key="medications" role="tab" aria-selected={tool === 'medications'} className={tool === 'medications' ? 'active' : ''} onClick={() => setTool('medications')}><strong>Medications</strong><small>Daily · {meds.filter(p => p.status === 'scheduled').length} scheduled{medAlerts.some(a => a.kind === 'critical') ? ' · critical alert' : ''}</small></button>
        </div>
        <div className="tool-panel">
          {tool === 'breathing' && <BreathingGuide onDone={c => { api && logQuietly(api.event(t, 'self_care_breathing', `${c} breathing cycles`)); notify('Breathing session saved to your log.') }} />}
          {tool === 'grounding' && <Grounding onDone={() => api && logQuietly(api.event(t, 'self_care_grounding'))} />}
          {tool === 'journal' && <Journal />}
          {tool === 'peer' && <div className="peer-tool"><p>Your designated support crewmate gets a quiet request for ten minutes together. No reason is shared unless you add one.</p>
            <button className="primary-action" onClick={() => talk('peer_support_request', 'Support crewmate requested')}><Icon name="users" /> Ask my support crewmate</button></div>}
          {tool === 'companion' && <AICompanion analysis={analysis} missionDay={missionDay} voiceDefault={situation === 'emergency'} openTool={setTool}
            onEnd={summary => { api && logQuietly(api.event(t, 'ai_companion_session', summary)); notify('Companion session saved to your log.') }} />}
          {tool === 'medications' && <MedicationLog plan={meds} alerts={medAlerts} missionDay={missionDay}
            onLog={(kind, med, detail) => { api && logQuietly(api.event(t, `medication_${kind}`, `${med.name} ${med.dosage}${detail ? `: ${detail}` : ''}`)); notify(kind === 'side_effect' ? `${med.name}: noted for the crew medical officer.` : `${med.name} ${kind} logged.`) }} />}
        </div>
      </section>

      <section className="care-block">
        <div className="section-title-row"><div><p className="screen-kicker">SUGGESTED BY IXCHEL TODAY · DAY {missionDay}</p><h2>Countermeasures for you</h2></div><span className="updated-label">First option = best past response for you</span></div>
        {!data && <p className="support-quiet">Start the Ixchel engine to see personal suggestions.</p>}
        {data && flagged.length === 0 && <p className="support-quiet"><Icon name="check" /> Nothing needs a countermeasure today. Keep your routine: sleep, exercise and time with the crew.</p>}
        <div className="care-domains">
          {data && flagged.map(d => (
            <article key={d.key} className="care-domain">
              <header><StatusMark kind={d.kind} size="sm" /><strong>{d.title}</strong><span>{d.status}</span></header>
              <p>{d.description}</p>
              <div className="care-options compact">
                {careFor(d.key, data).map(o => (
                  <button key={o.key} className={applied[d.key] === o.title ? 'care-option selected' : 'care-option'} onClick={() => {
                    setApplied(a => ({ ...a, [d.key]: o.title }))
                    api && logQuietly(api.decision(t, { tarjeta: `care:${d.key}`, dominio: d.key, titulo: `${DOMAIN_LABEL[d.key]} support`, decision: 'applied', contramedida: o.title, arm: o.key }))
                    notify(`${o.title} added to today’s plan. Ixchel will learn from how you respond.`)
                  }}>
                    <span className="care-select"><Icon name="check" /></span>
                    {o.tag && <small>{o.tag}</small>}
                    <h3>{o.title}</h3><strong>{o.duration}</strong><p>{o.copy}</p>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="care-block">
        <div className="section-title-row"><div><p className="screen-kicker">PEOPLE</p><h2>Talk to someone</h2></div><span className="updated-label"><Icon name="clock" /> Earth delay: {delayText(delayMin)}</span></div>
        <div className="talk-grid">
          <article><Icon name="users" /><h3>Support crewmate</h3><p>On board, no delay. Ten quiet minutes together.</p><button className="secondary-action" onClick={() => talk('peer_support_request', 'Support crewmate requested')}>Ask now</button></article>
          <article><Icon name="spark" /><h3>Private conference with the psychologist</h3><p>Booked into the next link window. A short summary travels ahead so they are ready.</p><button className="secondary-action" onClick={() => talk('conference_request', 'Private conference requested', true)}>Request conference</button></article>
          <article><Icon name="pulse" /><h3>Crew medical officer</h3><p>On board. For anything about your body, medication or sleep aids.</p><button className="secondary-action" onClick={() => talk('cmo_request', 'Crew medical officer notified')}>Notify CMO</button></article>
          <article><Icon name="package" /><h3>Family message</h3><p>Write now; it arrives with the delay. The delay is part of the space you share, not a wall.</p><button className="secondary-action" onClick={() => talk('family_message', 'Family message queued')}>Write message</button></article>
        </div>
      </section>

      <section className="care-block two-col">
        <div className="safety-plan">
          <div className="section-title-row"><div><p className="screen-kicker">IN YOUR OWN WORDS · ALWAYS AVAILABLE OFFLINE</p><h2>My safety plan</h2></div></div>
          <p className="support-note">Best written with a clinician, then kept for the hard moments. You can open it any time, even with no link to Earth.</p>
          {SAFETY_PLAN.map((item, i) => (
            <label key={item.id} className="plan-item"><span>{i + 1}</span><div><small>{item.text}</small>
              <textarea rows={2} value={plan[item.id] ?? ''} onChange={e => { setPlan(p => ({ ...p, [item.id]: e.target.value })); setPlanSaved(false) }} /></div></label>
          ))}
          <div className="check-save"><div><strong>{Object.values(plan).filter(v => v.trim()).length} of 8 sections written</strong><span>Shared only with your clinical team.</span></div>
            <button className="primary-action" disabled={!api} onClick={async () => { if (!api) return; await api.savePlan(t, plan); setPlanSaved(true); notify('Safety plan saved.') }}>{planSaved ? 'Saved' : 'Save plan'}</button></div>
        </div>
        <aside className="weekly-session">
          <p className="screen-kicker">PROTOCOL GP6 · PROPOSAL FOR CLINICAL REVIEW</p>
          <h2>Weekly support session</h2>
          <p>A structured 45-minute conversation with the ground psychologist: check-in, one skill (sleep, stress, activity or connection), a small plan for the week, and the safety question.</p>
          <div className="session-next"><small>NEXT SESSION</small><strong>Mission day {nextSession}</strong><span>Prepared with your last daily checks and countermeasures.</span></div>
          <button className="secondary-action" onClick={() => goTo('Daily check')}>Do today’s daily check</button>
          <button className="tertiary-action" onClick={() => goTo('Decision log')}>See what I have done</button>
        </aside>
      </section>
    </div>
  )
}
