// Timeline: the whole mission as the engine saw it, plus what the astronaut did, plus a real night of sleep.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { StatusMark, levelKind } from '../components/StatusMark'
import { ALERT_TEXT } from '../content'
import { ALERT_TITLE, sampleNight, supportApi, type LogEntry, type MissionSeries, type SampleNight } from '../ixchel'
import { DOMAIN_LABEL, fmt, type ViewProps } from './shared'

const LANES = ['psico', 'sueno', 'fisico', 'social'] as const
const LANE_COLOR: Record<string, string> = { psico: '#b07a2a', sueno: '#4f6d8a', fisico: '#889063', social: '#9b5d73' }
const STAGE_ROW: Record<string, number> = { despierto: 0, REM: 1, ligero: 2, profundo: 3 }
const STAGE_LABEL = ['Awake', 'REM', 'Light', 'Deep']

export function TimelineView({ scenarioKey, missionDay, setMissionDay, version }: ViewProps) {
  const [series, setSeries] = useState<MissionSeries | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [night, setNight] = useState<SampleNight | null>(null)
  const [error, setError] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)

  useEffect(() => {
    if (!scenarioKey) return
    const api = supportApi(scenarioKey)
    api.series().then(setSeries).catch(e => setError(String(e)))
    api.log().then(r => setLog(r.registro)).catch(() => undefined)
  }, [scenarioKey, version])
  useEffect(() => { sampleNight().then(setNight).catch(() => setNight(null)) }, [])
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(Math.max(560, el.clientWidth)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [series])

  const t = missionDay - 1
  const day = series?.dias[t]
  const reported = useMemo(() => {
    if (!series) return [] as { dia: number; tipo: string }[]
    const out: { dia: number; tipo: string }[] = []
    series.dias.forEach((d, i) => d.eventos.forEach(e => { if (!series.dias[i - 1]?.eventos.includes(e)) out.push({ dia: i, tipo: e }) }))
    return out
  }, [series])

  if (!scenarioKey) return <div className="timeline-view"><Header missionDay={missionDay} /><p className="support-error">Start the Ixchel engine to see the mission timeline.</p></div>
  if (!series) return <div className="timeline-view"><Header missionDay={missionDay} /><p className="support-quiet">{error ? `Could not load the timeline: ${error}` : 'Loading the mission…'}</p></div>

  const n = series.dias.length, L = 110, R = 14, top = 26, lane = 46, gap = 8
  const H = top + 30 + LANES.length * (lane + gap) + 46
  const x = (i: number) => L + ((width - L - R) * i) / (n - 1)
  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const sx = ((e.clientX - r.left) / r.width) * width
    setMissionDay(Math.max(1, Math.min(n, Math.round(((sx - L) / (width - L - R)) * (n - 1)) + 1)))
  }
  const logDays = log.filter(e => e.tipo !== 'reporte')
  return (
    <div className="timeline-view">
      <Header missionDay={missionDay} />
      <section className="timeline-chart" ref={box}>
        <svg viewBox={`0 0 ${width} ${H}`} width="100%" height={H} onClick={pick} role="img" aria-label="Mission timeline by domain">
          {/* overall level strip */}
          <text x="0" y={top + 14} className="lane-label">Overall</text>
          {series.dias.map((d, i) => <rect key={i} x={x(i) - (width - L - R) / n / 2} y={top} width={(width - L - R) / n + 0.5} height="20" className={`lvl ${d.nivel}`}><title>{`Day ${i + 1}: ${d.nivel}`}</title></rect>)}
          {LANES.map((dom, k) => {
            const y0 = top + 30 + k * (lane + gap)
            const pts = series.dias.map((d, i) => `${x(i).toFixed(1)},${(y0 + lane - 4 - (d.ml[dom] ?? 0) * (lane - 8)).toFixed(1)}`).join(' ')
            return (
              <g key={dom}>
                <text x="0" y={y0 + lane / 2 + 4} className="lane-label">{DOMAIN_LABEL[dom]}</text>
                <rect x={L} y={y0} width={width - L - R} height={lane} className="lane-bg" />
                <line x1={L} x2={width - R} y1={y0 + lane - 4 - 0.5 * (lane - 8)} y2={y0 + lane - 4 - 0.5 * (lane - 8)} className="lane-threshold" />
                <polyline points={pts} fill="none" stroke={LANE_COLOR[dom]} strokeWidth="2" />
                {series.dias.map((d, i) => d.alertas.some(a => a.dominio === dom) && <rect key={i} x={x(i) - 1} y={y0 + lane - 7} width="2.4" height="7" className={d.alertas.some(a => a.dominio === dom && a.nivel === 'ROJO') ? 'tick critical' : 'tick'} />)}
              </g>
            )
          })}
          {/* reported events and what the astronaut did */}
          {reported.map(e => <g key={e.tipo + e.dia}><line x1={x(e.dia)} x2={x(e.dia)} y1={top - 6} y2={H - 40} className="event-line" /><text x={x(e.dia) + 4} y={top - 10} className="event-label">{({ luto: 'Loss reported', emergencia: 'Emergency reported', herida: 'Injury', enfermedad: 'Illness', tratamiento: 'Treatment started', sospecha_trastorno: 'Clinical follow-up' } as Record<string, string>)[e.tipo] ?? e.tipo}</text></g>)}
          {logDays.map(e => <circle key={e.id} cx={x(e.dia)} cy={H - 30} r="4" className={`log-dot ${e.tipo}`}><title>{`Day ${e.dia + 1}: ${e.resumen}`}</title></circle>)}
          <text x="0" y={H - 26} className="lane-label">You</text>
          {Array.from({ length: Math.floor((n - 1) / 30) + 1 }, (_, i) => i * 30).map(i => <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="axis">day {i + 1}</text>)}
          <line x1={x(t)} x2={x(t)} y1={top - 4} y2={H - 18} className="cursor" />
        </svg>
        <div className="timeline-legend">
          <span><i className="sw VERDE" />Normal</span><span><i className="sw AMARILLO" />Attention</span><span><i className="sw ROJO" />Critical</span>
          <span><i className="sw line" />Model probability (dashed = 50%)</span><span><i className="sw tick" />Rule alert</span><span><i className="sw dot" />Your check-ins and decisions</span>
          <span className="hint">Click anywhere to open that day</span>
        </div>
      </section>

      {day && <section className="timeline-day">
        <div><p className="screen-kicker">DAY {missionDay}</p><h2><StatusMark kind={levelKind(day.nivel)} size="sm" /> {day.nivel === 'ROJO' ? 'Critical' : day.nivel === 'AMARILLO' ? 'Attention' : 'Normal'}</h2></div>
        <div className="timeline-day-grid">
          {LANES.map(d => <div key={d}><small>{DOMAIN_LABEL[d]}</small><strong>{Math.round((day.ml[d] ?? 0) * 100)}%</strong><span>model probability</span></div>)}
          <div><small>Hours slept</small><strong>{fmt(day.x.sueno_h, 1)} h</strong><span>last night</span></div>
          <div><small>Stress</small><strong>{fmt(day.x.estres_vas, 0)}</strong><span>of 100</span></div>
        </div>
        <ul className="timeline-alerts">{day.alertas.slice(0, 6).map((a, i) => <li key={i}><b>{DOMAIN_LABEL[a.dominio] ?? a.dominio}</b> {ALERT_TEXT[a.codigo]?.title ?? ALERT_TITLE[a.codigo] ?? a.codigo.replace(/_/g, ' ').toLowerCase()}</li>)}{day.alertas.length === 0 && <li>No alerts this day.</li>}</ul>
      </section>}

      <section className="hypnogram">
        <div className="section-title-row"><div><p className="screen-kicker">SLEEP MODEL · VALIDATED WITH REAL DATA</p><h2>One night, read from wrist heart rate</h2></div>
          {night && <span className="updated-label">{night.fuente}</span>}</div>
        {!night && <p className="support-quiet">The sample night needs the PhysioNet data (python scripts/download_data.py).</p>}
        {night && <>
          <Hypnogram night={night} />
          <div className="hypno-stats">
            <div><small>Sleep (model)</small><strong>{fmt(night.sueno_h_modelo, 2)} h</strong></div>
            <div><small>Sleep (expert)</small><strong>{fmt(night.sueno_h_experto, 2)} h</strong></div>
            <div><small>Efficiency</small><strong>{fmt(night.eficiencia_modelo, 0)}%</strong></div>
            <div><small>Resting heart rate</small><strong>{fmt(night.fc_reposo, 0)} bpm</strong></div>
          </div>
          <p className="support-note"><Icon name="check" /> On 47 people it never saw, the model tells sleep from wake 89% of the time and estimates nightly sleep within ±0.43 h. This is how ARMOR turns a watch into sleep hours without asking the astronaut.</p>
        </>}
      </section>
    </div>
  )
}

