"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { shortenAddress } from "../lib/auth"
import { useAuth } from "./providers"

const buttonStyle: CSSProperties = {
  border: "1px solid #3a4a78",
  borderRadius: "0.6rem",
  background: "#101628",
  color: "#e5ecff",
  padding: "0.35rem 0.65rem",
  fontSize: "0.85rem",
  cursor: "pointer",
}

export function NavbarControls() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { ready, session, login, logout, connectWallet, switchEnvironment, switchChain } = useAuth()

  const nextParam = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")

  const isMainnet = session.environment === "mainnet"

  const handleLogin = () => {
    login()
    router.push("/dashboard")
  }

  const handleLogout = () => {
    logout()
    router.push(`/auth?next=${encodeURIComponent(nextParam)}`)
  }

  return (
    <div style={{ marginLeft: "auto", display: "flex", gap: "0.55rem", alignItems: "center", flexWrap: "wrap" }}>
      <span className="pill">{ready ? shortenAddress(session.walletAddress) : "Loading session…"}</span>
      <span className="pill">{session.chainName}</span>
      <button style={buttonStyle} onClick={() => switchChain()} type="button">
        Switch chain
      </button>
      <button style={buttonStyle} onClick={() => switchEnvironment(isMainnet ? "testnet" : "mainnet")} type="button">
        {isMainnet ? "Use testnet" : "Use mainnet"}
      </button>
      {isMainnet ? <span className="warning-pill">Mainnet is live. Double-check every order.</span> : <span className="ok-pill">Testnet mode</span>}
      <button style={buttonStyle} onClick={connectWallet} type="button">
        Connect wallet
      </button>
      {session.authenticated ? (
        <button style={buttonStyle} onClick={handleLogout} type="button">
          Logout
        </button>
      ) : (
        <>
          <button style={buttonStyle} onClick={handleLogin} type="button">
            Login
          </button>
          <Link className="muted" href={`/auth?next=${encodeURIComponent(nextParam)}`}>
            Auth flow
          </Link>
        </>
      )}
    </div>
  )
}
