"use client"

import { useCallback, useMemo, useState } from "react"
import { PanelAsyncState, PanelShell, PnlValue, SkeletonBlock, StatusBadge, Toast } from "../../../../components/ui"
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
          className="trade-panel trade-panel-ticket panel-header-accent"
          title="Ticket"
          contextTag={<span className="muted value-hierarchy-meta">Execution · Symbol: {symbol}</span>}
          actions={null}
        >
          <OrderTicket
            symbol={symbol}
            referencePrice={priceState.data?.price ?? mockBook.asks[0][0]}
            onOrderPlaced={() => setRefreshKey((k) => k + 1)}
          />
        </PanelShell>

        <PanelShell
          tier="primary"
          className="trade-panel trade-depth-card panel-header-accent dense-data-region"
          title="Market & Depth"
          contextTag={<span className="muted value-hierarchy-meta">Market · Spread: {formatMagnitude(spread)} · {marketStatus.label}</span>}
          actions={(
            <>
              <span className="signature-live-indicator" data-tone={marketStatus.tone} role="status" aria-label={`Market status ${marketStatus.label}`}>
                <span className="signature-live-indicator__dot" aria-hidden="true" />
                {marketStatus.tone === "confirmed" ? "Live" : "Sync"}
              </span>
              {isCriticalStatusVariant(marketStatus.tone) ? <StatusBadge variant={marketStatus.tone} showIcon>{marketStatus.label}</StatusBadge> : null}
            </>
          )}
        >
          {priceState.error ? (
            <p className="status-error trade-inline-error" role="status" aria-live="polite">
              Failed to load price: {priceState.error}. Using last known book values for preview calculations.
            </p>
          ) : null}
          {priceState.isLoading ? (
            <SkeletonBlock width="14rem" height="2rem" className="trade-price-block" aria-label="Loading latest price" />
          ) : priceState.data?.price ? (
            <p className="trade-price financial-value value-hierarchy-value">{priceState.data.price}</p>
          ) : (
            <PanelAsyncState
              state="empty"
              size="compact"
              icon="₿"
              title="Price unavailable"
              message="No live quote is available for this symbol yet."
              action={
                <button className="button secondary" type="button" onClick={() => void priceState.retry()}>
                  Retry price check
                </button>
              }
            />
          )}
          <div className="trade-meta-bar value-hierarchy value-hierarchy--l2">
            <span>Best Bid <span className="numeric-fixed">{mockBook.bids[0][0]}</span></span>
            <span>Best Ask <span className="numeric-fixed">{mockBook.asks[0][0]}</span></span>
          </div>
          <div className="trade-depth-grid dense-data-region value-hierarchy value-hierarchy--l3">
            <div>
              <h4 className="value-hierarchy-label">Bids</h4>
              {mockBook.bids.map(([price, size]) => (
                <div key={`bid-${price}`} className="trade-depth-row dense-data-row">
                  <span className="numeric-fixed">{price}</span>
                  <span className="numeric-fixed">{size}</span>
                </div>
              ))}
            </div>
            <div>
              <h4 className="value-hierarchy-label">Asks</h4>
              {mockBook.asks.map(([price, size]) => (
                <div key={`ask-${price}`} className="trade-depth-row dense-data-row">
                  <span className="numeric-fixed">{price}</span>
                  <span className="numeric-fixed">{size}</span>
                </div>
              ))}
            </div>
          </div>
        </PanelShell>

        <PanelShell
          tier="primary"
          className="trade-panel panel-header-accent dense-data-region"
          title="Open Orders & Position"
          contextTag={<span className="muted value-hierarchy-meta">Position {mockPosition.side}</span>}
          actions={null}
        >
          <div className="trade-meta-bar value-hierarchy value-hierarchy--l1">
            <span>PNL <PnlValue value={mockPosition.pnl} hierarchy="l1" /></span>
            <span>Size <span className="numeric-fixed value-hierarchy-value">{mockPosition.size}</span></span>
          </div>
          <PanelShell tier="secondary" className="trade-position-card panel-header-accent value-hierarchy value-hierarchy--l2" title="Position Summary" contextTag={<span className="value-hierarchy-meta">Risk</span>} actions={null}>
            <div className="trade-position-grid">
              <span className="muted value-hierarchy-label">Entry</span>
              <strong className="financial-value">{mockPosition.entry}</strong>
              <span className="muted value-hierarchy-label">Liq.</span>
              <strong className="financial-value">{mockPosition.liq}</strong>
            </div>
          </PanelShell>

          <OpenOrdersTable refreshKey={refreshKey} />
        </PanelShell>
      </main>
      {toastMessage ? <Toast tone="warning" title="Market data" message={toastMessage} /> : null}
    </>
  )
}