function Header({ missionDay }: { missionDay: number }) {
  return <header className="compact-view-header"><div><p className="screen-kicker">MISSION HISTORY · DAY {missionDay}</p><h1>Timeline</h1><p>How each part of you changed across the mission, compared with your own norm. Shaded blocks are the overall state; lines are the learned model’s probability; marks are rule alerts.</p></div></header>
}

function Hypnogram({ night }: { night: SampleNight }) {
  const W = 1000, rowH = 22, H = rowH * 4 + 30, n = night.modelo.length
  const path = (stages: (string | null)[], y0: number) => {
    let d = ''
    stages.forEach((s, i) => {
      if (s == null || STAGE_ROW[s] === undefined) return
      const x = (i / n) * W, y = y0 + STAGE_ROW[s] * rowH + rowH / 2
      d += `${d ? 'L' : 'M'}${x.toFixed(1)},${y} H${(((i + 1) / n) * W).toFixed(1)} `
    })
    return d
  }
  const hours = Math.floor((n * night.epoca_s) / 3600)
  return (
    <div className="hypno-wrap">
      <svg viewBox={`-70 0 ${W + 80} ${H * 2}`} width="100%" role="img" aria-label="Hypnogram: model versus expert">
        {[0, 1].map(k => (
          <g key={k}>
            <text x="-66" y={k * H + 12} className="hypno-title">{k === 0 ? 'Model (heart rate only)' : 'Expert (lab recording)'}</text>
            {STAGE_LABEL.map((s, r) => <text key={s} x="-8" y={k * H + 18 + r * rowH + rowH / 2 + 4} textAnchor="end" className="axis">{s}</text>)}
            <path d={path(k === 0 ? night.modelo : night.experto, k * H + 18)} className={k === 0 ? 'hypno-line model' : 'hypno-line expert'} />
          </g>
        ))}
        {Array.from({ length: hours + 1 }, (_, h) => <text key={h} x={(h * 3600 / night.epoca_s / n) * W} y={H * 2 - 4} textAnchor="middle" className="axis">{h} h</text>)}
      </svg>
    </div>
  )
}
