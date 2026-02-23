"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { AgentApprovalSnapshot, ApprovalState } from "../../lib/agent-state"
import { loadOnboardingContext, saveOnboardingContext } from "../../lib/agent-state"
import { CompletionCelebration, ContextPreview, InlineError, StepProgress, type OnboardingStepKey, type StepDefinition } from "./components"

function formatTime(ts?: number) {
  if (!ts) return "—"
  return new Date(ts).toLocaleTimeString()
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message
  return "Something went wrong. Retry in a moment."
}

function trackOnboardingEvent(event: string, payload: Record<string, string | number | boolean | null>) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("hyperliquid:analytics", {
      detail: {
        event,
        ts: Date.now(),
        payload,
      },
    }),
  )
}

const STEPS: StepDefinition[] = [
  {
    key: "connect",
    title: "Connect wallet",
    shortLabel: "1. Connect",
    hint: "Use the same wallet tied to your Hyperliquid account.",
    previewTitle: "Dashboard unlock preview",
    previewDescription: "Once connected, the dashboard can personalize balances, mode (SIM/LIVE), and safety reminders.",
  },
  {
    key: "prerequisites",
    title: "Safety prerequisites",
    shortLabel: "2. Safety",
    hint: "Confirm key-handling and approval intent.",
    previewTitle: "Trade guardrails preview",
    previewDescription: "Completing this step unlocks guarded order controls with clearer recovery guidance.",
  },
  {
    key: "approve",
    title: "Approve agent",
    shortLabel: "3. Approve",
    hint: "Validate the API key and approve it on Hyperliquid.",
    previewTitle: "Live trade preview",
    previewDescription: "After approval, the BTC trade desk unlocks with order entry and lifecycle monitoring.",
  },
  {
    key: "ready",
    title: "Ready to trade",
    shortLabel: "4. Launch",
    hint: "Confirm activation and move straight into your first order flow.",
    previewTitle: "Success state",
    previewDescription: "You are one tap away from the trade desk and agent-status monitoring.",
  },
]

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
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const mountedAt = useRef<number>(Date.now())

  const ensureSessionContext = async () => {
    const response = await fetch("/api/auth/session", { method: "GET", cache: "no-store" })
    if (!response.ok) {
      throw new Error("Session expired. Reconnect wallet and retry this step.")
    }

    const payload = (await response.json()) as { walletAddress?: string | null; environment?: "mainnet" | "testnet" }
    if (payload.walletAddress) {
      setWalletAddress(payload.walletAddress)
    }
    if (payload.environment) {
      setIsTestnet(payload.environment === "testnet")
    }

    setSessionError(null)
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
        setSessionError("Could not preload your session. You can continue with manual entry.")
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

  const currentStep: OnboardingStepKey = useMemo(() => {
    if (!walletAddress) return "connect"
    if (!termsAccepted || !backupConfirmed) return "prerequisites"
    if (!record || record.state === "pending" || record.state === "missing") return "approve"
    return "ready"
  }, [backupConfirmed, record, termsAccepted, walletAddress])

  const activeIndex = Math.max(
    STEPS.findIndex((step) => step.key === currentStep),
    0,
  )

  const completeIndex = useMemo(() => {
    if (currentStep === "ready") return record?.state === "active" ? STEPS.length - 1 : STEPS.length - 2
    return Math.max(activeIndex - 1, 0)
  }, [activeIndex, currentStep, record?.state])

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

    trackOnboardingEvent("onboarding_status_polled", {
      state: nextRecord.state,
      isTestnet: testnet,
    })

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
      void pollAgentState(walletAddress, agentAddress, isTestnet, record?.state).catch((error: unknown) => {
        setStatusMessage(normalizeError(error))
      })
    }, 3000)

    return () => window.clearInterval(interval)
  }, [walletAddress, agentAddress, isTestnet, record?.state])

  useEffect(() => {
    trackOnboardingEvent("onboarding_step_viewed", {
      step: currentStep,
      elapsedMs: Date.now() - mountedAt.current,
    })
  }, [currentStep])

  useEffect(() => {
    return () => {
      if (record?.state === "active") return
      trackOnboardingEvent("onboarding_abandoned", {
        lastStep: currentStep,
        elapsedMs: Date.now() - mountedAt.current,
      })
    }
  }, [currentStep, record?.state])

  const startApproval = async () => {
    const normalizedWallet = walletAddress.trim()
    const normalizedPrivateKey = agentPrivateKey.trim()
    if (!normalizedWallet) {
      setFieldError("Enter your wallet address before continuing.")
      return
    }
    if (!normalizedPrivateKey) {
      setFieldError("Paste the API wallet private key to validate approval.")
      return
    }

    setFieldError(null)
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

      trackOnboardingEvent("onboarding_validation_submitted", {
        state: nextRecord.state,
        isTestnet,
      })

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
      const message = normalizeError(error)
      setStatusMessage(message)
      if (message.toLowerCase().includes("session")) {
        setSessionError(message)
      }
    } finally {
      setIsChecking(false)
      setAgentPrivateKey("")
    }
  }

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
    <main className="grid onboarding-flow" style={{ gap: "0.9rem" }}>
      <StepProgress steps={STEPS} activeIndex={activeIndex} completeIndex={completeIndex} />
      <ContextPreview title={STEPS[activeIndex].previewTitle} description={STEPS[activeIndex].previewDescription} />

      {sessionError ? (
        <InlineError
          onRecover={() => {
            void ensureSessionContext().catch((error: unknown) => setSessionError(normalizeError(error)))
          }}
          recoverLabel="Retry session check"
        >
          {sessionError}
        </InlineError>
      ) : null}

      <section className="card grid" style={{ gap: "0.65rem" }}>
        <h2 style={{ margin: 0 }}>{STEPS[activeIndex].title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {STEPS[activeIndex].hint}
        </p>

        {currentStep === "connect" ? (
          <>
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
          </>
        ) : null}

        {currentStep === "prerequisites" ? (
          <>
            <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
              I understand this app only trades once agent approval is active.
            </label>
            <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <input type="checkbox" checked={backupConfirmed} onChange={(event) => setBackupConfirmed(event.target.checked)} />
              I safely backed up my key material and will never share private keys in chat/screenshots.
            </label>
          </>
        ) : null}

        {(currentStep === "approve" || currentStep === "ready") ? (
          <>
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

            {fieldError ? <p style={{ margin: 0, color: "var(--semantic-warning)" }}>{fieldError}</p> : null}

            <div className="onboarding-touch-buttons">
              <button
                className="button"
                style={{ minHeight: 44 }}
                disabled={!walletAddress || !termsAccepted || !backupConfirmed || !agentPrivateKey || isChecking}
                onClick={startApproval}
              >
                {isChecking ? "Checking..." : "Validate and check approval"}
              </button>
              <a className="button secondary" style={{ minHeight: 44 }} href={approvalUrl} target="_blank" rel="noreferrer">
                Open Hyperliquid API approvals
              </a>
              <button
                className="button secondary"
                style={{ minHeight: 44 }}
                disabled={!walletAddress || !agentAddress}
                onClick={() => {
                  void pollAgentState(walletAddress, agentAddress, isTestnet, record?.state).catch((error: unknown) => {
                    setStatusMessage(normalizeError(error))
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

            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
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

            <div className="card" style={{ marginTop: "0.25rem" }}>
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
          </>
        ) : null}
      </section>

      {record?.state === "active" ? (
        <CompletionCelebration onNext={() => (window.location.href = "/trade/BTC")} />
      ) : (
        <section className="card">
          <p className="muted" style={{ margin: 0 }}>
            Finish all steps to unlock trading. You can also review state transitions on <Link href="/agent-status">Agent Status</Link>.
          </p>
        </section>
      )}

      <style jsx>{`
        .onboarding-step-grid {
          display: grid;
          gap: 0.65rem;
          grid-template-columns: 1fr;
        }

        .onboarding-touch-buttons {
          display: grid;
          gap: 0.6rem;
          grid-template-columns: 1fr;
        }

        .celebration-shell {
          animation: rise-in 300ms ease-out;
        }

        .celebration-dot {
          margin: 0 auto;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--accent-strong);
          box-shadow: 0 0 0 rgba(59, 130, 246, 0.8);
          animation: ping 700ms ease-out 2;
        }

        @media (min-width: 760px) {
          .onboarding-step-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .onboarding-touch-buttons {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @keyframes ping {
          from {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.8);
          }
          to {
            box-shadow: 0 0 0 16px rgba(59, 130, 246, 0);
          }
        }

        @keyframes rise-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  )
}
