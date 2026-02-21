"use client"

import { useEffect, useMemo, useState } from "react"
import { Toast } from "./Toast"
import { useSymbolPrice, useTradeOrders } from "../lib/hooks/use-trade-data"
import { useDebouncedValue } from "../lib/hooks/use-debounced-value"
import { StatusBadge } from "./ui/StatusBadge"
import { ValueFlash } from "./ui/ValueFlash"

type TradeClientProps = {
  symbol: string
}

const SORT_FREEZE_WINDOW_MS = 3000

export function TradeClient({ symbol }: TradeClientProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [liveSort, setLiveSort] = useState(false)
  const [displayedOrderIds, setDisplayedOrderIds] = useState<number[]>([])
  const debouncedSearch = useDebouncedValue(search, 300)

  const onTransientError = (message: string) => {
    setToastMessage(`Transient API issue: ${message}`)
  }

  const priceState = useSymbolPrice(symbol, onTransientError)
  const ordersState = useTradeOrders(onTransientError)

  const symbolOrders = useMemo(() => {
    const normalized = debouncedSearch.trim().toLowerCase()
    const matchingOrders =
      ordersState.data?.orders.filter((order) => order.coin.toUpperCase() === symbol && (`${order.oid}`.includes(normalized) || order.side.toLowerCase().includes(normalized))) ?? []

    return [...matchingOrders].sort((a, b) => b.timestamp - a.timestamp)
  }, [debouncedSearch, ordersState.data, symbol])

  useEffect(() => {
    if (symbolOrders.length === 0) {
      setDisplayedOrderIds([])
      return
    }

    if (liveSort || displayedOrderIds.length === 0) {
      setDisplayedOrderIds(symbolOrders.map((order) => order.oid))
      return
    }

    const freezeTimer = setTimeout(() => {
      setDisplayedOrderIds(symbolOrders.map((order) => order.oid))
    }, SORT_FREEZE_WINDOW_MS)

    return () => clearTimeout(freezeTimer)
  }, [displayedOrderIds.length, liveSort, symbolOrders])

  const symbolOrdersById = useMemo(() => new Map(symbolOrders.map((order) => [order.oid, order])), [symbolOrders])
  const displayedOrders = useMemo(() => {
    if (liveSort) {
      return symbolOrders
    }

    const ordered = displayedOrderIds.map((oid) => symbolOrdersById.get(oid)).filter((order) => order !== undefined)
    const knownOrderIds = new Set(ordered.map((order) => order.oid))
    const newcomers = symbolOrders.filter((order) => !knownOrderIds.has(order.oid))
    return [...ordered, ...newcomers]
  }, [displayedOrderIds, liveSort, symbolOrders, symbolOrdersById])

  const isStale = priceState.isStale || ordersState.isStale

  return (
    <main className="grid trade-layout">
      <section className="card">
        <h1 style={{ marginTop: 0 }}>{symbol} Market Snapshot</h1>
        <div className="dashboard-status-row" style={{ marginBottom: "0.5rem" }}>
          <StatusBadge variant={isStale ? "warning" : "positive"}>{isStale ? "Stale" : "Live"}</StatusBadge>
          <StatusBadge variant={priceState.error || ordersState.error ? "warning" : "positive"}>
            {priceState.error || ordersState.error ? "Degraded" : "Connected"}
          </StatusBadge>
        </div>

        {priceState.isLoading ? <p className="muted">Loading latest price…</p> : null}

        {priceState.error ? (
          <div>
            <p style={{ color: "#ff9ba3" }}>Failed to load price: {priceState.error}</p>
            <button onClick={() => void priceState.retry()}>Retry</button>
          </div>
        ) : null}

        {priceState.data?.price ? (
          <p style={{ fontSize: "2rem", margin: "0.4rem 0 1rem" }}>
            <ValueFlash value={priceState.data.price}>{priceState.data.price}</ValueFlash>
          </p>
        ) : (
          <p className="muted">No price found for this symbol.</p>
        )}

        <h3>Open Orders ({symbol})</h3>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ maxWidth: "220px" }}
            placeholder="Search order id / side"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <input type="checkbox" checked={liveSort} onChange={(event) => setLiveSort(event.target.checked)} />
            Live sorting
          </label>
        </div>
        {ordersState.isLoading ? <p className="muted">Loading orders…</p> : null}
        {ordersState.error ? (
          <div>
            <p style={{ color: "#ff9ba3" }}>Failed to load orders: {ordersState.error}</p>
            <button onClick={() => void ordersState.retry()}>Retry</button>
          </div>
        ) : null}

        {displayedOrders.length ? (
          <div className="grid">
            {displayedOrders.map((order) => (
              <div key={order.oid} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  #{order.oid} · {order.side} · {order.sz}
                </span>
                <ValueFlash value={`${order.oid}:${order.limitPx}`}>{order.limitPx}</ValueFlash>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No open orders for {symbol}.</p>
        )}
      </section>

      <aside className="card">
        <h2 style={{ marginTop: 0 }}>Order Ticket</h2>
        <p className="muted">Execution UI lands in Epic D. Live data updates every 2-5 seconds.</p>
      </aside>

      {toastMessage ? <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </main>
  )
}
