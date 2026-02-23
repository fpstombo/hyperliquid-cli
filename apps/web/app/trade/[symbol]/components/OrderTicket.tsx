"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useAuth } from "../../../../components/providers"
import { Button, Input, PanelShell, StatusBadge } from "../../../../components/ui"
import { isCriticalStatusVariant, type StatusVariant } from "../../../../components/ui/StatusBadge"

type OrderType = "market" | "limit"
type Side = "buy" | "sell"
type ExecutionState = "idle" | "pending" | "submitted" | "confirmed" | "failed"

type Props = {
  symbol: string
  referencePrice: string
  onOrderPlaced: () => void
}

type FieldErrors = {
  size?: string
  price?: string
  leverage?: string
  slippage?: string
}

function parseNumeric(value: string): number {
  const parsed = Number(value.replaceAll(",", ""))
  return Number.isFinite(parsed) ? parsed : 0
}

export function OrderTicket({ symbol, referencePrice, onOrderPlaced }: Props) {
  const { session } = useAuth()
  const [orderType, setOrderType] = useState<OrderType>("market")
  const [side, setSide] = useState<Side>("buy")
  const [size, setSize] = useState("0.01")
  const [price, setPrice] = useState("")
  const [tif, setTif] = useState("Gtc")
  const [slippage, setSlippage] = useState("1")
  const [leverage, setLeverage] = useState("5")
  const [reduceOnly, setReduceOnly] = useState(false)
  const [pending, setPending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [executionState, setExecutionState] = useState<ExecutionState>("idle")
  const [executionTimes, setExecutionTimes] = useState<Partial<Record<Exclude<ExecutionState, "idle">, string>>>({})

  const endpoint = useMemo(() => `/api/orders/${orderType}`, [orderType])
  const expectedChainId = session.environment === "mainnet" ? 42161 : 421614
  const hasChainMismatch = session.chainId !== expectedChainId
  const environmentTone: StatusVariant = session.environment === "mainnet" ? "warning" : "sim"

  const effectivePrice = useMemo(() => {
    if (orderType === "limit") {
      return parseNumeric(price)
    }
    return parseNumeric(referencePrice)
  }, [orderType, price, referencePrice])

  const riskPreview = useMemo(() => {
    const sizeValue = parseNumeric(size)
    const leverageValue = parseNumeric(leverage)
    const notional = sizeValue * effectivePrice
    const estimatedMargin = leverageValue > 0 ? notional / leverageValue : 0
    const liquidationBuffer = leverageValue > 0 ? Math.max(0, (1 / leverageValue) * 100) : 0

    return {
      notional,
      estimatedMargin,
      liquidationBuffer,
    }
  }, [effectivePrice, leverage, size])

  const submitTone: StatusVariant =
    executionState === "failed" ? "rejected" : executionState === "confirmed" ? "confirmed" : pending ? "pending" : "neutral"
  const submitLabel =
    executionState === "failed"
      ? "Failed"
      : executionState === "confirmed"
        ? "Confirmed"
        : executionState === "submitted"
          ? "Pending"
          : pending
            ? "Pending"
            : "Ready"

  function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  function setExecutionStep(step: Exclude<ExecutionState, "idle">) {
    setExecutionState(step)
    setExecutionTimes((prev) => ({ ...prev, [step]: formatTimestamp(new Date()) }))
  }

  function validateFields(): FieldErrors {
    const nextErrors: FieldErrors = {}

    if (parseNumeric(size) <= 0) {
      nextErrors.size = "Size must be greater than zero."
    }

    if (parseNumeric(leverage) <= 0) {
      nextErrors.leverage = "Leverage must be greater than zero."
    }

    if (orderType === "limit" && parseNumeric(price) <= 0) {
      nextErrors.price = "Enter a valid limit price."
    }

    if (orderType === "market" && parseNumeric(slippage) < 0) {
      nextErrors.slippage = "Slippage cannot be negative."
    }

    return nextErrors
  }

  async function submitOrder() {
    setPending(true)
    setStatus(null)
    setExecutionStep("pending")

    const payload: Record<string, unknown> = {
      side,
      size,
      coin: symbol,
      reduceOnly,
      leverage,
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
        setExecutionStep("failed")
        setStatus({ type: "error", text: json.error || "Order failed. Review details and retry." })
      } else {
        setExecutionStep("submitted")
        setStatus({ type: "success", text: "Order sent. Pending confirmation." })
        window.setTimeout(() => {
          setExecutionStep("confirmed")
          setStatus({ type: "success", text: "Order confirmed. View it in Open Orders." })
        }, 700)
        onOrderPlaced()
      }
    } catch {
      setExecutionStep("failed")
      setStatus({ type: "error", text: "Order failed. Check your connection and retry." })
    } finally {
      setPending(false)
      setConfirming(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors = validateFields()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ type: "error", text: "Fix highlighted fields, then review your order." })
      return
    }

    if (hasChainMismatch) {
      setStatus({
        type: "error",
        text: `Switch wallet network to chain ${expectedChainId} to match ${session.environment}, then retry.`,
      })
      return
    }

    setConfirming(true)
    setExecutionState("idle")
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault()
        setShowShortcuts((prev) => !prev)
      }

      if (event.key === "Escape") {
        setShowShortcuts(false)
        setConfirming(false)
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault()
        if (confirming && !pending && !hasChainMismatch) {
          void submitOrder()
          return
        }

        if (!confirming) {
          const nextErrors = validateFields()
          setFieldErrors(nextErrors)
          if (Object.keys(nextErrors).length === 0 && !hasChainMismatch) {
            setConfirming(true)
          }
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [confirming, hasChainMismatch, pending, size, price, leverage, slippage, orderType])

  return (
    <PanelShell
      tier="overlay"
      className="order-ticket"
      title="Order Ticket"
      contextTag={<span className="muted">Execution · Env: {session.environment.toUpperCase()}</span>}
      actions={
        isCriticalStatusVariant(environmentTone) ? (
          <StatusBadge variant={environmentTone}>{session.environment.toUpperCase()}</StatusBadge>
        ) : isCriticalStatusVariant(submitTone) ? (
          <StatusBadge variant={submitTone}>{submitLabel}</StatusBadge>
        ) : null
      }
    >
      {hasChainMismatch ? (
        <p className="status-error trade-inline-error" role="status" aria-live="polite">
          Wallet network does not match this environment. Switch to chain {expectedChainId}, then retry.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="grid order-form-zones">
        <section className="order-zone order-zone-input">
          <div className="order-zone-header">
            <strong>1. Build order</strong>
            <span className="muted">Fast path: type, side, size</span>
          </div>

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

          <Input label="Size" value={size} onChange={(e) => setSize(e.target.value)} hint={fieldErrors.size || "Base units to execute"} className={fieldErrors.size ? "input-error" : ""} />

          {orderType === "limit" ? <Input label="Price" value={price} onChange={(e) => setPrice(e.target.value)} hint={fieldErrors.price || "Quote per unit"} className={fieldErrors.price ? "input-error" : ""} /> : null}

          <div className="advanced-toggle-row">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced((prev) => !prev)}>
              {showAdvanced ? "Hide" : "Show"} advanced controls
            </Button>
            <span className="shortcut-hint">Press ?</span>
          </div>

          {showAdvanced ? (
            <div className="order-advanced-panel">
              <Input
                label="Leverage"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                hint={fieldErrors.leverage || "Used for estimated margin"}
                className={fieldErrors.leverage ? "input-error" : ""}
              />

              {orderType === "limit" ? (
                <label>
                  Time in force
                  <select className="input" value={tif} onChange={(e) => setTif(e.target.value)}>
                    <option value="Gtc">GTC</option>
                    <option value="Ioc">IOC</option>
                    <option value="Alo">ALO</option>
                  </select>
                </label>
              ) : (
                <Input
                  label="Slippage (%)"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  hint={fieldErrors.slippage || "Protection for market execution"}
                  className={fieldErrors.slippage ? "input-error" : ""}
                />
              )}

              <label className="checkbox-row">
                <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)} />
                Reduce only
              </label>
            </div>
          ) : null}
        </section>

        <section className="order-zone order-zone-context">
          <div className="order-zone-header">
            <strong>2. Margin & risk preview</strong>
            <span className="muted">Updates on every edit</span>
          </div>
          <div className="risk-preview-grid">
            <span>Reference price</span>
            <strong className="numeric-fixed">{effectivePrice.toLocaleString()}</strong>
            <span>Est. notional</span>
            <strong className="numeric-fixed">{riskPreview.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
            <span>Est. margin used</span>
            <strong className="numeric-fixed">{riskPreview.estimatedMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
            <span>Approx. liq buffer</span>
            <strong className="numeric-fixed">{riskPreview.liquidationBuffer.toFixed(2)}%</strong>
          </div>
        </section>

        <section className="order-zone order-zone-confirmation">
          <div className="order-zone-header">
            <strong>3. Review & execute</strong>
            <span className="muted">Use keyboard or click actions</span>
          </div>
          <div className="ticket-primary-actions">
            <Button type="submit" disabled={pending || hasChainMismatch}>
              {pending ? "Submitting..." : "Review order"}
            </Button>
            <span className="shortcut-hint">Ctrl/Cmd + Enter</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowShortcuts(true)}>
              Shortcuts
            </Button>
          </div>

          {confirming ? (
            <div className="confirm-box">
              <p className="order-ticket-confirm-copy">
                Confirm {orderType} {side.toUpperCase()} {size} {symbol} at {orderType === "market" ? "market" : price} ({session.environment.toUpperCase()})?
              </p>
              <div className="ticket-confirm-actions">
                <Button onClick={() => void submitOrder()} disabled={pending || hasChainMismatch}>
                  Confirm
                </Button>
                <span className="shortcut-hint">Ctrl/Cmd + Enter</span>
                <Button variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
                  Edit
                </Button>
              </div>
            </div>
          ) : null}

          <div className="execution-feedback" role="status" aria-live="polite">
            <div className="execution-feedback-row">
              <span>Pending</span>
              <span>{executionTimes.pending || "--"}</span>
            </div>
            <div className="execution-feedback-row">
              <span>Pending</span>
              <span>{executionTimes.submitted || "--"}</span>
            </div>
            <div className="execution-feedback-row">
              <span>Confirmed</span>
              <span>{executionTimes.confirmed || "--"}</span>
            </div>
            <div className="execution-feedback-row">
              <span>Failed</span>
              <span>{executionTimes.failed || "--"}</span>
            </div>
          </div>

          {status ? (
            <p className={status.type === "error" ? "status-error trade-inline-error" : "status-success"} role="status" aria-live="polite">
              {status.text}
              {status.type === "error" ? (
                <>
                  {" "}
                <Button type="button" variant="ghost" size="sm" onClick={() => void submitOrder()} disabled={pending || hasChainMismatch}>
                    Retry
                </Button>
                </>
              ) : null}
            </p>
          ) : null}
        </section>
      </form>

      {showShortcuts ? (
        <div className="trade-shortcuts-overlay" role="dialog" aria-label="Keyboard shortcuts">
          <div className="trade-shortcuts-card">
            <h4>Keyboard shortcuts</h4>
            <p className="muted">Keep hands on keyboard for faster execution.</p>
            <ul>
              <li>
                <strong>Ctrl/Cmd + Enter</strong> → Review or confirm order
              </li>
              <li>
                <strong>?</strong> → Toggle shortcuts panel
              </li>
              <li>
                <strong>Esc</strong> → Close panel or confirmation state
              </li>
            </ul>
            <Button variant="secondary" onClick={() => setShowShortcuts(false)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </PanelShell>
  )
}
