import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifySessionTokenMock: vi.fn(),
}))

vi.mock("/workspace/hyperliquid-cli/apps/web/lib/session-token", () => ({
  verifySessionToken: mocks.verifySessionTokenMock,
}))

class MockNextResponse extends Response {
  static next() {
    return new MockNextResponse(null, { status: 200, headers: { "x-middleware-next": "1" } })
  }

  static redirect(url: URL | string, init?: ResponseInit) {
    return new MockNextResponse(null, {
      status: init?.status ?? 307,
      headers: {
        location: String(url),
        ...(init?.headers ?? {}),
      },
    })
  }
}

vi.mock(
  "next/server",
  () => ({
    NextResponse: MockNextResponse,
  }),
  { virtual: true },
)

import { middleware } from "../../apps/web/middleware"

function createRequest(url: string, sessionToken?: string) {
  const parsed = new URL(url)
  return {
    url,
    nextUrl: { pathname: parsed.pathname, search: parsed.search },
    cookies: {
      get(name: string) {
        if (name !== "hl_session" || !sessionToken) return undefined
        return { value: sessionToken }
      },
    },
  } as never
}

describe("web auth middleware transitions", () => {
  it("redirects unauthenticated users from protected routes to auth page with next param", async () => {
    const response = await middleware(createRequest("http://localhost/dashboard"))

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("http://localhost/auth?next=%2Fdashboard")
  })

  it("allows authenticated requests to protected routes", async () => {
    mocks.verifySessionTokenMock.mockResolvedValue({ userId: "u_1" })

    const response = await middleware(createRequest("http://localhost/trade/BTC?tab=orders", "valid-token"))

    expect(mocks.verifySessionTokenMock).toHaveBeenCalledWith("valid-token")
    expect(response.status).toBe(200)
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("redirects to auth page when provided token is invalid", async () => {
    mocks.verifySessionTokenMock.mockRejectedValue(new Error("bad token"))

    const response = await middleware(createRequest("http://localhost/trade/BTC", "expired-token"))

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("http://localhost/auth?next=%2Ftrade%2FBTC")
  })
})
