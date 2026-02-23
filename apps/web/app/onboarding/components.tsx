"use client"

import type { ReactNode } from "react"

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
    <section className="card grid" style={{ gap: "0.75rem" }}>
      <div>
        <h1 style={{ margin: 0 }}>Agent onboarding wizard</h1>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          Guided setup optimized for first success in under 60 seconds.
        </p>
      </div>
      <div aria-label="Onboarding progress" style={{ display: "grid", gap: "0.45rem" }}>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          Step {Math.min(activeIndex + 1, steps.length)} of {steps.length} · {pct}% complete
        </p>
        <div style={{ width: "100%", height: 8, borderRadius: 999, background: "color-mix(in srgb, var(--surface-base) 82%, var(--border-subtle))" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, var(--accent), var(--accent-strong))",
              transition: "width 220ms ease",
            }}
          />
        </div>
      </div>
      <div className="onboarding-step-grid">
        {steps.map((step, index) => {
          const isActive = index === activeIndex
          const isComplete = index <= completeIndex
          return (
            <div key={step.key} className="card" style={{ borderColor: isActive ? "var(--accent-strong)" : undefined }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{step.shortLabel}</p>
              <p className="muted" style={{ margin: "0.2rem 0 0" }}>
                {isActive ? "In progress" : isComplete ? "Complete" : "Pending"}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ContextPreview({ title, description }: { title: string; description: string }) {
  return (
    <aside className="card" style={{ borderStyle: "dashed" }}>
      <p className="muted" style={{ marginTop: 0 }}>
        What unlocks next
      </p>
      <p style={{ margin: "0 0 0.35rem", fontWeight: 700 }}>{title}</p>
      <p className="muted" style={{ margin: 0 }}>{description}</p>
    </aside>
  )
}

export function InlineError({ children, onRecover, recoverLabel }: { children: ReactNode; onRecover?: () => void; recoverLabel?: string }) {
  return (
    <div
      className="card"
      style={{ borderColor: "color-mix(in srgb, var(--semantic-warning) 60%, var(--border))", background: "color-mix(in srgb, var(--surface-base) 90%, var(--semantic-warning) 10%)" }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Need a quick recovery?</p>
      <p style={{ margin: "0.35rem 0 0" }}>{children}</p>
      {onRecover ? (
        <button className="button secondary" style={{ marginTop: "0.6rem", minHeight: 44 }} onClick={onRecover}>
          {recoverLabel ?? "Retry"}
        </button>
      ) : null}
    </div>
  )
}

export function CompletionCelebration({ onNext }: { onNext: () => void }) {
  return (
    <section className="card celebration-shell" style={{ textAlign: "center" }}>
      <div className="celebration-dot" aria-hidden="true" />
      <h2 style={{ margin: "0.5rem 0" }}>🎉 Agent approved and ready</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        You unlocked live trade controls and real-time dashboard telemetry.
      </p>
      <button className="button" style={{ width: "100%", minHeight: 46 }} onClick={onNext}>
        Open BTC trade desk
      </button>
    </section>
  )
}
