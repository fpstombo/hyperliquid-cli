import { beforeEach, describe, expect, it, vi } from "vitest"
import { ServerCache } from "./cache.js"
import { RPCGateway } from "./rpc-core.js"

describe("critical auth/dashboard/trade flow e2e", () => {
  let gateway: RPCGateway

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"))

    const cache = new ServerCache()
    cache.setAllMids({ BTC: "50000" })

    gateway = new RPCGateway(
      cache,
      true,
      Date.now() - 5_000,
      () => true,
      () => undefined,
      () => undefined,
    )
  })

  it("handles login, dashboard load, place order, cancel order", () => {
    const login = gateway.handleRequest(
      { id: "1", method: "login", params: { wallet: "0xabc1234" } },
      { clientId: "e2e", receivedAt: Date.now(), traceId: "flow-1" },
    )
    expect(login.error).toBeUndefined()

    const token = (login.result as { token: string }).token

    const dashboard = gateway.handleRequest(
      { id: "2", method: "getDashboard", params: { authToken: token } },
      { clientId: "e2e", receivedAt: Date.now(), traceId: "flow-2" },
    )
    expect(dashboard.error).toBeUndefined()
    expect(dashboard.result).toMatchObject({ prices: { BTC: "50000" } })

    const placed = gateway.handleRequest(
      {
        id: "3",
        method: "placeOrder",
        params: { authToken: token, coin: "BTC", side: "buy", size: 1 },
      },
      { clientId: "e2e", receivedAt: Date.now(), traceId: "flow-3" },
    )
    expect(placed.error).toBeUndefined()

    const orderId = (placed.result as { orderId: string }).orderId
    const cancelled = gateway.handleRequest(
      { id: "4", method: "cancelOrder", params: { authToken: token, orderId } },
      { clientId: "e2e", receivedAt: Date.now(), traceId: "flow-4" },
    )

    expect(cancelled.error).toBeUndefined()
    expect(cancelled.result).toEqual({ orderId, status: "cancelled" })
  })
})
