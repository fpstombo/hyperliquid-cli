import { NextResponse } from "next/server"
import { fetchOpenOrders, resolveTradingContext, toApiError } from "../../../lib/trading"
import { requireAuthenticatedSession } from "../../../lib/server-session"
import type { ApiError, OrdersResponse } from "../../../lib/api-types"

export async function GET() {
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
  }
}
