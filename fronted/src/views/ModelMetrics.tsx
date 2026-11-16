// "How to read this": honest numbers for the two learned models.
import { useEffect, useState } from 'react'
import { modelMetrics } from '../ixchel'
import { DOMAIN_LABEL, fmt } from './shared'

export function ModelMetrics() {
  const [m, setM] = useState<Record<string, any> | null>(null)
  useEffect(() => { modelMetrics().then(setM).catch(() => setM(null)) }, [])
  if (!m?.metricas_riesgo) return null
  const r = m.metricas_riesgo, s = m.metricas_sueno
  const rules = r.global.reglas_motor, rf = r.global.random_forest
  const pct = (v: number) => `${fmt(v * 100, 0)}%`
  return (
    <section className="metrics-block">
      <div className="section-title-row"><div><p className="screen-kicker">HOW GOOD ARE THE MODELS</p><h2>Numbers, including the uncomfortable ones</h2></div></div>
      <div className="metrics-grid">
        <article>
          <span className="tag real">Real data</span>
          <h3>Sleep from wrist heart rate</h3>
          <p>Trained and tested on {s.personas} real people (PhysioNet), always evaluated on people it never saw.</p>
          <dl>
            <dt>Asleep vs awake</dt><dd>{pct(s.exactitud_dormido_vs_despierto)}</dd>
            <dt>Sleep hours per night</dt><dd>±{fmt(s.error_por_noche.sueno_h_error_absoluto_medio_h, 2)} h</dd>
            <dt>Four stages</dt><dd>{pct(s.exactitud)} (κ {fmt(s.kappa_cohen, 2)}; guessing gives {pct(s.exactitud_si_siempre_dice_ligero)})</dd>
          </dl>
        </article>
        <article>
          <span className="tag sim">Simulated crew</span>
          <h3>Early warning across four domains</h3>
          <p>Tested on {r.astronautas_prueba} simulated astronauts it never saw. The truth comes from the simulator, so these numbers are optimistic.</p>
          <table className="metrics-table">
            <thead><tr><th /><th>Rules only</th><th>Rules + model</th></tr></thead>
            <tbody>
              <tr><td>Problems detected</td><td>{pct(rules.sensibilidad)}</td><td>{pct(rf.sensibilidad)}</td></tr>
              <tr><td>False alarms / 100 healthy days</td><td>{fmt(rules.falsas_alarmas_por_100_dias_sanos, 1)}</td><td>{fmt(rf.falsas_alarmas_por_100_dias_sanos, 1)}</td></tr>
              <tr><td>Median delay</td><td>{fmt(rules.retraso_mediano_dias, 0)} d</td><td>{fmt(rf.retraso_mediano_dias, 0)} d</td></tr>
              {(['psico', 'sueno', 'fisico', 'social'] as const).map(d => <tr key={d}><td>{DOMAIN_LABEL[d]} detected</td><td>{pct(r.por_dominio[d].reglas_motor.sensibilidad)}</td><td>{pct(r.por_dominio[d].random_forest.sensibilidad)}</td></tr>)}
            </tbody>
          </table>
        </article>
        <article>
          <span className="tag rule">Design rules</span>
          <h3>What the model is never allowed to do</h3>
          <ul>
            <li>It can only raise an early notice (normal → attention). Critical always comes from a rule, and a person confirms.</li>
            <li>It never removes an alert from the rules.</li>
            <li>The safety question is evaluated apart from everything else and always prevails.</li>
            <li>Self-report thresholds are team design, not published astronaut cut-offs; questionnaires are screens, not diagnoses.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
