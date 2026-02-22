"use client"

type ToastProps = {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div role="status" className="ui-toast-floating">
      <span>{message}</span>
      <button onClick={onDismiss} className="ui-toast-floating-dismiss">
        Dismiss
      </button>
    </div>
  )
}
