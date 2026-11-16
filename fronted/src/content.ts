// English content for the psychological-support layer.
// Source of truth for logic, item ids, scales and rules: ixchel/conocimiento/base_conocimiento_psicologica.json
// (team knowledge base, Spanish). Standard instruments use their original English wording (PHQ-4, PHQ-9,
// GAD-7, WHO-5: free to use; ASQ: NIMH, public domain). Team items (check-in, safety item, state selector,
// grief check, team check, safety plan) are translated from the knowledge base and are NOT validated.
// Every protocol is "proposal for clinical review": the program detects, notifies and guides; it does not diagnose.

export interface Item { id: string; text: string; scale?: [number, number]; anchors?: Record<number, string>; open?: boolean; optional?: boolean }
export interface FormDef { key: string; name: string; stem: string; items: Item[]; note: string; minutes: number }

const FREQ = { 0: 'Not at all', 1: 'Several days', 2: 'More than half the days', 3: 'Nearly every day' }
const YESNO = { 0: 'No', 1: 'Yes' }

// ---------------------------------------------------------------- daily check-in (Q_CHECKIN, I07)
export const CHECKIN: Item[] = [
  { id: 'CK1', text: 'How is your mood today?', scale: [1, 5], anchors: { 1: 'Very low', 5: 'Very good' } },
  { id: 'CK2', text: 'How much do you feel like doing your tasks?', scale: [1, 5], anchors: { 1: 'Not at all', 5: 'A lot' } },
  { id: 'CK3', text: 'How much stress do you feel?', scale: [1, 5], anchors: { 1: 'None', 5: 'Extreme' } },
  { id: 'CK4', text: 'How much worry or nervousness do you have?', scale: [1, 5], anchors: { 1: 'None', 5: 'Extreme' } },
  { id: 'CK5', text: 'How much energy do you have?', scale: [1, 5], anchors: { 1: 'Exhausted', 5: 'Full of energy' } },
  { id: 'CK6', text: 'How loaded is your work today?', scale: [1, 5], anchors: { 1: 'Light', 5: 'Overwhelming' } },
  { id: 'CK7', text: 'How clear does your mind feel?', scale: [1, 5], anchors: { 1: 'Foggy', 5: 'Very clear' } },
  { id: 'CK8', text: 'Is anything worrying you today?', open: true, optional: true },
]

// ---------------------------------------------------------------- safety item (Q_SAFETY, I08) — always asked, always prevails
export const SAFETY_ITEM: Item = {
  id: 'SF1', text: 'Have you thought that it would be better not to be alive, or about hurting yourself?', scale: [0, 2],
  anchors: { 0: 'No', 1: 'Some days', 2: 'Many days' },
}

// ---------------------------------------------------------------- state selector (Q_STATE, I35)
export const STATES: { id: string; text: string }[] = [
  { id: 'ST01', text: 'I am fine, nothing important bothering me.' },
  { id: 'ST02', text: 'I feel down, unmotivated or uninterested in things.' },
  { id: 'ST03', text: 'I feel nervous, worried or tense.' },
  { id: 'ST04', text: 'I saw or lived through something very hard and it still affects me.' },
  { id: 'ST05', text: 'I lost someone (on the mission or on Earth).' },
  { id: 'ST06', text: 'I sleep badly or feel exhausted.' },
  { id: 'ST07', text: 'I have a lot of energy, sleep little without feeling tired, or feel very irritable.' },
  { id: 'ST08', text: 'My workload or pressure is very high.' },
  { id: 'ST09', text: 'I feel lonely or distant from the crew or my family.' },
  { id: 'ST10', text: 'I am drinking alcohol or using substances more than I would like.' },
  { id: 'ST11', text: 'I have thought it would be better not to be alive, or about hurting myself.' },
]

