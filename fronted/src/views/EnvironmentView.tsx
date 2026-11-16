// Environment: cabin conditions against the engine limits, and the first rule of the knowledge base:
// rule out environmental and physiological causes before reading a low mood as emotional.
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { StatusMark } from '../components/StatusMark'
import { supportApi, type MissionSeries, type StatusKind } from '../ixchel'
import { fmt, type ViewProps } from './shared'

// Same thresholds as ixchel_core.LIMITES (notice, critical, direction). Reference values to validate with NASA-STD-3001.
const VARS: { key: string; label: string; unit: string; dec: number; notice?: number; critical?: number; low?: boolean; note: string }[] = [
  { key: 'co2_ppm', label: 'Cabin CO₂', unit: 'ppm', dec: 0, notice: 3000, critical: 5000, note: 'From ~2.3 mmHg (≈3,000 ppm) people report headache, fatigue and low mood.' },
  { key: 'ruido_dba', label: 'Noise', unit: 'dBA', dec: 0, notice: 55, critical: 65, note: 'Noise above the sleep limit fragments rest and raises irritability.' },
  { key: 'o2_pct', label: 'Oxygen', unit: '%', dec: 1, notice: 20, critical: 19.5, low: true, note: 'Low oxygen can look like confusion or anxiety.' },
  { key: 'presion_hpa', label: 'Cabin pressure', unit: 'hPa', dec: 0, notice: 960, critical: 900, low: true, note: 'A pressure drop is a life-support event first.' },
  { key: 'humedad_pct', label: 'Humidity', unit: '%', dec: 0, notice: 70, critical: 80, note: 'High humidity affects comfort and sleep.' },
  { key: 'temp_c', label: 'Temperature', unit: '°C', dec: 1, note: 'Real ISS cabin values (NASA OSDR).' },
  { key: 'radiacion_msv_dia', label: 'Radiation today', unit: 'mSv', dec: 2, note: 'Daily dose, scaled from real ISS and Mars measurements.' },
  { key: 'masa_pct', label: 'Body mass change', unit: '%', dec: 1, notice: -5, critical: -7, low: true, note: 'Weight loss can come from low appetite or mood.' },
  { key: 'perdida_osea_pct', label: 'Bone loss (estimate)', unit: '%', dec: 1, notice: 8, critical: 12, note: 'Assumed rates, not validated.' },
]

const kindOf = (v: number | null | undefined, d: (typeof VARS)[number]): StatusKind => {
  if (v == null || d.notice === undefined) return 'normal'
  if (d.low) return v <= (d.critical ?? -Infinity) ? 'critical' : v <= d.notice ? 'attention' : 'normal'
  return v >= (d.critical ?? Infinity) ? 'critical' : v >= d.notice ? 'attention' : 'normal'
}

