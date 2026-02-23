import type { HTMLAttributes, ReactNode } from "react"

type ValueState = "positive" | "negative" | "neutral" | "warning" | "stale" | "degraded" | "pending" | "confirmed" | "rejected"
type ValueHierarchyLevel = "l1" | "l2" | "l3"

type ValueTextSemanticProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  mode: "semantic"
  value: ReactNode
  state: ValueState
  hierarchy?: ValueHierarchyLevel
}

type ValueTextSignedProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  mode: "signed"
  value: ReactNode
  state: "positive" | "negative" | "neutral"
  hierarchy?: ValueHierarchyLevel
}

type ValueTextProps = ValueTextSemanticProps | ValueTextSignedProps

/**
 * Usage example:
 * <ValueText mode="signed" value="+12.45" state="positive" />
 * <ValueText mode="semantic" value="Awaiting fills" state="pending" />
 */
export function ValueText({ mode, value, state, hierarchy = "l2", className = "", ...props }: ValueTextProps) {
  return (
    <span className={`ui-value-text ui-value-text--${mode} ui-value-text--${state} ui-value-text--${hierarchy} ${className}`.trim()} {...props}>
      {value}
    </span>
  )
}
