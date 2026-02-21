"use client"

import { useMemo, useState } from "react"
import { OpenOrdersTable } from "./OpenOrdersTable"
import { OrderTicket } from "./OrderTicket"

const mockBook = {
  bids: [
    ["102,301", "0.75"],
    ["102,290", "1.12"],
    ["102,287", "0.56"],
  ],
  asks: [
    ["102,320", "0.31"],
    ["102,330", "1.50"],
    ["102,339", "0.88"],
  ],
}

const mockPosition = {
  side: "Long",
  size: "0.42",
  entry: "102,145",
  liq: "98,430",
  pnl: "+124.80",
}

export function TradeWorkspace({ symbol }: { symbol: string }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const spread = useMemo(() => {
    const bestBid = Number(mockBook.bids[0][0].replaceAll(",", ""))
    const bestAsk = Number(mockBook.asks[0][0].replaceAll(",", ""))
    return (bestAsk - bestBid).toFixed(0)
  }, [])

  return (
    <main className="trade-workspace-grid">
      <section className="trade-panel trade-panel--ticket">
        <header className="trade-section-header">
          <h2>Ticket</h2>
          <div className="trade-meta-bar">
            <span className="muted">Execution</span>
            <strong>{symbol}</strong>
          </div>
        </header>
        <OrderTicket symbol={symbol} onOrderPlaced={() => setRefreshKey((k) => k + 1)} />
      </section>

      <section className="trade-panel trade-panel--market">
        <header className="trade-section-header">
          <h2>Market & Depth</h2>
          <div className="trade-meta-bar">
            <span>Spread {spread}</span>
            <span>Best Bid {mockBook.bids[0][0]}</span>
            <span>Best Ask {mockBook.asks[0][0]}</span>
          </div>
        </header>

        <div className="card trade-depth-card">
          <h3 style={{ marginTop: 0 }}>Order Book</h3>
          <div className="trade-depth-grid">
            <div>
              <h4>Bids</h4>
              {mockBook.bids.map(([price, size]) => (
                <div key={`bid-${price}`} className="trade-depth-row">
                  <span>{price}</span>
                  <span>{size}</span>
                </div>
              ))}
            </div>
            <div>
              <h4>Asks</h4>
              {mockBook.asks.map(([price, size]) => (
                <div key={`ask-${price}`} className="trade-depth-row">
                  <span>{price}</span>
                  <span>{size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="trade-panel trade-panel--orders">
        <header className="trade-section-header">
          <h2>Open Orders & Position</h2>
          <div className="trade-meta-bar">
            <span>Position {mockPosition.side}</span>
            <span>Size {mockPosition.size}</span>
            <span>PNL {mockPosition.pnl}</span>
          </div>
        </header>

        <div className="card trade-position-card">
          <h3 style={{ marginTop: 0 }}>Position Summary</h3>
          <div className="trade-position-grid">
            <span className="muted">Entry</span>
            <strong>{mockPosition.entry}</strong>
            <span className="muted">Liq.</span>
            <strong>{mockPosition.liq}</strong>
          </div>
        </div>

        <OpenOrdersTable refreshKey={refreshKey} />
      </section>
    </main>
  )
}
