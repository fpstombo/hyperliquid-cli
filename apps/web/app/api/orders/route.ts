import { NextResponse } from "next/server"
import { fetchOrders } from "../../../../../src/lib/web-readonly-adapter"
import { createRouteRuntimeConfig, requireApiAuth } from "../../../lib/api-auth"
import { createApiError, type OrdersResponse } from "../../../lib/api-types"

export async function GET(request: Request) {
  const auth = await requireApiAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    const data = await fetchOrders(createRouteRuntimeConfig(auth))
    const response: OrdersResponse = {
      orders: data,
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (error) {
    const body = createApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Failed to fetch orders")
    return NextResponse.json(body, { status: 500 })
  }
}
