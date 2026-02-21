import { PanelShell } from "../ui/PanelShell"
import { StatusBadge } from "../ui/StatusBadge"
import { Table, type TableColumn } from "../ui/table"
import type { DashboardOrderVm, DashboardPositionVm, DashboardViewModel } from "./dashboard-view-model"

type DashboardViewProps = {
  model: DashboardViewModel
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

const positionColumns: TableColumn<DashboardPositionVm>[] = [
  { key: "market", header: "Market", minWidth: 92 },
  { key: "size", header: "Size", align: "right", width: 120, minWidth: 110, className: "table-col--numeric" },
  {
    key: "unrealizedPnl",
    header: "PnL",
    align: "right",
    width: 130,
    minWidth: 120,
    className: "table-col--numeric",
  },
]

const orderColumns: TableColumn<DashboardOrderVm>[] = [
  { key: "market", header: "Market", minWidth: 82 },
  {
    key: "side",
    header: "Side",
    minWidth: 74,
    render: (order) => (order.side === "B" ? "Buy" : "Sell"),
  },
  { key: "size", header: "Size", align: "right", width: 110, minWidth: 100, className: "table-col--numeric" },
  {
    key: "limitPrice",
    header: "Price",
    align: "right",
    width: 120,
    minWidth: 110,
    className: "table-col--numeric",
  },
  {
    key: "timestamp",
    header: "Timestamp",
    width: 188,
    minWidth: 170,
    className: "table-col--numeric",
    render: (order) => formatTimestamp(order.timestamp),
  },
]

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
            <Table
              columns={positionColumns}
              rows={model.positions}
              rowKey={(position) => position.id}
              itemCount={model.positions.length}
              itemSize={40}
            />
          ) : (
            renderEmpty("No open positions.")
          )}
        </PanelShell>

        <PanelShell title="Open Orders" className="dashboard-panel-primary">
          {model.orders.length ? (
            <Table
              columns={orderColumns}
              rows={model.orders}
              rowKey={(order) => order.id}
              itemCount={model.orders.length}
              itemSize={40}
            />
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
