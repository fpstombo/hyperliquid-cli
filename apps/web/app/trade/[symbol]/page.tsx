import { TradeWorkspace } from "./components/TradeWorkspace"

type TradePageProps = {
  params: {
    symbol: string
  }
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()
  return <TradeWorkspace symbol={symbol} />
}
