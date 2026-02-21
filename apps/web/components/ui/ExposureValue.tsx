import type { HTMLAttributes } from "react"
import { formatCurrencyUsd, formatMagnitude, parseNumber } from "../../lib/formatters"

type ExposureTone = "low" | "medium" | "high"

type ExposureValueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: number | string
}

function getExposureTone(value: number): ExposureTone {
  if (value >= 1000000) return "high"
  if (value >= 100000) return "medium"
  return "low"
}

function getExposureGlyph(tone: ExposureTone): string {
  if (tone === "high") return "⬢"
  if (tone === "medium") return "◉"
  return "◌"
}

export function ExposureValue({ value, className = "", ...props }: ExposureValueProps) {
  const amount = Math.abs(parseNumber(value))
  const tone = getExposureTone(amount)

  return (
    <span className={`ui-exposure-value ui-exposure-value--${tone} ${className}`.trim()} {...props}>
      <span aria-hidden="true">{getExposureGlyph(tone)}</span>
      <span>{formatCurrencyUsd(amount)}</span>
      <span className="muted">({formatMagnitude(amount)})</span>
    </span>
  )
}
