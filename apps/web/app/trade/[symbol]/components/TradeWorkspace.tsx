"use client"

import { useState } from "react"
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

export function TradeWorkspace({ symbol }: { symbol: string }) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <main className="grid trade-layout">
        <section className="card">
          <h1 style={{ marginTop: 0 }}>{symbol} Order Book</h1>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <h3>Bids</h3>
              {mockBook.bids.map(([price, size]) => (
                <div key={`bid-${price}`} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{price}</span>
                  <span>{size}</span>
                </div>
              ))}
            </div>
            <div>
              <h3>Asks</h3>
              {mockBook.asks.map(([price, size]) => (
                <div key={`ask-${price}`} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{price}</span>
                  <span>{size}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OrderTicket symbol={symbol} onOrderPlaced={() => setRefreshKey((k) => k + 1)} />
      </main>

      <main>
        <OpenOrdersTable refreshKey={refreshKey} />
      </main>
    </>
  )
}
