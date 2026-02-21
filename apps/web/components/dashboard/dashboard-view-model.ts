import type { BalancesResponse, OrdersResponse, PositionsResponse } from "../../lib/api-types"
import type { SessionState } from "../../lib/auth"

export type DashboardStatusVm = {
  session: string
  mode: string
  apiHealth: string
  apiHealthTone: "positive" | "warning"
}

export type DashboardMetricVm = {
  label: string
  value: string
}

export type DashboardPositionVm = {
  id: string
  market: string
  size: string
  unrealizedPnl: string
}

export type DashboardOrderVm = {
  id: number
  market: string
  side: string
  size: string
  limitPrice: string
}

export type DashboardSecondaryItemVm = {
  label: string
  value: string
}

export type DashboardViewModel = {
  status: DashboardStatusVm
  metrics: {
    equity: DashboardMetricVm
    unrealizedPnl: DashboardMetricVm
    exposure: DashboardMetricVm
  }
  positions: DashboardPositionVm[]
  orders: DashboardOrderVm[]
  opportunities: DashboardSecondaryItemVm[]
  intents: DashboardSecondaryItemVm[]
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value)
}

function formatSignedUsd(value: number): string {
  if (value === 0) return "$0.00"
  const formatted = formatUsd(Math.abs(value))
  return `${value > 0 ? "+" : "-"}${formatted}`
}

function summarizeBalances(balances?: BalancesResponse | null): DashboardSecondaryItemVm[] {
  if (!balances || balances.spotBalances.length === 0) {
    return [{ label: "Spot balances", value: "No balances" }]
  }

  return balances.spotBalances.slice(0, 4).map((balance) => ({
    label: balance.token,
    value: balance.total,
  }))
}

function summarizeOrderContext(orders?: OrdersResponse | null): DashboardSecondaryItemVm[] {
  if (!orders?.context) {
    return [{ label: "Order context", value: "Unavailable" }]
  }

  return [
    { label: "Environment", value: orders.context.environment },
    { label: "Account source", value: orders.context.accountSource },
    { label: "Alias", value: orders.context.accountAlias ?? "Not set" },
    { label: "User", value: orders.context.user.slice(0, 10) + "…" },
  ]
}

export function buildDashboardViewModel(params: {
  balances?: BalancesResponse | null
  positions?: PositionsResponse | null
  orders?: OrdersResponse | null
  session: SessionState
  apiHealthy: boolean
}): DashboardViewModel {
  const { balances, positions, orders, session, apiHealthy } = params

  const totalUnrealized = (positions?.positions ?? []).reduce((sum, position) => sum + parseNumber(position.unrealizedPnl), 0)
  const totalExposure = (positions?.positions ?? []).reduce(
    (sum, position) => sum + Math.abs(parseNumber(position.positionValue)),
    0,
  )

  return {
    status: {
      session: session.walletAddress ? `${session.walletAddress.slice(0, 6)}…${session.walletAddress.slice(-4)}` : "No wallet",
      mode: session.environment === "testnet" ? "SIM" : "LIVE",
      apiHealth: apiHealthy ? "Healthy" : "Degraded",
      apiHealthTone: apiHealthy ? "positive" : "warning",
    },
    metrics: {
      equity: {
        label: "Equity",
        value: formatUsd(parseNumber(positions?.accountValue ?? "0")),
      },
      unrealizedPnl: {
        label: "Unrealized PnL",
        value: formatSignedUsd(totalUnrealized),
      },
      exposure: {
        label: "Exposure",
        value: formatUsd(totalExposure),
      },
    },
    positions: (positions?.positions ?? []).map((position) => ({
      id: `${position.coin}-${position.entryPx}`,
      market: position.coin,
      size: position.size,
      unrealizedPnl: position.unrealizedPnl,
    })),
    orders: (orders?.orders ?? []).slice(0, 5).map((order) => ({
      id: order.oid,
      market: order.coin,
      side: order.side,
      size: order.sz,
      limitPrice: order.limitPx,
    })),
    opportunities: summarizeBalances(balances),
    intents: summarizeOrderContext(orders),
  }
}
