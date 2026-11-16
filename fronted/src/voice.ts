// Hands-free layer: the browser's speech synthesis and recognition, nothing leaves the device.
// In an emergency the crew member may not be able to read or touch the screen.
import { useCallback, useEffect, useRef, useState } from 'react'

type RecognitionResult = { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }
interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((e: RecognitionResult) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null
  start: () => void; stop: () => void; abort: () => void
}
const RecognitionCtor = (): (new () => Recognition) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window
export const canListen = () => typeof window !== 'undefined' && RecognitionCtor() !== null
export const SPEECH_LANG = 'en-US'
/** Recognition follows the device language so the crew member can answer in Spanish or English. */
export const LISTEN_LANG = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('es') ? 'es-ES' : 'en-US'

const VOICE_KEY = 'armor-voice'

// ---------------------------------------------------------------- speech engine
// One queue for everything the app says. Each line is split into sentences: Chrome drops long
// utterances (~15 s) and can garbage-collect a playing one, which cuts the voice mid-way.
// Whatever is said (aloud or mimed silently) is broadcast so a face can move its lips with it.
export type SpeechEvent =
  | { type: 'start'; text: string; rate: number }   // a sentence starts
  | { type: 'boundary'; charIndex: number }         // a word inside that sentence
  | { type: 'end' }                                 // that sentence ended
  | { type: 'idle' }                                // nothing left to say
const listeners = new Set<(e: SpeechEvent) => void>()
export const onSpeech = (fn: (e: SpeechEvent) => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
const emit = (e: SpeechEvent) => listeners.forEach(fn => fn(e))

/** average English speech rate at rate = 1, in characters per second */
export const CHARS_PER_SECOND = 14
interface Job { chunks: string[]; rate: number; silent: boolean; onStart?: () => void; onDone?: () => void }
let queue: Job[] = []
let current: Job | null = null
let playing: SpeechSynthesisUtterance | null = null   // held on purpose: keeps Chrome from collecting it
let seq = 0
let timer: ReturnType<typeof setTimeout> | null = null
let watch: ReturnType<typeof setInterval> | null = null
let lastSpokeAt = 0
/** true while the device is talking (and a moment after), so the microphone does not hear itself. */
const selfTalking = () => current !== null || (canSpeak() && window.speechSynthesis.speaking) || Date.now() - lastSpokeAt < 700
export const isTalking = () => current !== null

function sentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?…]["')\]]*)\s+/)   // only where a space follows, so "5.2 h" stays whole
  const out: string[] = []
  for (const raw of parts) {
    let p = raw.trim()
    if (!p) continue
    while (p.length > 180) {                       // very long sentence: break at a comma or a space
      const cut = Math.max(p.lastIndexOf(', ', 180), p.lastIndexOf(' ', 160))
      const at = cut > 40 ? cut + 1 : 180
      out.push(p.slice(0, at).trim()); p = p.slice(at).trim()
    }
    if (out.length && out[out.length - 1].length < 18) out[out.length - 1] += ' ' + p   // keep tiny bits together
    else out.push(p)
  }
  return out.length ? out : [text]
}

