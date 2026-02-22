"use client"

import { useCallback, useMemo, useState } from "react"
import { PanelShell, PnlValue, SkeletonBlock, StatusBadge, Toast } from "../../../../components/ui"
import { isCriticalStatusVariant, type StatusVariant } from "../../../../components/ui/StatusBadge"
import { formatMagnitude } from "../../../../lib/formatters"
import { useSymbolPrice } from "../../../../lib/hooks/use-trade-data"
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
  pnl: 124.8,
}

export function TradeWorkspace({ symbol }: { symbol: string }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const onTransientError = useCallback((message: string) => {
    setToastMessage(`Transient API issue: ${message}`)
  }, [])
  const priceState = useSymbolPrice(symbol, onTransientError)

  const spread = useMemo(() => {
    const bestBid = Number(mockBook.bids[0][0].replaceAll(",", ""))
    const bestAsk = Number(mockBook.asks[0][0].replaceAll(",", ""))
    return bestAsk - bestBid
  }, [])

  const marketStatus: { label: string; tone: StatusVariant } = priceState.error
    ? { label: "Feed degraded", tone: "degraded" }
    : priceState.isStale
      ? { label: "Feed stale", tone: "stale" }
      : { label: "Feed live", tone: "confirmed" }

  return (
    <>
      <main className="trade-workspace-grid">
        <PanelShell
          tier="primary"
          className="trade-panel"
          title="Ticket"
          contextTag={<span className="muted">Execution · Symbol: {symbol}</span>}
          actions={null}
        >
          <OrderTicket symbol={symbol} onOrderPlaced={() => setRefreshKey((k) => k + 1)} />
        </PanelShell>

        <PanelShell
          tier="primary"
          className="trade-panel trade-depth-card"
          title="Market & Depth"
          contextTag={<span className="muted">Market · Spread: {formatMagnitude(spread)} · {marketStatus.label}</span>}
          actions={isCriticalStatusVariant(marketStatus.tone) ? <StatusBadge variant={marketStatus.tone}>{marketStatus.label}</StatusBadge> : null}
        >
          {priceState.error ? <p className="status-error">Failed to load price: {priceState.error}</p> : null}
          {priceState.isLoading ? (
            <SkeletonBlock width="14rem" height="2rem" className="trade-price-block" aria-label="Loading latest price" />
          ) : priceState.data?.price ? (
            <p className="trade-price">{priceState.data.price}</p>
          ) : (
            <p className="muted">No price found for this symbol.</p>
          )}
          <div className="trade-meta-bar">
            <span>Best Bid {mockBook.bids[0][0]}</span>
            <span>Best Ask {mockBook.asks[0][0]}</span>
          </div>
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
        </PanelShell>

        <PanelShell
          tier="primary"
          className="trade-panel"
          title="Open Orders & Position"
          contextTag={<span className="muted">Position {mockPosition.side}</span>}
          actions={null}
        >
          <div className="trade-meta-bar">
            <span>PNL <PnlValue value={mockPosition.pnl} /></span>
            <span>Size {mockPosition.size}</span>
          </div>
          <PanelShell tier="secondary" className="trade-position-card" title="Position Summary" contextTag="Risk" actions={null}>
            <div className="trade-position-grid">
              <span className="muted">Entry</span>
              <strong>{mockPosition.entry}</strong>
              <span className="muted">Liq.</span>
              <strong>{mockPosition.liq}</strong>
            </div>
          </PanelShell>

          <OpenOrdersTable refreshKey={refreshKey} />
        </PanelShell>
      </main>
      {toastMessage ? <Toast tone="warning" title="Market data" message={toastMessage} /> : null}
    </>
  )
}