// ---------------------------------------------------------------- questionnaires the app can run on board
export const FORMS: Record<string, FormDef> = {
  phq4: {
    key: 'phq4', name: 'PHQ-4', minutes: 1, stem: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    note: 'Ultra-brief screen (Kroenke et al., 2009). A high score is not a diagnosis.',
    items: [
      { id: 'P41', text: 'Feeling nervous, anxious or on edge', scale: [0, 3], anchors: FREQ },
      { id: 'P42', text: 'Not being able to stop or control worrying', scale: [0, 3], anchors: FREQ },
      { id: 'P43', text: 'Little interest or pleasure in doing things', scale: [0, 3], anchors: FREQ },
      { id: 'P44', text: 'Feeling down, depressed or hopeless', scale: [0, 3], anchors: FREQ },
    ],
  },
  phq9: {
    key: 'phq9', name: 'PHQ-9', minutes: 3, stem: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    note: 'Patient Health Questionnaire (Pfizer, free to use). Severity cut-offs are guidance, not a diagnosis.',
    items: [
      { id: 'PH1', text: 'Little interest or pleasure in doing things', scale: [0, 3], anchors: FREQ },
      { id: 'PH2', text: 'Feeling down, depressed, or hopeless', scale: [0, 3], anchors: FREQ },
      { id: 'PH3', text: 'Trouble falling or staying asleep, or sleeping too much', scale: [0, 3], anchors: FREQ },
      { id: 'PH4', text: 'Feeling tired or having little energy', scale: [0, 3], anchors: FREQ },
      { id: 'PH5', text: 'Poor appetite or overeating', scale: [0, 3], anchors: FREQ },
      { id: 'PH6', text: 'Feeling bad about yourself, or that you are a failure or have let yourself or your family down', scale: [0, 3], anchors: FREQ },
      { id: 'PH7', text: 'Trouble concentrating on things, such as reading or watching a video', scale: [0, 3], anchors: FREQ },
      { id: 'PH8', text: 'Moving or speaking so slowly that other people could have noticed, or the opposite: being so fidgety or restless that you have been moving around a lot more than usual', scale: [0, 3], anchors: FREQ },
      { id: 'PH9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', scale: [0, 3], anchors: FREQ },
    ],
  },
  gad7: {
    key: 'gad7', name: 'GAD-7', minutes: 2, stem: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    note: 'Generalized Anxiety Disorder scale (Pfizer, free to use). Not a diagnosis.',
    items: [
      { id: 'GA1', text: 'Feeling nervous, anxious, or on edge', scale: [0, 3], anchors: FREQ },
      { id: 'GA2', text: 'Not being able to stop or control worrying', scale: [0, 3], anchors: FREQ },
      { id: 'GA3', text: 'Worrying too much about different things', scale: [0, 3], anchors: FREQ },
      { id: 'GA4', text: 'Trouble relaxing', scale: [0, 3], anchors: FREQ },
      { id: 'GA5', text: 'Being so restless that it is hard to sit still', scale: [0, 3], anchors: FREQ },
      { id: 'GA6', text: 'Becoming easily annoyed or irritable', scale: [0, 3], anchors: FREQ },
      { id: 'GA7', text: 'Feeling afraid, as if something awful might happen', scale: [0, 3], anchors: FREQ },
    ],
  },
  who5: {
    key: 'who5', name: 'WHO-5', minutes: 1, stem: 'Over the last two weeks…',
    note: 'WHO-5 Well-Being Index (free to use). Measures well-being, not illness.',
    items: ['I have felt cheerful and in good spirits', 'I have felt calm and relaxed', 'I have felt active and vigorous',
      'I woke up feeling fresh and rested', 'My daily life has been filled with things that interest me'].map((text, i) => ({
      id: `W${i + 1}`, text, scale: [0, 5] as [number, number],
      anchors: { 0: 'At no time', 1: 'Some of the time', 2: 'Less than half of the time', 3: 'More than half of the time', 4: 'Most of the time', 5: 'All of the time' },
    })),
  },
  asq: {
    key: 'asq', name: 'ASQ', minutes: 1, stem: 'Ask Suicide-Screening Questions. Answering honestly helps your crew support you.',
    note: 'NIMH Ask Suicide-Screening Questions (public domain). Any “yes”, or preferring not to answer, means a clinician should talk with you soon.',
    items: [
      { id: 'AQ1', text: 'In the past few weeks, have you wished you were dead?', scale: [0, 1], anchors: YESNO },
      { id: 'AQ2', text: 'In the past few weeks, have you felt that you or your family would be better off if you were dead?', scale: [0, 1], anchors: YESNO },
      { id: 'AQ3', text: 'In the past week, have you been having thoughts about killing yourself?', scale: [0, 1], anchors: YESNO },
      { id: 'AQ4', text: 'Have you ever tried to kill yourself?', scale: [0, 1], anchors: YESNO },
      { id: 'AQ5', text: 'Are you having thoughts of killing yourself right now?', scale: [0, 1], anchors: YESNO },
    ],
  },
  duelo_diario: {
    key: 'duelo_diario', name: 'Grief check', minutes: 1, stem: 'A one-minute check on how your grief is going. Acute grief is not a disorder.',
    note: 'Team item (knowledge base I40), not validated. It follows the process; it does not label it.',
    items: [
      { id: 'GD1', text: 'Today, how intense was the sadness or pain about the loss?', scale: [1, 5], anchors: { 1: 'Very mild', 5: 'Very intense' } },
      { id: 'GD2', text: 'Today, how well could you concentrate on your tasks?', scale: [1, 5], anchors: { 1: 'Not at all', 5: 'Very well' } },
      { id: 'GD3', text: 'Today, how hard is it to be with other people?', scale: [1, 5], anchors: { 1: 'Not at all', 5: 'Extremely' } },
      { id: 'GD4', text: 'Last night, how did you sleep?', scale: [1, 5], anchors: { 1: 'Very badly', 5: 'Very well' } },
    ],
  },
  equipo: {
    key: 'equipo', name: 'Crew check', minutes: 1, stem: 'How is life with the crew this week?',
    note: 'Team items (knowledge base I10), not validated.',
    items: [
      { id: 'TM1', text: 'Do you feel the crew works as a team today?', scale: [1, 5], anchors: { 1: 'Not at all', 5: 'Completely' } },
      { id: 'TM2', text: 'Was there tension or conflict with someone in the crew?', scale: [1, 5], anchors: { 1: 'None', 5: 'A lot' } },
      { id: 'TM3', text: 'Did someone in the crew support you when you needed it?', scale: [1, 5], anchors: { 1: 'Never', 5: 'Always' } },
      { id: 'TM4', text: 'Did you have enough space and time alone?', scale: [1, 5], anchors: { 1: 'Not at all', 5: 'Plenty' } },
      { id: 'TM5', text: 'Could you talk with your family or friends this week?', scale: [1, 5], anchors: { 1: 'Not at all', 5: 'As much as I wanted' } },
      { id: 'TM6', text: 'Do you feel Mission Control understands and supports you?', scale: [1, 5], anchors: { 1: 'Not at all', 5: 'Completely' } },
    ],
  },
}

