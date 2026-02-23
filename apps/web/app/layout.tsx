import type { Metadata } from "next"
import { SidebarNav, TopNavPrimary } from "../components/app-shell-nav"
import { AppKeyboardShortcuts } from "../components/app-keyboard-shortcuts"
import { NavbarControls } from "../components/navbar-controls"
import { AppPrivyProvider } from "../components/providers"
import { RouteTransitionContainer } from "../components/route-transition-container"
import { SymbolQuickSwitcher } from "../components/symbol-quick-switcher"
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
        <AppPrivyProvider>
          <AppKeyboardShortcuts />
          <div className="app-shell">
            <header className="top-nav shell-surface signature-top-bar" role="banner">
              <div className="top-nav-inner">
                <div className="brand-wrap">
                  <div className="brand">Hyperliquid Web</div>
                </div>
                <TopNavPrimary navItems={navItems} />
                <NavbarControls />
              </div>
            </header>

            <div className="shell-grid-wrap">
              <div className="shell-grid">
                <SidebarNav markets={markets} sidebarExtra={<SymbolQuickSwitcher />} />

                <main className="content-panel">
                  <RouteTransitionContainer>{children}</RouteTransitionContainer>
                </main>
              </div>
            </div>
          </div>
        </AppPrivyProvider>
      </body>
    </html>
  )
}
