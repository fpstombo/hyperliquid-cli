import { TradeWorkspace } from "./components/TradeWorkspace"

type TradePageProps = {
  params: {
    symbol: string
  }
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()

  return (
    <div className="trade-shell signature-shell">
      <section className="signature-hero-strip" style={{ padding: "var(--space-4)", marginBottom: "var(--space-4)" }}>
        <h1 style={{ margin: "0 0 0.35rem" }}>Trade · {symbol}</h1>
        <p className="muted" style={{ margin: 0 }}>
          Execution workspace with live spread context and position state.
        </p>
      </section>
      <TradeWorkspace symbol={symbol} />
    </div>
  )
}
