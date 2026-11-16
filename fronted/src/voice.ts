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

  const stopSpeaking = useCallback(() => { if (canSpeak()) window.speechSynthesis.cancel(); setSpeaking(false) }, [])

  const say = useCallback((text: string, onDone?: () => void) => {
    if (!enabled || !canSpeak() || !text) { onDone?.(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = SPEECH_LANG; u.rate = 0.95
    u.onstart = () => setSpeaking(true)
    u.onend = () => { setSpeaking(false); onDone?.() }
    u.onerror = () => { setSpeaking(false); onDone?.() }
    window.speechSynthesis.speak(u)
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
        if (text) { setHeard(text); handler.current?.(text) }
      }
    }
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { rec.current = null; setListening(false) } }
    r.onend = () => { if (rec.current === r) { try { r.start() } catch { rec.current = null; setListening(false) } } }   // keep it open
    rec.current = r
    try { r.start(); setListening(true) } catch { rec.current = null }
  }, [enabled])

  useEffect(() => () => { stopListening(); if (canSpeak()) window.speechSynthesis.cancel() }, [stopListening])
  useEffect(() => { if (!enabled) { stopListening(); stopSpeaking() } }, [enabled, stopListening, stopSpeaking])

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
