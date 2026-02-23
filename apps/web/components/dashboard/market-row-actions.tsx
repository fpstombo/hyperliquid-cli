"use client"

import Link from "next/link"
import { useState } from "react"

type MarketRowActionsProps = {
  symbol: string
}

export function MarketRowActions({ symbol }: MarketRowActionsProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(symbol)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="table-row-actions" role="group" aria-label={`Actions for ${symbol}`}>
      <button type="button" className="table-row-action" onClick={handleCopy} aria-label={`Copy ${symbol} symbol`}>
        ⧉ <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <Link href={`/trade/${encodeURIComponent(symbol)}`} className="table-row-action" aria-label={`Open ${symbol} trade view`}>
        ↗ <span>Trade</span>
      </Link>
    </div>
  )
}
