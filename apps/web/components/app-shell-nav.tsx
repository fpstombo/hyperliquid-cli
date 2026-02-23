"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useReducedMotion } from "../lib/hooks/use-reduced-motion"

type NavItem = {
  href: string
  label: string
}

type RouteContext = {
  label: string
  subtitle: string
}

function resolveRouteContext(pathname: string): RouteContext {
  if (pathname.startsWith("/trade/")) {
    const symbol = pathname.split("/")[2]?.toUpperCase() ?? "Market"
    return {
      label: `Trade · ${symbol}`,
      subtitle: "Execution workspace with live spread and position context.",
    }
  }
  if (pathname.startsWith("/onboarding")) {
    return {
      label: "Onboarding",
      subtitle: "Progress through wallet safety and agent approval setup.",
    }
  }
  if (pathname.startsWith("/agent-status")) {
    return {
      label: "Agent status",
      subtitle: "Monitor approval lifecycle and remediation guidance.",
    }
  }
  if (pathname.startsWith("/auth")) {
    return {
      label: "Authentication",
      subtitle: "Connect wallet and establish an authenticated session.",
    }
  }
  return {
    label: "Dashboard",
    subtitle: "Live account state, balances, and risk posture in one view.",
  }
}

function isRouteActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/"
  if (href === "/trade/BTC") return pathname.startsWith("/trade")
  return pathname.startsWith(href)
}

export function TopNavPrimary({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname() ?? "/dashboard"
  const prefersReducedMotion = useReducedMotion()
  const routeContext = useMemo(() => resolveRouteContext(pathname), [pathname])

  const [contextSubtitle, setContextSubtitle] = useState(routeContext.subtitle)
  const [isSubtitleVisible, setIsSubtitleVisible] = useState(true)

  useEffect(() => {
    if (prefersReducedMotion) {
      setContextSubtitle(routeContext.subtitle)
      setIsSubtitleVisible(true)
      return
    }

    setIsSubtitleVisible(false)
    const timeout = window.setTimeout(() => {
      setContextSubtitle(routeContext.subtitle)
      setIsSubtitleVisible(true)
    }, 90)

    return () => window.clearTimeout(timeout)
  }, [prefersReducedMotion, routeContext.subtitle])

  return (
    <>
      <nav className="top-nav-links" aria-label="Primary">
        {navItems.map((item) => {
          const isActive = isRouteActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`top-nav-link ${isActive ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="top-nav-route-context" aria-live="polite">
        <p className="top-nav-route-label">{routeContext.label}</p>
        <p className={`top-nav-route-subtitle ${isSubtitleVisible ? "is-visible" : ""}`}>{contextSubtitle}</p>
      </div>
    </>
  )
}

export function SidebarNav({ markets, sidebarExtra }: { markets: string[]; sidebarExtra?: ReactNode }) {
  const pathname = usePathname() ?? "/dashboard"

  return (
    <aside className="sidebar shell-surface" aria-label="Markets and shortcuts">
      <section className="sidebar-section">
        <p className="sidebar-label">Favorites</p>
        <div className="sidebar-list">
          {markets.map((market) => {
            const href = `/trade/${market}`
            const isActive = pathname.toLowerCase().startsWith(href.toLowerCase())

            return (
              <Link
                key={market}
                className={`sidebar-link ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                href={href}
              >
                {market}
              </Link>
            )
          })}
        </div>
      </section>
      <section className="sidebar-section">
        <p className="sidebar-label">Workspace</p>
        <div className="sidebar-list">
          <Link
            className={`sidebar-link ${pathname.startsWith("/dashboard") ? "is-active" : ""}`}
            href="/dashboard"
            aria-current={pathname.startsWith("/dashboard") ? "page" : undefined}
          >
            Portfolio
          </Link>
          <button className="sidebar-link sidebar-link-button" type="button">
            Alerts (mock)
          </button>
        </div>
      </section>
      {sidebarExtra}
    </aside>
  )
}
