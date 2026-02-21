import type { HTMLAttributes, ReactNode } from "react"

type PanelShellProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
}

/**
 * Usage example:
 * <PanelShell title="Portfolio" subtitle="Unified account" actions={<StatusBadge variant="sim">SIM</StatusBadge>}>
 *   <InlineStat label="Equity" value={<ValueText value={15234.12} signDisplay="always" />} />
 * </PanelShell>
 */
export function PanelShell({ title, subtitle, actions, footer, className = "", children, ...props }: PanelShellProps) {
  return (
    <section className={`ui-panel-shell ${className}`.trim()} {...props}>
      {title || subtitle || actions ? (
        <header className="ui-panel-shell-header">
          <div>
            {title ? <h2 className="ui-panel-shell-title">{title}</h2> : null}
            {subtitle ? <p className="ui-panel-shell-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
      ) : null}
      {children}
      {footer ? <footer>{footer}</footer> : null}
    </section>
  )
}