// Forms the selector can suggest that are given with the crew medical officer or a clinician (not run in the app).
const CLINICIAN_FORMS: [RegExp, string][] = [
  [/C-SSRS/i, 'C-SSRS screen with a clinician'], [/AUDIT-C/i, 'AUDIT-C (alcohol)'], [/BGQ/i, 'Brief Grief Questionnaire'],
  [/PG-13-R/i, 'PG-13-R (prolonged grief)'], [/PCL-5/i, 'PCL-5 (post-traumatic stress)'], [/MDQ/i, 'MDQ (mood episodes)'],
  [/ISI/i, 'Insomnia Severity Index'], [/KSS/i, 'Sleepiness scales (KSS, Samn-Perelli)'], [/NASA-TLX/i, 'NASA-TLX (workload)'],
  [/SPANE/i, 'SPANE (positive and negative feelings)'], [/observaci/i, 'Crewmate observation list'],
]
const ALREADY_DONE = /check-in|selector/i

/** Map the selector's suggested form names (knowledge base, Spanish) to forms the app can run.
 * key = a form that runs inline; key 'plan' = the safety plan in Care; key null = given with a clinician. */
export function formsFromPlan(names: string[]): { key: string | null; label: string }[] {
  const out: { key: string | null; label: string }[] = []
  for (const raw of names) {
    const n = raw.toUpperCase()
    if (ALREADY_DONE.test(raw) && !/duelo/i.test(raw)) continue
    const key = n.includes('PHQ-4') ? 'phq4' : n.includes('PHQ-9') ? 'phq9' : n.includes('GAD-7') ? 'gad7' : n.includes('WHO-5') ? 'who5'
      : n.includes('ASQ') ? 'asq' : n.includes('DUELO') ? 'duelo_diario'
      : n.includes('COHESI') || n.includes('M6') ? 'equipo' : n.includes('PLAN DE SEGURIDAD') ? 'plan' : null
    const label = key === 'plan' ? 'Safety plan' : key ? FORMS[key].name : CLINICIAN_FORMS.find(([re]) => re.test(raw))?.[1] ?? raw
    if (!out.some(o => o.label === label)) out.push({ key, label })
  }
  return out
}

