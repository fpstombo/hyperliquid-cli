import { NextRequest, NextResponse } from "next/server"
import { fetchPrices, getWebRuntimeConfig } from "../../../../../src/lib/web-readonly-adapter"
import type { ApiError, PricesResponse } from "../../../../lib/api-types"

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase()
    const data = await fetchPrices(getWebRuntimeConfig())

    const response: PricesResponse = {
      ...data,
      symbol,
      price: symbol ? data.prices[symbol] : undefined,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    const body: ApiError = { error: error instanceof Error ? error.message : "Failed to fetch prices" }
    return NextResponse.json(body, { status: 500 })
  }
}
