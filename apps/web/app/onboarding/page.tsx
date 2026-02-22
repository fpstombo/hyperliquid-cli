"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { AgentApprovalSnapshot, ApprovalState } from "../../lib/agent-state"
import { loadOnboardingContext, saveOnboardingContext } from "../../lib/agent-state"

type WizardStep = "connect" | "prerequisites" | "approve" | "ready"

function formatTime(ts?: number) {
  if (!ts) return "—"
  return new Date(ts).toLocaleTimeString()
}

export default function OnboardingPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [agentPrivateKey, setAgentPrivateKey] = useState("")
  const [agentAddress, setAgentAddress] = useState("")
  const [isTestnet, setIsTestnet] = useState(false)
  const [approvalUrl, setApprovalUrl] = useState("https://app.hyperliquid.xyz/API")
  const [record, setRecord] = useState<AgentApprovalSnapshot | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const ensureSessionContext = async () => {
    const response = await fetch("/api/auth/session", { method: "GET", cache: "no-store" })
    if (!response.ok) {
      throw new Error("Your session has expired. Re-authenticate before retrying recovery steps.")
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
        // Ignore session hydration failures and continue with manual entry.
      }
    }

    void hydrateFromSession()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const saved = loadOnboardingContext()
    if (!saved) return
    setWalletAddress(saved.walletAddress)
    setAgentAddress(saved.agentAddress)
    setIsTestnet(saved.isTestnet)
    setTermsAccepted(saved.termsAccepted)
    setBackupConfirmed(saved.backupConfirmed)

    if (saved.walletAddress && saved.agentAddress) {
      void pollAgentState(saved.walletAddress, saved.agentAddress, saved.isTestnet, saved.lastKnownState)
    }
  }, [])

  const currentStep: WizardStep = useMemo(() => {
    if (!walletAddress) return "connect"
    if (!termsAccepted || !backupConfirmed) return "prerequisites"
    if (!record || record.state === "pending" || record.state === "missing") return "approve"
    return "ready"
  }, [backupConfirmed, record, termsAccepted, walletAddress])

  async function pollAgentState(userAddress: string, apiWalletAddress: string, testnet: boolean, lastKnownState?: ApprovalState) {
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
      throw new Error(payload.error ?? "Failed to fetch approval status")
    }

    const nextRecord: AgentApprovalSnapshot = {
      userAddress,
      agentAddress: apiWalletAddress,
      state: payload.state as ApprovalState,
      validUntil: payload.validUntil,
      reason: payload.reason,
      updatedAt: payload.updatedAt,
    }

    setRecord(nextRecord)
    setStatusMessage(nextRecord.reason ?? null)

    saveOnboardingContext({
      walletAddress: userAddress,
      agentAddress: apiWalletAddress,
      isTestnet: testnet,
      termsAccepted,
      backupConfirmed,
      lastKnownState: nextRecord.state,
    })
  }

  useEffect(() => {
    if (!walletAddress || !agentAddress) return

    const interval = window.setInterval(() => {
      void pollAgentState(walletAddress, agentAddress, isTestnet, record?.state)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [walletAddress, agentAddress, isTestnet, record?.state])

  const startApproval = async () => {
    const normalizedWallet = walletAddress.trim()
    const normalizedPrivateKey = agentPrivateKey.trim()
    if (!normalizedWallet || !normalizedPrivateKey) return

    setIsChecking(true)
    setStatusMessage(null)

    try {
      await ensureSessionContext()
      const response = await fetch("/api/agent/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: normalizedWallet,
          apiPrivateKey: normalizedPrivateKey,
          isTestnet,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to validate API wallet")
      }

      setApprovalUrl(payload.approvalUrl)
      setAgentAddress(payload.apiWalletAddress ?? "")

      const nextRecord: AgentApprovalSnapshot = {
        userAddress: normalizedWallet,
        agentAddress: payload.apiWalletAddress ?? "",
        state: payload.state,
        validUntil: payload.validUntil,
        reason: payload.reason,
        updatedAt: payload.updatedAt ?? Date.now(),
      }
      setRecord(nextRecord)
      setStatusMessage(nextRecord.reason ?? null)

      saveOnboardingContext({
        walletAddress: normalizedWallet,
        agentAddress: payload.apiWalletAddress ?? "",
        isTestnet,
        termsAccepted,
        backupConfirmed,
        lastKnownState: nextRecord.state,
      })

      if (payload.state === "pending") {
        await pollAgentState(normalizedWallet, payload.apiWalletAddress, isTestnet, "pending")
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to start approval")
    } finally {
      setIsChecking(false)
      setAgentPrivateKey("")
    }
  }

  const steps: { key: WizardStep; label: string }[] = [
    { key: "connect", label: "1. Connect wallet" },
    { key: "prerequisites", label: "2. Validate prerequisites" },
    { key: "approve", label: "3. Approve agent" },
    { key: "ready", label: "4. Ready to trade" },
  ]

  const remediationByState: Record<ApprovalState, { title: string; action: string }> = {
    missing: {
      title: "No active authorization found",
      action: "Re-run validation with the intended API key, then open Hyperliquid approvals to authorize the agent.",
    },
    pending: {
      title: "Approval is pending",
      action: "Approve the agent in Hyperliquid, then use Retry status check to pull fresh lifecycle state from the server.",
    },
    active: {
      title: "Authorization is active",
      action: "Proceed to trade and monitor lifecycle status in Agent Status for expiry/revocation changes.",
    },
    expired: {
      title: "Authorization has expired",
      action: "Renew the approval expiry window in Hyperliquid and immediately run Retry status check to confirm recovery.",
    },
    revoked: {
      title: "Authorization was revoked",
      action: "Treat this as a security event: rotate API credentials, re-validate a new key, and complete approval again.",
    },
  }
  const remediation = remediationByState[record?.state ?? "missing"]

  return (
    <main className="grid">
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Agent onboarding wizard</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Complete wallet connection, prerequisite checks, and API approval before enabling live trading.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {steps.map((step) => {
            const isActive = step.key === currentStep
            const isComplete = steps.findIndex((s) => s.key === step.key) < steps.findIndex((s) => s.key === currentStep)
            return (
              <div key={step.key} className="card" style={{ borderColor: isActive ? "var(--accent-strong)" : undefined }}>
                <p style={{ margin: 0 }}>{step.label}</p>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {isActive ? "In progress" : isComplete ? "Complete" : "Pending"}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card grid">
        <h2 style={{ margin: 0 }}>Connect wallet</h2>
        <label className="grid">
          <span className="muted">Master wallet address</span>
          <input
            value={walletAddress}
            onChange={(event) => setWalletAddress(event.target.value)}
            placeholder="0x..."
            className="input"
          />
        </label>
        <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input type="checkbox" checked={isTestnet} onChange={(event) => setIsTestnet(event.target.checked)} />
          Use Hyperliquid testnet endpoints
        </label>
      </section>

      <section className="card grid">
        <h2 style={{ margin: 0 }}>Prerequisite and safety checks</h2>
        <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
          I understand this app only trades once agent approval is active.
        </label>
        <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input type="checkbox" checked={backupConfirmed} onChange={(event) => setBackupConfirmed(event.target.checked)} />
          I safely backed up my key material and will never share private keys in chat/screenshots.
        </label>
        <p className="muted" style={{ margin: 0 }}>
          Key-safety guidance: your API private key is used only for server-side validation and is never persisted in browser storage.
          Store secrets in a password manager or hardware wallet workflow, rotate compromised keys immediately, and revoke unknown
          agent authorizations from the Hyperliquid API page.
        </p>
      </section>

      <section className="card grid">
        <h2 style={{ margin: 0 }}>Approve agent</h2>
        <p className="muted" style={{ margin: 0 }}>
          Status is polled every 3 seconds from API routes backed by Hyperliquid. Open approvals and confirm the API wallet.
        </p>

        <label className="grid">
          <span className="muted">API wallet private key (used for validation only)</span>
          <input
            value={agentPrivateKey}
            onChange={(event) => setAgentPrivateKey(event.target.value)}
            placeholder="0x..."
            className="input"
            type="password"
            autoComplete="off"
          />
        </label>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="button"
            disabled={!walletAddress || !termsAccepted || !backupConfirmed || !agentPrivateKey || isChecking}
            onClick={startApproval}
          >
            {isChecking ? "Checking..." : "Validate and check approval"}
          </button>
          <a className="button secondary" href={approvalUrl} target="_blank" rel="noreferrer">
            Open Hyperliquid API approvals
          </a>
          <button
            className="button secondary"
            disabled={!walletAddress || !agentAddress}
            onClick={() => {
              void pollAgentState(walletAddress, agentAddress, isTestnet, record?.state).catch((error: unknown) => {
                setStatusMessage(error instanceof Error ? error.message : "Unable to load recovery status")
              })
            }}
          >
            Retry status check
          </button>
        </div>

        {statusMessage ? (
          <p className="muted" style={{ margin: 0 }}>
            {statusMessage}
          </p>
        ) : null}

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <p style={{ margin: 0 }}>
            <strong>Agent wallet:</strong> {agentAddress || "Not validated"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Status:</strong> {record?.state ?? "missing"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Updated:</strong> {formatTime(record?.updatedAt)}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Valid until:</strong> {record?.validUntil ? new Date(record.validUntil).toLocaleString() : "—"}
          </p>
        </div>

        <div className="card" style={{ marginTop: "0.5rem" }}>
          <p className="muted" style={{ marginTop: 0 }}>
            Recovery guidance
          </p>
          <p style={{ marginBottom: "0.35rem" }}>
            <strong>{remediation.title}</strong>
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            {remediation.action}
          </p>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Ready state</h2>
        {record?.state === "active" ? (
          <p>
            ✅ Agent is active. Continue to <Link href="/trade/BTC">trade</Link> or monitor lifecycle events on the{" "}
            <Link href="/agent-status">agent status page</Link>.
          </p>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            Finish all steps to unlock trading. Missing, pending, expired, or revoked authorizations will keep trading disabled.
          </p>
        )}
      </section>
    </main>
  )
}
