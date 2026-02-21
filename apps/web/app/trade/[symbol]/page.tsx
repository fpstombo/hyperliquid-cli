import dynamic from "next/dynamic"

const TradeClient = dynamic(() => import("../../../components/trade-client").then((module) => module.TradeClient), {
  ssr: false,
})

type TradePageProps = {
  params: {
    symbol: string
  }
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()
  return <TradeClient symbol={symbol} />
}
