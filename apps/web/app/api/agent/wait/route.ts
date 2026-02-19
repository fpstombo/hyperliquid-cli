import { NextResponse } from "next/server"
import { getExtraAgents, waitForApproval } from "../../../../../../src/lib/api-wallet"
import { requireApiAuth } from "../../../../lib/api-auth"
import { createApiError } from "../../../../lib/api-types"
import { deriveExtraAgentsState } from "../../../../lib/agent-state-server"
import type { Address } from "viem"

export async function POST(request: Request) {
  const auth = await requireApiAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    const body = (await request.json()) as {
      userAddress?: string
      apiWalletAddress?: string
      pollIntervalMs?: number
      maxAttempts?: number
    }

    if (!body.userAddress || !body.apiWalletAddress) {
      return NextResponse.json(createApiError("BAD_REQUEST", "Missing userAddress or apiWalletAddress"), { status: 400 })
    }

    if (body.userAddress.toLowerCase() !== auth.walletAddress.toLowerCase()) {
      return NextResponse.json(createApiError("FORBIDDEN", "userAddress must match authenticated wallet"), { status: 403 })
    }

    const isTestnet = auth.environment === "testnet"

    const approved = await waitForApproval(
      body.apiWalletAddress as Address,
      body.userAddress as Address,
      isTestnet,
      body.pollIntervalMs,
      body.maxAttempts,
    )

    const extraAgents = await getExtraAgents(body.userAddress as Address, isTestnet)
    const state = deriveExtraAgentsState({
      apiWalletAddress: body.apiWalletAddress,
      validationValid: true,
      extraAgents,
      lastKnownState: approved ? "pending" : undefined,
    })

    const approvedFromLifecycle = state.state === "active"

    return NextResponse.json({
      ok: true,
      approved: approvedFromLifecycle,
      state: state.state,
      validUntil: state.validUntil,
      reason: state.reason,
      updatedAt: Date.now(),
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(createApiError("BAD_REQUEST", "Invalid request payload"), { status: 400 })
    }

    return NextResponse.json(
      createApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Failed while waiting for approval"),
      { status: 500 },
    )
  }
}
