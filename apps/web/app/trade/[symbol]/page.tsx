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
      <section className="signature-hero-strip trade-shell-header">
        <h1 className="trade-page-title">Trade · {symbol}</h1>
        <p className="muted trade-page-subtitle route-context-subtitle is-visible">
          Execution workspace with live spread context and position state.
        </p>
      </section>
      <TradeWorkspace symbol={symbol} />
    </div>
  )
}
