import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

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
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
