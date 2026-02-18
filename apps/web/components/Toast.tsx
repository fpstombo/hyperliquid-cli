"use client"

type ToastProps = {
  message: string
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        background: "#1f2b4d",
        border: "1px solid #324475",
        color: "#dce7ff",
        padding: "0.75rem 1rem",
        borderRadius: 8,
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <span>{message}</span>
      <button onClick={onDismiss} style={{ background: "transparent", color: "#b5c9ff", border: 0 }}>
        Dismiss
      </button>
    </div>
  )
}