// ---------------------------------------------------------------- alert codes (engine + self-report) in plain English
export const ALERT_TEXT: Record<string, { title: string; action: string }> = {
  R01: { title: 'Your daily check is below your usual', action: 'Check the cabin and your sleep first, then pick a countermeasure.' },
  R02: { title: 'Lower check-ins, also seen in sleep or activity', action: 'Tell a crewmate you trust and schedule support.' },
  R03: { title: 'Lower check-ins, likely caused by the environment', action: 'Fix the cabin or sleep factor and measure again before reading it as emotional.' },
  R04: { title: 'Marked and persistent drop', action: 'A clinical contact within 24 hours is recommended.' },
  R05: { title: 'Safety answer needs immediate support', action: 'Your crew medical officer and flight surgeon are notified. You will not be left alone.' },
  R08: { title: 'Sustained change in your daily check (trend detector)', action: 'Check possible causes and pick a countermeasure. Thresholds still being calibrated.' },
  R11: { title: 'Mood and motivation are sliding', action: 'Plan a positive activity; a short PHQ-4 is offered.' },
  R12: { title: 'Safety screen positive', action: 'Immediate notice to the clinical team; a clinician will talk with you and build a safety plan with you.' },
  R13: { title: 'Brief screen positive', action: 'A longer questionnaire (PHQ-9 or GAD-7) is suggested within 24 hours.' },
  R14: { title: 'Mild depressive symptoms', action: 'Self-care and watchful waiting; repeat in 2 weeks.' },
  R15: { title: 'Moderate depressive symptoms', action: 'The clinical team is notified to plan support with you.' },
  R16: { title: 'Severe depressive symptoms', action: 'Clinical contact within 24 hours.' },
  R17: { title: 'Anxiety symptoms', action: 'The clinical team is notified to plan support with you.' },
  R18: { title: 'Post-traumatic stress symptoms', action: 'The clinical team is notified.' },
  R19: { title: 'Insomnia symptoms', action: 'Check CO₂, noise and schedule; sleep countermeasures are offered.' },
  R20: { title: 'Grief that is not easing', action: 'Referral to a specialist is suggested.' },
  R21: { title: 'Possible elevated-mood episode', action: 'The clinical team reviews before changing sleep or activity plans.' },
  R22: { title: 'Alcohol use above your target', action: 'A brief supportive conversation is suggested.' },
  R23: { title: 'Death of a crewmember', action: 'Crew loss protocol (GP1) is activated.' },
  R24: { title: 'Death of a family member on Earth', action: 'Family loss protocol (GP2) is activated.' },
  R25: { title: 'A crewmate noticed confusion or agitation', action: 'Rule out CO₂, hypoxia, medication or illness first.' },
  R26: { title: 'A crewmate is worried about your safety', action: 'Immediate notice to the commander and flight surgeon.' },
  GD_TENDENCIA: { title: 'Grief sadness has not eased in 2 weeks', action: 'PHQ-9 and a talk with the support team are suggested.' },
}

