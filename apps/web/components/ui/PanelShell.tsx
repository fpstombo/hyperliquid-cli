import type { HTMLAttributes, ReactNode } from "react"

type PanelShellProps = HTMLAttributes<HTMLElement> & {
  title: ReactNode
  contextTag?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  tier?: "primary" | "secondary" | "overlay"
}

/**
 * Usage example:
 * <PanelShell title="Portfolio" contextTag="Unified account" actions={<StatusBadge variant="sim">SIM</StatusBadge>}>
 *   <InlineStat label="Equity" value={<ValueText mode="signed" value="+15234.12" state="positive" />} />
 * </PanelShell>
 */
export function PanelShell({ title, contextTag, actions, footer, tier = "primary", className = "", children, ...props }: PanelShellProps) {
  return (
    <section className={`ui-panel-shell ui-panel-shell--${tier} ${className}`.trim()} {...props}>
      <header className="ui-panel-shell-header">
        <div className="ui-panel-shell-heading">
          <h2 className="ui-panel-shell-title">{title}</h2>
          {contextTag ? <div className="ui-panel-shell-context">{contextTag}</div> : null}
        </div>
        {actions ? <div className="ui-panel-shell-actions">{actions}</div> : null}
      </header>
      {children}
      {footer ? <footer>{footer}</footer> : null}
    </section>
  )
}
