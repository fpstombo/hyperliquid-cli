import { beforeEach, describe, expect, it, vi } from "vitest"
import { ServerCache } from "./cache.js"
import { RPCGateway } from "./rpc-core.js"

describe("IPC route integration", () => {
  let cache: ServerCache
  let gateway: RPCGateway

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"))

    cache = new ServerCache()
    cache.setAllMids({ BTC: "50000", ETH: "3000" })

    gateway = new RPCGateway(
      cache,
      false,
      Date.now() - 10_000,
      () => true,
      () => undefined,
      () => undefined,
    )
  })

  it("serves data endpoints", () => {
    const response = gateway.handleRequest(
      { id: "1", method: "getPrices", params: { coin: "btc" } },
      { clientId: "client", receivedAt: Date.now(), traceId: "trace-1" },
    )

    expect(response.error).toBeUndefined()
    expect(response.result).toEqual({ BTC: "50000" })
    expect(response.trace_id).toBe("trace-1")
  })

  it("requires auth on protected endpoints", () => {
    const response = gateway.handleRequest(
      { id: "1", method: "getDashboard", params: {} },
      { clientId: "client", receivedAt: Date.now(), traceId: "trace-2" },
    )

    expect(response.error).toBe("Unauthorized")
  })

  it("returns status and metrics", () => {
    gateway.handleRequest(
      { id: "1", method: "getStatus" },
      { clientId: "client", receivedAt: Date.now(), traceId: "trace-3" },
    )

    const metrics = gateway.handleRequest(
      { id: "2", method: "getMetrics" },
      { clientId: "client", receivedAt: Date.now(), traceId: "trace-4" },
    )

    expect(metrics.error).toBeUndefined()
    expect(metrics.result).toMatchObject({ counters: expect.any(Object), latency_ms_totals: expect.any(Object) })
  })
})