function play(job: Job, i: number) {
  if (job !== current) return
  if (i >= job.chunks.length) { current = null; lastSpokeAt = Date.now(); job.onDone?.(); next(); return }
  const text = job.chunks[i], id = ++seq
  if (job.silent || !canSpeak()) {
    emit({ type: 'start', text, rate: job.rate })
    timer = setTimeout(() => { timer = null; if (id !== seq) return; emit({ type: 'end' }); play(job, i + 1) }, (text.length / (CHARS_PER_SECOND * job.rate)) * 1000 + 180)
    return
  }
  const u = new SpeechSynthesisUtterance(text)
  u.lang = SPEECH_LANG; u.rate = job.rate
  playing = u
  // the face starts now; it does not wait for Chrome's onstart, which does not always fire
  emit({ type: 'start', text, rate: job.rate })
  const t0 = Date.now(), expected = (text.length / (CHARS_PER_SECOND * job.rate)) * 1000
  let done = false
  const finish = () => {
    if (done || id !== seq) return
    done = true
    if (watch) { clearInterval(watch); watch = null }
    playing = null
    emit({ type: 'end' })
    play(job, i + 1)
  }
  u.onstart = () => { if (id === seq && !done) emit({ type: 'boundary', charIndex: 0 }) }   // resync with the real voice
  u.onboundary = e => { if (id === seq && !done && e.name !== 'sentence') emit({ type: 'boundary', charIndex: e.charIndex }) }
  u.onend = finish
  u.onerror = e => {
    if (id !== seq || done) return                  // a late "interrupted" from an older line: ignore it
    if (e.error === 'not-allowed') {                // audio blocked until the first tap: mime it instead
      done = true
      if (watch) { clearInterval(watch); watch = null }
      playing = null; job.silent = true; play(job, i)
    } else finish()
  }
  // watchdog: Chrome sometimes never sends onend, which used to leave everything after it stuck
  if (watch) clearInterval(watch)
  watch = setInterval(() => {
    if (id !== seq || done) { if (watch) { clearInterval(watch); watch = null } return }
    const synth = window.speechSynthesis, elapsed = Date.now() - t0
    if (elapsed > 600 && !synth.speaking && !synth.pending) finish()
    else if (elapsed > expected * 2.5 + 4000) { synth.cancel(); finish() }
  }, 250)
  window.speechSynthesis.speak(u)
}

function next() {
  current = queue.shift() ?? null
  if (!current) { emit({ type: 'idle' }); return }
  current.onStart?.()
  play(current, 0)
}

function cancelAll() {
  seq++
  if (timer) { clearTimeout(timer); timer = null }
  if (watch) { clearInterval(watch); watch = null }
  const dropped = [...(current ? [current] : []), ...queue]
  queue = []; current = null; playing = null
  if (canSpeak()) window.speechSynthesis.cancel()
  emit({ type: 'end' })
  dropped.forEach(j => j.onDone?.())
  return dropped.length > 0
}

/**
 * Says `text` (aloud, or silently with `silent`) and broadcasts it on the speech bus.
 * `queue: true` waits for whatever is being said; otherwise it replaces it.
 */
export function speak(text: string, opts: { rate?: number; silent?: boolean; queue?: boolean; onStart?: () => void; onDone?: () => void } = {}) {
  if (!text) { opts.onDone?.(); return }
  const job: Job = { chunks: sentences(text), rate: opts.rate ?? 0.95, silent: Boolean(opts.silent), onStart: opts.onStart, onDone: opts.onDone }
  // the same line twice in a row (a screen mounting twice, a double tap) is said once
  if (opts.queue && [current, ...queue].some(j => j && j.chunks.join(' ') === job.chunks.join(' '))) { opts.onDone?.(); return }
  const interrupted = opts.queue ? false : cancelAll()
  queue.push(job)
  if (current) return
  // Chrome sometimes swallows a speak() that comes right after cancel()
  if (interrupted) { timer = setTimeout(() => { timer = null; if (!current) next() }, 60) } else next()
}
/** Silent version: the face still "says" the text, at the pace it would be spoken. */
export const mime = (text: string, opts: { queue?: boolean } = {}) => speak(text, { silent: true, queue: opts.queue })
export const stopTalking = () => { if (cancelAll()) emit({ type: 'idle' }) }

