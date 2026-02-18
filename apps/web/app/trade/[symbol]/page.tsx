"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { refreshApprovalState, validateTradingContext } from "../../../lib/agent-approval"

type TradePageProps = {
  params: {
    symbol: string
  }
}

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

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()
  const [walletInput, setWalletInput] = useState("")
  const [validationError, setValidationError] = useState<string | null>("Connect wallet to validate agent context")

  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshApprovalState()
      if (walletInput) {
        const result = validateTradingContext(walletInput)
        setValidationError(result.valid ? null : result.reason ?? "Agent validation failed")
      }
    }, 3000)

    return () => window.clearInterval(interval)
  }, [walletInput])

  useEffect(() => {
    if (!walletInput) {
      setValidationError("Connect wallet to validate agent context")
      return
    }

    const result = validateTradingContext(walletInput)
    setValidationError(result.valid ? null : result.reason ?? "Agent validation failed")
  }, [walletInput])

  const canTrade = Boolean(walletInput) && !validationError

  return (
    <main className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
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

      <aside className="card grid">
        <h2 style={{ marginTop: 0 }}>Order Ticket</h2>
        <label className="grid">
          <span className="muted">Connected wallet</span>
          <input className="input" placeholder="0x..." value={walletInput} onChange={(event) => setWalletInput(event.target.value)} />
        </label>

        {validationError ? (
          <div className="card" style={{ borderColor: "#ff8b8b" }}>
            <p style={{ margin: 0 }}><strong>Trading locked</strong></p>
            <p className="muted" style={{ marginBottom: 0 }}>{validationError}</p>
            <p style={{ marginBottom: 0 }}>
              Go to <Link href="/onboarding">Onboarding</Link> or <Link href="/agent-status">Agent Status</Link> for remediation.
            </p>
          </div>
        ) : (
          <div className="card" style={{ borderColor: "#7bff8a" }}>
            <p style={{ margin: 0 }}><strong>Agent context valid</strong></p>
            <p className="muted" style={{ marginBottom: 0 }}>Trading controls are enabled.</p>
          </div>
        )}

        <button className="button" disabled={!canTrade}>Submit mock order</button>
      </aside>
    </main>
  )
}
