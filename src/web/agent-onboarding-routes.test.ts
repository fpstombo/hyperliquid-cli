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
        body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey", isTestnet: false }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "pending",
      apiWalletAddress: "0xagent",
      reason: "Approval request exists but agent is not active yet.",
    })
    expect(mocks.validateApiKeyMock).toHaveBeenCalledWith("0xkey", true)
  })

  it("accepts secure POST shape for extra-agents status checks", async () => {
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
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent", isTestnet: false, maxAttempts: 2 }),
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

  it("returns auth error response unchanged when request is unauthorized", async () => {
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
    expect(mocks.validateApiKeyMock).not.toHaveBeenCalled()
  })
})
