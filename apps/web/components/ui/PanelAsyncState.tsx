import type { ReactNode } from "react"

type PanelAsyncStateProps = {
  state: "loading" | "empty" | "error"
  title?: string
  message: string
  action?: ReactNode
}

/**
 * Reusable async state renderer for panel bodies.
 * Keeps loading/empty/error visuals and semantics consistent.
 */
export function PanelAsyncState({ state, title, message, action }: PanelAsyncStateProps) {
  return (
    <div className={`panel-async-state panel-async-state--${state}`} role={state === "error" ? "alert" : "status"}>
      {title ? <p className="panel-async-state__title">{title}</p> : null}
      <p className="panel-async-state__message">{message}</p>
      {action ? <div className="panel-async-state__action">{action}</div> : null}
    </div>
  )
}

