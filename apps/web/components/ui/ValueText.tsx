import type { HTMLAttributes, ReactNode } from "react"

type ValueState = "positive" | "negative" | "neutral" | "warning" | "stale" | "degraded" | "pending" | "confirmed" | "rejected"

type ValueTextSemanticProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  mode: "semantic"
  value: ReactNode
  state: ValueState
}

type ValueTextSignedProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  mode: "signed"
  value: ReactNode
  state: "positive" | "negative" | "neutral"
}

type ValueTextProps = ValueTextSemanticProps | ValueTextSignedProps

/**
 * Usage example:
 * <ValueText mode="signed" value="+12.45" state="positive" />
 * <ValueText mode="semantic" value="Awaiting fills" state="pending" />
 */
export function ValueText({ mode, value, state, className = "", ...props }: ValueTextProps) {
  return (
    <span className={`ui-value-text ui-value-text--${mode} ui-value-text--${state} ${className}`.trim()} {...props}>
      {value}
    </span>
  )
}
