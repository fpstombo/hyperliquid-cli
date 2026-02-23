import type { HTMLAttributes } from "react"
import { formatCurrencyUsd, formatSignedValue, getDirectionIcon, getSignedValueState, parseNumber } from "../../lib/formatters"
import { ValueText } from "./ValueText"

type PnlValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: number | string
  hierarchy?: "l1" | "l2" | "l3"
}

export function PnlValue({ value, hierarchy = "l2", className = "", ...props }: PnlValueProps) {
  const amount = parseNumber(value)
  const direction = getDirectionIcon(amount)
  const state = getSignedValueState(amount)
  const rendered = formatSignedValue(amount, formatCurrencyUsd)

  return (
    <ValueText
      mode="signed"
      value={`${direction} ${rendered}`}
      state={state}
      hierarchy={hierarchy}
      className={`ui-pnl-value ${className}`.trim()}
      {...props}
    />
  )
}
