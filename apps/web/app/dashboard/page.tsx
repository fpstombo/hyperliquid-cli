const mockBalances = [
  { asset: "USDC", amount: "14,230.21" },
  { asset: "BTC", amount: "0.3201" },
  { asset: "ETH", amount: "3.451" },
]

const mockPositions = [
  { market: "BTC", side: "Long", size: "0.10", pnl: "+$235.10" },
  { market: "SOL", side: "Short", size: "18", pnl: "-$41.88" },
]

export default function DashboardPage() {
  return (
    <main className="grid">
      <section>
        <h1 style={{ marginBottom: "0.5rem" }}>Dashboard</h1>
        <p className="muted" style={{ marginTop: 0 }}>
Dashboard with mocked account data plus onboarding and agent lifecycle controls.
        </p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Agent setup</h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          Complete onboarding before trading and use Agent Status for recovery from expired/revoked approvals.
        </p>
      </section>

      <section className="grid columns-3">
        {mockBalances.map((balance) => (
          <article key={balance.asset} className="card">
            <p className="muted" style={{ marginTop: 0 }}>
              {balance.asset}
            </p>
            <p style={{ fontSize: "1.3rem", marginBottom: 0 }}>{balance.amount}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Open Positions</h2>
        <div className="grid">
          {mockPositions.map((position) => (
            <div key={position.market} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                {position.market} · {position.side} · {position.size}
              </span>
              <span>{position.pnl}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
