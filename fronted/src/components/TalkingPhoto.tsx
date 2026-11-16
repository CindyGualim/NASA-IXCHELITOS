// A photo that comes alive: it breathes, blinks and moves its lips with whatever the companion says.
// Everything is drawn on a canvas from the one picture; nothing leaves the device.
import { useEffect, useRef, useState } from 'react'
import { CHARS_PER_SECOND, onSpeech } from '../voice'

type Pt = { x: number; y: number }   // fractions of the image (0..1)
export interface FacePoints { mouth: Pt; mouthW: number; eyes?: [Pt, Pt] }
export interface Photo { url: string; focus?: string; face?: FacePoints }

// ---------------------------------------------------------------- lip shapes from text
// openness of the mouth for each letter: open vowels wide, lips closed on m/b/p
const SHAPE: Record<string, number> = { a: 1, o: 0.85, e: 0.7, u: 0.5, i: 0.45, y: 0.4, w: 0.3, m: 0, b: 0, p: 0, f: 0.15, v: 0.15 }
const PAUSE: Record<string, number> = { '.': 5, '!': 5, '?': 5, ',': 2, ';': 3, ':': 3, '—': 3, '…': 5 }
interface Track { slots: number[]; slotOfChar: number[] }
function trackOf(text: string): Track {
  const slots: number[] = [], slotOfChar: number[] = []
  const lower = text.toLowerCase().normalize('NFD')
  for (const ch of lower) {
    slotOfChar.push(slots.length)
    if (PAUSE[ch]) { for (let i = 0; i < PAUSE[ch]; i++) slots.push(0) }
    else if (/\s/.test(ch)) slots.push(0.08)
    else if (/[a-z]/.test(ch)) slots.push(SHAPE[ch] ?? 0.3)
    else if (/[0-9]/.test(ch)) slots.push(0.6)
  }
  return { slots, slotOfChar }
}

// ---------------------------------------------------------------- image helpers
/** Shrinks the upload so it fits comfortably in local storage. */
export async function shrinkPhoto(file: File, max = 720): Promise<string> {
  const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file) })
  const img = await loadImage(url)
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.88)
}
const loadImage = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })

type Landmark = { type: string; locations: { x: number; y: number }[] }
type Face = { boundingBox: { x: number; y: number; width: number; height: number }; landmarks?: Landmark[] }
type FaceDetectorCtor = new (opts?: { fastMode?: boolean; maxDetectedFaces?: number }) => { detect: (img: HTMLImageElement) => Promise<Face[]> }

/** Finds the mouth and eyes with the browser's face detector, where it exists (Chrome with the flag, some Android). */
export async function detectFace(url: string): Promise<FacePoints | null> {
  const Detector = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector
  if (!Detector) return null
  try {
    const img = await loadImage(url)
    const [face] = await new Detector({ fastMode: false, maxDetectedFaces: 1 }).detect(img)
    if (!face) return null
    const w = img.naturalWidth, h = img.naturalHeight, b = face.boundingBox
    const avg = (ls: { x: number; y: number }[]) => ({ x: ls.reduce((s, l) => s + l.x, 0) / ls.length / w, y: ls.reduce((s, l) => s + l.y, 0) / ls.length / h })
    const mouthL = face.landmarks?.find(l => l.type === 'mouth')
    const eyeL = face.landmarks?.filter(l => l.type === 'eye') ?? []
    const mouth = mouthL?.locations.length ? avg(mouthL.locations) : { x: (b.x + b.width / 2) / w, y: (b.y + b.height * 0.78) / h }
    const eyes = eyeL.length === 2 ? [avg(eyeL[0].locations), avg(eyeL[1].locations)] as [Pt, Pt] : undefined
    return { mouth, mouthW: (b.width * 0.36) / w, eyes }
  } catch { return null }
}

// ---------------------------------------------------------------- component
type Step = 'mouth' | 'eye1' | 'eye2' | null

