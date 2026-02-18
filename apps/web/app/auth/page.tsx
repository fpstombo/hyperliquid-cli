"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useAuth } from "../../components/providers"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready, session, login, connectWallet } = useAuth()

  const nextRoute = useMemo(() => {
    const nextParam = searchParams.get("next")
    return nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard"
  }, [searchParams])

  const handleConnectAndLogin = async () => {
    await connectWallet()
    login()
  }

  useEffect(() => {
    if (ready && session.authenticated) {
      router.replace(nextRoute)
    }
  }, [nextRoute, ready, router, session.authenticated])

  return (
    <main className="grid" style={{ maxWidth: 540 }}>
      <section className="card">
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Connect to Hyperliquid Web</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Authentication is powered by Privy. Connect a wallet or sign in to continue.
        </p>

        <div className="grid" style={{ marginTop: "1rem" }}>
          <button className="cta" type="button" onClick={() => void connectWallet()} disabled={!ready}>
            {session.walletAddress ? "Reconnect wallet" : "Connect wallet"}
          </button>
          <button className="cta" type="button" onClick={() => void handleConnectAndLogin()} disabled={!ready}>
            Continue with Privy
          </button>
        </div>
      </section>
    </main>
  )
}
