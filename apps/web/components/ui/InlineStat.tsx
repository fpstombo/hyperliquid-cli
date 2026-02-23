import type { HTMLAttributes, ReactNode } from "react"

type InlineStatProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode
  value: ReactNode
  meta?: ReactNode
  hierarchy?: "l1" | "l2" | "l3"
}

/**
 * Usage example:
 * <InlineStat
 *   label="Funding"
 *   value={<ValueText mode="signed" value={0.0045} state="positive" />}
 *   meta="8h"
 * />
 */
export function InlineStat({ label, value, meta, hierarchy = "l2", className = "", ...props }: InlineStatProps) {
  return (
    <div className={`ui-inline-stat ui-inline-stat--${hierarchy} ${className}`.trim()} {...props}>
      <span className="ui-inline-stat-label">{label}</span>
      <span className="ui-inline-stat-value">{value}</span>
      {meta ? <span className="ui-inline-stat-meta">{meta}</span> : null}
    </div>
  )
}
