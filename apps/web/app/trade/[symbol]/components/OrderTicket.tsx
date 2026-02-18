"use client"

import { FormEvent, useMemo, useState } from "react"

type OrderType = "market" | "limit"
type Side = "buy" | "sell"

type Props = {
  symbol: string
  onOrderPlaced: () => void
}

export function OrderTicket({ symbol, onOrderPlaced }: Props) {
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
    setConfirming(true)
  }

  return (
    <div className="card order-ticket">
      <h2 style={{ marginTop: 0 }}>Order Ticket</h2>
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

        <button type="submit" disabled={pending}>{pending ? "Submitting..." : "Review order"}</button>
      </form>

      {confirming ? (
        <div className="confirm-box">
          <p style={{ marginTop: 0 }}>Confirm {orderType} {side.toUpperCase()} {size} {symbol}?</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => void submitOrder()} disabled={pending}>Confirm</button>
            <button onClick={() => setConfirming(false)} disabled={pending}>Edit</button>
          </div>
        </div>
      ) : null}

      {status ? <p className={status.type === "error" ? "status-error" : "status-success"}>{status.text}</p> : null}
    </div>
  )
}