export const PROTOCOL_NAME: Record<string, string> = {
  GP1: 'Crewmember loss', GP2: 'Loss of a family member on Earth', GP3: 'Safety emergency', GP4: 'Behavioral emergency',
  GP5: 'Detection and referral step', GP6: 'Weekly support session',
}

// ---------------------------------------------------------------- GP2: loss of a family member on Earth (astronaut-facing steps)
export const GRIEF_PHASES: { id: string; window: string; goal: string; from: number; to: number; steps: string[] }[] = [
  { id: 'N1', window: 'The day of the news', goal: 'Receiving the news with care', from: 0, to: 0, steps: [
    'Take the time you need; routine tests are paused today.',
    'Use the private channel to talk with your family when you are ready.',
    'Tell us who you would like to have with you: a crewmate, the flight surgeon or the psychologist.',
    'Answer the safety question at 24 hours, even if you feel stable.',
  ] },
  { id: 'N2', window: 'Days 1 to 7', goal: 'Support and a lighter workload', from: 1, to: 7, steps: [
    'Review today’s schedule with the commander; your workload can be reduced.',
    'Private conference with the psychologist (2 to 3 per week this first week).',
    'Join the funeral or a ritual remotely, if you wish.',
    'One-minute grief check each day.',
  ] },
  { id: 'N3', window: 'Weeks 2 to 12', goal: 'Telling expected grief apart from depression', from: 8, to: 84, steps: [
    'PHQ-9 and GAD-7 at two weeks.',
    'Weekly support session if PHQ-9 is 10 or more.',
    'Grief check three times a week.',
    'Keep your safety plan at hand; grief can bring dark thoughts, and asking for help is part of the plan.',
  ] },
]

// ---------------------------------------------------------------- GP3: safety support (shown to the astronaut)
export const SAFETY_STEPS = {
  notAcute: [
    'A clinician will contact you in the next hours, not days.',
    'Together you will build or review your safety plan.',
    'You decide with them how to make the cabin safer for now.',
    'Daily contact for 7 days, then weekly.',
    'You will be told who knows and what is shared.',
  ],
  acute: [
    'A crewmate is coming to be with you now. You will not be alone.',
    'The commander and the flight surgeon are being notified.',
    'With the communication delay, an emergency report is already on its way to Earth.',
    'Breathe with the guide below while you wait.',
  ],
}

// ---------------------------------------------------------------- safety plan (Q_SAFETY_PLAN, I36): written in the person's own words
export const SAFETY_PLAN: Item[] = [
  { id: 'SPL1', text: 'Warning signs: which thoughts, situations, moods or behaviors tell me a crisis may be starting?', open: true },
  { id: 'SPL2', text: 'My own coping strategies: what can I do alone to calm down or distract myself?', open: true },
  { id: 'SPL3', text: 'People and places on the ship that help: who or where makes me feel better, even without talking about it?', open: true },
  { id: 'SPL4', text: 'People I can ask for help: who in the crew or on Earth can I tell how I am?', open: true },
  { id: 'SPL5', text: 'Professionals and crisis channels: how do I reach the flight surgeon and psychologist, and what do I do during a delay?', open: true },
  { id: 'SPL6', text: 'Making my environment safer: what changes did we agree on?', open: true },
  { id: 'SPL7', text: 'My reasons for living and for going on: what matters to me and keeps me going?', open: true },
  { id: 'SPL8', text: 'What can others do to help me when they see I am not well?', open: true },
]

