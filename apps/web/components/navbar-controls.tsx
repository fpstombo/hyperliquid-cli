"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { shortenAddress } from "../lib/auth"
import { useAuth } from "./providers"

export function NavbarControls() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { ready, session, login, logout, connectWallet, switchEnvironment, switchChain } = useAuth()

  const nextParam = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")

  const isMainnet = session.environment === "mainnet"
  const symbolContext = pathname?.startsWith("/trade/") ? pathname.split("/")[2]?.toUpperCase() : null

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
        <span className="pill">{symbolContext ?? "Global"}</span>
      </div>

      <div className="top-nav-slot" aria-label="Session and health">
        <span className="top-nav-slot-label">Session</span>
        <span className="pill">{ready ? shortenAddress(session.walletAddress) : "Loading session…"}</span>
        <span className="pill">{session.chainName}</span>
        <span className="ok-pill">API healthy</span>
      </div>

      <div className="top-nav-slot" aria-label="Environment">
        <span className="top-nav-slot-label">Mode</span>
        <span className="sim-pill" role="status" aria-label="Simulation mode badge">SIM</span>
        {isMainnet ? <span className="warning-pill">Mainnet live</span> : <span className="ok-pill">Testnet</span>}
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
