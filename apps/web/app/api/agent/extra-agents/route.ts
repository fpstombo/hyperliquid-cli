import { NextResponse } from "next/server"
import { getExtraAgents, validateApiKey } from "../../../../../../src/lib/api-wallet"
import type { ApprovalState } from "../../../../lib/agent-state"
import { requireApiAuth } from "../../../../lib/api-auth"
import { createApiError } from "../../../../lib/api-types"
import { asMs, deriveExtraAgentsState } from "../../../../lib/agent-state-server"
import type { Address, Hex } from "viem"

export async function POST(request: Request) {
  const auth = await requireApiAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.has("apiPrivateKey")) {
      return NextResponse.json(createApiError("BAD_REQUEST", "apiPrivateKey must be sent in the JSON body"), { status: 400 })
    }

    const body = (await request.json()) as {
      userAddress?: string
      apiWalletAddress?: string
      apiPrivateKey?: string
      lastKnownState?: ApprovalState
    }

    if (!body.userAddress || !body.apiWalletAddress) {
      return NextResponse.json(createApiError("BAD_REQUEST", "Missing userAddress or apiWalletAddress"), { status: 400 })
    }

    if (body.userAddress.toLowerCase() !== auth.walletAddress.toLowerCase()) {
      return NextResponse.json(createApiError("FORBIDDEN", "userAddress must match authenticated wallet"), { status: 403 })
    }

    const isTestnet = auth.environment === "testnet"
    let validationValid = true
    let validationError: string | undefined

    if (body.apiPrivateKey) {
      const validation = await validateApiKey(body.apiPrivateKey as Hex, isTestnet)
      validationValid = validation.valid && validation.apiWalletAddress.toLowerCase() === body.apiWalletAddress.toLowerCase()
      if (!validation.valid) {
        validationError = validation.error
      }
    }

    const extraAgents = await getExtraAgents(body.userAddress as Address, isTestnet)
    const derived = deriveExtraAgentsState({
      apiWalletAddress: body.apiWalletAddress,
      validationValid,
      validationError,
      extraAgents,
      lastKnownState: body.lastKnownState,
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
    if (error instanceof SyntaxError) {
      return NextResponse.json(createApiError("BAD_REQUEST", "Invalid request payload"), { status: 400 })
    }

    return NextResponse.json(
      createApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Failed to load agent state"),
      { status: 500 },
    )
  }
}
