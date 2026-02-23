"use client"

import type { ReactNode } from "react"
import { PanelAsyncState } from "../../components/ui"

export type OnboardingStepKey = "connect" | "prerequisites" | "approve" | "ready"

export type StepDefinition = {
  key: OnboardingStepKey
  title: string
  shortLabel: string
  hint: string
  previewTitle: string
  previewDescription: string
}

export function StepProgress({ steps, activeIndex, completeIndex }: { steps: StepDefinition[]; activeIndex: number; completeIndex: number }) {
  const pct = Math.round(((completeIndex + 1) / steps.length) * 100)
  return (
    <section className="card grid onboarding-progress-shell">
      <div>
        <h1 className="onboarding-progress-title">Agent onboarding wizard</h1>
        <p className="muted onboarding-progress-subtitle">Guided setup optimized for first success in under 60 seconds.</p>
      </div>
      <div aria-label="Onboarding progress" className="onboarding-progress-meter">
        <p className="onboarding-progress-copy">
          Step {Math.min(activeIndex + 1, steps.length)} of {steps.length} · {pct}% complete
        </p>
        <div className="onboarding-progress-track">
          <div className="onboarding-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="onboarding-step-grid">
        {steps.map((step, index) => {
          const isActive = index === activeIndex
          const isComplete = index <= completeIndex
          return (
            <div key={step.key} className={`card onboarding-step-chip${isActive ? " onboarding-step-chip--active" : ""}`}>
              <p className="onboarding-step-chip-title">{step.shortLabel}</p>
              <p className="muted onboarding-step-chip-state">{isActive ? "In progress" : isComplete ? "Complete" : "Pending"}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ContextPreview({ title, description }: { title: string; description: string }) {
  return (
    <aside className="card onboarding-context-preview">
      <p className="muted onboarding-context-preview-label">What unlocks next</p>
      <p className="onboarding-context-preview-title">{title}</p>
      <p className="muted onboarding-context-preview-copy">{description}</p>
    </aside>
  )
}

export function InlineError({ children, onRecover, recoverLabel }: { children: ReactNode; onRecover?: () => void; recoverLabel?: string }) {
  return (
    <PanelAsyncState
      state="error"
      size="default"
      icon="🔐"
      title="Session check required"
      message={typeof children === "string" ? children : "We could not verify your session yet."}
      action={
        onRecover ? (
          <button className="button secondary onboarding-inline-error-action" type="button" onClick={onRecover}>
            {recoverLabel ?? "Retry"}
          </button>
        ) : undefined
      }
    />
  )
}

export function CompletionCelebration({ onNext }: { onNext: () => void }) {
  return (
    <section className="card celebration-shell onboarding-complete-shell">
      <div className="celebration-dot" aria-hidden="true" />
      <h2 className="onboarding-complete-title">🎉 Agent approved and ready</h2>
      <p className="muted onboarding-complete-copy">You unlocked live trade controls and real-time dashboard telemetry.</p>
      <button className="button onboarding-complete-cta" onClick={onNext}>
        Open BTC trade desk
      </button>
    </section>
  )
}