export function TalkingPhoto({ photo, onFace, size = 200, onReady, adjustable = true }: { photo: Photo; onFace?: (face: FacePoints) => void; size?: number; onReady?: () => void; adjustable?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [step, setStep] = useState<Step>(photo.face ? null : 'mouth')
  const [draft, setDraft] = useState<FacePoints | null>(photo.face ?? null)
  const [talking, setTalking] = useState(false)
  const speech = useRef<{ track: Track; t0: number; rate: number } | null>(null)
  const cropRef = useRef({ sx: 0, sy: 0, S: 1 })

  useEffect(() => { let live = true; loadImage(photo.url).then(i => live && setImg(i)).catch(() => {}); return () => { live = false } }, [photo.url])
  useEffect(() => { setDraft(photo.face ?? null); setStep(photo.face ? null : 'mouth') }, [photo.url, JSON.stringify(photo.face ?? null)]) // eslint-disable-line react-hooks/exhaustive-deps

  // the speech bus drives the lips
  useEffect(() => onSpeech(e => {
    if (e.type === 'start') { speech.current = { track: trackOf(e.text), t0: performance.now(), rate: e.rate }; setTalking(true) }
    else if (e.type === 'boundary' && speech.current) {
      const s = speech.current, slot = s.track.slotOfChar[e.charIndex] ?? 0
      s.t0 = performance.now() - (slot / (CHARS_PER_SECOND * s.rate)) * 1000   // resync with the real voice
    } else if (e.type === 'end') speech.current = null          // between sentences: lips close, glow stays
    else if (e.type === 'idle') { speech.current = null; setTalking(false) }
  }), [])

  // render loop
  useEffect(() => {
    const c = canvas.current
    if (!c || !img) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const C = Math.round(size * dpr)
    c.width = C; c.height = C
    const ctx = c.getContext('2d')!
    const iw = img.naturalWidth, ih = img.naturalHeight
    const face = step ? null : draft
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // crop: whole photo while marking points, close on the face once we know it
    let S = Math.min(iw, ih), cx = iw / 2, cy = ih / 2
    if (face) {
      S = Math.min(iw, ih, face.mouthW * iw * 5.2)
      cx = face.mouth.x * iw; cy = face.mouth.y * ih - face.mouthW * iw * 0.95
    } else if (photo.focus) {
      const [fx, fy] = photo.focus.split(' ').map(v => parseFloat(v) / 100)
      if (Number.isFinite(fx) && Number.isFinite(fy)) { cx = fx * iw; cy = fy * ih }
    }
    const sx = Math.max(0, Math.min(iw - S, cx - S / 2)), sy = Math.max(0, Math.min(ih - S, cy - S / 2))
    cropRef.current = { sx, sy, S }
    const k = C / S
    const toC = (p: Pt) => ({ x: (p.x * iw - sx) * k, y: (p.y * ih - sy) * k })

    // skin tone just below each eye, for the eyelids
    let lid = ['#c99a80', '#c99a80']
    if (face?.eyes) {
      const probe = document.createElement('canvas'); probe.width = iw; probe.height = ih
      const pc = probe.getContext('2d', { willReadFrequently: true })!
      pc.drawImage(img, 0, 0)
      const eyeGap = Math.hypot((face.eyes[0].x - face.eyes[1].x) * iw, (face.eyes[0].y - face.eyes[1].y) * ih)
      lid = face.eyes.map(e => {
        try {
          const d = pc.getImageData(Math.round(e.x * iw - 3), Math.round(e.y * ih + eyeGap * 0.28), 6, 4).data
          let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2] }
          const n = d.length / 4; return `rgb(${r / n | 0},${g / n | 0},${b / n | 0})`
        } catch { return '#c99a80' }
      })
    }

    let open = 0, raf = 0, last = performance.now(), nextBlink = last + 2500, blinkAt = -1, wordGain = 1, lastSlot = -1
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      // lips: follow the text timeline
      let target = 0
      const s = speech.current
      if (s) {
        const pos = ((now - s.t0) / 1000) * CHARS_PER_SECOND * s.rate
        const i = Math.floor(pos)
        if (i < s.track.slots.length) {
          if (i !== lastSlot) { lastSlot = i; if (s.track.slots[i] < 0.1) wordGain = 0.75 + Math.random() * 0.35 }
          const a = s.track.slots[i], b = s.track.slots[i + 1] ?? 0, f = pos - i
          target = (a + (b - a) * f) * wordGain
        } else target = 0.15 + 0.15 * Math.sin(now / 90)   // voice still going past our estimate
      }
      open += (target - open) * Math.min(1, dt * 22)

      ctx.save()
      ctx.clearRect(0, 0, C, C)
      // alive: slow breathing and sway, a little nod while talking
      if (!calm) {
        const t = now / 1000
        const sc = 1.012 + 0.008 * Math.sin(t * 1.35)
        ctx.translate(C / 2, C * 0.62)
        ctx.rotate(0.008 * Math.sin(t * 0.9) + 0.012 * open * Math.sin(t * 7))
        ctx.scale(sc, sc)
        ctx.translate(-C / 2, -C * 0.62 + 0.004 * C * Math.sin(t * 1.35))
      }
      ctx.drawImage(img, sx, sy, S, S, 0, 0, C, C)

      if (face) {
        const m = toC(face.mouth), mw = face.mouthW * iw * k, half = mw / 2
        const drop = open * mw * 0.32
        if (drop > 0.4) {
          const d = (x: number) => { const u = (x - m.x) / half; return Math.abs(u) >= 1 ? 0 : drop * Math.sqrt(1 - u * u) }
          // inside of the mouth
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(m.x - half, m.y)
          for (let x = m.x - half; x <= m.x + half; x += 1) ctx.lineTo(x, m.y - d(x) * 0.12)
          for (let x = m.x + half; x >= m.x - half; x -= 1) ctx.lineTo(x, m.y + d(x))
          ctx.closePath()
          const g = ctx.createLinearGradient(0, m.y, 0, m.y + drop)
          g.addColorStop(0, '#2a0d10'); g.addColorStop(1, '#4a1a1e')
          ctx.fillStyle = g; ctx.fill(); ctx.clip()
          ctx.fillStyle = 'rgba(236,230,218,0.9)'                                   // upper teeth
          ctx.fillRect(m.x - half * 0.7, m.y - drop * 0.12, half * 1.4, Math.min(drop * 0.32, mw * 0.08))
          ctx.fillStyle = 'rgba(150,60,66,0.55)'                                    // tongue
          ctx.beginPath(); ctx.ellipse(m.x, m.y + drop, half * 0.55, drop * 0.35, 0, 0, Math.PI * 2); ctx.fill()
          ctx.restore()
          // lower lip and chin: thin vertical strips, stretched down and squeezed back by the jaw line
          const jaw = mw * 1.25, stripW = Math.max(1, Math.round(dpr))
          for (let x = Math.floor(m.x - half); x < m.x + half; x += stripW) {
            const dx = d(x + stripW / 2)
            if (dx < 0.2) continue
            const srcX = sx + x / k, srcY = sy + m.y / k
            ctx.drawImage(img, srcX, srcY, stripW / k, jaw / k, x, m.y + dx, stripW, jaw - dx)
          }
        }
        // blink every few seconds
        if (face.eyes) {
          if (blinkAt < 0 && now > nextBlink) blinkAt = now
          if (blinkAt >= 0) {
            const p = (now - blinkAt) / 160
            if (p >= 1) { blinkAt = -1; nextBlink = now + 2200 + Math.random() * 3800 }
            else {
              const shut = Math.sin(p * Math.PI)
              const [a, b] = face.eyes.map(toC)
              const r = Math.hypot(a.x - b.x, a.y - b.y) * 0.24
              ;[a, b].forEach((e, i) => {
                ctx.save()
                ctx.beginPath(); ctx.ellipse(e.x, e.y - r * 0.55 * (1 - shut), r, r * 0.6 * shut, 0, 0, Math.PI * 2)
                ctx.fillStyle = lid[i]; ctx.filter = 'blur(1.2px)'; ctx.fill()
                ctx.filter = 'none'; ctx.strokeStyle = 'rgba(40,25,20,0.55)'; ctx.lineWidth = Math.max(1, r * 0.08)
                ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 0.95, r * 0.35 * shut, 0, 0.15, Math.PI - 0.15); ctx.stroke()
                ctx.restore()
              })
            }
          }
        }
      }
      ctx.restore()

      // marks while setting up
      if (step && draft) {
        const marks = [draft.mouth, ...(draft.eyes ?? [])].filter(Boolean)
        ctx.fillStyle = '#21a29a'
        marks.forEach(p => { const q = toC(p); ctx.beginPath(); ctx.arc(q.x, q.y, 5 * dpr, 0, Math.PI * 2); ctx.fill() })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [img, size, step, draft, photo.focus])

  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!step || !img) return
    const r = e.currentTarget.getBoundingClientRect(), { sx, sy, S } = cropRef.current
    const p = { x: (sx + ((e.clientX - r.left) / r.width) * S) / img.naturalWidth, y: (sy + ((e.clientY - r.top) / r.height) * S) / img.naturalHeight }
    if (step === 'mouth') { setDraft({ mouth: p, mouthW: 0.16 * Math.min(img.naturalWidth, img.naturalHeight) / img.naturalWidth }); setStep('eye1') }
    else if (step === 'eye1' && draft) { setDraft({ ...draft, eyes: [p, p] }); setStep('eye2') }
    else if (step === 'eye2' && draft?.eyes) {
      const eyes: [Pt, Pt] = [draft.eyes[0], p]
      // the mouth is about as wide as the gap between the eyes
      const gap = Math.hypot((eyes[0].x - eyes[1].x) * img.naturalWidth, (eyes[0].y - eyes[1].y) * img.naturalHeight)
      finish({ ...draft, eyes, mouthW: (gap * 0.8) / img.naturalWidth })
    }
  }
  const finish = (f: FacePoints) => { setDraft(f); setStep(null); onFace?.(f); onReady?.() }

  return (
    <div className={`talking-photo ${talking ? 'talking' : ''} ${step ? 'setup' : ''}`} style={{ width: size, height: size }}>
      <canvas ref={canvas} onPointerDown={tap} style={{ width: size, height: size }} aria-label={step ? 'Photo: tap to mark the face' : 'Your companion'} role="img" />
      {step && (
        <div className="talking-photo-help">
          <strong>{step === 'mouth' ? 'Tap the middle of the mouth' : step === 'eye1' ? 'Now tap one eye' : 'And the other eye'}</strong>
          {step !== 'mouth' && draft && <button type="button" onClick={() => finish({ ...draft, eyes: undefined })}>Skip eyes</button>}
        </div>
      )}
      {!step && adjustable && <button type="button" className="talking-photo-adjust" onClick={() => { setDraft(null); setStep('mouth') }}>Adjust face</button>}
    </div>
  )
}
