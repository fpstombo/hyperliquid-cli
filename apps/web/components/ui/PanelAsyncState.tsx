import type { ReactNode } from "react"

type PanelAsyncStateProps = {
  state: "loading" | "empty" | "error"
  title?: string
  message: string
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
export function PanelAsyncState({ state, title, message, action }: PanelAsyncStateProps) {
  return (
    <div className={`panel-async-state panel-async-state--${state}`} role={state === "error" ? "alert" : "status"}>
      <span className="panel-async-state__icon" aria-hidden="true">{stateGlyph(state)}</span>
      {title ? <p className="panel-async-state__title">{title}</p> : null}
      <p className="panel-async-state__message">{message}</p>
      {action ? <div className="panel-async-state__action">{action}</div> : null}
    </div>
  )
}
