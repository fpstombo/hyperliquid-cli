"use client"

import { useMemo, useState } from "react"
import { Toast } from "./Toast"
import { useSymbolPrice, useTradeOrders } from "../lib/hooks/use-trade-data"

type TradeClientProps = {
  symbol: string
}

export function TradeClient({ symbol }: TradeClientProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const onTransientError = (message: string) => {
    setToastMessage(`Transient API issue: ${message}`)
  }

  const priceState = useSymbolPrice(symbol, onTransientError)
  const ordersState = useTradeOrders(onTransientError)

  const symbolOrders = useMemo(
    () => ordersState.data?.orders.filter((order) => order.coin.toUpperCase() === symbol) ?? [],
    [ordersState.data, symbol],
  )

  return (
    <main className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <section className="card">
        <h1 style={{ marginTop: 0 }}>{symbol} Market Snapshot</h1>

        {priceState.isLoading ? <p className="muted">Loading latest price…</p> : null}

        {priceState.error ? (
          <div>
            <p style={{ color: "#ff9ba3" }}>Failed to load price: {priceState.error}</p>
            <button onClick={() => void priceState.retry()}>Retry</button>
          </div>
        ) : null}

        {priceState.data?.price ? (
          <p style={{ fontSize: "2rem", margin: "0.4rem 0 1rem" }}>{priceState.data.price}</p>
        ) : (
          <p className="muted">No price found for this symbol.</p>
        )}

        <h3>Open Orders ({symbol})</h3>
        {ordersState.isLoading ? <p className="muted">Loading orders…</p> : null}
        {ordersState.error ? (
          <div>
            <p style={{ color: "#ff9ba3" }}>Failed to load orders: {ordersState.error}</p>
            <button onClick={() => void ordersState.retry()}>Retry</button>
          </div>
        ) : null}

        {symbolOrders.length ? (
          <div className="grid">
            {symbolOrders.map((order) => (
              <div key={order.oid} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  #{order.oid} · {order.side} · {order.sz}
                </span>
                <span>{order.limitPx}</span>
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
