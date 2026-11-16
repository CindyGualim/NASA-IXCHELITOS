import { Icon } from '../components/Icon'
import { StatusMark } from '../components/StatusMark'
import { type DayPayload, type TodayVM } from '../ixchel'
import { type ViewProps } from './shared'

export function CommanderView({ missionDay, goTo, today, data }: ViewProps & { today: TodayVM | null; data: DayPayload | null }) {
  const domains = today?.domains ?? []
  const criticalDomains = domains.filter(d => d.kind === 'critical')
  const attentionDomains = domains.filter(d => d.kind === 'attention')

  return (
    <div className="commander-view">
      <header className="compact-view-header">
        <div>
          <p className="screen-kicker">CREW MEDICAL SUMMARY · MISSION DAY {missionDay}</p>
          <h1>Crew Member 04: Elena Vega</h1>
          <p>Operational capacity and critical alerts only. Details remain private with the crew member.</p>
        </div>
        <span className="updated-label"><Icon name="shield" /> Command level view</span>
      </header>

      <section className="commander-overview">
        <div className="overview-grid">
          <article className={`capacity-card ${today?.overallKind ?? 'normal'}`}>
            <div className="card-header">
              <StatusMark kind={today?.overallKind ?? 'normal'} size="lg" />
              <div>
                <strong>Overall Operational Status</strong>
                <span>{today?.overallLabel ?? 'Normal'}</span>
              </div>
            </div>
            <p className="capacity-note">{today?.overallNote ?? 'All systems within normal parameters'}</p>
          </article>

          <article className="capability-card">
            <Icon name="scan" />
            <div>
              <strong>Mission Capability</strong>
              <p>{criticalDomains.length === 0 ? 'Full operational capacity for planned tasks' : `Restricted from high-attention tasks (${criticalDomains.length} critical alert${criticalDomains.length !== 1 ? 's' : ''})`}</p>
            </div>
          </article>

          <article className="readiness-card">
            <Icon name="pulse" />
            <div>
              <strong>EVA Readiness</strong>
              <p>Check medications for EVA restrictions before scheduling.</p>
            </div>
          </article>

          <article className="resilience-card">
            <Icon name="heart" />
            <div>
              <strong>Psychological Support Status</strong>
              <p>Crew member has access to 24/7 support tools and AI companion.</p>
            </div>
          </article>
        </div>
      </section>

      {criticalDomains.length > 0 && (
        <section className="critical-section">
          <div className="section-title-row">
            <div>
              <p className="screen-kicker">CRITICAL ALERTS</p>
              <h2>Require immediate Commander review</h2>
            </div>
          </div>
          <div className="critical-list">
            {criticalDomains.map(d => (
              <article key={d.key} className="critical-item">
                <StatusMark kind="critical" size="lg" />
                <div>
                  <strong>{d.title}</strong>
                  <p>{d.description}</p>
                  <p className="critical-action">Action: Crew medical officer has been notified. Review protocol procedures.</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {attentionDomains.length > 0 && (
        <section className="attention-section">
          <div className="section-title-row">
            <div>
              <p className="screen-kicker">MONITORING ALERTS</p>
              <h2>Require routine follow-up</h2>
            </div>
          </div>
          <div className="attention-list">
            {attentionDomains.map(d => (
              <article key={d.key}>
                <StatusMark kind="attention" size="sm" />
                <div>
                  <strong>{d.title}</strong>
                  <p>{d.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="decisions-section">
        <div className="section-title-row">
          <div>
            <p className="screen-kicker">CREW MEMBER DECISIONS</p>
            <h2>Actions taken this cycle</h2>
          </div>
        </div>
        <div className="decision-summary">
          <p className="summary-note">
            <Icon name="shield" />
            Crew member retains autonomy over all health decisions. ARMOR proposes; they decide. All decisions are logged and can be reviewed.
          </p>
          <button className="secondary-action" onClick={() => goTo('Decision log')}>
            View decision log <Icon name="chevron" />
          </button>
        </div>
      </section>

      <section className="context-section">
        <div className="section-title-row">
          <div>
            <p className="screen-kicker">MISSION CONTEXT</p>
            <h2>Environmental factors</h2>
          </div>
        </div>
        <div className="context-items-commander">
          <div>
            <small>Gravity</small>
            <strong>0 g · day {missionDay}</strong>
          </div>
          <div>
            <small>Earth delay</small>
            <strong>12 min</strong>
          </div>
          <div>
            <small>Radiation today</small>
            <strong>0.62 mSv</strong>
          </div>
          <div>
            <small>Cabin CO₂</small>
            <strong>3,180 ppm</strong>
          </div>
          <div>
            <small>Mission radiation</small>
            <strong>214 of 600 mSv</strong>
          </div>
          <div>
            <small>Phase</small>
            <strong>Transit to Mars · day 87 of 180</strong>
          </div>
        </div>
      </section>

      <footer className="commander-footer">
        <div>
          <Icon name="shield" />
          <div>
            <strong>Command Protocol</strong>
            <p>This view shows operational capacity only. Crew member's full health data remains private. Regular sync meetings recommended every 3-5 mission days.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
