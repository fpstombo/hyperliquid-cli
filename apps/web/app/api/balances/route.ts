import { NextResponse } from "next/server"
import { fetchBalances, getWebRuntimeConfig } from "../../../../../src/lib/web-readonly-adapter"
import type { ApiError, BalancesResponse } from "../../../../lib/api-types"

export async function GET() {
  try {
    const data = await fetchBalances(getWebRuntimeConfig())
    const response: BalancesResponse = {
      ...data,
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (error) {
    const body: ApiError = { error: error instanceof Error ? error.message : "Failed to fetch balances" }
    return NextResponse.json(body, { status: 500 })
  }
}
