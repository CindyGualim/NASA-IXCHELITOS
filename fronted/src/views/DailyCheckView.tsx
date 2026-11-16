// Daily check: check-in (CK1–CK8) + safety item (SF1) + state selector (ST01–ST11), scored by the team's
// self-report layer (autoreporte.py). Suggested questionnaires run inline. Safety always prevails.
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { StatusMark } from '../components/StatusMark'
import { VoiceBar } from '../components/VoiceBar'
import { commandOf, optionOf, readOptions, useVoice } from '../voice'
import { PROTOCOL_OF_SITUATION, sensorAnomaliesFor, situationOf } from '../care'
import { ALERT_TEXT, CHECKIN, FORMS, PROTOCOL_NAME, SAFETY_ITEM, SAFETY_STEPS, SENSOR_CHANNELS, STATES, formsFromPlan, getSensorQuestions, type FormDef, type SensorAnomaly, type SensorQuestion } from '../content'
import { supportApi, logQuietly, type CheckinResult, type DayPayload, type FormResult, type SupportAlert, type TodayVM } from '../ixchel'
import { BreathingGuide } from './SupportTools'
import { DOMAIN_LABEL, delayText, fmt, type ViewProps } from './shared'

const SEVERITY: Record<string, string> = {
  'mínima': 'minimal', leve: 'mild', moderada: 'moderate', 'moderadamente grave': 'moderately severe', grave: 'severe',
}
export const confounderText = (c: string) => c.replace('ruido en el sueño', 'noise during sleep').replace('ruido', 'noise')
  .replace(' en 24 h', ' over 24 h').replace('sueño', 'sleep').replace('2,3', '2.3')

