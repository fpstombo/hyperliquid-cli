import { NextResponse } from "next/server"
import { fetchOrders, getWebRuntimeConfig } from "../../../../../src/lib/web-readonly-adapter"
import type { ApiError, OrdersResponse } from "../../../../lib/api-types"

export async function GET() {
  try {
    const data = await fetchOrders(getWebRuntimeConfig())
    const response: OrdersResponse = {
      orders: data,
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (error) {
    const body: ApiError = { error: error instanceof Error ? error.message : "Failed to fetch orders" }
    return NextResponse.json(body, { status: 500 })
  }
}
