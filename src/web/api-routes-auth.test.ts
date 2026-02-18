import { beforeEach, describe, expect, it, vi } from "vitest"

class MockNextResponse extends Response {
  static json(body: unknown, init?: ResponseInit) {
    return new MockNextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    })
  }
}

const mocks = vi.hoisted(() => ({
  requireApiAuthMock: vi.fn(),
  createRouteRuntimeConfigMock: vi.fn(),
  verifyAuthorizedTradingAccountMock: vi.fn(),
  fetchBalancesMock: vi.fn(),
  executeMarketOrderMock: vi.fn(),
  executeLimitOrderMock: vi.fn(),
  cancelOrderMock: vi.fn(),
  fetchOpenOrdersMock: vi.fn(),
  toApiErrorMock: vi.fn((error: unknown) => ({
    error: { code: "ORDER_ERROR", message: error instanceof Error ? error.message : "Order failed" },
  })),
}))

vi.mock(
  "next/server",
  () => ({
    NextResponse: MockNextResponse,
  }),
  { virtual: true },
)

vi.mock("/workspace/hyperliquid-cli/apps/web/lib/api-auth.ts", () => ({
  requireApiAuth: mocks.requireApiAuthMock,
  createRouteRuntimeConfig: mocks.createRouteRuntimeConfigMock,
  verifyAuthorizedTradingAccount: mocks.verifyAuthorizedTradingAccountMock,
}))

vi.mock("/workspace/hyperliquid-cli/src/lib/web-readonly-adapter.ts", () => ({
  fetchBalances: mocks.fetchBalancesMock,
}))

vi.mock("/workspace/hyperliquid-cli/apps/web/lib/trading.ts", () => ({
  executeMarketOrder: mocks.executeMarketOrderMock,
  executeLimitOrder: mocks.executeLimitOrderMock,
  cancelOrder: mocks.cancelOrderMock,
  fetchOpenOrders: mocks.fetchOpenOrdersMock,
  toApiError: mocks.toApiErrorMock,
}))

import { GET as getBalances } from "../../apps/web/app/api/balances/route"
import { POST as postMarketOrder } from "../../apps/web/app/api/orders/market/route"
import { POST as postLimitOrder } from "../../apps/web/app/api/orders/limit/route"
import { POST as postCancelOrder } from "../../apps/web/app/api/orders/cancel/route"
import { GET as getOpenOrders } from "../../apps/web/app/api/orders/open/route"

describe("API route auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRouteRuntimeConfigMock.mockReturnValue({ user: "0xabc", isTestnet: true })
    mocks.verifyAuthorizedTradingAccountMock.mockReturnValue(null)
  })

  it("rejects anonymous balances requests with normalized auth error", async () => {
    mocks.requireApiAuthMock.mockResolvedValue(
      MockNextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }),
    )

    const response = await getBalances(new Request("http://localhost/api/balances"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    })
    expect(mocks.fetchBalancesMock).not.toHaveBeenCalled()
  })

  it("serves balances for authenticated requests using request-bound runtime config", async () => {
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
    })
    mocks.fetchBalancesMock.mockResolvedValue({ perpBalance: "100", spotBalances: [] })

    const response = await getBalances(new Request("http://localhost/api/balances"))

    expect(response.status).toBe(200)
    expect(mocks.createRouteRuntimeConfigMock).toHaveBeenCalledWith({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
    })
    expect(mocks.fetchBalancesMock).toHaveBeenCalledWith({ user: "0xabc", isTestnet: true })
  })

  it("rejects all order endpoints when trading account does not match auth context", async () => {
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
    })
    mocks.verifyAuthorizedTradingAccountMock.mockReturnValue(
      MockNextResponse.json(
        { error: { code: "FORBIDDEN", message: "Trading account does not match authenticated wallet" } },
        { status: 403 },
      ),
    )

    const [marketResponse, limitResponse, cancelResponse, openResponse] = await Promise.all([
      postMarketOrder(
        new Request("http://localhost/api/orders/market", {
          method: "POST",
          body: JSON.stringify({ side: "buy", size: "1", coin: "BTC", slippage: "0.1" }),
        }),
      ),
      postLimitOrder(
        new Request("http://localhost/api/orders/limit", {
          method: "POST",
          body: JSON.stringify({ side: "buy", size: "1", coin: "BTC", price: "100000", tif: "Gtc" }),
        }),
      ),
      postCancelOrder(
        new Request("http://localhost/api/orders/cancel", {
          method: "POST",
          body: JSON.stringify({ oid: "1", coin: "BTC" }),
        }),
      ),
      getOpenOrders(new Request("http://localhost/api/orders/open")),
    ])

    expect(marketResponse.status).toBe(403)
    expect(limitResponse.status).toBe(403)
    expect(cancelResponse.status).toBe(403)
    expect(openResponse.status).toBe(403)
    expect(mocks.executeMarketOrderMock).not.toHaveBeenCalled()
    expect(mocks.executeLimitOrderMock).not.toHaveBeenCalled()
    expect(mocks.cancelOrderMock).not.toHaveBeenCalled()
    expect(mocks.fetchOpenOrdersMock).not.toHaveBeenCalled()
  })

  it("allows authorized market orders", async () => {
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
    })
    mocks.executeMarketOrderMock.mockResolvedValue({ status: "ok" })

    const response = await postMarketOrder(
      new Request("http://localhost/api/orders/market", {
        method: "POST",
        body: JSON.stringify({ side: "buy", size: "1", coin: "BTC", slippage: "0.1" }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.executeMarketOrderMock).toHaveBeenCalledWith({ side: "buy", size: "1", coin: "BTC", slippage: "0.1" })
    await expect(response.json()).resolves.toEqual({ status: "ok" })
  })
})
