import type { BalancesResponse, OrdersResponse, PositionsResponse } from "../api-types"
import type { SessionState } from "../auth"
import { formatCurrencyUsd, formatSignedValue, formatTimestampHint, getSignedValueState, parseNumber } from "../formatters"
import { formatSimStatusLabel, getSimStatusTone, type SimStatusTone } from "../sim-state"

export type DashboardStatusVm = {
  session: string
  mode: string
  apiHealth: string
  apiHealthTone: "confirmed" | "degraded"
  connection: "Connected" | "Degraded"
  connectionTone: "confirmed" | "degraded"
  freshness: "Fresh" | "Stale"
  freshnessTone: "confirmed" | "stale"
  updatedHint: string
  simStateLabel: "SIM Pending" | "SIM Confirmed" | "SIM Failed"
  simStateTone: SimStatusTone
}

export type DashboardMetricVm = {
  label: string
  value: string
  rawValue?: number
  tone?: "positive" | "negative" | "neutral"
}

export type DashboardPositionVm = {
  id: string
  market: string
  size: string
  unrealizedPnl: number
}

export type DashboardOrderVm = {
  id: number
  market: string
  side: string
  size: string
  limitPrice: string
  timestamp: number
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
  positionsError: string | null
  ordersError: string | null
  opportunities: DashboardSecondaryItemVm[]
  intents: DashboardSecondaryItemVm[]
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

function summarizeOrderContext(orders?: OrdersResponse | null, simStateLabel?: string): DashboardSecondaryItemVm[] {
  if (!orders?.context) {
    return [{ label: simStateLabel ? "SIM Order context" : "Order context", value: "Unavailable" }]
  }

  return [
    ...(simStateLabel ? [{ label: "SIM State", value: simStateLabel }] : []),
    { label: simStateLabel ? "SIM Environment" : "Environment", value: orders.context.environment },
    { label: simStateLabel ? "SIM Account source" : "Account source", value: orders.context.accountSource },
    { label: simStateLabel ? "SIM Alias" : "Alias", value: orders.context.accountAlias ?? "Not set" },
    { label: simStateLabel ? "SIM User" : "User", value: orders.context.user.slice(0, 10) + "…" },
  ]
}

function getFreshness(lastSuccessAt: number | null, pollMs: number, stale: boolean): { label: "Fresh" | "Stale"; tone: "confirmed" | "stale" } {
  if (stale || !lastSuccessAt) {
    return { label: "Stale", tone: "stale" }
  }

  const isFresh = Date.now() - lastSuccessAt <= pollMs * 3
  return isFresh ? { label: "Fresh", tone: "confirmed" } : { label: "Stale", tone: "stale" }
}

export function buildDashboardViewModel(params: {
  balances?: BalancesResponse | null
  positions?: PositionsResponse | null
  orders?: OrdersResponse | null
  session: SessionState
  apiHealthy: boolean
  stale: boolean
  lastSuccessAt: number | null
  pollMs: number
  positionsError?: string | null
  ordersError?: string | null
}): DashboardViewModel {
  const { balances, positions, orders, session, apiHealthy, stale, lastSuccessAt, pollMs, positionsError = null, ordersError = null } = params

  const totalUnrealized = (positions?.positions ?? []).reduce((sum, position) => sum + parseNumber(position.unrealizedPnl), 0)
  const totalExposure = (positions?.positions ?? []).reduce(
    (sum, position) => sum + Math.abs(parseNumber(position.positionValue)),
    0,
  )
  const freshness = getFreshness(lastSuccessAt, pollMs, stale)
  const simStatusTone = getSimStatusTone({
    isSim: session.environment === "testnet",
    apiHealthy,
    stale,
  })
  const simStateLabel = formatSimStatusLabel(simStatusTone)

  return {
    status: {
      session: session.walletAddress ? `${session.walletAddress.slice(0, 6)}…${session.walletAddress.slice(-4)}` : "No wallet",
      mode: session.environment === "testnet" ? "SIM" : "LIVE",
      apiHealth: apiHealthy ? "Healthy" : "Degraded",
      apiHealthTone: apiHealthy ? "confirmed" : "degraded",
      connection: apiHealthy ? "Connected" : "Degraded",
      connectionTone: apiHealthy ? "confirmed" : "degraded",
      freshness: freshness.label,
      freshnessTone: freshness.tone,
      updatedHint: formatTimestampHint(lastSuccessAt ?? undefined),
      simStateLabel,
      simStateTone: simStatusTone,
    },
    metrics: {
      equity: {
        label: "Equity",
        value: formatCurrencyUsd(parseNumber(positions?.accountValue ?? "0")),
      },
      unrealizedPnl: {
        label: "Unrealized PnL",
        value: formatSignedValue(totalUnrealized, formatCurrencyUsd),
        rawValue: totalUnrealized,
        tone: getSignedValueState(totalUnrealized),
      },
      exposure: {
        label: "Exposure",
        value: formatCurrencyUsd(totalExposure),
        rawValue: totalExposure,
      },
    },
    positions: (positions?.positions ?? []).map((position) => ({
      id: `${position.coin}-${position.entryPx}`,
      market: position.coin,
      size: position.size,
      unrealizedPnl: parseNumber(position.unrealizedPnl),
    })),
    positionsError,
    ordersError,
    orders: (orders?.orders ?? []).slice(0, 5).map((order) => ({
      id: order.oid,
      market: order.coin,
      side: order.side,
      size: order.sz,
      limitPrice: order.limitPx,
      timestamp: order.timestamp,
    })),
    opportunities: summarizeBalances(balances),
    intents: summarizeOrderContext(orders, session.environment === "testnet" ? simStateLabel : undefined),
  }
}