// ---------------------------------------------------------------- sensor channels (Garmin watch, ring, spacesuit)
// Each sensor maps to a variable the Ixchel engine already tracks and a human label for the UI.
export const SENSOR_CHANNELS = {
  steps:         { label: 'Daily steps (Garmin)',         unit: 'steps',  source: 'garmin' },
  exercise_min:  { label: 'Active minutes (Garmin)',      unit: 'min',    source: 'garmin' },
  hrv:           { label: 'HRV (Garmin / ring)',          unit: 'ms',     source: 'garmin_ring' },
  hr_rest:       { label: 'Resting heart rate',           unit: 'bpm',    source: 'garmin' },
  hr_elevated:   { label: 'Elevated HR during task',      unit: 'bpm',    source: 'garmin' },
  sleep_quality: { label: 'Sleep quality (ring)',         unit: '%',      source: 'ring' },
  sleep_h:       { label: 'Sleep duration (ring)',        unit: 'h',      source: 'ring' },
  o2_sat:        { label: 'SpO₂ (suit / ring)',          unit: '%',      source: 'suit_ring' },
  temperature:   { label: 'Skin temperature (ring)',      unit: '°C',     source: 'ring' },
  pressure_suit: { label: 'Suit pressure',                unit: 'hPa',    source: 'suit' },
} as const
export type SensorChannel = keyof typeof SENSOR_CHANNELS

// A sensor "anomaly" is what triggers a contextual question.
// delta = percentage drop/rise vs. personal baseline; negative = below baseline.
export interface SensorAnomaly {
  channel: SensorChannel
  delta_pct: number      // negative = below norm, positive = above
  raw_value?: number
  norm_value?: number
}

// ---------------------------------------------------------------- protocol-specific sensor checks
// For each protocol type, what sensor anomalies should trigger which contextual questions.
// The question is phrased as caring observation — never accusation, never diagnosis.
// Answers feed into the support layer, NOT into the alert system.

type SensorQuestion = {
  trigger_channel: SensorChannel
  trigger_threshold: number    // |delta_pct| that makes the question relevant
  question: string
  follow_up?: string           // shown after a non-"fine" answer
  options: string[]            // answer options; "Prefer not to say" always added
}

