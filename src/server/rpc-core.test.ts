import { describe, expect, it } from "vitest"
import { FixedWindowRateLimiter, validateRPCRequest } from "./rpc-core.js"
import { withBackoff } from "./backoff.js"

describe("RPC core unit logic", () => {
  it("validates known method payload", () => {
    const result = validateRPCRequest({ id: "1", method: "getStatus", params: {} })
    expect(result.error).toBeUndefined()
    expect(result.request?.method).toBe("getStatus")
  })

  it("rejects unknown methods", () => {
    const result = validateRPCRequest({ id: "1", method: "doesNotExist" })
    expect(result.error).toContain("Unknown method")
  })

  it("enforces fixed-window rate limiting", () => {
    const limiter = new FixedWindowRateLimiter(2, 1000)
    expect(limiter.allow("client", 1000)).toBe(true)
    expect(limiter.allow("client", 1200)).toBe(true)
    expect(limiter.allow("client", 1500)).toBe(false)
    expect(limiter.allow("client", 2101)).toBe(true)
  })

  it("retries failed operations with backoff", async () => {
    let attempts = 0
    const sleeps: number[] = []

    const output = await withBackoff(
      async () => {
        attempts += 1
        if (attempts < 3) {
          throw new Error("temporary")
        }
        return "ok"
      },
      {
        maxAttempts: 4,
        baseDelayMs: 10,
        maxDelayMs: 40,
        jitterRatio: 0,
        sleep: async (ms: number) => {
          sleeps.push(ms)
        },
      },
    )

    expect(output).toBe("ok")
    expect(attempts).toBe(3)
    expect(sleeps).toEqual([10, 20])
  })
})
