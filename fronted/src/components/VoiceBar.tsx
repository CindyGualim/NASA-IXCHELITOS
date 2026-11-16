import type { useVoice } from '../voice'

type Voice = ReturnType<typeof useVoice>

/** Hands-free status and controls: what the system is doing, what it heard, and how to turn it off. */
export function VoiceBar({ voice, hint, onRepeat, compact = false }: { voice: Voice; hint: string; onRepeat?: () => void; compact?: boolean }) {
  if (!voice.supported) return <p className="voice-bar unsupported">Hands-free voice is not available in this browser.</p>
  return (
    <div className={`voice-bar ${compact ? 'compact' : ''} ${voice.enabled ? 'on' : ''}`} role="status" aria-live="polite">
      <span className={`voice-dot ${voice.speaking ? 'speaking' : voice.listening ? 'listening' : ''}`} aria-hidden="true" />
      <div className="voice-text">
        <strong>{!voice.enabled ? 'Voice off' : voice.speaking ? 'Reading aloud…' : voice.listening ? 'Listening' : voice.canListen ? 'Voice on' : 'Reading aloud only (no microphone support)'}</strong>
        <small>{voice.enabled ? (voice.heard ? `Heard: "${voice.heard}"` : hint) : 'Turn on to hear each message and answer by speaking.'}</small>
      </div>
      {voice.enabled && onRepeat && <button type="button" className="tertiary-action" onClick={onRepeat}>Repeat</button>}
      <button type="button" className="secondary-action" onClick={() => voice.setEnabled(!voice.enabled)}>{voice.enabled ? 'Turn voice off' : 'Turn voice on'}</button>
    </div>
  )
}
