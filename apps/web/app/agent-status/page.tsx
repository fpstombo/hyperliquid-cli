"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { AgentApprovalSnapshot, ApprovalState } from "../../lib/agent-state"
import { clearOnboardingContext, loadOnboardingContext, saveOnboardingContext } from "../../lib/agent-state"

const statusMeta: Record<ApprovalState, { label: string; color: string }> = {
  missing: { label: "Missing", color: "#8f9ac0" },
  pending: { label: "Pending", color: "#ffca72" },
  active: { label: "Active", color: "#7bff8a" },
  expired: { label: "Expired", color: "#ff8b8b" },
  revoked: { label: "Revoked", color: "#ff5f5f" },
}

export default function AgentStatusPage() {
  const [record, setRecord] = useState<AgentApprovalSnapshot | null>(null)
  const [walletAddress, setWalletAddress] = useState("")
  const [agentAddress, setAgentAddress] = useState("")
  const [isTestnet, setIsTestnet] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function fetchState(userAddress: string, apiWalletAddress: string, testnet: boolean, lastKnownState?: ApprovalState) {
    const response = await fetch("/api/agent/extra-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        userAddress,
        apiWalletAddress,
        lastKnownState,
      }),
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to fetch agent state")
    }

    const snapshot: AgentApprovalSnapshot = {
      userAddress,
      agentAddress: apiWalletAddress,
      state: payload.state,
      validUntil: payload.validUntil,
      reason: payload.reason,
      updatedAt: payload.updatedAt,
    }

    setRecord(snapshot)
    setMessage(snapshot.reason ?? null)

    saveOnboardingContext({
      walletAddress: userAddress,
      agentAddress: apiWalletAddress,
      isTestnet: testnet,
      termsAccepted: true,
      backupConfirmed: true,
      lastKnownState: snapshot.state,
    })
  }

  useEffect(() => {
    const saved = loadOnboardingContext()
    if (!saved) return

    setWalletAddress(saved.walletAddress)
    setAgentAddress(saved.agentAddress)
    setIsTestnet(saved.isTestnet)

    if (saved.walletAddress && saved.agentAddress) {
      void fetchState(saved.walletAddress, saved.agentAddress, saved.isTestnet, saved.lastKnownState)
    }
  }, [])

  useEffect(() => {
    if (!walletAddress || !agentAddress) return

    const interval = window.setInterval(() => {
      void fetchState(walletAddress, agentAddress, isTestnet, record?.state)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [walletAddress, agentAddress, isTestnet, record?.state])

  async function waitForActive() {
    if (!walletAddress || !agentAddress) return
    setIsRefreshing(true)
    setMessage("Waiting for Hyperliquid approval confirmation...")

    try {
      const response = await fetch("/api/agent/wait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletAddress,
          apiWalletAddress: agentAddress,
          isTestnet,
          pollIntervalMs: 3000,
          maxAttempts: 20,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed while waiting for approval")
      }

      await fetchState(walletAddress, agentAddress, isTestnet, payload.state)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to refresh state")
    } finally {
      setIsRefreshing(false)
    }
  }

  const state = record?.state ?? "missing"

  return (
    <main className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <section className="card grid">
        <h1 style={{ margin: 0 }}>Agent authorization status</h1>
        <p className="muted" style={{ margin: 0 }}>
          Live status is fetched from API routes backed by Hyperliquid validation and extra-agent polling.
        </p>

        <div className="card" style={{ borderColor: statusMeta[state].color }}>
          <p className="muted" style={{ marginTop: 0 }}>
            Current state
          </p>
          <h2 style={{ marginBottom: "0.4rem", color: statusMeta[state].color }}>{statusMeta[state].label}</h2>
          <p style={{ margin: 0 }}>
            Wallet: <strong>{walletAddress || "Not connected"}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Agent: <strong>{agentAddress || "Not configured"}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Valid until: <strong>{record?.validUntil ? new Date(record.validUntil).toLocaleString() : "—"}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Last update: <strong>{record?.updatedAt ? new Date(record.updatedAt).toLocaleTimeString() : "—"}</strong>
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <button
            className="button"
            onClick={() => void fetchState(walletAddress, agentAddress, isTestnet, record?.state)}
            disabled={!walletAddress || !agentAddress || isRefreshing}
          >
            Retry status check
          </button>
          <button className="button" onClick={waitForActive} disabled={!walletAddress || !agentAddress || isRefreshing}>
            {isRefreshing ? "Waiting..." : "Wait for approval"}
          </button>
          <button
            className="button secondary"
            onClick={() => {
              clearOnboardingContext()
              setRecord(null)
              setWalletAddress("")
              setAgentAddress("")
              setMessage("Cleared local onboarding metadata")
            }}
          >
            Clear local metadata
          </button>
        </div>
        {message ? (
          <p className="muted" style={{ margin: 0 }}>
            {message}
          </p>
        ) : null}
      </section>

      <aside className="card grid">
        <h2 style={{ margin: 0 }}>Remediation guide</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>
            <strong>Missing:</strong> return to onboarding and validate the API private key for the intended wallet context.
          </li>
          <li>
            <strong>Pending:</strong> complete API approval in wallet UI, then use Retry/Wait for approval for a real re-check.
          </li>
          <li>
            <strong>Expired:</strong> renew approval in Hyperliquid API page, then re-run status checks.
          </li>
          <li>
            <strong>Revoked:</strong> verify account security, rotate keys if needed, and perform a fresh onboarding validation.
          </li>
        </ul>
        <p className="muted" style={{ margin: 0 }}>
          Trading stays blocked unless the agent state is Active. Return to the onboarding wizard for guided setup.
        </p>
        <Link className="button" href="/onboarding">
          Open onboarding wizard
        </Link>
      </aside>
    </main>
  )
}