export function useVoice(defaultOn = false) {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    try { const v = localStorage.getItem(VOICE_KEY); return v == null ? defaultOn : v === 'on' } catch { return defaultOn }
  })
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState('')
  const rec = useRef<Recognition | null>(null)
  const handler = useRef<((text: string) => void) | null>(null)

  const setEnabled = (on: boolean) => { setEnabledState(on); try { localStorage.setItem(VOICE_KEY, on ? 'on' : 'off') } catch { /* private mode */ } }

  const mine = useRef(false)   // is this screen the one talking right now?
  const stopSpeaking = useCallback(() => { if (mine.current) stopTalking(); mine.current = false; setSpeaking(false) }, [])

  /** Reads aloud when voice is on. `force` speaks even with voice off (e.g. a talking photo). */
  /** `queue` waits for what is being said instead of cutting it off. */
  const say = useCallback((text: string, onDone?: () => void, force = false, queue = false) => {
    if ((!enabled && !force) || !canSpeak() || !text) { onDone?.(); return }
    speak(text, { queue, onStart: () => { mine.current = true; setSpeaking(true) }, onDone: () => { mine.current = false; setSpeaking(false); onDone?.() } })
  }, [enabled])

  const stopListening = useCallback(() => { rec.current?.abort(); rec.current = null; setListening(false) }, [])

  /** Keeps the microphone open and calls `onText` with every final phrase until stopped. */
  const listen = useCallback((onText: (text: string) => void) => {
    const Ctor = RecognitionCtor()
    if (!enabled || !Ctor) return
    handler.current = onText
    if (rec.current) return
    const r = new Ctor()
    r.lang = LISTEN_LANG; r.continuous = true; r.interimResults = false
    r.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.trim()
        // ignore our own voice coming back through the speakers
        if (text && !selfTalking()) { setHeard(text); handler.current?.(text) }
      }
    }
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { rec.current = null; setListening(false) } }
    r.onend = () => { if (rec.current === r) { try { r.start() } catch { rec.current = null; setListening(false) } } }   // keep it open
    rec.current = r
    try { r.start(); setListening(true) } catch { rec.current = null }
  }, [enabled])

  // leaving the screen closes the microphone; what is being said keeps going (the floating face finishes it)
  useEffect(() => () => { stopListening() }, [stopListening])
  // turning voice off stops this screen's speech, but mounting with voice off must not silence anyone else
  const wasOn = useRef(enabled)
  useEffect(() => { if (wasOn.current && !enabled) { stopListening(); stopSpeaking() } wasOn.current = enabled }, [enabled, stopListening, stopSpeaking])

  return { enabled, setEnabled, supported: canSpeak() || canListen(), canListen: canListen(), speaking, listening, heard, say, stopSpeaking, listen, stopListening }
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const WORDS: Record<string, string[]> = {
  next: ['done', 'next', 'ready', 'ok', 'okay', 'listo', 'siguiente', 'hecho', 'continuar', 'continue'],
  repeat: ['repeat', 'again', 'repite', 'repetir', 'otra vez'],
  notify: ['commander', 'comandante', 'notify', 'avisa', 'avisar', 'help', 'ayuda'],
  skip: ['skip', 'prefer not', 'saltar', 'prefiero no', 'no answer', 'sin respuesta'],
  back: ['back', 'previous', 'atras', 'anterior'],
}
const NUMBERS = [['one', 'uno', 'first', 'primera', 'primero', '1'], ['two', 'dos', 'second', 'segunda', 'segundo', '2'], ['three', 'tres', 'third', 'tercera', 'tercero', '3'], ['four', 'cuatro', 'fourth', 'cuarta', 'cuarto', '4'], ['five', 'cinco', 'fifth', 'quinta', 'quinto', '5']]

/** Recognises a spoken command in English or Spanish. */
export function commandOf(text: string): keyof typeof WORDS | null {
  const t = norm(text)
  for (const [cmd, words] of Object.entries(WORDS)) if (words.some(w => t.includes(w))) return cmd as keyof typeof WORDS
  return null
}

/** Picks one of the options from what was said: by number ("option two", "dos") or by overlapping words. */
export function optionOf(text: string, options: string[]): string | null {
  const t = norm(text)
  for (let i = 0; i < Math.min(options.length, NUMBERS.length); i++) if (NUMBERS[i].some(n => new RegExp(`\\b${n}\\b`).test(t))) return options[i]
  const said = new Set(t.split(/\W+/).filter(w => w.length > 2))
  let best: { opt: string; score: number } | null = null
  for (const opt of options) {
    const words = norm(opt).split(/\W+/).filter(w => w.length > 2)
    const score = words.filter(w => said.has(w)).length
    if (score > 0 && (!best || score > best.score)) best = { opt, score }
  }
  return best?.opt ?? null
}

/** Spoken version of a question with numbered options. */
export const readOptions = (question: string, options: string[]) => `${question} ${options.map((o, i) => `Option ${i + 1}: ${o}.`).join(' ')} Say the option number, or "skip".`
