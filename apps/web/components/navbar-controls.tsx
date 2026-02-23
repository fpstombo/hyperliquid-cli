"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useReducedMotion } from "../lib/hooks/use-reduced-motion"
import { shortenAddress } from "../lib/hooks/use-auth-session"
import { useAuth } from "./providers"
import { StatusBadge } from "./ui"

export function NavbarControls() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const { ready, session, login, logout, connectWallet, switchEnvironment, switchChain } = useAuth()

  const nextParam = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")

  const isMainnet = session.environment === "mainnet"
  const symbolContext = pathname?.startsWith("/trade/") ? pathname.split("/")[2]?.toUpperCase() : "Global"
  const [activeSymbolContext, setActiveSymbolContext] = useState(symbolContext)
  const [isSymbolVisible, setIsSymbolVisible] = useState(true)

  useEffect(() => {
    if (prefersReducedMotion) {
      setActiveSymbolContext(symbolContext)
      setIsSymbolVisible(true)
      return
    }

    setIsSymbolVisible(false)
    const timeout = window.setTimeout(() => {
      setActiveSymbolContext(symbolContext)
      setIsSymbolVisible(true)
    }, 80)

    return () => window.clearTimeout(timeout)
  }, [prefersReducedMotion, symbolContext])

  const handleLogin = () => {
    login()
    router.push("/dashboard")
  }

  const handleLogout = () => {
    logout()
    router.push(`/auth?next=${encodeURIComponent(nextParam)}`)
  }

  return (
    <div className="top-nav-controls">
      <div className="top-nav-slot" aria-label="Symbol context">
        <span className="top-nav-slot-label">Symbol</span>
        <span className={`top-nav-symbol ${isSymbolVisible ? "is-visible" : ""}`}>
          <StatusBadge variant="neutral">{activeSymbolContext}</StatusBadge>
        </span>
      </div>

      <div className="top-nav-slot" aria-label="Session and health">
        <span className="top-nav-slot-label">Session</span>
        <StatusBadge variant="neutral">{ready ? shortenAddress(session.walletAddress) : "Loading session…"}</StatusBadge>
        <StatusBadge variant="neutral">{session.chainName}</StatusBadge>
        <StatusBadge variant="positive">API healthy</StatusBadge>
      </div>

      <div className="top-nav-slot" aria-label="Environment">
        <span className="top-nav-slot-label">Mode</span>
        <StatusBadge variant="sim" role="status" aria-label="Simulation mode badge">SIM</StatusBadge>
        {isMainnet ? <StatusBadge variant="warning">Mainnet live</StatusBadge> : <StatusBadge variant="positive">Testnet</StatusBadge>}
      </div>

      <div className="top-nav-actions">
        <button className="top-nav-button" onClick={() => void switchChain()} type="button">
          Switch chain
        </button>
        <button className="top-nav-button" onClick={() => switchEnvironment(isMainnet ? "testnet" : "mainnet")} type="button">
          {isMainnet ? "Use testnet" : "Use mainnet"}
        </button>
        <button className="top-nav-button" onClick={() => void connectWallet()} type="button">
          Connect wallet
        </button>
        {session.authenticated ? (
          <button className="top-nav-button" onClick={handleLogout} type="button">
            Logout
          </button>
        ) : (
          <>
            <button className="top-nav-button" onClick={handleLogin} type="button">
              Login
            </button>
            <Link className="muted top-nav-auth-link" href={`/auth?next=${encodeURIComponent(nextParam)}`}>
              Auth flow
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
