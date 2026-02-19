import { describe, expect, it } from "vitest"
import { asMs, deriveExtraAgentsState, deriveValidateAgentState } from "../../apps/web/lib/agent-state-server"

describe("agent-state-server helpers", () => {
  it("treats exact expiry boundary as expired", () => {
    const nowMs = 1_730_000_000_000
    const state = deriveExtraAgentsState({
      apiWalletAddress: "0xagent",
      validationValid: true,
      extraAgents: [{ address: "0xagent", validUntil: nowMs / 1000 }],
      nowMs,
    })

    expect(state).toEqual({
      state: "expired",
      validUntil: nowMs,
      reason: "Agent approval has expired.",
    })
  })

  it("falls back to revoked when previously active/pending key validation fails", () => {
    const state = deriveExtraAgentsState({
      apiWalletAddress: "0xagent",
      validationValid: false,
      lastKnownState: "pending",
      extraAgents: [],
    })

    expect(state).toEqual({
      state: "revoked",
      reason: "Agent authorization no longer valid.",
    })
  })

  it("uses missing transition for invalid keys without active/pending history", () => {
    const state = deriveExtraAgentsState({
      apiWalletAddress: "0xagent",
      validationValid: false,
      validationError: "API key revoked",
      lastKnownState: "missing",
      extraAgents: [],
    })

    expect(state).toEqual({
      state: "missing",
      reason: "API key revoked",
    })
  })

  it("normalizes timestamps from seconds to milliseconds", () => {
    expect(asMs(1_730_000_000)).toBe(1_730_000_000_000)
    expect(asMs(1_730_000_000_000)).toBe(1_730_000_000_000)
  })

  it("returns missing state for validate flow when key is invalid", () => {
    const state = deriveValidateAgentState({
      apiWalletAddress: "0xagent",
      validationValid: false,
      validationError: "Invalid key",
      extraAgents: [],
    })

    expect(state).toEqual({
      state: "missing",
      reason: "Invalid key",
    })
  })
})
