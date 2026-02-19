import type { Address } from "viem"
import type { ApprovalState } from "./agent-state"

export interface AgentStateResult {
  state: ApprovalState
  validUntil?: number
  reason?: string
}

export function asMs(value: number): number {
  return value > 1_000_000_000_000 ? value : value * 1000
}

export function active(validUntil?: number): AgentStateResult {
  return { state: "active", validUntil }
}

export function pending(reason: string): AgentStateResult {
  return { state: "pending", reason }
}

export function expired(validUntil: number, reason = "Agent approval has expired."): AgentStateResult {
  return { state: "expired", validUntil, reason }
}

export function revoked(reason = "Agent authorization no longer valid."): AgentStateResult {
  return { state: "revoked", reason }
}

export function missing(reason = "Agent authorization not found."): AgentStateResult {
  return { state: "missing", reason }
}

export function findMatchingExtraAgent(
  apiWalletAddress: string,
  extraAgents: Array<{ address: Address; validUntil: number }>,
): { address: Address; validUntil: number } | undefined {
  return extraAgents.find((agent) => agent.address.toLowerCase() === apiWalletAddress.toLowerCase())
}

export function deriveValidateAgentState(input: {
  apiWalletAddress: string
  extraAgents: Array<{ address: Address; validUntil: number }>
  validationValid: boolean
  validationError?: string
  nowMs?: number
}): AgentStateResult {
  const match = findMatchingExtraAgent(input.apiWalletAddress, input.extraAgents)

  if (match) {
    const validUntil = asMs(match.validUntil)
    if ((input.nowMs ?? Date.now()) >= validUntil) {
      return expired(validUntil)
    }
    return active(validUntil)
  }

  if (!input.validationValid) {
    return missing(input.validationError ?? "API key is not currently authorized.")
  }

  return pending("Approval request exists but agent is not active yet.")
}

export function deriveExtraAgentsState(input: {
  apiWalletAddress: string
  validationValid: boolean
  extraAgents: Array<{ address: Address; validUntil: number }>
  lastKnownState?: ApprovalState
  validationError?: string
  nowMs?: number
}): AgentStateResult {
  const match = findMatchingExtraAgent(input.apiWalletAddress, input.extraAgents)

  if (match) {
    const validUntil = asMs(match.validUntil)
    if ((input.nowMs ?? Date.now()) >= validUntil) {
      return expired(validUntil)
    }
    return active(validUntil)
  }

  if (!input.validationValid) {
    if (input.lastKnownState === "active" || input.lastKnownState === "pending") {
      return revoked(input.validationError)
    }
    return missing(input.validationError)
  }

  return pending("Approval is still pending on Hyperliquid.")
}
