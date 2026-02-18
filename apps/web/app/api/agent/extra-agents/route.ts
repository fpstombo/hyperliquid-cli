import { NextResponse } from "next/server"
import { getExtraAgents, validateApiKey } from "../../../../../../src/lib/api-wallet"
import type { ApprovalState } from "../../../../lib/agent-state"
import type { Address, Hex } from "viem"

function asMs(value: number): number {
  return value > 1_000_000_000_000 ? value : value * 1000
}

function deriveState(args: {
  userAddress: string
  apiWalletAddress: string
  validationValid: boolean
  extraAgents: Array<{ address: Address; validUntil: number }>
  lastKnownState?: ApprovalState
  validationError?: string
}): { state: ApprovalState; validUntil?: number; reason?: string } {
  const extra = args.extraAgents.find((agent) => agent.address.toLowerCase() === args.apiWalletAddress.toLowerCase())

  if (extra) {
    const validUntil = asMs(extra.validUntil)
    if (Date.now() >= validUntil) {
      return { state: "expired", validUntil, reason: "Agent approval has expired." }
    }
    return { state: "active", validUntil }
  }

  if (!args.validationValid) {
    if (args.lastKnownState === "active" || args.lastKnownState === "pending") {
      return { state: "revoked", reason: args.validationError ?? "Agent authorization no longer valid." }
    }
    return { state: "missing", reason: args.validationError ?? "Agent authorization not found." }
  }

  return { state: "pending", reason: "Approval is still pending on Hyperliquid." }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get("userAddress")
    const apiWalletAddress = searchParams.get("apiWalletAddress")
    const isTestnet = searchParams.get("isTestnet") === "true"
    const lastKnownState = searchParams.get("lastKnownState") as ApprovalState | null
    const apiPrivateKey = searchParams.get("apiPrivateKey")

    if (!userAddress || !apiWalletAddress) {
      return NextResponse.json({ error: "Missing userAddress or apiWalletAddress" }, { status: 400 })
    }

    let validationValid = true
    let validationError: string | undefined

    if (apiPrivateKey) {
      const validation = await validateApiKey(apiPrivateKey as Hex, isTestnet)
      validationValid = validation.valid && validation.apiWalletAddress.toLowerCase() === apiWalletAddress.toLowerCase()
      if (!validation.valid) {
        validationError = validation.error
      }
    }

    const extraAgents = await getExtraAgents(userAddress as Address, isTestnet)
    const derived = deriveState({
      userAddress,
      apiWalletAddress,
      validationValid,
      validationError,
      extraAgents,
      lastKnownState: lastKnownState ?? undefined,
    })

    return NextResponse.json({
      ok: true,
      state: derived.state,
      reason: derived.reason,
      validUntil: derived.validUntil,
      extraAgents: extraAgents.map((agent) => ({ ...agent, validUntil: asMs(agent.validUntil) })),
      updatedAt: Date.now(),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load agent state" }, { status: 500 })
  }
}
