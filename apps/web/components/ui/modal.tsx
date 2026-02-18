import type { ReactNode } from "react"

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children?: ReactNode
}

export function Modal({ open, title, description, children }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h3 id="modal-title" className="modal-title">
          {title}
        </h3>
        {description ? <p className="modal-description">{description}</p> : null}
        {children}
      </div>
    </div>
  )
}
