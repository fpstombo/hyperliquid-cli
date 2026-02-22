import dynamic from "next/dynamic"
import { ExposureValue } from "../ui/ExposureValue"
import { PanelShell } from "../ui/PanelShell"
import { PnlValue } from "../ui/PnlValue"
import { SkeletonBlock } from "../ui/SkeletonBlock"
import { StatusBadge } from "../ui/StatusBadge"
import { Table, type TableColumn } from "../ui/table"
import { ValueFlash } from "../ui/ValueFlash"
import { formatTimestamp } from "../../lib/formatters"
import type { DashboardOrderVm, DashboardPositionVm, DashboardViewModel } from "../../lib/hooks/dashboard-view-model"

type DashboardViewProps = {
  model: DashboardViewModel
  isInitialLoading?: boolean
}

const DashboardSecondaryPanels = dynamic(
  () => import("./dashboard-secondary-panels").then((module) => module.DashboardSecondaryPanels),
  {
    loading: () => (
      <section className="dashboard-secondary-grid" aria-label="Loading secondary panels">
        <PanelShell title="Opportunities" contextTag="Secondary context" className="dashboard-panel-secondary">
          <div className="dashboard-secondary-list">
            <SkeletonBlock height="1rem" />
            <SkeletonBlock height="1rem" width="80%" />
            <SkeletonBlock height="1rem" width="65%" />
          </div>
        </PanelShell>
        <PanelShell title="Intent" contextTag="Execution metadata" className="dashboard-panel-secondary">
          <div className="dashboard-secondary-list">
            <SkeletonBlock height="1rem" />
            <SkeletonBlock height="1rem" width="76%" />
            <SkeletonBlock height="1rem" width="90%" />
          </div>
        </PanelShell>
      </section>
    ),
  },
)

function tableLoadingSkeleton(rows = 4) {
  return (
    <div className="grid" style={{ gap: "0.5rem" }} aria-label="Loading table data">
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonBlock key={idx} height="1rem" width={idx % 2 ? "88%" : "100%"} />
      ))}
    </div>
  )
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
    render: (position) => <PnlValue value={position.unrealizedPnl} />,
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

export function DashboardView({ model, isInitialLoading = false }: DashboardViewProps) {
  return (
    <>
      <section className="dashboard-status-row">
        <StatusBadge variant="neutral">Session {model.status.session}</StatusBadge>
        <StatusBadge variant={model.status.mode === "SIM" ? "sim" : "confirmed"} role="status" aria-label={`Mode ${model.status.mode}`}>{model.status.mode}</StatusBadge>
        {model.status.mode === "SIM" ? (
          <StatusBadge variant={model.status.simStateTone} role="status" aria-label={model.status.simStateLabel}>
            {model.status.simStateLabel}
          </StatusBadge>
        ) : null}
        <StatusBadge variant={model.status.connectionTone} role="status" aria-label={`Connection ${model.status.connection}`}>{model.status.connection}</StatusBadge>
        <StatusBadge variant={model.status.apiHealthTone}>{model.status.apiHealth}</StatusBadge>
        <StatusBadge variant={model.status.freshnessTone}>{model.status.freshness}</StatusBadge>
        <span className="dashboard-status-hint muted">Updated {model.status.updatedHint}</span>
      </section>

      <section className="dashboard-metrics-grid">
        <article className="dashboard-metric-card">
          <p className="dashboard-metric-label">{model.metrics.equity.label}</p>
          <p className="dashboard-metric-value"><ValueFlash value={model.metrics.equity.value}>{model.metrics.equity.value}</ValueFlash></p>
        </article>
        <article className="dashboard-metric-card">
          <p className="dashboard-metric-label">{model.metrics.unrealizedPnl.label}</p>
          <p className="dashboard-metric-value">
            <ValueFlash value={model.metrics.unrealizedPnl.rawValue ?? 0}><PnlValue value={model.metrics.unrealizedPnl.rawValue ?? 0} /></ValueFlash>
          </p>
        </article>
        <article className="dashboard-metric-card">
          <p className="dashboard-metric-label">{model.metrics.exposure.label}</p>
          <p className="dashboard-metric-value">
            <ValueFlash value={model.metrics.exposure.rawValue ?? 0}><ExposureValue value={model.metrics.exposure.rawValue ?? 0} /></ValueFlash>
          </p>
        </article>
      </section>

      <section className="dashboard-core-grid">
        <PanelShell title="Open Positions" className="dashboard-panel-primary">
          {isInitialLoading && model.positions.length === 0 ? (
            tableLoadingSkeleton()
          ) : model.positions.length ? (
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
          {isInitialLoading && model.orders.length === 0 ? (
            tableLoadingSkeleton()
          ) : model.orders.length ? (
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

      <DashboardSecondaryPanels model={model} isLoading={isInitialLoading} />
    </>
  )
}
