import type { HTMLAttributes } from "react"

export type StatusVariant =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "sim"
  | "stale"
  | "degraded"
  | "pending"
  | "confirmed"
  | "rejected"
  | "sim-pending"
  | "sim-confirmed"
  | "sim-rejected"

const STATUS_PRIORITY: Record<StatusVariant, number> = {
  sim: 10,
  neutral: 20,
  positive: 30,
  confirmed: 35,
  pending: 40,
  warning: 50,
  stale: 60,
  degraded: 70,
  negative: 80,
  rejected: 90,
  "sim-pending": 45,
  "sim-confirmed": 36,
  "sim-rejected": 85,
}

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusVariant
}

export function getStatusVariantPriority(variant: StatusVariant): number {
  return STATUS_PRIORITY[variant]
}

/**
 * Usage example:
 * <StatusBadge variant="sim">SIM</StatusBadge>
 * <StatusBadge variant="pending">Pending approval</StatusBadge>
 */
export function StatusBadge({ variant = "neutral", className = "", children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={`ui-status-badge ui-status-badge--${variant} ${className}`.trim()}
      data-variant={variant}
      data-priority={getStatusVariantPriority(variant)}
      {...props}
    >
      {children}
    </span>
  )
}
