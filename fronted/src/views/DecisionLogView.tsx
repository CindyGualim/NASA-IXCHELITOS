// Decision log: everything the astronaut did, and the asynchronous report that travels to Earth.
import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { StatusMark, levelKind } from '../components/StatusMark'
import { supportApi, type AsyncReport, type LogEntry } from '../ixchel'
import { DOMAIN_LABEL, delayText, fmt, type ViewProps } from './shared'

const TYPES: Record<string, { label: string; icon: IconName }> = {
  checkin: { label: 'Daily check', icon: 'check' },
  formulario: { label: 'Questionnaire', icon: 'scan' },
  decision: { label: 'Decision', icon: 'spark' },
  evento: { label: 'Event', icon: 'alert' },
  protocolo: { label: 'Protocol step', icon: 'heart' },
  plan_seguridad: { label: 'Safety plan', icon: 'shield' },
  reporte: { label: 'Report to Earth', icon: 'upload' },
}
const INSTRUMENT: Record<string, string> = { 'Duelo diario': 'Grief check', Equipo: 'Crew check', 'Check-in': 'Daily check', SF1: 'Safety item' }
const EVENT_TEXT: Record<string, string> = {
  peer_support_request: 'Asked the support crewmate', conference_request: 'Requested a private conference', cmo_request: 'Notified the crew medical officer',
  family_message: 'Queued a family message', self_care_breathing: 'Guided breathing', self_care_grounding: 'Grounding exercise',
  emergencia: 'Emergency reported', emergencia_fin: 'Emergency closed, 72-hour window opened',
}

export function DecisionLogView({ scenarioKey, missionDay, delayMin, notify, version }: ViewProps) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [note, setNote] = useState('')
  const [report, setReport] = useState<AsyncReport | null>(null)
  const [busy, setBusy] = useState(false)
  const api = scenarioKey ? supportApi(scenarioKey) : null
  const reload = () => { api?.log().then(r => setEntries(r.registro)).catch(() => undefined) }
  useEffect(reload, [scenarioKey, version]) // eslint-disable-line react-hooks/exhaustive-deps
  const [confirmReset, setConfirmReset] = useState(false)

  const shown = entries.filter(e => filter === 'all' || e.tipo === filter)
  const counts = entries.reduce<Record<string, number>>((c, e) => ({ ...c, [e.tipo]: (c[e.tipo] ?? 0) + 1 }), {})
  const send = async () => {
    if (!api) return
    setBusy(true)
    try { setReport(await api.report(missionDay - 1, note || undefined)); setNote(''); reload(); notify(`Report sent. It reaches Earth in ${delayText(delayMin)}.`) } finally { setBusy(false) }
  }

  return (
    <div className="log-view">
      <header className="compact-view-header"><div><p className="screen-kicker">YOUR RECORD · PRIVATE MEDICAL FILE</p><h1>Decision log</h1><p>Every check, questionnaire, decision and protocol step, in order. You stay in control: ARMOR proposes, you decide, and the log keeps the context for your clinical team.</p></div></header>
      {!scenarioKey && <p className="support-error">Start the Ixchel engine to keep a log.</p>}
      {scenarioKey && <div className="log-layout">
        <section>
          <div className="log-filters">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All · {entries.length}</button>
            {Object.entries(TYPES).filter(([k]) => counts[k]).map(([k, v]) => <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{v.label} · {counts[k]}</button>)}
          </div>
          {shown.length === 0 && <div className="log-empty"><Icon name="clock" /><p>Nothing here yet. Your daily check, decisions on countermeasures and requests for support will appear here.</p></div>}
          <ol className="log-list">
            {shown.map(e => {
              const type = TYPES[e.tipo] ?? { label: e.tipo, icon: 'spark' as IconName }
              const evento = typeof e.evento === 'string' ? EVENT_TEXT[e.evento] ?? e.evento
                : e.tipo === 'formulario' ? `${INSTRUMENT[String(e.instrumento)] ?? String(e.instrumento ?? 'Questionnaire')}${e.puntaje != null ? `: score ${fmt(Number(e.puntaje), 0)}` : ' completed'}` : null
              return (
                <li key={e.id} className={e.seguridad ? 'safety' : ''}>
                  <span className="log-icon"><Icon name={type.icon} /></span>
                  <div>
                    <small>DAY {e.dia + 1} · {e.hora} · {type.label.toUpperCase()}{typeof e.dominio === 'string' ? ` · ${DOMAIN_LABEL[e.dominio] ?? e.dominio}` : ''}</small>
                    <strong>{evento ?? e.resumen.replace('Daily check:', 'Daily check score')}</strong>
                    {typeof e.motivo === 'string' && e.motivo && <p>Reason: {e.motivo}</p>}
                    {typeof e.nota === 'string' && e.nota && <p>“{e.nota}”</p>}
                    {Array.isArray(e.alertas) && e.alertas.length > 0 && <p>Rules: {(e.alertas as string[]).join(', ')}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
        <aside className="report-panel">
          <p className="screen-kicker">ASYNCHRONOUS REPORT</p>
          <h2>Send a summary to Earth</h2>
          <p>With the {delayText(delayMin)} delay, nobody answers in real time. ARMOR packs what the ground team needs into one structured message.</p>
          <label>Add a note (optional)<textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Anything you want the psychologist to know…" /></label>
          <button className="primary-action" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send report'}</button>
          {report && <div className="report-card">
            <header><strong>Mission day {report.mission_day}</strong><span>Arrives in ~{Math.ceil(report.eta_minutes)} min</span></header>
            <div className="report-modules">{Object.entries(report.status_by_module_vs_baseline).map(([d, l]) => <span key={d}><StatusMark kind={levelKind(l)} size="sm" />{DOMAIN_LABEL[d]}</span>)}</div>
            <dl>
              <dt>Sleep, last 7 nights</dt><dd>{report.sleep_hours_last_7_days.map(h => fmt(h, 1)).join(' · ')} h</dd>
              <dt>Reaction time</dt><dd>{report.reflex_trend}</dd>
              <dt>Safety item</dt><dd>{report.safety_item_answer}</dd>
              <dt>Countermeasures used</dt><dd>{report.countermeasures_used.length ? report.countermeasures_used.join(', ') : 'none yet'}</dd>
              <dt>Your notes</dt><dd>{report.astronaut_notes.length ? report.astronaut_notes.map(n => `“${n}”`).join(' ') : 'none'}</dd>
            </dl>
          </div>}
          <div className="reset-demo">
            <p className="screen-kicker">DEMO</p>
            {!confirmReset
              ? <button className="tertiary-action" onClick={() => setConfirmReset(true)}>Reset this scenario</button>
              : <div><p>This deletes every check, decision and report in this scenario and recalculates the original simulated mission. It cannot be undone.</p>
                  <button className="secondary-action" onClick={() => setConfirmReset(false)}>Keep my data</button>
                  <button className="primary-action" onClick={async () => { if (!api) return; await api.reset(); setConfirmReset(false); setReport(null); notify('Scenario reset to the original mission.') }}>Delete and reset</button></div>}
          </div>
        </aside>
      </div>}
    </div>
  )
}
