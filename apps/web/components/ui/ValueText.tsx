import type { HTMLAttributes, ReactNode } from "react"

type ValueState = "positive" | "negative" | "neutral" | "warning"

type ValueTextProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: ReactNode
  state?: ValueState
}

/**
 * Usage example:
 * <ValueText value="+12.45" state="positive" />
 * <ValueText value="-4.1" state="negative" />
 */
export function ValueText({ value, state = "neutral", className = "", ...props }: ValueTextProps) {
  return (
    <span className={`ui-value-text ui-value-text--${state} ${className}`.trim()} {...props}>
      {value}
    </span>
  )
}
