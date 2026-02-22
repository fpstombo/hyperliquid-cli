import type { HTMLAttributes, ReactNode } from "react"

type InlineStatProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode
  value: ReactNode
  meta?: ReactNode
}

/**
 * Usage example:
 * <InlineStat
 *   label="Funding"
 *   value={<ValueText mode="signed" value={0.0045} state="positive" />}
 *   meta="8h"
 * />
 */
export function InlineStat({ label, value, meta, className = "", ...props }: InlineStatProps) {
  return (
    <div className={`ui-inline-stat ${className}`.trim()} {...props}>
      <span className="ui-inline-stat-label">{label}</span>
      <span>{value}</span>
      {meta ? <span className="ui-inline-stat-meta">{meta}</span> : null}
    </div>
  )
}
