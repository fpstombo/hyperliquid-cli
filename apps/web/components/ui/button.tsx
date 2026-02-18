import type { ButtonHTMLAttributes } from "react"

type ButtonVariant = "primary" | "secondary" | "ghost"
type ButtonSize = "sm" | "md"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ className = "", variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`btn btn-${variant} btn-${size} ${className}`.trim()} {...props} />
}
