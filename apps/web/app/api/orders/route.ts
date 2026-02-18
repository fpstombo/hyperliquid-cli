import { NextResponse } from "next/server"
import { fetchOpenOrders, resolveTradingContext, toApiError } from "../../../lib/trading"
import { requireAuthenticatedSession } from "../../../lib/server-session"
import type { ApiError, OrdersResponse } from "../../../lib/api-types"
import { fetchOrders } from "../../../../../src/lib/web-readonly-adapter"
import { createRouteRuntimeConfig, requireApiAuth } from "../../../lib/api-auth"
import { createApiError, type OrdersResponse } from "../../../lib/api-types"

export async function GET(request: Request) {
  const auth = await requireApiAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  try {
    const session = await requireAuthenticatedSession()
    const context = resolveTradingContext(session)
    const data = await fetchOpenOrders(context)

    const response: OrdersResponse & {
      context: {
        environment: string
        user: string
        accountSource: string
        accountAlias: string | null
      }
    } = {
    const data = await fetchOrders(createRouteRuntimeConfig(auth))
    const response: OrdersResponse = {
      orders: data,
      updatedAt: new Date().toISOString(),
      context: {
        environment: context.environment,
        user: context.user,
        accountSource: context.accountSource,
        accountAlias: context.accountAlias,
      },
    }
    return NextResponse.json(response)
  } catch (error) {
    const body: ApiError = toApiError(error)
    return NextResponse.json(body, { status: 400 })
    const body = createApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Failed to fetch orders")
    return NextResponse.json(body, { status: 500 })
  }
}
