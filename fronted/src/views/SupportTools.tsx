// Self-care tools that work without Earth: guided breathing, 5-4-3-2-1 grounding and a private journal.
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'

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

interface CompanionMessage { role: 'user' | 'companion'; text: string; timestamp: number }

export function AICompanion({ onDone }: { onDone?: () => void }) {
  const [messages, setMessages] = useState<CompanionMessage[]>([
    { role: 'companion', text: 'Hello. I'm here with you. How are you feeling right now?', timestamp: Date.now() }
  ])
  const [input, setInput] = useState('')
  const [photoMode, setPhotoMode] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const COMPANION_RESPONSES: Record<string, string[]> = {
    tired: ['Rest is one of the best things you can do right now. Would you like a breathing exercise?', 'That makes sense. Would it help to talk about what's making you tired?'],
    sad: ['I hear you. Those feelings are valid. Would you like to write about it, or talk to someone?', 'That's a lot to carry. Remember you have support on the crew and on Earth.'],
    happy: ['I'm glad you're feeling good. Let's keep that momentum.', 'That's wonderful. What helped you feel this way?'],
    worried: ['Worry is natural in space. Would grounding exercises help?', 'Let's break this down. What's the first thing you need to handle?'],
    alone: ['You have people who care about you, even across the distance.', 'Would talking to a crewmate help? Or writing a message to Earth?'],
    default: ['I'm here to listen and support you.', 'That sounds important. Tell me more.', 'How can I help right now?']
  }

  const getCompanionResponse = (text: string): string => {
    const lower = text.toLowerCase()
    for (const [keyword, responses] of Object.entries(COMPANION_RESPONSES)) {
      if (lower.includes(keyword)) return responses[Math.floor(Math.random() * responses.length)]
    }
    return COMPANION_RESPONSES.default[Math.floor(Math.random() * COMPANION_RESPONSES.default.length)]
  }

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg: CompanionMessage = { role: 'user', text: input, timestamp: Date.now() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setTimeout(() => {
      const response: CompanionMessage = {
        role: 'companion',
        text: getCompanionResponse(input),
        timestamp: Date.now()
      }
      setMessages(m => [...m, response])
    }, 500)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string)
        setPhotoMode(false)
        setMessages(m => [...m, {
          role: 'companion',
          text: 'I see someone important to you. That's a good reminder that people care about you from Earth. Do you want to talk about them or about how you're feeling?',
          timestamp: Date.now()
        }])
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="ai-companion">
      {photoUrl && <div className="companion-photo"><img src={photoUrl} alt="Support companion" style={{ maxWidth: '100px', borderRadius: '8px', marginBottom: '1rem' }} /></div>}

      {photoMode ? (
        <div className="photo-upload">
          <p>Upload a photo of yourself or someone important to you</p>
          <label className="file-input">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            <span>Choose photo</span>
          </label>
          <button className="tertiary-action" onClick={() => setPhotoMode(false)}>Cancel</button>
        </div>
      ) : (
        <>
          <div className="companion-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.role === 'companion' && <Icon name="heart" />}
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <div className="companion-input">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              placeholder="How are you feeling…"
            />
            <button className="primary-action" onClick={sendMessage} disabled={!input.trim()}>
              <Icon name="check" />
            </button>
            <button className="tertiary-action" onClick={() => setPhotoMode(true)} title="Upload photo">
              <Icon name="users" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export interface Medication {
  id: string; name: string; dosage: string; frequency: string; indication: string
  adherence: number; sideEffects: string[]; warnings: string[]; daysRemaining: number
}

export function MedicationLog({ medications = [] }: { medications?: Medication[] }) {
  const [selectedMed, setSelectedMed] = useState<string | null>(null)
  const [logs, setLogs] = useState<Record<string, boolean>>({})

  const defaultMeds: Medication[] = medications.length > 0 ? medications : [
    { id: 'm1', name: 'Sleep Aid (Zaleplon)', dosage: '5 mg', frequency: 'As needed', indication: 'Sleep', adherence: 76, sideEffects: ['Grogginess'], warnings: ['No EVA in 8h after'], daysRemaining: 12 },
    { id: 'm2', name: 'Anticoagulant', dosage: '5 mg', frequency: '2x daily', indication: 'Prevention', adherence: 100, sideEffects: ['Bruising'], warnings: ['CRITICAL: Suspend 24h before EVA'], daysRemaining: 28 },
  ]

  const selected = defaultMeds.find(m => m.id === selectedMed)

  return (
    <div className="medication-log">
      {!selectedMed ? (
        <>
          <div className="meds-list">
            {defaultMeds.map(med => (
              <button key={med.id} className="med-item" onClick={() => setSelectedMed(med.id)}>
                <strong>{med.name}</strong>
                <small>{med.dosage} · {med.frequency}</small>
                <span className="adherence">{med.adherence}%</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="back-button" onClick={() => setSelectedMed(null)}>
            <Icon name="chevron" /> Back
          </button>
          {selected && (
            <div className="med-detail">
              <h3>{selected.name}</h3>
              <p><strong>{selected.dosage}</strong> · {selected.frequency}</p>
              <p className="indication">{selected.indication}</p>

              {selected.warnings.some(w => w.includes('CRITICAL')) && (
                <div className="warning-banner">
                  <Icon name="alert" />
                  <p>{selected.warnings.find(w => w.includes('CRITICAL'))}</p>
                </div>
              )}

              <div className="med-actions">
                <button className="primary-action" onClick={() => { setLogs(l => ({ ...l, [selected.id]: true })); alert('✓ Taken logged') }}>
                  <Icon name="check" /> Taken
                </button>
                <button className="secondary-action" onClick={() => { setLogs(l => ({ ...l, [selected.id]: false })); alert('✗ Skipped logged') }}>
                  Skipped
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
