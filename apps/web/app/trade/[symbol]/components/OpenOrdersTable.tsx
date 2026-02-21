"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../../../components/providers"

type Order = {
  oid: number
  coin: string
  side: string
  sz: string
  limitPx: string
  timestamp?: number
}

type Context = {
  environment: "mainnet" | "testnet"
  user: string
  accountSource: string
  accountAlias: string | null
}

type Props = {
  refreshKey: number
}

export function OpenOrdersTable({ refreshKey }: Props) {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<Context | null>(null)

  async function loadOrders() {
    try {
      const response = await fetch("/api/orders/open")
      const json = (await response.json()) as { orders?: Order[]; context?: Context; error?: string }
      if (!response.ok) {
        setError(json.error || "Failed to load open orders")
        return
      }
      setError(null)
      setOrders(json.orders || [])
      setContext(json.context || null)
    } catch {
      setError("Failed to load open orders")
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [refreshKey])

  async function cancelOrder(order: Order) {
    const snapshot = orders
    setOrders((prev) => prev.filter((o) => o.oid !== order.oid))

    try {
      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oid: String(order.oid), coin: order.coin }),
      })

      if (!response.ok) {
        const json = (await response.json()) as { error?: string }
        setError(json.error || "Failed to cancel order")
        setOrders(snapshot)
      } else {
        setError(null)
        void loadOrders()
      }
    } catch {
      setError("Failed to cancel order")
      setOrders(snapshot)
    }
  }

  const hasEnvironmentMismatch = context ? context.environment !== session.environment : false

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Open Orders</h2>
      {context ? (
        <p className="muted">
          API context: {context.environment.toUpperCase()} · {context.user} · {context.accountAlias ?? context.accountSource}
        </p>
      ) : null}
      {hasEnvironmentMismatch ? (
        <p className="status-error">
          API is serving {context?.environment.toUpperCase()} while UI is set to {session.environment.toUpperCase()}. Trading actions are blocked.
        </p>
      ) : null}
      {error ? <p className="status-error">{error}</p> : null}
      {orders.length === 0 ? (
        <p className="muted">No open orders.</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>OID</th>
              <th>Coin</th>
              <th>Side</th>
              <th>Size</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.oid}>
                <td>{order.oid}</td>
                <td>{order.coin}</td>
                <td>{order.side === "B" ? "Buy" : "Sell"}</td>
                <td>{order.sz}</td>
                <td>{order.limitPx}</td>
                <td>
                  <button onClick={() => void cancelOrder(order)} disabled={hasEnvironmentMismatch}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
