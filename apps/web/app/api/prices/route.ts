import { NextResponse } from "next/server"
import { fetchPrices } from "../../../lib/web-readonly-adapter"
import { createRouteRuntimeConfig, requireApiAuth } from "../../../lib/api-auth"
import { createApiError, type PricesResponse } from "../../../lib/api-types"

export async function GET(request: Request) {
  const auth = await requireApiAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    const url = new URL(request.url)
    const symbol = url.searchParams.get("symbol")?.toUpperCase()
    const data = await fetchPrices(createRouteRuntimeConfig(auth))

    const response: PricesResponse = {
      ...data,
      symbol,
      price: symbol ? data.prices[symbol] : undefined,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    const body = createApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Failed to fetch prices")
    return NextResponse.json(body, { status: 500 })
  }
}
