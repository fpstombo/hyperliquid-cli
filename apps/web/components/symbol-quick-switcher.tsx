"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

const supportedSymbols = ["BTC", "ETH", "SOL", "ARB", "HYPE"]

export function SymbolQuickSwitcher() {
  const router = useRouter()
  const [symbol, setSymbol] = useState("BTC")

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = symbol.trim().toUpperCase()
    if (!normalized) {
      return
    }

    router.push(`/trade/${normalized}`)
  }

  return (
    <div className="sidebar-shortcuts" aria-label="Keyboard shortcuts and quick symbol switcher">
      <form className="sidebar-shortcuts-form" onSubmit={onSubmit}>
        <label htmlFor="global-symbol-search" className="sidebar-label">Quick symbol</label>
        <div className="sidebar-shortcuts-row">
          <input
            id="global-symbol-search"
            className="input"
            data-global-symbol-search
            aria-label="Quick symbol search"
            list="symbol-options"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="Type symbol"
          />
          <button type="submit" className="top-nav-button" aria-label="Go to symbol market">
            Go
          </button>
        </div>
        <datalist id="symbol-options">
          {supportedSymbols.map((item) => <option key={item} value={item} />)}
        </datalist>
      </form>

      <details className="inline-disclosure">
        <summary>Keyboard shortcuts</summary>
        <p className="muted">Alt+1 Dashboard · Alt+2 Trade · Alt+3 Onboarding · Alt+4 Agent Status · / focus symbol search</p>
      </details>
    </div>
  )
}
