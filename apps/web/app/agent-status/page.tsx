"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  clearApproval,
  recoverApproval,
  refreshApprovalState,
  revokeApproval,
  type AgentApprovalRecord,
} from "../../lib/agent-approval"

const statusMeta: Record<string, { label: string; color: string }> = {
  missing: { label: "Missing", color: "#8f9ac0" },
  pending: { label: "Pending", color: "#ffca72" },
  active: { label: "Active", color: "#7bff8a" },
  expired: { label: "Expired", color: "#ff8b8b" },
  revoked: { label: "Revoked", color: "#ff5f5f" },
}

export default function AgentStatusPage() {
  const [record, setRecord] = useState<AgentApprovalRecord | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRecord(refreshApprovalState())
    }, 3000)

    setRecord(refreshApprovalState())
    return () => window.clearInterval(interval)
  }, [])

  const state = record?.state ?? "missing"

  return (
    <main className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <section className="card grid">
        <h1 style={{ margin: 0 }}>Agent authorization status</h1>
        <p className="muted" style={{ margin: 0 }}>
          Polling every 3s for transitions from pending to active and active to expired.
        </p>

        <div className="card" style={{ borderColor: statusMeta[state].color }}>
          <p className="muted" style={{ marginTop: 0 }}>
            Current state
          </p>
          <h2 style={{ marginBottom: "0.4rem", color: statusMeta[state].color }}>{statusMeta[state].label}</h2>
          <p style={{ margin: 0 }}>
            Wallet: <strong>{record?.userAddress ?? "Not connected"}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Agent: <strong>{record?.agentAddress ?? "Not created"}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Valid until: <strong>{record?.validUntil ? new Date(record.validUntil).toLocaleString() : "—"}</strong>
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
          <button className="button" onClick={() => setRecord(revokeApproval())} disabled={!record || record.state === "revoked"}>
            Simulate revocation
          </button>
          <button className="button" onClick={() => setRecord(recoverApproval())} disabled={!record}>
            Re-approve / recover
          </button>
          <button className="button secondary" onClick={() => {
            clearApproval()
            setRecord(null)
          }}>
            Clear authorization
          </button>
        </div>
      </section>

      <aside className="card grid">
        <h2 style={{ margin: 0 }}>Remediation guide</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>
            <strong>Pending:</strong> complete API approval in wallet UI and keep this page open until status turns Active.
          </li>
          <li>
            <strong>Expired:</strong> start recovery flow to issue a fresh approval and validity window.
          </li>
          <li>
            <strong>Revoked:</strong> verify account security, rotate keys if needed, then re-approve the agent.
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