export function EnvironmentView({ scenarioKey, missionDay, version }: ViewProps) {
  const [series, setSeries] = useState<MissionSeries | null>(null)
  useEffect(() => { if (scenarioKey) supportApi(scenarioKey).series().then(setSeries).catch(() => setSeries(null)) }, [scenarioKey, version])
  const t = missionDay - 1
  const day = series?.dias[t]
  const last = series ? series.dias.slice(Math.max(0, t - 29), t + 1) : []
  const acc = day?.radiacion_acum_msv ?? null
  const co2mmhg = day?.x.co2_ppm != null ? day.x.co2_ppm * 0.00076 : null
  const sleep = day?.x.sueno_h ?? null
  const checks = day ? [
    { ok: co2mmhg == null || co2mmhg < 2.3, label: 'CO₂ below 2.3 mmHg', value: co2mmhg == null ? '—' : `${fmt(co2mmhg, 1)} mmHg` },
    { ok: (day.x.ruido_dba ?? 0) < 55, label: 'Noise below the sleep limit (55 dBA)', value: `${fmt(day.x.ruido_dba, 0)} dBA` },
    { ok: sleep == null || sleep > 6, label: 'Slept more than 6 hours', value: sleep == null ? '—' : `${fmt(sleep, 1)} h` },
    { ok: (day.x.o2_pct ?? 21) > 20, label: 'Oxygen normal', value: `${fmt(day.x.o2_pct, 1)} %` },
  ] : []
  const failing = checks.filter(c => !c.ok)

  return (
    <div className="environment-view">
      <header className="compact-view-header"><div><p className="screen-kicker">CABIN AND BODY CONTEXT · DAY {missionDay}</p><h1>Environment</h1><p>The cabin can change how you feel. Before ARMOR reads a low day as emotional, it checks the air, the noise and your sleep.</p></div></header>
      {!scenarioKey && <p className="support-error">Start the Ixchel engine to see cabin data.</p>}
      {day && <>
        <section className={failing.length ? 'confounder-panel attention' : 'confounder-panel'}>
          <div><p className="screen-kicker">FIRST RULE · RULE OUT THE ENVIRONMENT</p>
            <h2>{failing.length ? `${failing.length} non-emotional cause${failing.length > 1 ? 's' : ''} to fix first` : 'No environmental cause today'}</h2>
            <p>{failing.length ? 'If your mood or focus feels off today, these may be part of it. Fix them and check again before reading it as emotional.' : 'If you feel low today, it is worth talking about: the cabin is not the explanation.'}</p></div>
          <ul>{checks.map(c => <li key={c.label} className={c.ok ? 'ok' : 'bad'}>{c.ok ? <Icon name="check" /> : <Icon name="alert" />}<span>{c.label}</span><b>{c.value}</b></li>)}</ul>
        </section>

        <section className="env-grid">
          {VARS.map(v => {
            const val = day.x[v.key]
            const kind = kindOf(val, v)
            const vals = last.map(d => d.x[v.key]).filter((z): z is number => z != null)
            return (
              <article key={v.key} className={`env-card ${kind}`}>
                <header><small>{v.label}</small><StatusMark kind={kind} size="sm" /></header>
                <strong>{fmt(val, v.dec)} <span>{v.unit}</span></strong>
                <Spark values={vals} notice={v.notice} />
                <p>{v.notice !== undefined ? `Notice ${v.low ? '≤' : '≥'} ${fmt(v.notice, v.dec)} · critical ${v.low ? '≤' : '≥'} ${fmt(v.critical ?? null, v.dec)}` : 'No limit set'}</p>
                <p className="env-note">{v.note}</p>
              </article>
            )
          })}
          <article className={`env-card ${acc != null && acc >= 540 ? 'critical' : acc != null && acc >= 300 ? 'attention' : 'normal'}`}>
            <header><small>Mission radiation</small><StatusMark kind={acc != null && acc >= 540 ? 'critical' : 'normal'} size="sm" /></header>
            <strong>{fmt(acc, 0)} <span>of 600 mSv</span></strong>
            <div className="context-progress"><i style={{ width: `${Math.min(100, (acc ?? 0) / 6)}%` }} /></div>
            <p>Career reference limit 600 mSv (NASA).</p>
            <p className="env-note">Accumulated since launch in this simulated mission.</p>
          </article>
        </section>
        <p className="support-note">Cabin CO₂, temperature and humidity are real ISS days (NASA OSDR, 14 missions). Limits are reference values to validate with NASA-STD-3001. Real ISS finding: the median daily CO₂ (~3,040 ppm) is already above the notice level.</p>
      </>}
    </div>
  )
}

function Spark({ values, notice }: { values: number[]; notice?: number }) {
  if (values.length < 2) return <div className="env-spark" />
  const W = 200, H = 44
  const lo = Math.min(...values, notice ?? Infinity), hi = Math.max(...values, notice ?? -Infinity)
  const span = hi - lo || 1
  const y = (v: number) => H - 4 - ((v - lo) / span) * (H - 8)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg className="env-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Last 30 days">
      {notice !== undefined && <line x1="0" x2={W} y1={y(notice)} y2={y(notice)} className="notice" />}
      <polyline points={pts} />
    </svg>
  )
}
