// Self-care tools that work without Earth: guided breathing, 5-4-3-2-1 grounding and a private journal.
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { MOOD_LABEL, adherenceOf, loadMedRecord, reply, saveMedRecord, type Analysis, type MedAlert, type MedRecord, type Medication, type MedicationPlan, type Mood, type Severity } from '../care'
import { VoiceBar } from '../components/VoiceBar'
import { commandOf, useVoice } from '../voice'

const PHASES = [
  { label: 'Inhale', seconds: 4 },
  { label: 'Hold', seconds: 4 },
  { label: 'Exhale', seconds: 6 },
] as const

export function BreathingGuide({ compact = false, onDone }: { compact?: boolean; onDone?: (cycles: number) => void }) {
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState({ phase: 0, left: PHASES[0].seconds as number, cycles: 0 })

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setTick(s => {
        if (s.left > 1) return { ...s, left: s.left - 1 }
        const phase = (s.phase + 1) % PHASES.length
        return { phase, left: PHASES[phase].seconds, cycles: s.cycles + (phase === 0 ? 1 : 0) }
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  const { phase, left, cycles } = tick
  const stop = () => { setRunning(false); if (cycles > 0) onDone?.(cycles); setTick({ phase: 0, left: PHASES[0].seconds, cycles: 0 }) }
  const current = PHASES[phase]
  return (
    <div className={compact ? 'breathing compact' : 'breathing'}>
      <div className={`breathing-orb ${running ? current.label.toLowerCase() : ''}`} style={{ ['--phase-s' as string]: `${current.seconds}s` }} aria-hidden="true"><span /></div>
      <div className="breathing-text" aria-live="polite">
        <strong>{running ? current.label : 'Ready when you are'}</strong>
        <span>{running ? `${left} s · cycle ${cycles + 1}` : 'Inhale 4 · hold 4 · exhale 6. About 3 minutes.'}</span>
      </div>
      {running ? <button className="secondary-action" onClick={stop}>Finish</button> : <button className="primary-action" onClick={() => { setTick({ phase: 0, left: PHASES[0].seconds, cycles: 0 }); setRunning(true) }}>Start breathing</button>}
    </div>
  )
}

const SENSES = [
  { n: 5, text: 'things you can see' },
  { n: 4, text: 'things you can touch' },
  { n: 3, text: 'things you can hear' },
  { n: 2, text: 'things you can smell' },
  { n: 1, text: 'thing you can taste' },
]

export function Grounding({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState(0)
  const done = step >= SENSES.length
  return (
    <div className="grounding">
      <div className="grounding-steps">
        {SENSES.map((s, i) => <span key={s.n} className={i < step ? 'done' : i === step ? 'active' : ''}>{i < step ? <Icon name="check" /> : s.n}</span>)}
      </div>
      {done
        ? <p><strong>Well done.</strong> You are here, in the cabin, right now.</p>
        : <p>Name <strong>{SENSES[step].n} {SENSES[step].text}</strong>, one by one, slowly.</p>}
      {done
        ? <button className="secondary-action" onClick={() => setStep(0)}>Start again</button>
        : <button className="primary-action" onClick={() => { const next = step + 1; setStep(next); if (next === SENSES.length) onDone?.() }}>Done, next sense</button>}
    </div>
  )
}

const JOURNAL_KEY = 'armor-journal'

export function Journal() {
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<{ when: string; text: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) ?? '[]') } catch { return [] }
  })
  const save = () => {
    const next = [{ when: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), text: text.trim() }, ...entries].slice(0, 20)
    setEntries(next)
    setText('')
    try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(next)) } catch { /* private mode: keep in memory */ }
  }
  return (
    <div className="journal">
      <label>Three lines about today<textarea rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="What happened, how I felt, one thing that helped…" /></label>
      <div className="journal-actions"><span><Icon name="shield" /> Private: stays on this device, never sent to Earth.</span><button className="primary-action" disabled={!text.trim()} onClick={save}>Save entry</button></div>
      {entries.length > 0 && <ul className="journal-list">{entries.slice(0, 3).map(e => <li key={e.when + e.text}><small>{e.when}</small><p>{e.text}</p></li>)}</ul>}
    </div>
  )
}

// ---------------------------------------------------------------- AI companion
interface CompanionMessage { role: 'user' | 'companion'; text: string }
const QUICK = ['I am tired', 'I feel low', 'I am worried', 'I feel alone', 'I am okay']
const PHOTO_KEY = 'armor-companion-photo'

type FaceBox = { boundingBox: { x: number; y: number; width: number; height: number } }
type FaceDetectorCtor = new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect: (img: HTMLImageElement) => Promise<FaceBox[]> }

