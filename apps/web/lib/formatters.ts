const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const DECIMAL_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const MAGNITUDE_SUFFIXES = ["", "K", "M", "B", "T"]

export type SignedValueState = "positive" | "negative" | "neutral"

export function parseNumber(value: string | number | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "")
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatCurrencyUsd(value: number): string {
  return USD_FORMATTER.format(value)
}

export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value)
}

export function formatMagnitude(value: number): string {
  const absolute = Math.abs(value)
  if (absolute < 1000) {
    return DECIMAL_FORMATTER.format(value)
  }

  const tier = Math.min(Math.floor(Math.log10(absolute) / 3), MAGNITUDE_SUFFIXES.length - 1)
  const scaled = value / 1000 ** tier
  return `${DECIMAL_FORMATTER.format(scaled)}${MAGNITUDE_SUFFIXES[tier]}`
}

export function getSignedValueState(value: number): SignedValueState {
  if (value > 0) return "positive"
  if (value < 0) return "negative"
  return "neutral"
}

export function getDirectionIcon(value: number): string {
  if (value > 0) return "▲"
  if (value < 0) return "▼"
  return "•"
}

export function formatSignedValue(value: number, formatter: (magnitude: number) => string): string {
  if (Object.is(value, -0) || value === 0) {
    return formatter(0)
  }

  const sign = value > 0 ? "+" : "-"
  return `${sign}${formatter(Math.abs(value))}`
}

export function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "—"

  return new Date(timestamp).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function formatTimestampHint(timestamp?: number): string {
  if (!timestamp) return "No successful update yet"

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (elapsedSeconds < 5) return "just now"
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`

  const elapsedMinutes = Math.floor(elapsedSeconds / 60)
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  return `${elapsedHours}h ago`
}
