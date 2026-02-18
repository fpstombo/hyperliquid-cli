import { NextResponse } from "next/server"
import { getApprovalUrl, getExtraAgents, validateApiKey } from "../../../../../../src/lib/api-wallet"
import type { ApprovalState } from "../../../../lib/agent-state"
import type { Address, Hex } from "viem"

function asMs(value: number): number {
  return value > 1_000_000_000_000 ? value : value * 1000
}

function deriveState(input: {
  apiWalletAddress: string
  extraAgents: Array<{ address: Address; validUntil: number }>
  validationValid: boolean
  validationError?: string
}): { state: ApprovalState; validUntil?: number; reason?: string } {
  const match = input.extraAgents.find((agent) => agent.address.toLowerCase() === input.apiWalletAddress.toLowerCase())

  if (match) {
    const validUntil = asMs(match.validUntil)
    if (Date.now() >= validUntil) {
      return { state: "expired", validUntil, reason: "Agent approval has expired." }
    }
    return { state: "active", validUntil }
  }

  if (!input.validationValid) {
    return { state: "missing", reason: input.validationError ?? "API key is not currently authorized." }
  }

  return { state: "pending", reason: "Approval request exists but agent is not active yet." }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      apiPrivateKey?: string
      userAddress?: string
      isTestnet?: boolean
    }

    if (!body.apiPrivateKey || !body.userAddress) {
      return NextResponse.json({ error: "Missing apiPrivateKey or userAddress" }, { status: 400 })
    }

    const validation = await validateApiKey(body.apiPrivateKey as Hex, body.isTestnet ?? false)

    if (!validation.valid) {
      return NextResponse.json({
        ok: false,
        state: "missing" satisfies ApprovalState,
        reason: validation.error,
        approvalUrl: getApprovalUrl(body.isTestnet ?? false),
      })
    }

    if (validation.masterAddress.toLowerCase() !== body.userAddress.toLowerCase()) {
      return NextResponse.json({
        ok: false,
        state: "missing" satisfies ApprovalState,
        reason: `API key belongs to ${validation.masterAddress}, not ${body.userAddress}`,
        apiWalletAddress: validation.apiWalletAddress,
        approvalUrl: getApprovalUrl(body.isTestnet ?? false),
      })
    }

    const extraAgents = await getExtraAgents(body.userAddress as Address, body.isTestnet ?? false)
    const derived = deriveState({
      apiWalletAddress: validation.apiWalletAddress,
      extraAgents,
      validationValid: validation.valid,
    })

    return NextResponse.json({
      ok: true,
      state: derived.state,
      reason: derived.reason,
      validUntil: derived.validUntil,
      masterAddress: validation.masterAddress,
      apiWalletAddress: validation.apiWalletAddress,
      approvalUrl: getApprovalUrl(body.isTestnet ?? false),
      updatedAt: Date.now(),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to validate key" }, { status: 500 })
  }
}
