"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { AgentApprovalSnapshot, ApprovalState } from "../../lib/agent-state"
import { PanelAsyncState } from "../../components/ui"
import { clearOnboardingContext, loadOnboardingContext, saveOnboardingContext } from "../../lib/agent-state"

const statusMeta: Record<ApprovalState, { label: string; color: string }> = {
  missing: { label: "Missing", color: "var(--text-muted)" },
  pending: { label: "Pending", color: "var(--semantic-warning)" },
  active: { label: "Active", color: "var(--semantic-success)" },
  expired: { label: "Expired", color: "var(--semantic-error)" },
  revoked: { label: "Revoked", color: "var(--semantic-error)" },
}

export default function AgentStatusPage() {
  const [record, setRecord] = useState<AgentApprovalSnapshot | null>(null)
  const [walletAddress, setWalletAddress] = useState("")
  const [agentAddress, setAgentAddress] = useState("")
  const [isTestnet, setIsTestnet] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const ensureSessionContext = async () => {
    const response = await fetch("/api/auth/session", { method: "GET", cache: "no-store" })
    if (!response.ok) {
      throw new Error("Authentication session is missing. Sign in again to continue remediation.")
    }

    const payload = (await response.json()) as { walletAddress?: string | null; environment?: "mainnet" | "testnet" }
    if (payload.walletAddress) {
      setWalletAddress(payload.walletAddress)
    }
    if (payload.environment) {
      setIsTestnet(payload.environment === "testnet")
    }
  }

  useEffect(() => {
    let cancelled = false

    async function hydrateFromSession() {
      try {
        const response = await fetch("/api/auth/session", { method: "GET", cache: "no-store" })
        if (!response.ok) return
        const payload = (await response.json()) as { walletAddress?: string | null; environment?: "mainnet" | "testnet" }
        if (cancelled) return

        if (payload.walletAddress) {
          setWalletAddress((current) => current || payload.walletAddress || "")
        }
        if (payload.environment) {
          setIsTestnet(payload.environment === "testnet")
        }
      } catch {
        // Ignore session hydration failures and continue with local/manual metadata.
      }
    }

    void hydrateFromSession()
    return () => {
      cancelled = true
    }
  }, [])

  async function fetchState(userAddress: string, apiWalletAddress: string, testnet: boolean, lastKnownState?: ApprovalState) {
    await ensureSessionContext()
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
      await ensureSessionContext()
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
  const remediationByState: Record<ApprovalState, { steps: string[] }> = {
    missing: {
      steps: [
        "Go to onboarding and validate the API key to bind the expected wallet pair.",
        "Open Hyperliquid approvals and create/confirm the agent authorization.",
      ],
    },
    pending: {
      steps: [
        "Complete approval in Hyperliquid wallet UI.",
        "Run Retry status check or Wait for approval to refresh lifecycle state from server routes.",
      ],
    },
    active: {
      steps: [
        "Authorization is healthy—continue trading.",
        "Keep this page open during critical sessions to catch expiration or revocation early.",
      ],
    },
    expired: {
      steps: [
        "Renew the approval expiry in Hyperliquid.",
        "Immediately rerun Retry status check to verify the server now reports Active.",
      ],
    },
    revoked: {
      steps: [
        "Pause trading and review account activity for unauthorized changes.",
        "Rotate API credentials, then re-run onboarding validation and approval with a fresh key.",
      ],
    },
  }

  return (
    <main className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <section className="card grid">
        <h1 style={{ margin: 0 }}>Agent authorization status</h1>
        <p className="muted route-context-subtitle is-visible" style={{ margin: 0 }}>
          Live status is fetched from API routes backed by Hyperliquid validation and extra-agent polling.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <label className="grid">
            <span className="muted">Master wallet address</span>
            <input
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              placeholder="0x..."
              className="input"
            />
          </label>
          <label className="grid">
            <span className="muted">Agent wallet address</span>
            <input
              value={agentAddress}
              onChange={(event) => setAgentAddress(event.target.value)}
              placeholder="0x..."
              className="input"
            />
          </label>
        </div>

        <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input type="checkbox" checked={isTestnet} onChange={(event) => setIsTestnet(event.target.checked)} />
          Use Hyperliquid testnet endpoints
        </label>

        <div className="card" style={{ borderColor: statusMeta[state].color }}>
          <p className="muted route-context-subtitle is-visible" style={{ marginTop: 0 }}>
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
            type="button"
            className="button"
            onClick={() => {
              void fetchState(walletAddress, agentAddress, isTestnet, record?.state).catch((error: unknown) => {
                setMessage(error instanceof Error ? error.message : "Unable to refresh status")
              })
            }}
            disabled={!walletAddress || !agentAddress || isRefreshing}
          >
            Retry status check
          </button>
          <button type="button" className="button" onClick={waitForActive} disabled={!walletAddress || !agentAddress || isRefreshing}>
            {isRefreshing ? "Waiting..." : "Wait for approval"}
          </button>
          <button
            type="button"
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
          <PanelAsyncState
            state={state === "active" ? "empty" : "error"}
            size="compact"
            icon={state === "active" ? "✅" : "🛡"}
            title={state === "active" ? "Authorization healthy" : "Action needed"}
            message={message}
            action={
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  void fetchState(walletAddress, agentAddress, isTestnet, record?.state).catch((error: unknown) => {
                    setMessage(error instanceof Error ? error.message : "Unable to refresh status")
                  })
                }}
                disabled={!walletAddress || !agentAddress || isRefreshing}
              >
                Retry status check
              </button>
            }
          />
        ) : null}
      </section>

      <aside className="card grid">
        <h2 style={{ margin: 0 }}>Remediation guide</h2>
        <p className="muted route-context-subtitle is-visible" style={{ margin: 0 }}>
          Server lifecycle response: <strong>{statusMeta[state].label}</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {remediationByState[state].steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <p className="muted route-context-subtitle is-visible" style={{ margin: 0 }}>
          Trading stays blocked unless the agent state is Active. Return to the onboarding wizard for guided setup.
        </p>
        <Link className="button" href="/onboarding">
          Open onboarding wizard
        </Link>
      </aside>
    </main>
  )
}
