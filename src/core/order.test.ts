import { describe, expect, it } from "vitest"
import {
  buildCancelRequest,
  buildLimitOrderRequest,
  buildMarketOrderRequest,
  parseOrderError,
} from "./order.js"

const mockClient = {
  allPerpMetas: async () => [{ universe: [{ name: "BTC" }] }],
  spotMeta: async () => ({ universe: [{ name: "PURR/USDC" }] }),
  allMids: async () => ({ BTC: "100" }),
}

describe("core order helpers", () => {
  it("builds market order with IOC limit price", async () => {
    const request = await buildMarketOrderRequest(mockClient, {
      side: "buy",
      size: "0.5",
      coin: "BTC",
      slippagePercent: "1",
    })

    expect(request.orders[0].p).toBe("101.000000")
    expect(request.orders[0].t.limit.tif).toBe("Ioc")
  })

  it("builds limit order with tif", async () => {
    const request = await buildLimitOrderRequest(mockClient, {
      side: "sell",
      size: "1",
      price: "99",
      coin: "BTC",
      tif: "Alo",
    })

    expect(request.orders[0].b).toBe(false)
    expect(request.orders[0].t.limit.tif).toBe("Alo")
  })

  it("builds cancel request with validated oid", () => {
    expect(buildCancelRequest({ assetIndex: 0, orderId: "42" })).toEqual({
      cancels: [{ a: 0, o: 42 }],
    })
  })

  it("maps errors to user-readable messages", () => {
    expect(parseOrderError(new Error("insufficient margin available"))).toContain("Insufficient margin")
    expect(parseOrderError(new Error("invalid tif"))).toContain("Invalid order parameters")
  })
})
