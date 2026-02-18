type TradePageProps = {
  params: {
    symbol: string
  }
}

const mockBook = {
  bids: [
    ["102,301", "0.75"],
    ["102,290", "1.12"],
    ["102,287", "0.56"],
  ],
  asks: [
    ["102,320", "0.31"],
    ["102,330", "1.50"],
    ["102,339", "0.88"],
  ],
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()

  return (
    <main className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
      <section className="card">
        <h1 style={{ marginTop: 0 }}>{symbol} Order Book</h1>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <h3>Bids</h3>
            {mockBook.bids.map(([price, size]) => (
              <div key={`bid-${price}`} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{price}</span>
                <span>{size}</span>
              </div>
            ))}
          </div>
          <div>
            <h3>Asks</h3>
            {mockBook.asks.map(([price, size]) => (
              <div key={`ask-${price}`} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{price}</span>
                <span>{size}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <aside className="card">
        <h2 style={{ marginTop: 0 }}>Order Ticket</h2>
        <p className="muted">Mocked form placeholder for market/limit order entry.</p>
      </aside>
    </main>
  )
}
