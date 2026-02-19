import { NextResponse } from "next/server"
import { getApprovalUrl, getExtraAgents, validateApiKey } from "../../../../../../src/lib/api-wallet"
import { requireApiAuth } from "../../../../lib/api-auth"
import { createApiError } from "../../../../lib/api-types"
import { deriveValidateAgentState, missing } from "../../../../lib/agent-state-server"
import type { Address, Hex } from "viem"

type ValidateStatus = "pending" | "active" | "missing"

function toValidateStatus(state: string): ValidateStatus {
  if (state === "active" || state === "pending") {
    return state
  }
  return "missing"
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
      const derived = missing("error" in validation ? validation.error : undefined)
      return NextResponse.json({
        ok: false,
        state: derived.state,
        status: toValidateStatus(derived.state),
        reason: derived.reason,
        apiWalletAddress: null,
        approvalUrl: getApprovalUrl(isTestnet),
      })
    }

    if (validation.masterAddress.toLowerCase() !== body.userAddress.toLowerCase()) {
      return NextResponse.json({
        ok: false,
        state: "missing",
        status: "missing",
        reason: `API key belongs to ${validation.masterAddress}, not ${body.userAddress}`,
        apiWalletAddress: validation.apiWalletAddress,
        approvalUrl: getApprovalUrl(isTestnet),
      })
    }

    const extraAgents = await getExtraAgents(body.userAddress as Address, isTestnet)
    const derived = deriveValidateAgentState({
      apiWalletAddress: validation.apiWalletAddress,
      extraAgents,
      validationValid: validation.valid,
    })

    return NextResponse.json({
      ok: true,
      state: derived.state,
      status: toValidateStatus(derived.state),
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
