import type { DashboardViewModel } from "../../lib/hooks/dashboard-view-model"
import { PanelShell } from "../ui/PanelShell"
import { SkeletonBlock } from "../ui/SkeletonBlock"

type DashboardSecondaryPanelsProps = {
  model: Pick<DashboardViewModel, "opportunities" | "intents">
  isLoading?: boolean
}

const TOP_HIGHLIGHT_LIMIT = 2

function getOpportunityContext(rank: number) {
  if (rank === 1) {
    return { confidence: "High", timeContext: "Updated now" }
  }

  if (rank === 2) {
    return { confidence: "Medium", timeContext: "Updated <1m" }
  }

  return { confidence: "Low", timeContext: "Rolling" }
}

function getIntentContext(rank: number) {
  if (rank === 1) {
    return { confidence: "Confirmed", timeContext: "Latest event" }
  }

  if (rank === 2) {
    return { confidence: "Monitor", timeContext: "Recent" }
  }

  return { confidence: "Trace", timeContext: "Snapshot" }
}

function SecondaryRow({
  label,
  value,
  rank,
  context,
  emphasize,
}: {
  label: string
  value: string
  rank: number
  context: { confidence: string; timeContext: string }
  emphasize: boolean
}) {
  return (
    <div key={label} className={`dashboard-list-row ${emphasize ? "dashboard-list-row--top" : ""}`} aria-label={`${label}: ${value}`}>
      <div className="dashboard-list-row-main">
        <span className="dashboard-list-rank">#{rank}</span>
        <span className="dashboard-list-label">{label}</span>
      </div>
      <span className="dashboard-list-value">{value}</span>
      <div className="dashboard-list-context">
        <span className={`dashboard-row-tag ${emphasize ? "dashboard-row-tag--top" : ""}`}>{context.confidence}</span>
        <span className="dashboard-list-time">{context.timeContext}</span>
      </div>
    </div>
  )
}

export function DashboardSecondaryPanels({ model, isLoading = false }: DashboardSecondaryPanelsProps) {
  if (isLoading) {
    return (
      <section className="dashboard-secondary-grid" aria-label="Loading secondary panels">
        <PanelShell title="Opportunities" contextTag="Secondary context" tier="secondary" className="dashboard-secondary-panel">
          <div className="dashboard-secondary-list">
            <SkeletonBlock height="1rem" />
            <SkeletonBlock height="1rem" width="85%" />
            <SkeletonBlock height="1rem" width="70%" />
          </div>
        </PanelShell>
        <PanelShell title="Intent" contextTag="Execution metadata" tier="secondary" className="dashboard-secondary-panel">
          <div className="dashboard-secondary-list">
            <SkeletonBlock height="1rem" />
            <SkeletonBlock height="1rem" width="75%" />
            <SkeletonBlock height="1rem" width="90%" />
          </div>
        </PanelShell>
      </section>
    )
  }

  return (
    <section className="dashboard-secondary-grid">
      <PanelShell title="Opportunities" contextTag="Secondary context" tier="secondary" className="dashboard-secondary-panel">
        <div className="dashboard-secondary-list">
          {model.opportunities.map((item, index) => {
            const rank = index + 1
            const emphasize = rank <= TOP_HIGHLIGHT_LIMIT
            return (
              <SecondaryRow
                key={item.label}
                label={item.label}
                value={item.value}
                rank={rank}
                context={getOpportunityContext(rank)}
                emphasize={emphasize}
              />
            )
          })}
        </div>
      </PanelShell>

      <PanelShell title="Intent" contextTag="Execution metadata" tier="secondary" className="dashboard-secondary-panel">
        <div className="dashboard-secondary-list" role="status" aria-label="Intent state indicators">
          {model.intents.map((item, index) => {
            const rank = index + 1
            const emphasize = rank <= TOP_HIGHLIGHT_LIMIT
            return (
              <SecondaryRow
                key={item.label}
                label={item.label}
                value={item.value}
                rank={rank}
                context={getIntentContext(rank)}
                emphasize={emphasize}
              />
            )
          })}
        </div>
      </PanelShell>
    </section>
  )
}
