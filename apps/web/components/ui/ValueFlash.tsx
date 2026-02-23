"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type ValueFlashProps = {
  value: string | number
  className?: string
  children?: ReactNode
  showDirectionCue?: boolean
}

export function ValueFlash({ value, className = "", children, showDirectionCue = false }: ValueFlashProps) {
  const [isActive, setIsActive] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [direction, setDirection] = useState<"up" | "down" | "neutral">("neutral")
  const previousValueRef = useRef<string | number>(value)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches)
    syncMotionPreference()
    mediaQuery.addEventListener("change", syncMotionPreference)

    return () => mediaQuery.removeEventListener("change", syncMotionPreference)
  }, [])

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

    if (prefersReducedMotion) {
      setIsActive(false)
      return
    }

    const durationToken = getComputedStyle(document.documentElement).getPropertyValue("--motion-value-update-duration").trim()
    const parsedDuration = Number.parseFloat(durationToken.replace("ms", ""))
    const flashDurationMs = Number.isFinite(parsedDuration) ? parsedDuration : 160

    setIsActive(true)
    const timer = setTimeout(() => setIsActive(false), flashDurationMs)
    return () => clearTimeout(timer)
  }, [prefersReducedMotion, value])

  return (
    <span
      className={`value-flash ${isActive ? "value-flash--active" : ""} ${showDirectionCue ? "value-flash--with-cue" : ""} ${className}`.trim()}
      data-direction={direction}
    >
      {children ?? value}
    </span>
  )
}
