"use client"

import { useMemo, useState } from "react"
import { Toast } from "./Toast"
import { useBalances, useOrders, usePositions } from "../lib/hooks/use-dashboard-data"

export function DashboardClient() {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const onTransientError = (message: string) => {
    setToastMessage(`Transient API issue: ${message}`)
  }

  const balances = useBalances(onTransientError)
  const positions = usePositions(onTransientError)
  const orders = useOrders(onTransientError)

  const loading = balances.isLoading || positions.isLoading || orders.isLoading
  const error = balances.error ?? positions.error ?? orders.error

  const positionRows = positions.data?.positions ?? []
  const orderRows = useMemo(() => orders.data?.orders.slice(0, 5) ?? [], [orders.data])

  return (
    <main className="grid">
      <section>
        <h1 style={{ marginBottom: "0.5rem" }}>Dashboard</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Live account state with 5s polling.
        </p>
      </section>

      {loading ? <section className="card">Loading account data…</section> : null}

      {error ? (
        <section className="card">
          <p style={{ marginTop: 0, color: "#ff9ba3" }}>Failed to load data: {error}</p>
          <button onClick={() => void Promise.all([balances.retry(), positions.retry(), orders.retry()])}>Retry</button>
        </section>
      ) : null}

      <section className="grid columns-3">
        {balances.data?.spotBalances.length ? (
          balances.data.spotBalances.map((balance) => (
            <article key={balance.token} className="card">
              <p className="muted" style={{ marginTop: 0 }}>
                {balance.token}
              </p>
              <p style={{ fontSize: "1.3rem", marginBottom: 0 }}>{balance.total}</p>
            </article>
          ))
        ) : (
          <article className="card">
            <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
              No spot balances.
            </p>
          </article>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Open Positions</h2>
        {positionRows.length ? (
          <div className="grid">
            {positionRows.map((position) => (
              <div key={`${position.coin}-${position.entryPx}`} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {position.coin} · {position.size}
                </span>
                <span>{position.unrealizedPnl}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            No open positions.
          </p>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Open Orders</h2>
        {orderRows.length ? (
          <div className="grid">
            {orderRows.map((order) => (
              <div key={order.oid} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {order.coin} · {order.side} · {order.sz}
                </span>
                <span>{order.limitPx}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            No open orders.
          </p>
        )}
      </section>

      {toastMessage ? <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </main>
  )
}
