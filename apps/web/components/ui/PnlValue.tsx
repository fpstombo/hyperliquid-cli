import type { HTMLAttributes } from "react"
import { formatCurrencyUsd, formatSignedValue, getDirectionIcon, getSignedValueState, parseNumber } from "../../lib/formatters"
import { ValueText } from "./ValueText"

type PnlValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: number | string
}

export function PnlValue({ value, className = "", ...props }: PnlValueProps) {
  const amount = parseNumber(value)
  const direction = getDirectionIcon(amount)
  const state = getSignedValueState(amount)
  const rendered = formatSignedValue(amount, formatCurrencyUsd)

  return (
    <ValueText value={`${direction} ${rendered}`} state={state} className={`ui-pnl-value ${className}`.trim()} {...props} />
  )
}