export function AICompanion({ analysis, missionDay, voiceDefault = false, onExchange, onEnd, openTool }: {
  analysis: Analysis
  missionDay: number
  voiceDefault?: boolean
  onExchange?: (userText: string, mood: Mood) => void
  onEnd?: (summary: string, exchanges: number) => void
  openTool?: (tool: 'breathing' | 'grounding' | 'journal' | 'peer') => void
}) {
  const voice = useVoice(voiceDefault)
  const [messages, setMessages] = useState<CompanionMessage[]>([{ role: 'companion', text: analysis.opening }])
  const [input, setInput] = useState('')
  const [photo, setPhoto] = useState<{ url: string; focus: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem(PHOTO_KEY) ?? 'null') } catch { return null }
  })
  const [showData, setShowData] = useState(false)
  const [count, setCount] = useState(0)
  const exchanges = useRef(0)
  const ended = useRef(false)

  useEffect(() => {
    setMessages([{ role: 'companion', text: analysis.opening }])
    exchanges.current = 0; ended.current = false; setCount(0)
  }, [analysis.opening])

  const finish = () => {
    if (ended.current || exchanges.current === 0) return
    ended.current = true
    onEnd?.(`${MOOD_LABEL[analysis.mood]} · ${exchanges.current} exchanges · day ${missionDay}`, exchanges.current)
  }
  useEffect(() => finish, []) // eslint-disable-line react-hooks/exhaustive-deps

  const send = (text: string) => {
    const t = text.trim()
    if (!t) return
    const turn = exchanges.current++
    setCount(exchanges.current)
    setMessages(m => [...m, { role: 'user', text: t }])
    setInput('')
    onExchange?.(t, analysis.mood)
    const answer = reply(t, analysis, turn)
    window.setTimeout(() => { setMessages(m => [...m, { role: 'companion', text: answer }]); voice.say(answer) }, 450)
  }
  // hands-free: the opening line is read aloud and whatever is said becomes the message
  useEffect(() => { voice.say(analysis.opening) }, [analysis.opening, voice.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    voice.listen(text => { if (commandOf(text) === 'repeat') voice.say(messagesRef.current[messagesRef.current.length - 1]?.text ?? ''); else send(text) })
    return voice.stopListening
  }, [voice.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const url = ev.target?.result as string
      let focus = 'center 30%'
      const Detector = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector
      if (Detector) {
        try {
          const img = new Image(); img.src = url
          await new Promise(res => { img.onload = res })
          const [face] = await new Detector({ fastMode: true, maxDetectedFaces: 1 }).detect(img)
          if (face) { const b = face.boundingBox; focus = `${((b.x + b.width / 2) / img.naturalWidth * 100).toFixed(0)}% ${((b.y + b.height / 2) / img.naturalHeight * 100).toFixed(0)}%` }
        } catch { /* detector unavailable: keep the default framing */ }
      }
      const next = { url, focus }
      setPhoto(next)
      try { localStorage.setItem(PHOTO_KEY, JSON.stringify(next)) } catch { /* too large for storage: kept for this session */ }
      setMessages(m => [...m, { role: 'companion', text: 'I have them here with us now. When the day gets long, this face is a good place to look. Want to tell me who they are?' }])
    }
    reader.readAsDataURL(file)
  }

  const sevClass = (s: Severity) => (s === 'high' ? 'high' : s === 'watch' ? 'watch' : '')
  return (
    <div className="companion">
      <aside className="companion-side">
        <div className="companion-anchor">
          {photo
            ? <img src={photo.url} alt="Your anchor" style={{ objectPosition: photo.focus }} />
            : <label className="companion-photo-empty"><input type="file" accept="image/*" onChange={onPhoto} /><span>Add a photo</span><small>you, or someone from home</small></label>}
          {photo && <label className="companion-photo-change"><input type="file" accept="image/*" onChange={onPhoto} />Change photo</label>}
        </div>
        <div className="companion-read">
          <small>WHAT I SEE TODAY · {analysis.source === 'engine' ? 'FROM YOUR SENSORS' : 'SAMPLE DATA'}</small>
          <strong>{MOOD_LABEL[analysis.mood]}</strong>
          <ul>{analysis.drivers.slice(0, 3).map(d => <li key={d}>{d}</li>)}</ul>
          <button className="tertiary-action" onClick={() => setShowData(s => !s)}>{showData ? 'Hide the numbers' : 'Show the numbers'}</button>
          {showData && (
            <div className="companion-findings">
              <small>BODY</small>
              {analysis.physical.map(f => <div key={f.key} className={sevClass(f.severity)}><span>{f.label}</span><b>{f.value}</b><i>norm {f.norm}</i></div>)}
              <small>MIND AND CONNECTION</small>
              {analysis.psychological.map(f => <div key={f.key} className={sevClass(f.severity)}><span>{f.label}</span><b>{f.value}</b><i>{f.delta == null ? f.norm : `norm ${f.norm}`}</i></div>)}
            </div>
          )}
        </div>
        <div className="companion-suggest">
          <small>WITHIN REACH</small>
          {analysis.suggestions.map(s => <button key={s.key} className="secondary-action" disabled={!s.local} onClick={() => s.local && openTool?.(s.local)}>{s.title}</button>)}
        </div>
      </aside>
      <div className="companion-chat">
        <VoiceBar voice={voice} compact hint="Just speak; your words are sent as a message. Say &quot;repeat&quot; to hear the last reply again." onRepeat={() => voice.say(messages[messages.length - 1]?.text ?? '')} />
        <div className="companion-messages" aria-live="polite">
          {messages.map((m, i) => <p key={i} className={m.role}>{m.text}</p>)}
        </div>
        <div className="companion-quick">{QUICK.map(q => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>
        <form className="companion-input" onSubmit={e => { e.preventDefault(); send(input) }}>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="In your own words…" aria-label="Message to the companion" />
          <button className="primary-action" type="submit" disabled={!input.trim()}>Send</button>
          <button className="tertiary-action" type="button" onClick={finish} disabled={count === 0 || ended.current}>End session</button>
        </form>
        <p className="companion-privacy"><Icon name="shield" /> Runs on board, with no link to Earth. Only "companion session · mood · length" goes to your decision log.</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- medications
export function MedicationLog({ plan, alerts, missionDay, onLog }: {
  plan: MedicationPlan[]
  alerts: MedAlert[]
  missionDay: number
  onLog?: (kind: 'taken' | 'skipped' | 'side_effect', med: Medication, detail?: string) => void
}) {
  const [record, setRecord] = useState<MedRecord>(loadMedRecord)
  const [open, setOpen] = useState<string | null>(null)
  const [effect, setEffect] = useState('')
  const update = (next: MedRecord) => { setRecord(next); saveMedRecord(next) }
  const todayOf = (id: string) => record.taken[id]?.[missionDay]
  const mark = (med: Medication, v: 'taken' | 'skipped') => {
    update({ ...record, taken: { ...record.taken, [med.id]: { ...(record.taken[med.id] ?? {}), [missionDay]: v } } })
    onLog?.(v, med)
  }
  const addEffect = (med: Medication) => {
    const e = effect.trim(); if (!e) return
    update({ ...record, effects: { ...record.effects, [med.id]: [...(record.effects[med.id] ?? []), { day: missionDay, effect: e }] } })
    setEffect(''); onLog?.('side_effect', med, e)
  }

  return (
    <div className="medication-log">
      <div className="med-list">
        {plan.map(({ med, status, note }) => {
          const done = todayOf(med.id)
          const cls = status.replace(' ', '-')
          return (
            <article key={med.id} className={`med-item ${cls} ${open === med.id ? 'open' : ''}`}>
              <button className="med-head" onClick={() => setOpen(open === med.id ? null : med.id)} aria-expanded={open === med.id}>
                <div><strong>{med.name} {med.dosage}</strong><small>{med.generic} · {med.indication}</small></div>
                <span className={`med-status ${cls}`}>{status}</span>
                <span className="med-adherence"><b>{adherenceOf(med, record)}%</b><small>adherence</small></span>
              </button>
              <p className="med-note">{note}</p>
              {status !== 'suspended' && status !== 'not today' && (
                <div className="med-actions">
                  <button className={done === 'taken' ? 'primary-action' : 'secondary-action'} onClick={() => mark(med, 'taken')}><Icon name="check" /> {done === 'taken' ? 'Taken today' : 'Taken'}</button>
                  <button className={done === 'skipped' ? 'primary-action' : 'secondary-action'} onClick={() => mark(med, 'skipped')}>{done === 'skipped' ? 'Skipped today' : 'Skipped'}</button>
                </div>
              )}
              {open === med.id && (
                <div className="med-detail">
                  <div><small>FREQUENCY</small><p>{med.frequency}</p></div>
                  <div><small>RESTRICTIONS</small><ul>{med.restrictions.map(r => <li key={r} className={med.critical && r.includes('EVA') ? 'critical' : ''}>{r}</li>)}</ul></div>
                  <div><small>KNOWN SIDE EFFECTS</small><p>{med.sideEffects.join(' · ')}</p></div>
                  <div><small>STOCK</small><p>{med.stockDays} days{med.stockDays < 20 ? ' · resupply in next report' : ''}</p></div>
                  <div className="med-effects">
                    <small>SOMETHING YOU NOTICED</small>
                    {(record.effects[med.id] ?? []).slice(-3).map((e, i) => <span key={i}>day {e.day}: {e.effect}</span>)}
                    <form onSubmit={e => { e.preventDefault(); addEffect(med) }}>
                      <input value={effect} onChange={e => setEffect(e.target.value)} placeholder="e.g. bruise on the forearm, groggy until 10:00" aria-label="Side effect" />
                      <button className="secondary-action" type="submit" disabled={!effect.trim()}>Log for the CMO</button>
                    </form>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
      <aside className="med-alerts">
        <small>CROSSED WITH TODAY'S RECOMMENDATIONS</small>
        {alerts.map((a, i) => <article key={i} className={`med-alert ${a.kind}`}><strong>{a.title}</strong><p>{a.text}</p></article>)}
      </aside>
    </div>
  )
}

