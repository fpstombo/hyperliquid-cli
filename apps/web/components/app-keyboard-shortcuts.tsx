"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

const routeShortcuts: Record<string, string> = {
  "1": "/dashboard",
  "2": "/trade/BTC",
  "3": "/onboarding",
  "4": "/agent-status",
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  return tagName === "input" || tagName === "textarea" || target.isContentEditable || tagName === "select"
}

export function AppKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        return
      }

      if (event.altKey && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        const route = routeShortcuts[event.key]
        if (route && pathname !== route) {
          event.preventDefault()
          router.push(route)
          return
        }
      }

      if (event.key === "/" || event.key.toLowerCase() === "s") {
        const focusTarget =
          document.querySelector<HTMLInputElement>("[data-global-symbol-search]") ??
          document.querySelector<HTMLInputElement>("[data-global-search]")

        if (focusTarget) {
          event.preventDefault()
          focusTarget.focus()
          focusTarget.select()
        }
      }
    }

    window.addEventListener("keydown", onKeydown)
    return () => window.removeEventListener("keydown", onKeydown)
  }, [pathname, router])

  return null
}
