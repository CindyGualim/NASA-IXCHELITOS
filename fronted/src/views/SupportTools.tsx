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
