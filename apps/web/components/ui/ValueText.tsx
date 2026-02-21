import type { HTMLAttributes, ReactNode } from "react"

type ValueState = "positive" | "negative" | "neutral" | "warning"
type SignDisplay = "auto" | "always" | "exceptZero" | "never"

type ValueTextProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: number | string | ReactNode
  state?: ValueState
  signDisplay?: SignDisplay
}

function formatSignedValue(value: ValueTextProps["value"], signDisplay: SignDisplay): ValueTextProps["value"] {
  if (typeof value !== "number" || signDisplay === "auto") {
    return value
  }

  if (Object.is(value, -0) || value === 0) {
    return signDisplay === "always" ? "+0" : "0"
  }

  if (signDisplay === "never") {
    return Math.abs(value).toString()
  }

  if (signDisplay === "always" || signDisplay === "exceptZero") {
    return `${value > 0 ? "+" : "-"}${Math.abs(value)}`
  }

  return value
}

/**
 * Usage example:
 * <ValueText value={12.45} state="positive" signDisplay="always" />
 * <ValueText value={-4.1} state="negative" signDisplay="exceptZero" />
 */
export function ValueText({ value, state = "neutral", signDisplay = "auto", className = "", ...props }: ValueTextProps) {
  const rendered = formatSignedValue(value, signDisplay)

  return (
    <span className={`ui-value-text ui-value-text--${state} ${className}`.trim()} {...props}>
      {rendered}
    </span>
  )
}
