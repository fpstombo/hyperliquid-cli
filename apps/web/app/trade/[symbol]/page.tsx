import { TradeClient } from "../../../components/trade-client"

type TradePageProps = {
  params: {
    symbol: string
  }
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()
  return <TradeClient symbol={symbol} />
}
