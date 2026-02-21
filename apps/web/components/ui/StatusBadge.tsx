import type { HTMLAttributes } from "react"

type StatusVariant = "neutral" | "positive" | "negative" | "warning" | "sim"

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusVariant
}

/**
 * Usage example:
 * <StatusBadge variant="sim">SIM</StatusBadge>
 * <StatusBadge variant="warning">Pending approval</StatusBadge>
 */
export function StatusBadge({ variant = "neutral", className = "", children, ...props }: StatusBadgeProps) {
  return (
    <span className={`ui-status-badge ui-status-badge--${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  )
}
