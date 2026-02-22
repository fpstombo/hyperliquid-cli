"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type ValueFlashProps = {
  value: string | number
  className?: string
  children?: ReactNode
}

export function ValueFlash({ value, className = "", children }: ValueFlashProps) {
  const [isActive, setIsActive] = useState(false)
  const previousValueRef = useRef<string | number>(value)

  useEffect(() => {
    if (previousValueRef.current === value) {
      return
    }

    previousValueRef.current = value
    setIsActive(true)
    const timer = setTimeout(() => setIsActive(false), 220)
    return () => clearTimeout(timer)
  }, [value])

  return <span className={`value-flash ${isActive ? "value-flash--active" : ""} ${className}`.trim()}>{children ?? value}</span>
}
