"use client"

import { FormEvent, useMemo, useState } from "react"
import { useAuth } from "../../../../components/providers"
import { Button, Input, PanelShell, StatusBadge } from "../../../../components/ui"
import { isCriticalStatusVariant, type StatusVariant } from "../../../../components/ui/StatusBadge"

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
  const environmentTone: StatusVariant = session.environment === "mainnet" ? "warning" : "sim"
  const submitTone: StatusVariant = pending ? "pending" : "confirmed"
  const submitLabel = pending ? "Submitting" : "Ready"

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
    <PanelShell
      tier="overlay"
      className="order-ticket"
      title="Order Ticket"
      contextTag={<span className="muted">Execution · Env: {session.environment.toUpperCase()}</span>}
      actions={isCriticalStatusVariant(environmentTone) ? <StatusBadge variant={environmentTone}>{session.environment.toUpperCase()}</StatusBadge> : isCriticalStatusVariant(submitTone) ? <StatusBadge variant={submitTone}>{submitLabel}</StatusBadge> : null}
    >
      {hasChainMismatch ? (
        <p className="status-error" role="status" aria-live="polite">
          Wallet chain and selected environment do not match. Order submission is blocked.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="grid">
        <label>
          Type
          <select className="input" value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)}>
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </label>

        <label>
          Side
          <select className="input" value={side} onChange={(e) => setSide(e.target.value as Side)}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <Input label="Size" value={size} onChange={(e) => setSize(e.target.value)} />

        {orderType === "limit" ? (
          <>
            <Input label="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <label>
              Time in force
              <select className="input" value={tif} onChange={(e) => setTif(e.target.value)}>
                <option value="Gtc">GTC</option>
                <option value="Ioc">IOC</option>
                <option value="Alo">ALO</option>
              </select>
            </label>
          </>
        ) : (
          <Input label="Slippage (%)" value={slippage} onChange={(e) => setSlippage(e.target.value)} />
        )}

        <label className="checkbox-row">
          <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)} />
          Reduce only
        </label>

        <div className="ticket-primary-actions">
          <Button type="submit" disabled={pending || hasChainMismatch}>{pending ? "Submitting..." : "Review order"}</Button>
          <span className="muted">Kill switch: {hasChainMismatch ? "engaged" : "ready"}</span>
        </div>
      </form>

      {confirming ? (
        <div className="confirm-box">
          <p className="order-ticket-confirm-copy">
            Confirm {orderType} {side.toUpperCase()} {size} {symbol} on {session.environment.toUpperCase()}?
          </p>
          <div className="ticket-confirm-actions">
            <Button onClick={() => void submitOrder()} disabled={pending || hasChainMismatch}>Confirm</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>Edit</Button>
          </div>
        </div>
      ) : null}

      {status ? (
        <p className={status.type === "error" ? "status-error" : "muted"} role="status" aria-live="polite">
          {status.text}
        </p>
      ) : null}
    </PanelShell>
  )
}
