import type { HTMLAttributes, ReactNode } from "react"

type CardProps = HTMLAttributes<HTMLElement> & {
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export function Card({ title, subtitle, actions, className = "", children, ...props }: CardProps) {
  return (
    <section className={`card ${className}`.trim()} {...props}>
      {title || subtitle || actions ? (
        <header className="card-header">
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
      ) : null}
      <div>{children}</div>
    </section>
  )
}
