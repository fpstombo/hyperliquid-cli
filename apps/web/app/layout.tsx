import type { Metadata } from "next"
import Link from "next/link"
import { NavbarControls } from "../components/navbar-controls"
import { AppPrivyProvider } from "../components/providers"
import "./globals.css"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trade/BTC", label: "Trade" },
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
        <header style={{ borderBottom: "1px solid #25304f", padding: "0.9rem 1rem" }}>
          <nav style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: "1rem", alignItems: "center" }}>
            <strong>Hyperliquid Web</strong>
            <Link className="muted" href="/dashboard">
              Dashboard
            </Link>
            <Link className="muted" href="/trade/BTC">
              Trade
            </Link>
            <Link className="muted" href="/onboarding">
              Onboarding
            </Link>
            <Link className="muted" href="/agent-status">
              Agent Status
            </Link>
          </nav>
        </header>
        {children}
        <div className="app-shell">
          <header className="top-nav">
            <div className="top-nav-inner">
              <div className="brand">Hyperliquid Web</div>
              <nav className="top-nav-links" aria-label="Primary">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="top-nav-link">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <div className="shell-grid">
            <aside className="sidebar" aria-label="Markets and shortcuts">
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
        <AppPrivyProvider>
          <header style={{ borderBottom: "1px solid #25304f", padding: "0.9rem 1rem" }}>
            <nav style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: "1rem", alignItems: "center" }}>
              <strong>Hyperliquid Web</strong>
              <Link className="muted" href="/dashboard">
                Dashboard
              </Link>
              <Link className="muted" href="/trade/BTC">
                Trade
              </Link>
              <NavbarControls />
            </nav>
          </header>
          {children}
        </AppPrivyProvider>
      </body>
    </html>
  )
}
