import type { Metadata } from "next"
import Link from "next/link"
import { NavbarControls } from "../components/navbar-controls"
import { AppPrivyProvider } from "../components/providers"
import "./globals.css"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trade/BTC", label: "Trade" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/agent-status", label: "Agent Status" },
]

const markets = ["BTC", "ETH", "SOL", "ARB", "HYPE"]

export const metadata: Metadata = {
  title: "Hyperliquid Web",
  description: "Web-first Hyperliquid experience",
}

export default function RootLayout({ children }: { children: import("react").ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppPrivyProvider>
          <div className="app-shell">
            <header className="top-nav shell-surface" role="banner">
              <div className="top-nav-inner">
                <div className="brand-wrap">
                  <div className="brand">Hyperliquid Web</div>
                </div>
                <nav className="top-nav-links" aria-label="Primary">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className="top-nav-link">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <NavbarControls />
              </div>
            </header>

            <div className="shell-grid-wrap">
              <div className="shell-grid">
                <aside className="sidebar shell-surface" aria-label="Markets and shortcuts">
                  <section className="sidebar-section">
                    <p className="sidebar-label">Favorites</p>
                    <div className="sidebar-list">
                      {markets.map((market) => (
                        <Link key={market} className="sidebar-link" href={`/trade/${market}`}>
                          {market}
                        </Link>
                      ))}
                    </div>
                  </section>
                  <section className="sidebar-section">
                    <p className="sidebar-label">Workspace</p>
                    <div className="sidebar-list">
                      <Link className="sidebar-link" href="/dashboard">
                        Portfolio
                      </Link>
                      <button className="sidebar-link sidebar-link-button" type="button">
                        Alerts (mock)
                      </button>
                    </div>
                  </section>
                </aside>

                <main className="content-panel">{children}</main>
              </div>
            </div>
          </div>
        </AppPrivyProvider>
      </body>
    </html>
  )
}
