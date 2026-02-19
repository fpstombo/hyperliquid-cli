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
  resolveTradingContextMock: vi.fn(),
  requireAuthenticatedSessionMock: vi.fn(),
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
  resolveTradingContext: mocks.resolveTradingContextMock,
  toApiError: mocks.toApiErrorMock,
}))

vi.mock("/workspace/hyperliquid-cli/apps/web/lib/server-session", () => ({
  requireAuthenticatedSession: mocks.requireAuthenticatedSessionMock,
}))

import { GET as getBalances } from "../../apps/web/app/api/balances/route"
import { POST as postMarketOrder } from "../../apps/web/app/api/orders/market/route"
import { POST as postLimitOrder } from "../../apps/web/app/api/orders/limit/route"
import { POST as postCancelOrder } from "../../apps/web/app/api/orders/cancel/route"
import { GET as getOpenOrders } from "../../apps/web/app/api/orders/open/route"
import { GET as getOrders } from "../../apps/web/app/api/orders/route"

describe("API route auth guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createRouteRuntimeConfigMock.mockReturnValue({ user: "0xabc", isTestnet: true })
    mocks.verifyAuthorizedTradingAccountMock.mockReturnValue(null)
    mocks.requireAuthenticatedSessionMock.mockResolvedValue({ environment: "testnet", walletAddress: "0xabc" })
    mocks.resolveTradingContextMock.mockReturnValue({
      environment: "testnet",
      user: "0xabc",
      accountSource: "environment_variables",
      accountAlias: null,
    })
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
      environment: "testnet",
    })
    mocks.fetchBalancesMock.mockResolvedValue({ perpBalance: "100", spotBalances: [] })

    const response = await getBalances(new Request("http://localhost/api/balances"))

    expect(response.status).toBe(200)
    expect(mocks.createRouteRuntimeConfigMock).toHaveBeenCalledWith({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "testnet",
    })
    expect(mocks.fetchBalancesMock).toHaveBeenCalledWith({ user: "0xabc", isTestnet: true })
  })

  it("rejects all order endpoints when trading account does not match auth context", async () => {
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "testnet",
    })
    mocks.verifyAuthorizedTradingAccountMock.mockReturnValue(
      MockNextResponse.json(
        { error: { code: "FORBIDDEN", message: "Trading account does not match authenticated wallet" } },
        { status: 403 },
      ),
    )

    const [marketResponse, limitResponse, cancelResponse, openResponse, ordersResponse] = await Promise.all([
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
      getOrders(new Request("http://localhost/api/orders")),
    ])

    expect(marketResponse.status).toBe(403)
    expect(limitResponse.status).toBe(403)
    expect(cancelResponse.status).toBe(403)
    expect(openResponse.status).toBe(403)
    expect(ordersResponse.status).toBe(403)
    expect(mocks.executeMarketOrderMock).not.toHaveBeenCalled()
    expect(mocks.executeLimitOrderMock).not.toHaveBeenCalled()
    expect(mocks.cancelOrderMock).not.toHaveBeenCalled()
    expect(mocks.fetchOpenOrdersMock).not.toHaveBeenCalled()
  })

  it("returns normalized responses for authenticated order endpoints", async () => {
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "testnet",
    })

    mocks.executeMarketOrderMock.mockResolvedValue({ status: "ok" })
    mocks.executeLimitOrderMock.mockResolvedValue({ status: "ok", oid: "2" })
    mocks.cancelOrderMock.mockResolvedValue({ status: "ok", canceled: true })
    mocks.fetchOpenOrdersMock.mockResolvedValue([
      { oid: 1, coin: "BTC", side: "B", sz: "1", limitPx: "100000", timestamp: 1234567890 },
    ])

    const [marketResponse, limitResponse, cancelResponse, openResponse, ordersResponse] = await Promise.all([
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
      getOrders(new Request("http://localhost/api/orders")),
    ])

    await expect(marketResponse.json()).resolves.toMatchObject({
      status: "ok",
      context: { environment: "testnet", user: "0xabc", accountSource: "environment_variables", accountAlias: null },
    })
    await expect(limitResponse.json()).resolves.toMatchObject({
      status: "ok",
      oid: "2",
      context: { environment: "testnet", user: "0xabc", accountSource: "environment_variables", accountAlias: null },
    })
    await expect(cancelResponse.json()).resolves.toMatchObject({
      status: "ok",
      canceled: true,
      context: { environment: "testnet", user: "0xabc", accountSource: "environment_variables", accountAlias: null },
    })
    await expect(openResponse.json()).resolves.toMatchObject({
      orders: [{ oid: 1, coin: "BTC" }],
      context: { environment: "testnet", user: "0xabc", accountSource: "environment_variables", accountAlias: null },
    })

    const ordersBody = await ordersResponse.json()
    expect(ordersBody).toMatchObject({
      orders: [{ oid: 1, coin: "BTC" }],
      context: { environment: "testnet", user: "0xabc", accountSource: "environment_variables", accountAlias: null },
    })
    expect(typeof ordersBody.updatedAt).toBe("string")
  })

  it("uses session environment when building runtime config for mainnet requests", async () => {
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "mainnet",
    })
    mocks.createRouteRuntimeConfigMock.mockReturnValue({ user: "0xabc", isTestnet: false })
    mocks.fetchBalancesMock.mockResolvedValue({ perpBalance: "100", spotBalances: [] })

    const response = await getBalances(new Request("http://localhost/api/balances"))

    expect(response.status).toBe(200)
    expect(mocks.createRouteRuntimeConfigMock).toHaveBeenCalledWith({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "mainnet",
    })
    expect(mocks.fetchBalancesMock).toHaveBeenCalledWith({ user: "0xabc", isTestnet: false })
  })

  it("passes authenticated environment into authorization checks to avoid cross-environment leakage", async () => {
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "mainnet",
    })

    await postMarketOrder(
      new Request("http://localhost/api/orders/market", {
        method: "POST",
        body: JSON.stringify({ side: "buy", size: "1", coin: "BTC", slippage: "0.1" }),
      }),
    )

    expect(mocks.verifyAuthorizedTradingAccountMock).toHaveBeenCalledWith({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "mainnet",
    })
  })
})