export const PROTOCOL_SENSOR_CHECKS: Record<string, SensorQuestion[]> = {
  luto: [
    {
      trigger_channel: 'steps',
      trigger_threshold: 25,
      question: 'Your Garmin shows you\'ve been less active than usual these past days. We\'re not measuring you — just checking in. How does moving around feel right now?',
      follow_up: 'That makes sense. Even a short walk around the module can help when things feel heavy. No pressure.',
      options: ['I\'m choosing to rest', 'Movement feels hard right now', 'I hadn\'t noticed'],
    },
    {
      trigger_channel: 'sleep_quality',
      trigger_threshold: 20,
      question: 'Your ring shows your sleep has been lighter than usual. Are you resting, even if sleep is broken?',
      follow_up: 'Sleep often shifts during difficult times. We can adjust lighting, noise or schedule if that helps.',
      options: ['Resting, yes', 'Hard to sleep — thoughts keep coming', 'Sleeping about the same as always'],
    },
    {
      trigger_channel: 'hrv',
      trigger_threshold: 15,
      question: 'Your HRV — a measure of how your body is recovering — is below your norm. That often goes along with stress or grief. How is your body feeling today?',
      options: ['Heavy or tense', 'OK physically', 'Hard to tell'],
    },
    {
      trigger_channel: 'exercise_min',
      trigger_threshold: 40,
      question: 'You\'ve skipped the ergometer more than usual. Exercise is entirely optional during this time. If you\'d like to move, even 10 minutes of light stretching counts.',
      options: ['I\'d like a gentle plan', 'Not ready yet', 'I\'ll decide later'],
    },
  ],

  emergencia: [
    {
      trigger_channel: 'hr_elevated',
      trigger_threshold: 15,
      question: 'Your Garmin detected an elevated heart rate during tasks that normally don\'t cause this. Any physical symptoms right now?',
      follow_up: 'The crew medical officer is notified. Describe what you feel as clearly as you can.',
      options: ['Chest discomfort or pain', 'Shortness of breath', 'Dizziness or nausea', 'No symptoms, may be stress'],
    },
    {
      trigger_channel: 'o2_sat',
      trigger_threshold: 2,
      question: 'Your SpO₂ reading is below your personal norm. Are you feeling short of breath or lightheaded?',
      follow_up: 'Move to a better-ventilated area and alert the medical officer.',
      options: ['Yes, I feel breathless', 'Slightly dizzy', 'No, I feel fine'],
    },
    {
      trigger_channel: 'steps',
      trigger_threshold: 50,
      question: 'Movement has dropped significantly today. Is this because of physical discomfort or pain?',
      options: ['Yes, pain or injury', 'Weakness or fatigue', 'I\'m resting as a precaution', 'Other reason'],
    },
    {
      trigger_channel: 'temperature',
      trigger_threshold: 10,
      question: 'Your skin temperature is above your personal baseline. Any fever, chills or general feeling of illness?',
      follow_up: 'Report to the crew medical officer. If possible, also measure oral temperature.',
      options: ['Fever or chills', 'Warm but no fever', 'Just worked out', 'I feel fine'],
    },
  ],

  enfermedad: [
    {
      trigger_channel: 'steps',
      trigger_threshold: 30,
      question: 'Your activity has been lower than your norm for several days. How is your body feeling overall?',
      options: ['Still symptomatic', 'Improving but tired', 'Better — ready to return to normal', 'Prefer not to say'],
    },
    {
      trigger_channel: 'sleep_h',
      trigger_threshold: 15,
      question: 'Sleep duration has changed from your norm during this illness period. Are you sleeping more, less, or just differently?',
      options: ['More than usual (fever, rest)', 'Less — discomfort waking me', 'About the same'],
    },
    {
      trigger_channel: 'hrv',
      trigger_threshold: 20,
      question: 'Your HRV recovery score is still below your pre-illness baseline. This is normal during recovery. How much better do you feel compared to Day 1 of illness?',
      options: ['Much better', 'Some improvement', 'About the same', 'Worse than yesterday'],
    },
    {
      trigger_channel: 'hr_rest',
      trigger_threshold: 12,
      question: 'Resting heart rate is still above your personal baseline. Are you following the medication schedule the crew medical officer prescribed?',
      options: ['Yes, every dose', 'Missed one or two doses', 'Medication effects bothering me', 'No prescription yet'],
    },
  ],

  sospecha_trastorno: [
    {
      trigger_channel: 'exercise_min',
      trigger_threshold: 35,
      question: 'Over the past 10 days, your time in physical activity has gone down compared to your personal norm. We noticed — not to flag you, but because movement often connects with how things feel inside. Has anything changed for you lately?',
      follow_up: 'That's completely valid. We\'re here to understand, not to judge.',
      options: ['Motivation has been lower', 'Physically not up to it', 'Too busy with mission tasks', 'Everything\'s fine'],
    },
    {
      trigger_channel: 'steps',
      trigger_threshold: 30,
      question: 'You\'ve been moving around the module less than your personal baseline for the past two weeks. Is there any reason you\'ve been staying in one area more?',
      options: ['Preference for my quarters', 'Conflict with someone on board', 'Just busy with tasks', 'Nothing specific'],
    },
    {
      trigger_channel: 'hrv',
      trigger_threshold: 20,
      question: 'Your body\'s recovery score has been trending lower for a while. That can go along with ongoing stress or emotional weight. Is anything accumulating for you that we haven\'t talked about?',
      follow_up: 'You don\'t have to name it. Even saying "yes, there\'s something" helps us offer better support.',
      options: ['Yes, there\'s something going on', 'Nothing I can point to', 'Not sure', 'Prefer not to say'],
    },
    {
      trigger_channel: 'sleep_quality',
      trigger_threshold: 25,
      question: 'Sleep quality has been lower than your norm for more than a week. Sleep and mood are closely connected. Are you finding it hard to feel rested even when you sleep?',
      options: ['Yes, rest isn\'t helping', 'Some nights are OK, some aren\'t', 'Sleep feels fine, actually', 'Prefer not to say'],
    },
  ],

  herida: [
    {
      trigger_channel: 'steps',
      trigger_threshold: 40,
      question: 'Your Garmin shows significantly less movement than your pre-injury baseline. How is the injury affecting mobility today compared to yesterday?',
      options: ['Better than yesterday', 'About the same', 'More limited than yesterday', 'Too painful to assess'],
    },
    {
      trigger_channel: 'exercise_min',
      trigger_threshold: 50,
      question: 'Exercise minutes are down from your plan — expected with an injury. The crew medical officer adjusted your protocol. Are you following the modified plan?',
      options: ['Yes, following adjusted plan', 'Haven\'t received an adjusted plan', 'Pain prevents it', 'Pushing past the plan'],
    },
    {
      trigger_channel: 'hrv',
      trigger_threshold: 15,
      question: 'Recovery score is below norm, which often happens with physical injury and pain. Pain level today compared to Day 1 of the injury?',
      options: ['Significantly less pain', 'Similar pain', 'More pain than initially', 'Hard to compare'],
    },
  ],
}

