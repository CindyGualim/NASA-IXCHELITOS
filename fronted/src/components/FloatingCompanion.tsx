// The companion's face as a floating bubble: always on top, draggable, and it says out loud (or
// mouths) everything the app says. A tap opens the conversation in Care.
import { useEffect, useRef, useState } from 'react'
import { companion, openCompanion, useCompanion } from '../companionStore'
import { onSpeech, stopTalking } from '../voice'
import { TalkingPhoto } from './TalkingPhoto'

const SIZE = 92
const MARGIN = 12

export function FloatingCompanion() {
  const { photo, speaks, pos } = useCompanion()
  const [caption, setCaption] = useState('')
  const [talking, setTalking] = useState(false)
  const [hidden, setHidden] = useState(false)
  const drag = useRef<{ dx: number; dy: number; moved: boolean; id: number } | null>(null)
  const [live, setLive] = useState<{ x: number; y: number } | null>(null)
  const clear = useRef<ReturnType<typeof setTimeout> | null>(null)

  // caption: the sentence being said right now
  useEffect(() => onSpeech(e => {
    if (e.type === 'start') { if (clear.current) clearTimeout(clear.current); setCaption(e.text); setTalking(true) }
    else if (e.type === 'idle') { setTalking(false); clear.current = setTimeout(() => setCaption(''), 2200) }
  }), [])

  // keep it on screen when the window changes size
  const [, setTick] = useState(0)
  useEffect(() => { const r = () => setTick(t => t + 1); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r) }, [])

  if (!photo?.face) return null
  const vw = window.innerWidth, vh = window.innerHeight
  const clamp = (p: { x: number; y: number }) => ({ x: Math.max(MARGIN, Math.min(vw - SIZE - MARGIN, p.x)), y: Math.max(MARGIN, Math.min(vh - SIZE - MARGIN, p.y)) })
  const at = clamp(live ?? pos ?? { x: vw - SIZE - 24, y: vh - SIZE - 24 })
  const left = at.x + SIZE / 2 > vw / 2   // caption opens toward the middle of the screen

  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { dx: e.clientX - at.x, dy: e.clientY - at.y, moved: false, id: e.pointerId }
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const p = { x: e.clientX - d.dx, y: e.clientY - d.dy }
    if (!d.moved && Math.hypot(p.x - at.x, p.y - at.y) < 5) return
    d.moved = true
    setLive(clamp(p))
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.moved && live) { companion.setPos(live); setLive(null) }
    else openCompanion()
  }

  if (hidden) return <button type="button" className="companion-bubble-restore" onClick={() => setHidden(false)} aria-label="Show companion">●</button>

  return (
    <div className={`companion-bubble ${talking ? 'talking' : ''} ${live ? 'dragging' : ''}`} style={{ left: at.x, top: at.y, width: SIZE, height: SIZE }}>
      <div className="companion-bubble-face" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; setLive(null) }}
        role="button" tabIndex={0} aria-label="Companion: tap to talk, drag to move" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openCompanion() }}>
        <TalkingPhoto photo={photo} size={SIZE} adjustable={false} />
      </div>
      {caption && <p className={`companion-bubble-caption ${left ? 'left' : 'right'} ${at.y < 140 ? 'below' : ''}`} aria-live="polite">{caption}</p>}
      <div className="companion-bubble-tools">
        <button type="button" onClick={() => companion.setSpeaks(!speaks)} aria-label={speaks ? 'Mute companion' : 'Let companion speak'} title={speaks ? 'Mute' : 'Speak'}>{speaks ? '🔊' : '🔇'}</button>
        {talking && <button type="button" onClick={stopTalking} aria-label="Stop talking" title="Stop">■</button>}
        <button type="button" onClick={() => setHidden(true)} aria-label="Hide companion" title="Hide">–</button>
      </div>
    </div>
  )
}
