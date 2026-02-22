"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Toast } from "./Toast"
import { useSymbolPrice, useTradeOrders } from "../lib/hooks/use-trade-data"
import { useDebouncedValue } from "../lib/hooks/use-debounced-value"
import { PanelShell } from "./ui/PanelShell"
import { StatusBadge } from "./ui/StatusBadge"
import { ValueFlash } from "./ui/ValueFlash"
import { SkeletonBlock } from "./ui/SkeletonBlock"

type TradeClientProps = {
  symbol: string
}

const SORT_HOLD_WINDOW_MS = 1200

type TradeOrder = NonNullable<ReturnType<typeof useTradeOrders>["data"]>["orders"][number]

const TradeOrderRow = memo(function TradeOrderRow({ order }: { order: TradeOrder }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>
        #{order.oid} · {order.side} · {order.sz}
      </span>
      <ValueFlash value={`${order.oid}:${order.limitPx}`}>{order.limitPx}</ValueFlash>
    </div>
  )
})

export function TradeClient({ symbol }: TradeClientProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [liveSort, setLiveSort] = useState(false)
  const [displayedOrderIds, setDisplayedOrderIds] = useState<number[]>([])
  const [lastResortAt, setLastResortAt] = useState(0)
  const debouncedSearch = useDebouncedValue(search, 300)

  const onTransientError = useCallback((message: string) => {
    setToastMessage(`Transient API issue: ${message}`)
  }, [])

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
      setLastResortAt(0)
      return
    }

    const nextOrderIds = symbolOrders.map((order) => order.oid)

    if (liveSort || displayedOrderIds.length === 0) {
      setDisplayedOrderIds(nextOrderIds)
      setLastResortAt(Date.now())
      return
    }

    const now = Date.now()
    const elapsed = now - lastResortAt
    if (elapsed >= SORT_HOLD_WINDOW_MS) {
      setDisplayedOrderIds(nextOrderIds)
      setLastResortAt(now)
      return
    }

    const holdTimer = setTimeout(() => {
      setDisplayedOrderIds(nextOrderIds)
      setLastResortAt(Date.now())
    }, SORT_HOLD_WINDOW_MS - elapsed)

    return () => clearTimeout(holdTimer)
  }, [displayedOrderIds.length, lastResortAt, liveSort, symbolOrders])

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
      <PanelShell title={`${symbol} Market Snapshot`}>
        <div className="dashboard-status-row" style={{ marginBottom: "0.5rem" }}>
          <StatusBadge variant={isStale ? "warning" : "positive"}>{isStale ? "Stale" : "Live"}</StatusBadge>
          <StatusBadge variant={priceState.error || ordersState.error ? "warning" : "positive"}>
            {priceState.error || ordersState.error ? "Degraded" : "Connected"}
          </StatusBadge>
        </div>

        {priceState.error ? (
          <div>
            <p style={{ color: "#ff9ba3" }}>Failed to load price: {priceState.error}</p>
            <button onClick={() => void priceState.retry()}>Retry</button>
          </div>
        ) : null}

        {priceState.isLoading ? (
          <SkeletonBlock width="14rem" height="2rem" style={{ margin: "0.4rem 0 1rem" }} aria-label="Loading latest price" />
        ) : priceState.data?.price ? (
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
            data-global-search
            aria-label="Search open orders"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <input type="checkbox" checked={liveSort} onChange={(event) => setLiveSort(event.target.checked)} />
            Live sorting
          </label>
        </div>
        {ordersState.error ? (
          <div>
            <p style={{ color: "#ff9ba3" }}>Failed to load orders: {ordersState.error}</p>
            <button onClick={() => void ordersState.retry()}>Retry</button>
          </div>
        ) : null}

        {ordersState.isLoading && displayedOrders.length === 0 ? (
          <div className="grid" style={{ gap: "0.5rem" }} aria-label="Loading orders">
            <SkeletonBlock height="1rem" />
            <SkeletonBlock height="1rem" width="80%" />
            <SkeletonBlock height="1rem" width="90%" />
          </div>
        ) : displayedOrders.length ? (
          <div className="grid">
            {displayedOrders.map((order) => <TradeOrderRow key={order.oid} order={order} />)}
          </div>
        ) : (
          <p className="muted">No open orders for {symbol}.</p>
        )}
      </PanelShell>

      <PanelShell title="Order Ticket">
        <p className="muted">Execution UI lands in Epic D. Live data updates every 2-5 seconds.</p>
      </PanelShell>

      {toastMessage ? <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} /> : null}
    </main>
  )
}
