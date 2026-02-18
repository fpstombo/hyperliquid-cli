import { NextResponse } from "next/server"
import { fetchOpenOrders, resolveTradingContext, toApiError } from "../../../../lib/trading"
import { requireAuthenticatedSession } from "../../../../lib/server-session"

export async function GET() {
  try {
    const session = await requireAuthenticatedSession()
    const context = resolveTradingContext(session)
    const orders = await fetchOpenOrders(context)
    return NextResponse.json({
      orders,
      context: {
        environment: context.environment,
        user: context.user,
        accountSource: context.accountSource,
        accountAlias: context.accountAlias,
      },
    })
  } catch (error) {
    return NextResponse.json(toApiError(error), { status: 400 })
  }
}
