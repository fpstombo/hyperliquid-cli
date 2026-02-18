"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useAuth } from "../../components/providers"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready, session, login, connectWallet } = useAuth()

  const nextRoute = useMemo(() => {
    const nextParam = searchParams.get("next")
    return nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard"
  }, [searchParams])

  const handleConnectAndLogin = () => {
    connectWallet()
    login()
    router.replace(nextRoute)
  }

  return (
    <main className="grid" style={{ maxWidth: 540 }}>
      <section className="card">
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Connect to Hyperliquid Web</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          This flow is wired through an app-level Privy provider wrapper, with local persistence while we wait for
          production Privy credentials.
        </p>

        <div className="grid" style={{ marginTop: "1rem" }}>
          <button className="cta" type="button" onClick={connectWallet} disabled={!ready}>
            {session.walletAddress ? "Reconnect wallet" : "Connect wallet"}
          </button>
          <button className="cta" type="button" onClick={handleConnectAndLogin} disabled={!ready}>
            Continue with wallet
          </button>
        </div>
      </section>
    </main>
  )
}
