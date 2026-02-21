import { PanelShell } from "../ui/PanelShell"
import { StatusBadge } from "../ui/StatusBadge"
import type { DashboardViewModel } from "./dashboard-view-model"

type DashboardViewProps = {
  model: DashboardViewModel
}

function renderEmpty(label: string) {
  return <p className="muted" style={{ margin: 0 }}>{label}</p>
}

export function DashboardView({ model }: DashboardViewProps) {
  return (
    <>
      <section className="dashboard-status-row">
        <StatusBadge variant="neutral">Session {model.status.session}</StatusBadge>
        <StatusBadge variant="sim">{model.status.mode}</StatusBadge>
        <StatusBadge variant={model.status.apiHealthTone}>{model.status.apiHealth}</StatusBadge>
      </section>

      <section className="dashboard-metrics-grid">
        <article className="dashboard-metric-card">
          <p className="dashboard-metric-label">{model.metrics.equity.label}</p>
          <p className="dashboard-metric-value">{model.metrics.equity.value}</p>
        </article>
        <article className="dashboard-metric-card">
          <p className="dashboard-metric-label">{model.metrics.unrealizedPnl.label}</p>
          <p className="dashboard-metric-value">{model.metrics.unrealizedPnl.value}</p>
        </article>
        <article className="dashboard-metric-card">
          <p className="dashboard-metric-label">{model.metrics.exposure.label}</p>
          <p className="dashboard-metric-value">{model.metrics.exposure.value}</p>
        </article>
      </section>

      <section className="dashboard-core-grid">
        <PanelShell title="Open Positions" className="dashboard-panel-primary">
          {model.positions.length ? (
            <div className="dashboard-list">
              {model.positions.map((position) => (
                <div key={position.id} className="dashboard-list-row">
                  <span>{position.market} · {position.size}</span>
                  <span>{position.unrealizedPnl}</span>
                </div>
              ))}
            </div>
          ) : (
            renderEmpty("No open positions.")
          )}
        </PanelShell>

        <PanelShell title="Open Orders" className="dashboard-panel-primary">
          {model.orders.length ? (
            <div className="dashboard-list">
              {model.orders.map((order) => (
                <div key={order.id} className="dashboard-list-row">
                  <span>{order.market} · {order.side} · {order.size}</span>
                  <span>{order.limitPrice}</span>
                </div>
              ))}
            </div>
          ) : (
            renderEmpty("No open orders.")
          )}
        </PanelShell>
      </section>

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
    </>
  )
}
