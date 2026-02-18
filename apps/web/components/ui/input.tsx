import type { InputHTMLAttributes } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
}

export function Input({ id, label, hint, className = "", ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-")

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <input id={inputId} className={`input ${className}`.trim()} {...props} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}
