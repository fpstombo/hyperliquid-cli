"use client"

import { FormEvent, useMemo, useState } from "react"
import { useAuth } from "../../../../components/providers"
import { PanelShell, StatusBadge } from "../../../../components/ui"

type OrderType = "market" | "limit"
type Side = "buy" | "sell"

type Props = {
  symbol: string
  onOrderPlaced: () => void
}

export function OrderTicket({ symbol, onOrderPlaced }: Props) {
  const { session } = useAuth()
  const [orderType, setOrderType] = useState<OrderType>("market")
  const [side, setSide] = useState<Side>("buy")
  const [size, setSize] = useState("0.01")
  const [price, setPrice] = useState("")
  const [tif, setTif] = useState("Gtc")
  const [slippage, setSlippage] = useState("1")
  const [reduceOnly, setReduceOnly] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const endpoint = useMemo(() => `/api/orders/${orderType}`, [orderType])
  const expectedChainId = session.environment === "mainnet" ? 42161 : 421614
  const hasChainMismatch = session.chainId !== expectedChainId

  async function submitOrder() {
    setPending(true)
    setStatus(null)
    const payload: Record<string, unknown> = {
      side,
      size,
      coin: symbol,
      reduceOnly,
    }

    if (orderType === "market") {
      payload.slippage = slippage
    } else {
      payload.price = price
      payload.tif = tif
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = (await response.json()) as { error?: string }

      if (!response.ok) {
        setStatus({ type: "error", text: json.error || "Order rejected" })
      } else {
        setStatus({ type: "success", text: "Order submitted successfully." })
        onOrderPlaced()
      }
    } catch {
      setStatus({ type: "error", text: "Unable to reach order API." })
    } finally {
      setPending(false)
      setConfirming(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (hasChainMismatch) {
      setStatus({
        type: "error",
        text: `Environment mismatch: ${session.environment} expects chain ${expectedChainId}, connected wallet is ${session.chainId}. Switch chain before submitting.`,
      })
      return
    }
    setConfirming(true)
  }

  return (
    <PanelShell className="order-ticket" title="Order Ticket">
      <StatusBadge
        variant={session.environment === "mainnet" ? "warning" : "sim"}
        role="status"
        aria-label={`Active trading environment ${session.environment.toUpperCase()} on ${session.chainName}`}
      >
        Active environment: {session.environment.toUpperCase()} ({session.chainName})
      </StatusBadge>
      {hasChainMismatch ? (
        <p className="status-error" role="status" aria-live="polite">
          Wallet chain and selected environment do not match. Order submission is blocked.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="grid">
        <label>
          Type
          <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)}>
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </label>

        <label>
          Side
          <select value={side} onChange={(e) => setSide(e.target.value as Side)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <label>
          Size
          <input value={size} onChange={(e) => setSize(e.target.value)} />
        </label>

        {orderType === "limit" ? (
          <>
            <label>
              Price
              <input value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>
            <label>
              Time in force
              <select value={tif} onChange={(e) => setTif(e.target.value)}>
                <option value="Gtc">GTC</option>
                <option value="Ioc">IOC</option>
                <option value="Alo">ALO</option>
              </select>
            </label>
          </>
        ) : (
          <label>
            Slippage (%)
            <input value={slippage} onChange={(e) => setSlippage(e.target.value)} />
          </label>
        )}

        <label className="checkbox-row">
          <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)} />
          Reduce only
        </label>

        <div className="ticket-primary-actions">
          <button type="submit" disabled={pending || hasChainMismatch}>{pending ? "Submitting..." : "Review order"}</button>
          {session.environment === "testnet" ? <StatusBadge variant="sim" role="status" aria-label="Simulation mode enabled">SIM MODE</StatusBadge> : null}
          <StatusBadge
            variant={hasChainMismatch ? "warning" : "positive"}
            role="status"
            aria-label={`Kill switch ${hasChainMismatch ? "engaged" : "ready"}`}
          >
            Kill switch {hasChainMismatch ? "engaged" : "ready"}
          </StatusBadge>
        </div>
      </form>

      {confirming ? (
        <div className="confirm-box">
          <p style={{ marginTop: 0 }}>
            Confirm {orderType} {side.toUpperCase()} {size} {symbol} on {session.environment.toUpperCase()}?
          </p>
          <div className="ticket-confirm-actions">
            <button onClick={() => void submitOrder()} disabled={pending || hasChainMismatch}>Confirm</button>
            <button onClick={() => setConfirming(false)} disabled={pending}>Edit</button>
          </div>
        </div>
      ) : null}

      {status ? (
        <p className={status.type === "error" ? "status-error" : "status-success"} role="status" aria-live="polite">
          {status.text}
        </p>
      ) : null}
    </PanelShell>
  )
}
