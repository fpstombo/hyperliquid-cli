import { Button, Card, Table, Toast } from "@/components/ui"

const balanceRows = [
  { id: "usdc", asset: "USDC", amount: "14,230.21", change: "+2.6%" },
  { id: "btc", asset: "BTC", amount: "0.3201", change: "+0.9%" },
  { id: "eth", asset: "ETH", amount: "3.451", change: "-0.4%" },
]

const positionRows = [
  { id: "btc-long", market: "BTC", side: "Long", size: "0.10", entry: "$101,200", pnl: "+$235.10" },
  { id: "sol-short", market: "SOL", side: "Short", size: "18", entry: "$173.80", pnl: "-$41.88" },
]

const orderRows = [
  { id: "ord-1", market: "ETH", side: "Buy", type: "Limit", price: "$4,290", size: "0.50" },
  { id: "ord-2", market: "BTC", side: "Sell", type: "Stop", price: "$100,940", size: "0.05" },
]

export default function DashboardPage() {
  return (
    <div className="stack-lg">
      <section className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Mocked account overview for Slice 1 shell validation.</p>
        </div>
        <Button variant="secondary">Refresh mock data</Button>
      </section>

      <section className="stats-grid">
        {balanceRows.map((balance) => (
          <Card key={balance.id} title={balance.asset} subtitle="Available balance">
            <p className="metric">{balance.amount}</p>
            <p className="muted">24h: {balance.change}</p>
          </Card>
        ))}
      </section>

      <section className="page-grid">
        <Card title="Open positions" subtitle="Active perps exposure" className="span-8">
          <Table
            columns={[
              { key: "market", header: "Market" },
              { key: "side", header: "Side" },
              { key: "size", header: "Size", align: "right" },
              { key: "entry", header: "Entry", align: "right" },
              { key: "pnl", header: "PnL", align: "right" },
            ]}
            rows={positionRows}
          />
        </Card>

        <Card title="System" subtitle="Trading status" className="span-4">
          <div className="stack-md">
            <Toast tone="success" title="Connected" message="Wallet and market feeds are mocked as healthy." />
            <Toast tone="info" title="Next step" message="Slice 2 will replace this area with auth state." />
          </div>
        </Card>
      </section>

      <Card
        title="Open orders"
        subtitle="Mock order intents"
        actions={<Button variant="ghost">Cancel all</Button>}
      >
        <Table
          columns={[
            { key: "market", header: "Market" },
            { key: "side", header: "Side" },
            { key: "type", header: "Type" },
            { key: "price", header: "Price", align: "right" },
            { key: "size", header: "Size", align: "right" },
          ]}
          rows={orderRows}
        />
      </Card>
    </div>
  )
}
