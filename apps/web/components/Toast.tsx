"use client"

import { useEffect } from "react"

type ToastProps = {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4200)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return (
    <div role="status" aria-live="polite" className="ui-toast-floating">
      <span className="ui-toast-floating-message">{message}</span>
      <button onClick={onDismiss} className="ui-toast-floating-dismiss" aria-label="Dismiss notification">
        Dismiss
      </button>
    </div>
  )
}
