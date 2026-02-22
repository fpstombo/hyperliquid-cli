import type { HTMLAttributes, ReactNode } from "react"

type PanelShellProps = HTMLAttributes<HTMLElement> & {
  title: ReactNode
  contextTag?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
}

/**
 * Usage example:
 * <PanelShell title="Portfolio" contextTag="Unified account" actions={<StatusBadge variant="sim">SIM</StatusBadge>}>
 *   <InlineStat label="Equity" value={<ValueText mode="signed" value="+15234.12" state="positive" />} />
 * </PanelShell>
 */
export function PanelShell({ title, contextTag, actions, footer, className = "", children, ...props }: PanelShellProps) {
  return (
    <section className={`ui-panel-shell ${className}`.trim()} {...props}>
      <header className="ui-panel-shell-header">
        <h2 className="ui-panel-shell-title">{title}</h2>
        <div className="ui-panel-shell-context">{contextTag}</div>
        <div className="ui-panel-shell-actions">{actions}</div>
      </header>
      {children}
      {footer ? <footer>{footer}</footer> : null}
    </section>
  )
}
