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
    <div className="grid layout-gap-2" aria-label="Loading table data">
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonBlock key={idx} height="1rem" width={idx % 2 ? "88%" : "100%"} />
      ))}
    </div>
  )
}

const positionColumns: TableColumn<DashboardPositionVm>[] = [
  { key: "market", header: "Market", minWidth: 92 },
  {
    key: "size",
    header: "Size",
    align: "right",
    width: 120,
    minWidth: 110,
    className: "table-col--numeric",
    render: (position) => <ValueFlash value={position.size} className="table-value-update">{position.size}</ValueFlash>,
  },
  {
    key: "unrealizedPnl",
    header: "PnL",
    align: "right",
    width: 130,
    minWidth: 120,
    className: "table-col--numeric",
    render: (position) => (
      <ValueFlash value={position.unrealizedPnl} className="table-value-update">
        <PnlValue value={position.unrealizedPnl} />
      </ValueFlash>
    ),
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
  {
    key: "size",
    header: "Size",
    align: "right",
    width: 110,
    minWidth: 100,
    className: "table-col--numeric",
    render: (order) => <ValueFlash value={order.size} className="table-value-update">{order.size}</ValueFlash>,
  },
  {
    key: "limitPrice",
    header: "Price",
    align: "right",
    width: 120,
    minWidth: 110,
    className: "table-col--numeric",
    render: (order) => <ValueFlash value={order.limitPrice} className="table-value-update">{order.limitPrice}</ValueFlash>,
  },
  {
    key: "timestamp",
    header: "Timestamp",
    width: 188,
    minWidth: 170,
    className: "table-col--numeric",
    render: (order) => (
      <ValueFlash value={order.timestamp ?? ""} className="table-value-update">
        {formatTimestamp(order.timestamp)}
      </ValueFlash>
    ),
  },
]

function renderEmpty(label: string) {
  return <p className="muted layout-m-0">{label}</p>
}

export function DashboardView({ model, isInitialLoading = false }: DashboardViewProps) {
  const isSim = model.status.mode === "SIM"

  return (
    <>
      <section className="dashboard-first-viewport">
        <section className="dashboard-hero-composition">
          <article className="dashboard-metric-card dashboard-metric-card--hero">
            <div className="dashboard-metric-heading">
              <p className="dashboard-metric-label">{model.metrics.equity.label}</p>
              <StatusBadge variant={isSim ? "sim" : "confirmed"} role="status" aria-label={`Mode ${model.status.mode}`}>
                {model.status.mode}
              </StatusBadge>
            </div>
            <p className="dashboard-metric-value dashboard-metric-value--hero">
              <ValueFlash value={model.metrics.equity.value}>{model.metrics.equity.value}</ValueFlash>
            </p>
            <p className="dashboard-metric-tertiary">
              {model.status.session}
              {isSim ? (
                <span className={`dashboard-status-simstate dashboard-status-simstate--${model.status.simStateTone}`} role="status" aria-label={model.status.simStateLabel}>
                  {model.status.simStateLabel}
                </span>
              ) : null}
            </p>
          </article>

          <section className="dashboard-hero-side" aria-label="Risk and status context">
            <section className="dashboard-secondary-metrics" aria-label="Secondary metrics">
              <article className="dashboard-metric-card dashboard-metric-card--supporting">
                <p className="dashboard-metric-label">{model.metrics.unrealizedPnl.label}</p>
                <p className="dashboard-metric-value">
                  <ValueFlash value={model.metrics.unrealizedPnl.rawValue ?? 0}><PnlValue value={model.metrics.unrealizedPnl.rawValue ?? 0} /></ValueFlash>
                </p>
              </article>

              <article className="dashboard-metric-card dashboard-metric-card--supporting">
                <p className="dashboard-metric-label">{model.metrics.exposure.label}</p>
                <p className="dashboard-metric-value">
                  <ValueFlash value={model.metrics.exposure.rawValue ?? 0}><ExposureValue value={model.metrics.exposure.rawValue ?? 0} /></ValueFlash>
                </p>
              </article>
            </section>

            <section className="dashboard-status-rail" aria-label="Session and system status">
              <div className="dashboard-status-item">
                <p className="dashboard-status-label">Connection</p>
                <StatusBadge variant={model.status.connectionTone}>{model.status.connection}</StatusBadge>
              </div>
              <div className="dashboard-status-item">
                <p className="dashboard-status-label">API</p>
                <StatusBadge variant={model.status.apiHealthTone}>{model.status.apiHealth}</StatusBadge>
              </div>
              <div className="dashboard-status-item">
                <p className="dashboard-status-label">Freshness</p>
                <StatusBadge variant={model.status.freshnessTone}>{model.status.freshness}</StatusBadge>
              </div>
              <p className="dashboard-status-hint muted">Updated {model.status.updatedHint}</p>
            </section>
          </section>
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
      </section>

      <DashboardSecondaryPanels model={model} isLoading={isInitialLoading} />
    </>
  )
}
