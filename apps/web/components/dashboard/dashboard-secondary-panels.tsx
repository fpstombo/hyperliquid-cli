import type { DashboardViewModel } from "./dashboard-view-model"
import { PanelShell } from "../ui/PanelShell"
import { SkeletonBlock } from "../ui/SkeletonBlock"

type DashboardSecondaryPanelsProps = {
  model: Pick<DashboardViewModel, "opportunities" | "intents">
  isLoading?: boolean
}

export function DashboardSecondaryPanels({ model, isLoading = false }: DashboardSecondaryPanelsProps) {
  if (isLoading) {
    return (
      <section className="dashboard-secondary-grid" aria-label="Loading secondary panels">
        <PanelShell title="Opportunities" subtitle="Secondary context" className="dashboard-panel-secondary">
          <div className="dashboard-secondary-list">
            <SkeletonBlock height="1rem" />
            <SkeletonBlock height="1rem" width="85%" />
            <SkeletonBlock height="1rem" width="70%" />
          </div>
        </PanelShell>
        <PanelShell title="Intent" subtitle="Execution metadata" className="dashboard-panel-secondary">
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
      <PanelShell title="Opportunities" subtitle="Secondary context" className="dashboard-panel-secondary">
        <div className="dashboard-secondary-list">
          {model.opportunities.map((item) => (
            <div key={item.label} className="dashboard-list-row">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </PanelShell>

      <PanelShell title="Intent" subtitle="Execution metadata" className="dashboard-panel-secondary">
        <div className="dashboard-secondary-list">
          {model.intents.map((item) => (
            <div key={item.label} className="dashboard-list-row">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </PanelShell>
    </section>
  )
}