// Generate sensor questions relevant to the current state.
// Pass sensor anomalies detected today and the active protocol key.
export function getSensorQuestions(protocol: string, anomalies: SensorAnomaly[]): SensorQuestion[] {
  const checks = PROTOCOL_SENSOR_CHECKS[protocol] ?? []
  return checks.filter(check => {
    const anom = anomalies.find(a => a.channel === check.trigger_channel)
    return anom && Math.abs(anom.delta_pct) >= check.trigger_threshold
  })
}

// Mock sensor anomalies for the demo (replace with real Garmin/ring API data)
export function getMockSensorAnomalies(protocol: string, missionDay: number): SensorAnomaly[] {
  if (protocol === 'luto') return [
    { channel: 'steps',         delta_pct: -45, raw_value: 2800,  norm_value: 5100 },
    { channel: 'sleep_quality', delta_pct: -28, raw_value: 61,    norm_value: 85 },
    { channel: 'hrv',           delta_pct: -18, raw_value: 42,    norm_value: 51 },
  ]
  if (protocol === 'emergencia') return [
    { channel: 'hr_elevated',   delta_pct: +22, raw_value: 110,   norm_value: 90 },
    { channel: 'steps',         delta_pct: -65, raw_value: 1200,  norm_value: 5100 },
  ]
  if (protocol === 'enfermedad') return [
    { channel: 'steps',         delta_pct: -55, raw_value: 1600,  norm_value: 5100 },
    { channel: 'hrv',           delta_pct: -25, raw_value: 38,    norm_value: 51 },
    { channel: 'hr_rest',       delta_pct: +14, raw_value: 78,    norm_value: 68 },
  ]
  if (protocol === 'sospecha_trastorno') return [
    { channel: 'exercise_min',  delta_pct: -38, raw_value: 42,    norm_value: 68 },
    { channel: 'steps',         delta_pct: -32, raw_value: 3500,  norm_value: 5100 },
    { channel: 'sleep_quality', delta_pct: -26, raw_value: 63,    norm_value: 85 },
  ]
  if (protocol === 'herida') return [
    { channel: 'steps',         delta_pct: -42, raw_value: 2900,  norm_value: 5100 },
    { channel: 'exercise_min',  delta_pct: -55, raw_value: 30,    norm_value: 68 },
  ]
  // nominal / fatigue: moderate anomalies for sleep + activity
  return [
    { channel: 'sleep_quality', delta_pct: -18, raw_value: 70,    norm_value: 85 },
    { channel: 'exercise_min',  delta_pct: -20, raw_value: 55,    norm_value: 68 },
  ]
}

// ---------------------------------------------------------------- self-care tools (knowledge base: alerts.countermeasures)
export const SELF_CARE = [
  { key: 'breathing', title: 'Guided breathing', minutes: 3, copy: 'Slow your breathing to calm your body. Inhale 4, hold 4, exhale 6.' },
  { key: 'grounding', title: '5-4-3-2-1 grounding', minutes: 2, copy: 'Bring your attention back to the cabin, one sense at a time.' },
  { key: 'journal', title: 'Brief journal', minutes: 3, copy: 'Three lines about today. It stays on this device.' },
  { key: 'peer', title: 'Check-in with a crewmate', minutes: 10, copy: 'Ask your designated support crewmate for ten minutes together.' },
]
