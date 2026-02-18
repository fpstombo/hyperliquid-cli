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

vi.mock("/workspace/hyperliquid-cli/src/lib/api-wallet", () => ({
  validateApiKey: mocks.validateApiKeyMock,
  getExtraAgents: mocks.getExtraAgentsMock,
  getApprovalUrl: mocks.getApprovalUrlMock,
  waitForApproval: mocks.waitForApprovalMock,
}))

import { POST as postValidate } from "../../apps/web/app/api/agent/validate/route"
import { GET as getExtraAgents } from "../../apps/web/app/api/agent/extra-agents/route"
import { POST as postWait } from "../../apps/web/app/api/agent/wait/route"

describe("agent onboarding + status API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
        body: JSON.stringify({ userAddress: "0xabc", apiPrivateKey: "0xkey", isTestnet: true }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "pending",
      apiWalletAddress: "0xagent",
      reason: "Approval request exists but agent is not active yet.",
    })
  })

  it("returns active state for matching extra-agent approvals", async () => {
    const validUntilSeconds = Math.floor(Date.now() / 1000) + 3600
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: validUntilSeconds }])

    const response = await getExtraAgents(
      new Request(
        "http://localhost/api/agent/extra-agents?userAddress=0xabc&apiWalletAddress=0xagent&isTestnet=true&lastKnownState=pending",
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "active",
      validUntil: validUntilSeconds * 1000,
    })
  })

  it("marks active/pending sessions as revoked when validation fails", async () => {
    mocks.validateApiKeyMock.mockResolvedValue({ valid: false, error: "invalid key" })
    mocks.getExtraAgentsMock.mockResolvedValue([])

    const response = await getExtraAgents(
      new Request(
        "http://localhost/api/agent/extra-agents?userAddress=0xabc&apiWalletAddress=0xagent&isTestnet=false&lastKnownState=active&apiPrivateKey=0xkey",
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      state: "revoked",
      reason: "invalid key",
    })
  })

  it("wait endpoint reports active state and validity for approved agents", async () => {
    const validUntilSeconds = Math.floor(Date.now() / 1000) + 3600
    mocks.waitForApprovalMock.mockResolvedValue(true)
    mocks.getExtraAgentsMock.mockResolvedValue([{ address: "0xagent", validUntil: validUntilSeconds }])

    const response = await postWait(
      new Request("http://localhost/api/agent/wait", {
        method: "POST",
        body: JSON.stringify({ userAddress: "0xabc", apiWalletAddress: "0xagent", isTestnet: true, maxAttempts: 2 }),
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
})
