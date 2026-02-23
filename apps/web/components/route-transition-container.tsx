"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useReducedMotion } from "../lib/hooks/use-reduced-motion"

export function RouteTransitionContainer({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/dashboard"
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={`route-transition-root ${prefersReducedMotion ? "reduced-motion" : ""}`} data-route-path={pathname}>
      <div key={pathname} className="route-transition-panel">
        {children}
      </div>
    </div>
  )
}
