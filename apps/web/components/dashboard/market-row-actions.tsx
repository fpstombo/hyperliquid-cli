"use client"

import Link from "next/link"
import { useState } from "react"

type MarketRowActionsProps = {
  symbol: string
}

export function MarketRowActions({ symbol }: MarketRowActionsProps) {
  const [copied, setCopied] = useState(false)
  const [copyPending, setCopyPending] = useState(false)

  async function handleCopy() {
    setCopyPending(true)
    try {
      await navigator.clipboard.writeText(symbol)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    } finally {
      setCopyPending(false)
    }
  }

  return (
    <div className="table-row-actions" role="group" aria-label={`Actions for ${symbol}`}>
      <button
        type="button"
        className="table-row-action"
        onClick={handleCopy}
        aria-label={`Copy ${symbol} symbol`}
        aria-live="polite"
        disabled={copyPending}
      >
        <span>{copied ? "Copied" : copyPending ? "Copying…" : "Copy"}</span>
      </button>
      <Link href={`/trade/${encodeURIComponent(symbol)}`} className="table-row-action" aria-label={`Open ${symbol} trade view`}>
        <span>Trade</span>
      </Link>
    </div>
  )
}
