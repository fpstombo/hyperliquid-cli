"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  beginApproval,
  createMockAgentAddress,
  getApprovalUrl,
  refreshApprovalState,
  type AgentApprovalRecord,
} from "../../lib/agent-approval"

type WizardStep = "connect" | "prerequisites" | "approve" | "ready"

function formatTime(ts?: number) {
  if (!ts) return "—"
  return new Date(ts).toLocaleTimeString()
}

export default function OnboardingPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [agentAddress, setAgentAddress] = useState("")
  const [record, setRecord] = useState<AgentApprovalRecord | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [backupConfirmed, setBackupConfirmed] = useState(false)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRecord(refreshApprovalState())
    }, 3000)
    setRecord(refreshApprovalState())
    return () => window.clearInterval(interval)
  }, [])

  const currentStep: WizardStep = useMemo(() => {
    if (!walletAddress) return "connect"
    if (!termsAccepted || !backupConfirmed) return "prerequisites"
    if (!record || record.state === "pending") return "approve"
    return "ready"
  }, [backupConfirmed, record, termsAccepted, walletAddress])

  const startApproval = () => {
    const normalizedWallet = walletAddress.trim()
    if (!normalizedWallet) return

    const newAgent = createMockAgentAddress()
    setAgentAddress(newAgent)
    setRecord(beginApproval(normalizedWallet, newAgent))
  }

  const steps: { key: WizardStep; label: string }[] = [
    { key: "connect", label: "1. Connect wallet" },
    { key: "prerequisites", label: "2. Validate prerequisites" },
    { key: "approve", label: "3. Approve agent" },
    { key: "ready", label: "4. Ready to trade" },
  ]

  return (
    <main className="grid">
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Agent onboarding wizard</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Complete wallet connection, prerequisite checks, and agent approval before enabling live trading.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          {steps.map((step) => {
            const isActive = step.key === currentStep
            const isComplete = steps.findIndex((s) => s.key === step.key) < steps.findIndex((s) => s.key === currentStep)
            return (
              <div key={step.key} className="card" style={{ borderColor: isActive ? "#4f78ff" : undefined }}>
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
          Key-safety guidance: store secrets in a password manager or hardware wallet workflow, rotate compromised keys immediately,
          and revoke unknown agent authorizations from the Hyperliquid API page.
        </p>
      </section>

      <section className="card grid">
        <h2 style={{ margin: 0 }}>Approve agent</h2>
        <p className="muted" style={{ margin: 0 }}>
          Approval polling checks every 3 seconds and automatically advances when the API confirms authorization.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="button" disabled={!walletAddress || !termsAccepted || !backupConfirmed} onClick={startApproval}>
            Start approval request
          </button>
          <a className="button secondary" href={getApprovalUrl(false)} target="_blank" rel="noreferrer">
            Open Hyperliquid API approvals
          </a>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <p style={{ margin: 0 }}>
            <strong>Agent wallet:</strong> {agentAddress || "Not created"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Status:</strong> {record?.state ?? "missing"}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Requested:</strong> {formatTime(record?.requestedAt)}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Valid until:</strong> {record?.validUntil ? new Date(record.validUntil).toLocaleString() : "—"}
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
            Finish all steps to unlock trading. Pending, expired, or revoked authorizations will keep trading disabled.
          </p>
        )}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Epic progress</h2>
        <ul style={{ marginBottom: 0 }}>
          <li>E1: Onboarding wizard implemented (connect → prerequisites → approve → ready).</li>
          <li>E2: Approval polling and lifecycle status checks implemented.</li>
          <li>E3: Agent status + remediation paths implemented.</li>
          <li>E4: Trade validation gate implemented for active agent context only.</li>
        </ul>
      </section>
    </main>
  )
}
