"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Toast } from "./Toast"
import { PanelAsyncState } from "./ui"
import { useBalances, useOrders, usePositions } from "../lib/hooks/use-dashboard-data"
import { useAuth } from "./providers"
import { DashboardView } from "./dashboard/dashboard-view"
import { buildDashboardViewModel } from "../lib/hooks/dashboard-view-model"

const DASHBOARD_POLL_MS = 5000

export function DashboardLiveData() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const { session } = useAuth()

  const onTransientError = useCallback((message: string) => {
    setToastMessage(`Update failed: ${message}`)
  }, [])

  const balances = useBalances(onTransientError)
  const positions = usePositions(onTransientError)
  const orders = useOrders(onTransientError)

  const retryAll = useCallback(async () => {
    setIsRetrying(true)
    try {
      await Promise.all([balances.retry(), positions.retry(), orders.retry()])
      setToastMessage("Dashboard confirmed.")
    } finally {
      setIsRetrying(false)
    }
  }, [balances, orders, positions])

  const loading = balances.isLoading || positions.isLoading || orders.isLoading
  const error = balances.error ?? positions.error ?? orders.error
  const summaryError = balances.error
  const stale = balances.isStale || positions.isStale || orders.isStale
  const lastSuccessAt = [balances.lastSuccessAt, positions.lastSuccessAt, orders.lastSuccessAt].reduce<number | null>(
    (latest, timestamp) => {
      if (!timestamp) return latest
      return latest ? Math.max(latest, timestamp) : timestamp
    },
    null,
  )

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const model = useMemo(
    () =>
      buildDashboardViewModel({
        balances: balances.data,
        positions: positions.data,
        orders: orders.data,
        session,
        apiHealthy: !error,
        stale,
        lastSuccessAt,
        pollMs: DASHBOARD_POLL_MS,
        positionsError: positions.error,
        ordersError: orders.error,
      }),
    [balances.data, error, lastSuccessAt, orders.data, positions.data, session, stale],
  )

  return (
    <>
      <DashboardView
        model={model}
        isInitialLoading={loading}
        staleForSeconds={lastSuccessAt ? Math.floor((now - lastSuccessAt) / 1000) : null}
        isRefreshing={balances.isRefreshing || positions.isRefreshing || orders.isRefreshing}
        isRetrying={isRetrying}
        showRetryAction={(Boolean(error) || stale) && (!lastSuccessAt || now - lastSuccessAt > DASHBOARD_POLL_MS * 2)}
        onRetry={() => void retryAll()}
      />

      {summaryError ? (
        <PanelAsyncState
          state="error"
          size="compact"
          icon="📊"
          title="Dashboard update failed"
          message={`Balances update failed: ${summaryError}`}
          action={
            <button className="button secondary" type="button" onClick={() => void retryAll()} disabled={isRetrying}>
              {isRetrying ? "Retrying…" : "Retry"}
            </button>
          }
        />
      ) : null}

      {toastMessage ? <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </>
  )
}
