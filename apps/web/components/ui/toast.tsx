type ToastTone = "info" | "success" | "warning"

type ToastProps = {
  tone?: ToastTone
  title: string
  message: string
}

export function Toast({ tone = "info", title, message }: ToastProps) {
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      <p className="toast-title">{title}</p>
      <p className="toast-message">{message}</p>
    </div>
  )
}
