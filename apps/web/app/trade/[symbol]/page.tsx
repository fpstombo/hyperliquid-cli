import { Button, Card, Input, Modal, Table, Toast } from "@/components/ui"

type TradePageProps = {
  params: {
    symbol: string
  }
}

const mockBookRows = {
  bids: [
    { id: "b1", price: "102,301", size: "0.75" },
    { id: "b2", price: "102,290", size: "1.12" },
    { id: "b3", price: "102,287", size: "0.56" },
  ],
  asks: [
    { id: "a1", price: "102,320", size: "0.31" },
    { id: "a2", price: "102,330", size: "1.50" },
    { id: "a3", price: "102,339", size: "0.88" },
  ],
}

export default function TradePage({ params }: TradePageProps) {
  const symbol = params.symbol.toUpperCase()

  return (
    <div className="stack-lg">
      <section className="page-header">
        <div>
          <h1>{symbol} Trade</h1>
          <p className="muted">Mocked order book and order entry layout.</p>
        </div>
        <Button variant="secondary">Switch to depth chart</Button>
      </section>

      <section className="trade-grid">
        <Card title="Order book" subtitle={`${symbol}-PERP`} className="span-8">
          <div className="split-grid">
            <div>
              <p className="section-label">Bids</p>
              <Table
                columns={[
                  { key: "price", header: "Price" },
                  { key: "size", header: "Size", align: "right" },
                ]}
                rows={mockBookRows.bids}
              />
            </div>
            <div>
              <p className="section-label">Asks</p>
              <Table
                columns={[
                  { key: "price", header: "Price" },
                  { key: "size", header: "Size", align: "right" },
                ]}
                rows={mockBookRows.asks}
              />
            </div>
          </div>
        </Card>

        <Card title="Order ticket" subtitle="Market and limit" className="span-4">
          <form className="stack-md">
            <Input label="Side" defaultValue="Buy" readOnly />
            <Input label="Price" placeholder="102,310" />
            <Input label="Size" placeholder="0.10" hint="Min order size is mocked for now." />
            <div className="button-row">
              <Button>Place order</Button>
              <Button variant="secondary">Preview</Button>
            </div>
          </form>
          <div className="stack-md top-gap">
            <Toast tone="warning" title="Mock mode" message="Submission is disabled until API routes are wired in Slice 4." />
          </div>
        </Card>
      </section>

      <Modal open={false} title="Order Preview" description="Preview modal primitive for future connected workflow." />
    </div>
  )
}
