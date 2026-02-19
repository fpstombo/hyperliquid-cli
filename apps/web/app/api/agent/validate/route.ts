import { NextResponse } from "next/server"
import { getApprovalUrl, getExtraAgents, validateApiKey } from "../../../../../../src/lib/api-wallet"
import type { ApprovalState } from "../../../../lib/agent-state"
import { requireApiAuth } from "../../../../lib/api-auth"
import { createApiError } from "../../../../lib/api-types"
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
  const auth = await requireApiAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    const body = (await request.json()) as {
      apiPrivateKey?: string
      userAddress?: string
    }

    if (!body.apiPrivateKey || !body.userAddress) {
      return NextResponse.json(createApiError("BAD_REQUEST", "Missing apiPrivateKey or userAddress"), { status: 400 })
    }

    if (body.userAddress.toLowerCase() !== auth.walletAddress.toLowerCase()) {
      return NextResponse.json(createApiError("FORBIDDEN", "userAddress must match authenticated wallet"), { status: 403 })
    }

    const isTestnet = auth.environment === "testnet"
    const validation = await validateApiKey(body.apiPrivateKey as Hex, isTestnet)

    if (!validation.valid) {
      return NextResponse.json({
        ok: false,
        state: "missing" satisfies ApprovalState,
        reason: validation.error,
        approvalUrl: getApprovalUrl(isTestnet),
      })
    }

    if (validation.masterAddress.toLowerCase() !== body.userAddress.toLowerCase()) {
      return NextResponse.json({
        ok: false,
        state: "missing" satisfies ApprovalState,
        reason: `API key belongs to ${validation.masterAddress}, not ${body.userAddress}`,
        apiWalletAddress: validation.apiWalletAddress,
        approvalUrl: getApprovalUrl(isTestnet),
      })
    }

    const extraAgents = await getExtraAgents(body.userAddress as Address, isTestnet)
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
      approvalUrl: getApprovalUrl(isTestnet),
      updatedAt: Date.now(),
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(createApiError("BAD_REQUEST", "Invalid request payload"), { status: 400 })
    }

    return NextResponse.json(
      createApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Failed to validate key"),
      { status: 500 },
    )
  }
}
