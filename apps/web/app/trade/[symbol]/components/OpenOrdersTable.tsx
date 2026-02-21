"use client"

import { useEffect, useMemo, useState } from "react"
import { Table, type TableColumn } from "../../../../components/ui"
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

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "—"

  return new Date(timestamp).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
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

  const columns = useMemo<TableColumn<Order>[]>(
    () => [
      { key: "oid", header: "OID", minWidth: 96, className: "table-col--numeric" },
      { key: "coin", header: "Coin", minWidth: 88 },
      {
        key: "side",
        header: "Side",
        minWidth: 84,
        render: (order) => (order.side === "B" ? "Buy" : "Sell"),
      },
      {
        key: "sz",
        header: "Size",
        align: "right",
        minWidth: 110,
        width: 120,
        className: "table-col--numeric",
      },
      {
        key: "limitPx",
        header: "Price",
        align: "right",
        minWidth: 120,
        width: 140,
        className: "table-col--numeric",
      },
      {
        key: "timestamp",
        header: "Timestamp",
        minWidth: 170,
        width: 190,
        className: "table-col--numeric",
        render: (order) => formatTimestamp(order.timestamp),
      },
      {
        key: "actions",
        header: "",
        minWidth: 90,
        width: 90,
        render: (order) => (
          <button onClick={() => void cancelOrder(order)} disabled={hasEnvironmentMismatch}>
            Cancel
          </button>
        ),
      },
    ],
    [hasEnvironmentMismatch],
  )

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
      <Table
        columns={columns}
        rows={orders}
        rowKey={(order) => order.oid}
        emptyState="No open orders."
        itemCount={orders.length}
        itemSize={40}
      />
    </section>
  )
}
