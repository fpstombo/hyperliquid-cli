"use client"

import { useState } from "react"
import { Toast } from "./Toast"
import { useBalances, useOrders, usePositions } from "../lib/hooks/use-dashboard-data"
import { useAuth } from "./providers"
import { DashboardView } from "./dashboard/dashboard-view"
import { buildDashboardViewModel } from "./dashboard/dashboard-view-model"

export function DashboardClient() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { session } = useAuth()

  const onTransientError = (message: string) => {
    setToastMessage(`Transient API issue: ${message}`)
  }

  const balances = useBalances(onTransientError)
  const positions = usePositions(onTransientError)
  const orders = useOrders(onTransientError)

  const loading = balances.isLoading || positions.isLoading || orders.isLoading
  const error = balances.error ?? positions.error ?? orders.error

  const model = buildDashboardViewModel({
    balances: balances.data,
    positions: positions.data,
    orders: orders.data,
    session,
    apiHealthy: !error,
  })

  return (
    <main className="grid">
      <section>
        <h1 style={{ marginBottom: "0.5rem" }}>Dashboard</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Live account state with 5s polling.
        </p>
      </section>

      <DashboardView model={model} />

      {loading ? <section className="card">Loading account data…</section> : null}

      {error ? (
        <section className="card">
          <p style={{ marginTop: 0, color: "#ff9ba3" }}>Failed to load data: {error}</p>
          <button onClick={() => void Promise.all([balances.retry(), positions.retry(), orders.retry()])}>Retry</button>
        </section>
      ) : null}

      {toastMessage ? <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </main>
  )
}
