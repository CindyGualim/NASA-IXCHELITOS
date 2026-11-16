// The companion's photo lives here, outside any screen, so its floating bubble follows the crew
// member through the whole app. Stored on this device only.
import { useSyncExternalStore } from 'react'
import type { Photo } from './components/TalkingPhoto'
import { stopTalking } from './voice'

const PHOTO_KEY = 'armor-companion-photo'
const VOICE_KEY = 'armor-companion-photo-voice'
const POS_KEY = 'armor-companion-bubble'

const read = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) } catch { return fallback } }
const write = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* full or private mode: kept for this session */ } }

interface State { photo: Photo | null; speaks: boolean; pos: { x: number; y: number } | null }
let state: State = { photo: read<Photo | null>(PHOTO_KEY, null), speaks: read<unknown>(VOICE_KEY, true) !== false, pos: read(POS_KEY, null) }
const subs = new Set<() => void>()
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; subs.forEach(fn => fn()) }
const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn) } }

export const useCompanion = () => useSyncExternalStore(subscribe, () => state)
export const companion = {
  get: () => state,
  setPhoto: (photo: Photo | null) => { set({ photo }); write(PHOTO_KEY, photo) },
  setSpeaks: (speaks: boolean) => { set({ speaks }); write(VOICE_KEY, speaks); if (!speaks) stopTalking() },
  setPos: (pos: { x: number; y: number }) => { set({ pos }); write(POS_KEY, pos) },
}

// "open the companion" from the bubble: the app jumps to Care and Care opens the Companion tab
const openers = new Set<() => void>()
let pendingOpen = false
export const onOpenCompanion = (fn: () => void) => { openers.add(fn); return () => { openers.delete(fn) } }
export const openCompanion = () => { pendingOpen = true; openers.forEach(fn => fn()) }
/** Care asks once on mount whether it was opened from the bubble. */
export const takeOpenRequest = () => { const v = pendingOpen; pendingOpen = false; return v }
