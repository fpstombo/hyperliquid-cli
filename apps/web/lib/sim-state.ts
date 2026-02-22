import type { StatusVariant } from "../components/ui/StatusBadge"

export type SimStatusTone = "sim-pending" | "sim-confirmed" | "sim-rejected"

export function formatSimStatusLabel(tone: SimStatusTone): "SIM Pending" | "SIM Confirmed" | "SIM Rejected" {
  if (tone === "sim-rejected") return "SIM Rejected"
  if (tone === "sim-pending") return "SIM Pending"
  return "SIM Confirmed"
}

export function getSimStatusTone(params: {
  isSim: boolean
  apiHealthy: boolean
  stale?: boolean
  isSubmitting?: boolean
  hasChainMismatch?: boolean
}): SimStatusTone {
  const { isSim, apiHealthy, stale = false, isSubmitting = false, hasChainMismatch = false } = params

  if (!isSim || hasChainMismatch || !apiHealthy) return "sim-rejected"
  if (isSubmitting || stale) return "sim-pending"
  return "sim-confirmed"
}

export function toSimBadgeVariant(tone: SimStatusTone): StatusVariant {
  return tone
}