export function AlertList({ alerts }: { alerts: SupportAlert[] }) {
  if (!alerts.length) return <p className="support-quiet"><Icon name="check" /> No rule was triggered. Ixchel keeps comparing you with your own norm.</p>
  return (
    <ul className="support-alerts">
      {alerts.map(a => {
        const t = ALERT_TEXT[a.codigo]
        return (
          <li key={a.codigo + a.detalle} className={a.seguridad ? 'safety' : a.nivel === 'ROJO' ? 'critical' : 'attention'}>
            <StatusMark kind={a.nivel === 'ROJO' ? 'critical' : 'attention'} size="sm" />
            <div>
              <small>{a.codigo} · {DOMAIN_LABEL[a.dominio] ?? a.dominio}{a.protocolo ? ` · ${PROTOCOL_NAME[a.protocolo] ?? a.protocolo}` : ''}</small>
              <strong>{t?.title ?? a.codigo}</strong>
              <p>{t?.action ?? a.accion}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function Scale({ item, value, onChange }: { item: { id: string; scale?: [number, number]; anchors?: Record<number, string> }; value: number | undefined; onChange: (v: number) => void }) {
  const [lo, hi] = item.scale ?? [1, 5]
  const values = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  const wide = values.length <= 4 && Object.keys(item.anchors ?? {}).length === values.length
  return (
    <div className={wide ? 'scale-row wide' : 'scale-row'} role="radiogroup">
      {values.map(v => (
        <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'selected' : ''} onClick={() => onChange(v)}>
          <b>{wide ? item.anchors?.[v] : v}</b>{!wide && item.anchors?.[v] && <small>{item.anchors[v]}</small>}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- questionnaire runner
export function FormRunner({ form, onSubmit, onClose }: { form: FormDef; onSubmit: (answers: Record<string, number>, refused: boolean) => Promise<FormResult>; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<FormResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const asqYes = form.key === 'asq' && ['AQ1', 'AQ2', 'AQ3', 'AQ4'].some(k => answers[k] === 1)
  const items = form.items.filter(i => form.key !== 'asq' || i.id !== 'AQ5' || asqYes)
  const complete = items.every(i => answers[i.id] !== undefined)
  const send = async (refused = false) => {
    setBusy(true); setError('')
    try { setResult(await onSubmit(answers, refused)) } catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  const r = result?.resultado
  return (
    <section className="form-runner" aria-label={form.name}>
      <header><div><p className="screen-kicker">QUESTIONNAIRE · ABOUT {form.minutes} MIN</p><h2>{form.name}</h2><p>{form.stem}</p></div><button className="tertiary-action" onClick={onClose}>Close</button></header>
      {!result && <>
        {items.map((item, i) => (
          <div className="form-item" key={item.id}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <div><p>{item.text}</p><Scale item={item} value={answers[item.id]} onChange={v => setAnswers(a => ({ ...a, [item.id]: v }))} /></div>
          </div>
        ))}
        <div className="check-save">
          <div><strong>{complete ? 'Ready to send' : 'Answer every question to continue'}</strong><span>{form.note}</span></div>
          {form.key === 'asq' && <button className="tertiary-action" disabled={busy} onClick={() => send(true)}>Prefer not to answer</button>}
          <button className="primary-action" disabled={!complete || busy} onClick={() => send(false)}>{busy ? 'Scoring…' : 'Send'}</button>
        </div>
      </>}
      {error && <p className="support-error">Could not reach the Ixchel engine. Your answers were not saved. ({error})</p>}
      {result && <div className="form-result">
        <div className="form-score">
          <small>{form.name}</small>
          <strong>{r?.puntaje == null ? '✓' : fmt(Number(r.puntaje), 0)}</strong>
          <span>{r?.puntaje == null || ['duelo_diario', 'equipo'].includes(form.key) ? 'Saved. Ixchel follows the trend over days, not one answer.'
            : r?.severidad ? `${SEVERITY[String(r.severidad)] ?? r.severidad} symptoms` : r?.positivo ? 'Positive screen' : 'Negative screen'}</span>
        </div>
        <div>
          {r?.nota_tiempo && <p className="support-note">It is too early to read this as a disorder; the program offers support and follow-up.</p>}
          <AlertList alerts={result.alertas} />
          <p className="support-note">This is a screen, not a diagnosis. A professional confirms.</p>
        </div>
      </div>}
    </section>
  )
}

// ---------------------------------------------------------------- safety support (GP3), always first
export function SafetySupport({ acute, delayMin, onAsq, onPlan, onPeer }: { acute: boolean | null; delayMin: number; onAsq?: () => void; onPlan: () => void; onPeer: () => void }) {
  return (
    <section className="safety-support" role="alert">
      <div className="safety-head"><Icon name="users" /><div><p className="screen-kicker">YOU ARE NOT ALONE</p><h2>Thank you for telling us. Support is on its way.</h2>
        <p>Your crew medical officer and the flight surgeon are notified. With the {delayText(delayMin)} delay, an emergency report is already travelling to Earth.</p></div></div>
      <ol className="safety-steps">{(acute ? SAFETY_STEPS.acute : SAFETY_STEPS.notAcute).map(s => <li key={s}>{s}</li>)}</ol>
      {acute === null && onAsq && <div className="safety-next"><p><strong>Five short questions</strong> help the team know how to support you right now.</p><button className="primary-action" onClick={onAsq}>Answer the 5 questions</button></div>}
      <div className="safety-actions">
        <button className="primary-action" onClick={onPeer}><Icon name="users" /> Ask a crewmate to be with me now</button>
        <button className="secondary-action" onClick={onPlan}><Icon name="shield" /> Open my safety plan</button>
      </div>
      <BreathingGuide compact />
      <p className="support-note">Protocol GP3 is a proposal pending clinical review. ARMOR detects, notifies and guides; people decide.</p>
    </section>
  )
}

// ---------------------------------------------------------------- sensor context check (before the check-in)
// Caring questions triggered by what the wearables saw this week, phrased for the active protocol.
export function SensorContextCheck({ protocol, anomalies, voiceDefault = false, onAnswered }: { protocol: string; anomalies: SensorAnomaly[]; voiceDefault?: boolean; onAnswered: (answers: { channel: string; question: string; answer: string }[]) => void }) {
  const questions: SensorQuestion[] = getSensorQuestions(protocol, anomalies)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const voice = useVoice(voiceDefault)
  const state = useRef({ step, answers, questions })
  state.current = { step, answers, questions }

  const current = questions[step] as SensorQuestion | undefined
  const isLast = step === questions.length - 1
  const answer = answers[step]
  const finish = () => onAnswered(questions.map((q, i) => ({ channel: q.trigger_channel, question: q.question, answer: answers[i] ?? 'Prefer not to say' })))
  const readCurrent = () => { const q = state.current.questions[state.current.step]; if (q) voice.say(readOptions(`Question ${state.current.step + 1} of ${state.current.questions.length}. ${q.question}`, q.options)) }
  const choose = (opt: string) => {
    setAnswers(a => ({ ...a, [step]: opt }))
    const q = state.current.questions[state.current.step]
    const followUp = q.follow_up && opt !== 'Prefer not to say' && opt !== q.options[q.options.length - 1] ? ` ${q.follow_up}` : ''
    voice.say(`${opt}.${followUp} ${state.current.step === state.current.questions.length - 1 ? 'Say "done" to continue to the daily check.' : 'Say "next" for the next question.'}`)
  }

  useEffect(() => { if (questions.length) readCurrent() }, [step, voice.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!questions.length) return
    voice.listen(text => {
      const { step: s, answers: a, questions: qs } = state.current
      const cmd = commandOf(text)
      if (cmd === 'repeat') return readCurrent()
      if (cmd === 'skip') { setAnswers(x => ({ ...x, [s]: 'Prefer not to say' })); return }
      if (cmd === 'next' && a[s] !== undefined) { if (s === qs.length - 1) finish(); else setStep(s + 1); return }
      const opt = optionOf(text, [...qs[s].options, 'Prefer not to say'])
      if (opt) choose(opt)
      else voice.say('I did not catch that. Say the option number, "repeat" or "skip".')
    })
    return voice.stopListening
  }, [voice.enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null
  const anom = anomalies.find(a => a.channel === current.trigger_channel)
  const channel = SENSOR_CHANNELS[current.trigger_channel]
  const below = (anom?.delta_pct ?? 0) < 0
  const showFollowUp = Boolean(current.follow_up && answer && answer !== 'Prefer not to say' && answer !== current.options[current.options.length - 1])

  return (
    <section className="sensor-check" aria-label="Sensor check">
      <VoiceBar voice={voice} compact hint='Say the option number, "repeat", "skip" or "next"' onRepeat={readCurrent} />
      <header>
        <div>
          <p className="screen-kicker">WHAT YOUR SENSORS SAW · {step + 1} OF {questions.length}</p>
          <strong>{channel.label}</strong>
          {anom && <span className={`sensor-delta ${below ? 'below' : 'above'}`}>{below ? '↓' : '↑'} {Math.abs(Math.round(anom.delta_pct))}% vs. your norm{anom.raw_value != null && anom.norm_value != null ? ` · ${anom.raw_value.toLocaleString('en-US')} ${channel.unit} this week, usually ${anom.norm_value.toLocaleString('en-US')}` : ''}</span>}
        </div>
        <div className="sensor-progress">{questions.map((_, i) => <span key={i} className={i < step ? 'done' : i === step ? 'active' : ''} />)}</div>
      </header>
      <h2>{current.question}</h2>
      <div className="answer-options">
        {[...current.options, 'Prefer not to say'].map(opt => (
          <button key={opt} className={answer === opt ? 'selected' : ''} onClick={() => choose(opt)}>{answer === opt && <Icon name="check" />}{opt}</button>
        ))}
      </div>
      {showFollowUp && <p className="sensor-follow-up">{current.follow_up}</p>}
      <div className="sensor-nav">
        <p className="privacy-copy"><Icon name="shield" />Goes to your private log only. It helps Ixchel tell a physical cause from an emotional one.</p>
        {answer && (isLast
          ? <button className="primary-action" onClick={finish}>Continue to the daily check <Icon name="chevron" /></button>
          : <button className="secondary-action" onClick={() => setStep(s => s + 1)}>Next <Icon name="chevron" /></button>)}
        {!answer && <button className="tertiary-action" onClick={finish}>Skip for today</button>}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- the view
export function DailyCheckView({ scenarioKey, scenario, today, data, missionDay, delayMin, goTo, notify, safetyActive = false, checkedToday = false }: ViewProps & { scenario: string; today: TodayVM | null; data: DayPayload | null; safetyActive?: boolean; checkedToday?: boolean }) {
  const situation = situationOf(scenario, today)
  const anomalies = sensorAnomaliesFor(situation, data, missionDay)
  const [sensorDone, setSensorDone] = useState<number | null>(null)   // mission day whose sensor check was answered
  const [answers, setAnswers] = useState<Record<string, number | string>>({})
  const [sf1, setSf1] = useState<number | null>(null)
  const [states, setStates] = useState<string[]>([])
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [form, setForm] = useState<string | null>(null)
  const [asqAcute, setAsqAcute] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const api = scenarioKey ? supportApi(scenarioKey) : null
  const t = missionDay - 1
  const scaleItems = CHECKIN.filter(i => !i.open)
  const done = scaleItems.filter(i => answers[i.id] !== undefined).length + (sf1 !== null ? 1 : 0)
  const total = scaleItems.length + 1
  const ready = done === total

  const toggleState = (id: string) => setStates(cur => {
    if (cur.includes(id)) return cur.filter(s => s !== id)
    if (id === 'ST01') return ['ST01']
    return [...cur.filter(s => s !== 'ST01'), id]
  })
  const submit = async () => {
    if (!api) return
    setBusy(true); setError('')
    try {
      const r = await api.checkin(t, answers, sf1, states)
      setResult(r); setForm(null); setAsqAcute(null)
      if (r.seguridad_activa) logQuietly(api.report(t, 'Safety answer in daily check', 'safety'))
    } catch (e) { setError(String(e)) } finally { setBusy(false) }
  }
  // safety stays active for the day even after leaving and coming back (the engine remembers it)
  const safety = result?.seguridad_activa ?? safetyActive
  const suggested = result ? result.plan.flatMap(p => formsFromPlan(p.formularios)) : []
  const forms = [...new Map(suggested.map(f => [f.label, f])).values()]
  if (safety && !forms.some(f => f.key === 'asq')) forms.unshift({ key: 'asq', label: 'ASQ' })

  return (
    <div className="daily-check-view">
      <header className="compact-view-header"><div><p className="screen-kicker">PRIVATE · ABOUT 60 SECONDS · DAY {missionDay}</p><h1>Daily check</h1><p>Seven quick ratings, one safety question and how you feel lately. Ixchel compares you with your own norm, never with an average astronaut.</p></div><span className="check-timer"><Icon name="clock" /> Under 1 min</span></header>
      {!scenarioKey && <p className="support-error">The Ixchel engine is offline. Start the API to save and score your check-in (cd ixchel &amp;&amp; uvicorn api:app --port 8000).</p>}

      {checkedToday && !result && !safety && <p className="support-quiet"><Icon name="check" /> Today’s check is already in. You can answer again if something changed; the new answers replace today’s.</p>}

      {safety && <SafetySupport acute={asqAcute} delayMin={delayMin} onAsq={() => setForm('asq')}
        onPlan={() => goTo('Care')} onPeer={() => { api && logQuietly(api.event(t, 'peer_support_request', 'Asked a crewmate to stay with me')); notify('Your support crewmate has been called.') }} />}

      {form && api && <FormRunner form={FORMS[form]} onClose={() => setForm(null)} onSubmit={async (a, refused) => {
        const r = await api.form(t, form, a, refused)
        if (form === 'asq' && r.resultado.positivo) {
          setAsqAcute(Boolean(r.resultado.agudo))
          setResult(cur => cur ? { ...cur, seguridad_activa: true } : cur)   // the engine also marks the day (safety banner)
          logQuietly(api.report(t, r.resultado.agudo ? 'ASQ acute' : 'ASQ positive, not acute', 'safety'))
        }
        return r
      }} />}

      {!result && !safety && sensorDone !== missionDay && (
        <SensorContextCheck key={`${situation}-${missionDay}`} protocol={PROTOCOL_OF_SITUATION[situation]} anomalies={anomalies} voiceDefault={situation === 'emergency'} onAnswered={list => {
          setSensorDone(missionDay)
          if (list.length && api) logQuietly(api.event(t, 'sensor_check', list.map(a => `${SENSOR_CHANNELS[a.channel as keyof typeof SENSOR_CHANNELS]?.label ?? a.channel}: ${a.answer}`).join(' · ')))
          if (list.length) notify('Thank you. Your answers are in your private log.')
        }} />
      )}

      {!result && <>
        <div className="check-progress"><i style={{ width: `${Math.max(6, (done / total) * 100)}%` }} /></div>
        <section className="checkin-grid">
          {scaleItems.map((item, i) => (
            <div className="checkin-item" key={item.id}>
              <p><span>{String(i + 1).padStart(2, '0')}</span>{item.text}</p>
              <Scale item={item} value={answers[item.id] as number | undefined} onChange={v => setAnswers(a => ({ ...a, [item.id]: v }))} />
            </div>
          ))}
          <label className="checkin-note">{CHECKIN[7].text} <small>(optional)</small>
            <textarea rows={2} value={String(answers.CK8 ?? '')} onChange={e => setAnswers(a => ({ ...a, CK8: e.target.value }))} placeholder="Write it in your own words…" /></label>
        </section>

        <section className="question-card safety-question">
          <span className="question-number">08</span>
          <div><p className="screen-kicker">ONE QUESTION WE ASK EVERYONE, EVERY DAY</p><h2>{SAFETY_ITEM.text}</h2>
            <div className="answer-options">{[0, 1, 2].map(v => <button key={v} className={sf1 === v ? 'selected' : ''} onClick={() => setSf1(v)}>{sf1 === v && <Icon name="check" />}{SAFETY_ITEM.anchors?.[v]}</button>)}</div>
            <p className="privacy-copy"><Icon name="shield" />Any answer other than “No” brings support right away. It is never used against you.</p>
          </div>
        </section>

        <section className="question-card">
          <span className="question-number">09</span>
          <div><p className="screen-kicker">OPTIONAL · MARK ALL THAT APPLY</p><h2>What best describes how you have felt lately?</h2>
            <div className="state-options">{STATES.map(s => <button key={s.id} className={states.includes(s.id) ? 'selected' : ''} aria-pressed={states.includes(s.id)} onClick={() => toggleState(s.id)}>{states.includes(s.id) && <Icon name="check" />}{s.text}</button>)}</div>
            <p className="privacy-copy"><Icon name="shield" />Your selection only decides which short questionnaire is offered next. Nothing is ever rejected.</p>
          </div>
        </section>

        <div className="check-save"><div><strong>{ready ? 'Ready to save' : `${done} of ${total} answered`}</strong><span>Answers stay in your private medical record.</span></div>
          <button className="primary-action" disabled={!ready || busy || !scenarioKey} onClick={submit}>{busy ? 'Saving…' : 'Save check'}</button></div>
        {error && <p className="support-error">Could not save: {error}</p>}
      </>}

      {result && <section className="checkin-result">
        <div className="checkin-score">
          <p className="screen-kicker">TODAY’S CHECK</p>
          <strong>{fmt(result.resultado.puntaje, 1)}<small>/5</small></strong>
          <span>{result.base ? `Your usual: ${fmt(result.base.media, 1)} ± ${fmt(result.base.sd, 1)}` : 'Your personal baseline is still being built (14 check-ins).'}</span>
          <CheckinSpark serie={result.serie} base={result.base} />
          <small className="spark-legend"><i className="user" /> your answers · <i /> earlier days (simulated history)</small>
        </div>
        <div className="checkin-findings">
          <p className="screen-kicker">WHAT IXCHEL NOTICED</p>
          <AlertList alerts={result.alertas.filter(a => !(safety && a.seguridad))} />
          {result.confusores.length > 0 && <p className="support-note"><Icon name="alert" /> Possible non-emotional causes today: {result.confusores.map(confounderText).join('; ')}. Check them first.</p>}
          {forms.length > 0 && <>
            <p className="screen-kicker" style={{ marginTop: 18 }}>SUGGESTED FOR YOU</p>
            <div className="suggested-forms">{forms.map(f => f.key === 'plan'
              ? <button key={f.label} className="secondary-action" onClick={() => goTo('Care')}>Safety plan · in Care</button>
              : f.key
              ? <button key={f.label} className="secondary-action" onClick={() => setForm(f.key)}>{f.label} · {FORMS[f.key!].minutes} min</button>
              : <span key={f.label} className="form-offline">{f.label} · with your crew medical officer</span>)}</div>
          </>}
          <div className="checkin-next">
            <button className="primary-action" onClick={() => goTo('Care')}>Go to Care</button>
            <button className="tertiary-action" onClick={() => { setResult(null); setAnswers({}); setSf1(null); setStates([]) }}>Edit today’s check</button>
          </div>
        </div>
      </section>}
    </div>
  )
}

function CheckinSpark({ serie, base }: { serie: CheckinResult['serie']; base: CheckinResult['base'] }) {
  if (serie.length < 2) return null
  const W = 300, H = 80, x = (i: number) => 4 + (i * (W - 8)) / (serie.length - 1), y = (v: number) => H - 6 - ((v - 1) / 4) * (H - 12)
  return (
    <svg className="checkin-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily check over the last 30 days">
      {base && <rect x="0" width={W} y={y(Math.min(5, base.media + base.sd))} height={Math.max(2, y(Math.max(1, base.media - base.sd)) - y(Math.min(5, base.media + base.sd)))} className="band" />}
      <polyline points={serie.map((p, i) => `${x(i)},${y(p.compuesto)}`).join(' ')} />
      {serie.map((p, i) => p.usuario && <circle key={p.dia} cx={x(i)} cy={y(p.compuesto)} r="4" />)}
    </svg>
  )
}
