import type { ReactNode } from "react"

type PanelAsyncStateProps = {
  state: "loading" | "empty" | "error"
  size?: "compact" | "default" | "full"
  title?: string
  message: string
  icon?: ReactNode
  action?: ReactNode
}

function stateGlyph(state: PanelAsyncStateProps["state"]) {
  if (state === "loading") {
    return "◌"
  }

  if (state === "error") {
    return "⚠"
  }

  return "◍"
}

/**
 * Reusable async state renderer for panel bodies.
 * Keeps loading/empty/error visuals and semantics consistent.
 */
export function PanelAsyncState({ state, size = "default", title, message, icon, action }: PanelAsyncStateProps) {
  const ariaLive = state === "error" ? "assertive" : "polite"

  return (
    <div
      className={`panel-async-state panel-async-state--${state} panel-async-state--${size}`}
      role={state === "error" ? "alert" : "status"}
      aria-live={ariaLive}
      aria-busy={state === "loading"}
    >
      <span className="panel-async-state__icon" aria-hidden="true">{icon ?? stateGlyph(state)}</span>
      {title ? <p className="panel-async-state__title">{title}</p> : null}
      <p className="panel-async-state__message">{message}</p>
      {action ? <div className="panel-async-state__action" role="group" aria-label="Async state actions">{action}</div> : null}
    </div>
  )
}
