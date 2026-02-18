import { NextResponse } from "next/server"
import { getExtraAgents, waitForApproval } from "../../../../../../src/lib/api-wallet"
import type { Address } from "viem"

function asMs(value: number): number {
  return value > 1_000_000_000_000 ? value : value * 1000
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userAddress?: string
      apiWalletAddress?: string
      isTestnet?: boolean
      pollIntervalMs?: number
      maxAttempts?: number
    }

    if (!body.userAddress || !body.apiWalletAddress) {
      return NextResponse.json({ error: "Missing userAddress or apiWalletAddress" }, { status: 400 })
    }

    const approved = await waitForApproval(
      body.apiWalletAddress as Address,
      body.userAddress as Address,
      body.isTestnet ?? false,
      body.pollIntervalMs,
      body.maxAttempts,
    )

    const extraAgents = await getExtraAgents(body.userAddress as Address, body.isTestnet ?? false)
    const extraAgent = extraAgents.find((item) => item.address.toLowerCase() === body.apiWalletAddress?.toLowerCase())

    return NextResponse.json({
      ok: true,
      approved,
      state: approved ? "active" : "pending",
      validUntil: extraAgent ? asMs(extraAgent.validUntil) : undefined,
      updatedAt: Date.now(),
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed while waiting for approval" }, { status: 500 })
  }
}
