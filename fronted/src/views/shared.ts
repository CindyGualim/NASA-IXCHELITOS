export type ViewName = 'Today' | 'Daily check' | 'Timeline' | 'My body' | 'Environment' | 'Care' | 'Decision log' | 'How to read this' | 'Commander view'

export interface ViewProps {
  /** engine scenario key (nominal / fatiga / duelo), or null when the API is offline or the scenario is UI-only */
  scenarioKey: string | null
  /** mission day shown in ARMOR (1-based) */
  missionDay: number
  /** Earth communication delay in minutes */
  delayMin: number
  setMissionDay: (day: number) => void
  /** engine version: bumps after every write, so views re-read what the engine recalculated */
  version: number
  goTo: (view: ViewName) => void
  notify: (message: string) => void
}

export const fmt = (v: number | null | undefined, dec = 1) =>
  v == null || Number.isNaN(v) ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const delayText = (min: number) => (min < 1 ? 'less than a minute' : `about ${Math.ceil(min)} minutes`)

export const DOMAIN_LABEL: Record<string, string> = { psico: 'Mood', sueno: 'Sleep', fisico: 'Body', social: 'Connection', ambiente: 'Cabin', seguridad: 'Safety', evento: 'Event' }
