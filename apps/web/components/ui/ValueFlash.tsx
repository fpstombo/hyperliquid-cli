"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type ValueFlashProps = {
  value: string | number
  className?: string
  children?: ReactNode
}

export function ValueFlash({ value, className = "", children }: ValueFlashProps) {
  const [isActive, setIsActive] = useState(false)
  const [direction, setDirection] = useState<"up" | "down" | "neutral">("neutral")
  const previousValueRef = useRef<string | number>(value)

  useEffect(() => {
    if (previousValueRef.current === value) {
      return
    }

    if (typeof previousValueRef.current === "number" && typeof value === "number") {
      if (value > previousValueRef.current) {
        setDirection("up")
      } else if (value < previousValueRef.current) {
        setDirection("down")
      } else {
        setDirection("neutral")
      }
    } else {
      setDirection("neutral")
    }

    previousValueRef.current = value
    setIsActive(true)
    const timer = setTimeout(() => setIsActive(false), 160)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <span
      className={`value-flash ${isActive ? "value-flash--active" : ""} ${className}`.trim()}
      data-direction={direction}
    >
      {children ?? value}
    </span>
  )
}
