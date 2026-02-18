"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { refreshApprovalState, validateTradingContext } from "../../../lib/agent-approval"
import { TradeWorkspace } from "./components/TradeWorkspace"
import { Button, Card, Input, Modal, Table, Toast } from "@/components/ui"

type TradePageProps = {
  params: {
    symbol: string
  }
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()
  return <TradeWorkspace symbol={symbol} />
const mockBookRows = {
  bids: [
    { id: "b1", price: "102,301", size: "0.75" },
    { id: "b2", price: "102,290", size: "1.12" },
    { id: "b3", price: "102,287", size: "0.56" },
  ],
  asks: [
    { id: "a1", price: "102,320", size: "0.31" },
    { id: "a2", price: "102,330", size: "1.50" },
    { id: "a3", price: "102,339", size: "0.88" },
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
    <div className="stack-lg">
      <section className="page-header">
        <div>
          <h1>{symbol} Trade</h1>
          <p className="muted">Mocked order book and order entry layout.</p>
        </div>
        <Button variant="secondary">Switch to depth chart</Button>
      </section>

      <section className="trade-grid">
        <Card title="Order book" subtitle={`${symbol}-PERP`} className="span-8">
          <div className="split-grid">
            <div>
              <p className="section-label">Bids</p>
              <Table
                columns={[
                  { key: "price", header: "Price" },
                  { key: "size", header: "Size", align: "right" },
                ]}
                rows={mockBookRows.bids}
              />
            </div>
            <div>
              <p className="section-label">Asks</p>
              <Table
                columns={[
                  { key: "price", header: "Price" },
                  { key: "size", header: "Size", align: "right" },
                ]}
                rows={mockBookRows.asks}
              />
            </div>
          </div>
        </Card>

        <Card title="Order ticket" subtitle="Market and limit" className="span-4">
          <form className="stack-md">
            <Input label="Side" defaultValue="Buy" readOnly />
            <Input label="Price" placeholder="102,310" />
            <Input label="Size" placeholder="0.10" hint="Min order size is mocked for now." />
            <div className="button-row">
              <Button>Place order</Button>
              <Button variant="secondary">Preview</Button>
            </div>
          </form>
          <div className="stack-md top-gap">
            <Toast tone="warning" title="Mock mode" message="Submission is disabled until API routes are wired in Slice 4." />
          </div>
        </Card>
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
      <Modal open={false} title="Order Preview" description="Preview modal primitive for future connected workflow." />
    </div>
  )
}
