export const crewMember = {
  name: 'Dr. Vega',
  role: 'Mission specialist',
  missionDay: 147,
}

export const radiationReadings = {
  current: 0.18,
  trend: [0.08, 0.1, 0.09, 0.12, 0.14, 0.18],
  accumulated: 42.6,
  referenceThreshold: 0.5,
  careerLimit: 600,
  updatedAt: '14:32 UTC',
}

export const physiologicalData = [
  { label: 'Heart rate', value: '72', unit: 'bpm', note: 'Stable', icon: 'heart' },
  { label: 'Blood pressure', value: '118/76', unit: 'mmHg', note: 'Within range', icon: 'pulse' },
  { label: 'Ultrasound', value: 'No changes', unit: 'latest review', note: '12:20 UTC', icon: 'scan' },
]

export const bodyRegions = {
  head: {
    label: 'Head and vision',
    trigger: 'Mild ocular change recorded during the simulated review.',
    protocol: 'Information protocol OCU-04 · Ocular assessment in microgravity.',
  },
  chest: {
    label: 'Chest and circulation',
    trigger: 'Heart-rate variation after simulated exercise.',
    protocol: 'Information protocol CIR-02 · Cardiovascular monitoring.',
  },
  legs: {
    label: 'Lower extremities',
    trigger: 'Simulated muscular deconditioning trend.',
    protocol: 'Information protocol MOV-07 · Approved mobility routine.',
  },
} as const

export const wellnessData = {
  sleep: 6.8,
  hrv: 48,
  reaction: 284,
  sleepTrend: [7.4, 7.1, 6.6, 7.2, 6.8],
}

export const approvedAlternatives: Record<string, string[]> = {
  'Cold pack': ['Reusable thermal cloth — consult protocol AUX-08'],
  'Saline solution': ['No automatic alternative is available. Contact the crew medical officer.'],
}
