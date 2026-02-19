import { NextResponse } from "next/server"
import { getExtraAgents, waitForApproval } from "../../../../../../src/lib/api-wallet"
import { requireApiAuth } from "../../../../lib/api-auth"
import { createApiError } from "../../../../lib/api-types"
import type { Address } from "viem"

function asMs(value: number): number {
  return value > 1_000_000_000_000 ? value : value * 1000
}

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
    const extraAgent = extraAgents.find((item) => item.address.toLowerCase() === body.apiWalletAddress?.toLowerCase())

    return NextResponse.json({
      ok: true,
      approved,
      state: approved ? "active" : "pending",
      validUntil: extraAgent ? asMs(extraAgent.validUntil) : undefined,
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
