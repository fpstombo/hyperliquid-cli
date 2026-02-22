import { TradeLiveWidgets } from "../../../components/trade-client"
import { PanelShell } from "../../../components/ui/PanelShell"

type TradePageProps = {
  params: {
    symbol: string
  }
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()

  return (
    <main className="grid trade-layout">
      <PanelShell title={`${symbol} Market Snapshot`}>
        <TradeLiveWidgets symbol={symbol} />
      </PanelShell>

      <PanelShell title="Order Ticket">
        <p className="muted">Execution UI lands in Epic D. Live data updates every 2-5 seconds.</p>
      </PanelShell>
    </main>
  )
}
