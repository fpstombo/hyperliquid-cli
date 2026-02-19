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
  validateApiKeyMock: vi.fn(),
  getExtraAgentsMock: vi.fn(),
  getApprovalUrlMock: vi.fn(),
  waitForApprovalMock: vi.fn(),
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
}))

vi.mock("/workspace/hyperliquid-cli/src/lib/api-wallet", () => ({
  validateApiKey: mocks.validateApiKeyMock,
  getExtraAgents: mocks.getExtraAgentsMock,
  getApprovalUrl: mocks.getApprovalUrlMock,
  waitForApproval: mocks.waitForApprovalMock,
}))

import { POST as postValidate } from "../../apps/web/app/api/agent/validate/route"
import { POST as postExtraAgents } from "../../apps/web/app/api/agent/extra-agents/route"
import { POST as postWait } from "../../apps/web/app/api/agent/wait/route"

describe("agent onboarding + status API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    mocks.requireApiAuthMock.mockResolvedValue({
      userId: "user_1",
      walletAddress: "0xabc",
      tradingAccount: "0xabc",
      environment: "testnet",
    })
    mocks.getApprovalUrlMock.mockReturnValue("https://app.hyperliquid.xyz/API")
  })

  it("returns pending state when key is valid but extra-agent approval is not active", async () => {
    mocks.validateApiKeyMock.mockResolvedValue({
      valid: true,
      masterAddress: "0xabc",
      apiWalletAddress: "0xagent",
    })
    mocks.getExtraAgentsMock.mockResolvedValue([])

    const response = await postValidate(
      new Request("http://localhost/api/agent/validate", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "pending",
      status: "pending",
      apiWalletAddress: "0xagent",
      approvalUrl: "https://app.hyperliquid.xyz/API",
      reason: "Approval request exists but agent is not active yet.",
    })
    expect(mocks.validateApiKeyMock).toHaveBeenCalledWith("0xkey", true)
  })

  it("moves lifecycle from pending to active from extra-agents route payload", async () => {
    const validUntilSeconds = Math.floor(Date.now() / 1000) + 3600
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: validUntilSeconds }])

    const response = await postExtraAgents(
      new Request("http://localhost/api/agent/extra-agents", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent", lastKnownState: "pending" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "active",
      validUntil: validUntilSeconds * 1000,
    })
  })

  it("returns expired when agent validUntil is in the past", async () => {
    const nowMs = 1_730_000_000_000
    vi.useFakeTimers()
    vi.setSystemTime(nowMs)
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: Math.floor((nowMs - 1_000) / 1000) }])

    const response = await postExtraAgents(
      new Request("http://localhost/api/agent/extra-agents", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent", lastKnownState: "active" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "expired",
      reason: "Agent approval has expired.",
    })
  })

  it("treats validUntil equal to now as expired boundary", async () => {
    const nowMs = 1_730_000_000_000
    vi.useFakeTimers()
    vi.setSystemTime(nowMs)
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: Math.floor(nowMs / 1000) }])

    const response = await postExtraAgents(
      new Request("http://localhost/api/agent/extra-agents", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent", lastKnownState: "active" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true, state: "expired", validUntil: nowMs })
  })

  it.each(["active", "pending"])("returns revoked when %s authorization disappears on revalidation", async (lastKnownState) => {
    mocks.validateApiKeyMock.mockResolvedValue({ valid: false, error: "API key revoked" })
    mocks.getExtraAgentsMock.mockResolvedValue([])

    const response = await postExtraAgents(
      new Request("http://localhost/api/agent/extra-agents", {
        method: "POST",
        body: JSON.stringify({
          userAddress: "0xabc",
          apiWalletAddress: "0xagent",
          apiPrivateKey: "0xkey",
          lastKnownState,
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "revoked",
      reason: "API key revoked",
    })
  })

  it("rejects apiPrivateKey in query params for extra-agents", async () => {
    const response = await postExtraAgents(
      new Request("http://localhost/api/agent/extra-agents?apiPrivateKey=0xkey", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent" }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: { code: "BAD_REQUEST", message: "apiPrivateKey must be sent in the JSON body" },
    })
    expect(mocks.validateApiKeyMock).not.toHaveBeenCalled()
  })

  it("wait endpoint reports active state and validity for approved agents", async () => {
    const validUntilSeconds = Math.floor(Date.now() / 1000) + 3600
    mocks.waitForApprovalMock.mockResolvedValue(true)
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: validUntilSeconds }])

    const response = await postWait(
      new Request("http://localhost/api/agent/wait", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent", maxAttempts: 2 }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      approved: true,
      state: "active",
      validUntil: validUntilSeconds * 1000,
    })
    expect(mocks.waitForApprovalMock).toHaveBeenCalledWith("0xagent", "0xabc", true, undefined, 2)
  })


  it("derives wait state from server lifecycle even when polling result is false", async () => {
    const validUntilSeconds = Math.floor(Date.now() / 1000) + 3600
    mocks.waitForApprovalMock.mockResolvedValue(false)
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: validUntilSeconds }])

    const response = await postWait(
      new Request("http://localhost/api/agent/wait", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      approved: true,
      state: "active",
      validUntil: validUntilSeconds * 1000,
    })
  })

  it("returns bad request for invalid JSON payloads on onboarding status routes", async () => {
    const [extraResponse, waitResponse] = await Promise.all([
      postExtraAgents(new Request("http://localhost/api/agent/extra-agents", { method: "POST", body: "{" })),
      postWait(new Request("http://localhost/api/agent/wait", { method: "POST", body: "{" })),
    ])

    expect(extraResponse.status).toBe(400)
    expect(waitResponse.status).toBe(400)
    await expect(extraResponse.json()).resolves.toEqual({
      error: { code: "BAD_REQUEST", message: "Invalid request payload" },
    })
    await expect(waitResponse.json()).resolves.toEqual({
      error: { code: "BAD_REQUEST", message: "Invalid request payload" },
    })
  })

  it("returns auth error response unchanged when request is unauthorized", async () => {
    mocks.requireApiAuthMock.mockResolvedValue(
      MockNextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }),
    )

    const [validateResponse, extraResponse, waitResponse] = await Promise.all([
      postValidate(
        new Request("http://localhost/api/agent/validate", {
          method: "POST",
          body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey" }),
        }),
      ),
      postExtraAgents(
        new Request("http://localhost/api/agent/extra-agents", {
          method: "POST",
          body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent" }),
        }),
      ),
      postWait(
        new Request("http://localhost/api/agent/wait", {
          method: "POST",
          body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent" }),
        }),
      ),
    ])

    expect(validateResponse.status).toBe(401)
    expect(extraResponse.status).toBe(401)
    expect(waitResponse.status).toBe(401)
  })

  it("rejects validate route when authentication context is missing", async () => {
    mocks.requireApiAuthMock.mockResolvedValue(
      MockNextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }),
    )

    const response = await postValidate(
      new Request("http://localhost/api/agent/validate", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey" }),
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    })
  })

  it("rejects validate route for wallet mismatch", async () => {
    const response = await postValidate(
      new Request("http://localhost/api/agent/validate", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xdef", apiPrivateKey: "0xkey" }),
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: { code: "FORBIDDEN", message: "userAddress must match authenticated wallet" },
    })
    expect(mocks.validateApiKeyMock).not.toHaveBeenCalled()
  })

  it("returns explicit missing status payload when api key is invalid", async () => {
    mocks.validateApiKeyMock.mockResolvedValue({ valid: false, error: "API key revoked" })

    const response = await postValidate(
      new Request("http://localhost/api/agent/validate", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      state: "missing",
      status: "missing",
      reason: "API key revoked",
      apiWalletAddress: null,
      approvalUrl: "https://app.hyperliquid.xyz/API",
    })
  })

  it("returns explicit missing status payload when key belongs to different master", async () => {
    mocks.validateApiKeyMock.mockResolvedValue({
      valid: true,
      masterAddress: "0xdef",
      apiWalletAddress: "0xagent",
    })

    const response = await postValidate(
      new Request("http://localhost/api/agent/validate", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      state: "missing",
      status: "missing",
      reason: "API key belongs to 0xdef, not 0xabc",
      apiWalletAddress: "0xagent",
      approvalUrl: "https://app.hyperliquid.xyz/API",
    })
  })

  it("returns explicit active status payload when extra-agent approval is active", async () => {
    const validUntilSeconds = Math.floor(Date.now() / 1000) + 3600
    mocks.validateApiKeyMock.mockResolvedValue({
      valid: true,
      masterAddress: "0xabc",
      apiWalletAddress: "0xagent",
    })
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: validUntilSeconds }])

    const response = await postValidate(
      new Request("http://localhost/api/agent/validate", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey" }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "active",
      status: "active",
      apiWalletAddress: "0xagent",
      approvalUrl: "https://app.hyperliquid.xyz/API",
      validUntil: validUntilSeconds * 1000,
    })
  })

  it("enforces session wallet match for validate/extra-agents/wait routes", async () => {
    const [validateResponse, extraResponse, waitResponse] = await Promise.all([
      postValidate(
        new Request("http://localhost/api/agent/validate", {
          method: "POST",
          body: JSON.stringify({ userAddress: "0xdef", apiPrivateKey: "0xkey" }),
        }),
      ),
      postExtraAgents(
        new Request("http://localhost/api/agent/extra-agents", {
          method: "POST",
          body: JSON.stringify({ userAddress: "0xdef", apiWalletAddress: "0xagent" }),
        }),
      ),
      postWait(
        new Request("http://localhost/api/agent/wait", {
          method: "POST",
          body: JSON.stringify({ userAddress: "0xdef", apiWalletAddress: "0xagent" }),
        }),
      ),
    ])

    await expect(validateResponse.json()).resolves.toEqual({
      error: { code: "FORBIDDEN", message: "userAddress must match authenticated wallet" },
    })
    await expect(extraResponse.json()).resolves.toEqual({
      error: { code: "FORBIDDEN", message: "userAddress must match authenticated wallet" },
    })
    await expect(waitResponse.json()).resolves.toEqual({
      error: { code: "FORBIDDEN", message: "userAddress must match authenticated wallet" },
    })
    expect(mocks.validateApiKeyMock).not.toHaveBeenCalled()
    expect(mocks.waitForApprovalMock).not.toHaveBeenCalled()
  })
})
