import { NextResponse } from "next/server"
import { executeMarketOrder, resolveTradingContext, toApiError } from "../../../../lib/trading"
import { requireAuthenticatedSession } from "../../../../lib/server-session"

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedSession()
    const context = resolveTradingContext(session)
    const body = (await request.json()) as {
      side: string
      size: string
      coin: string
      reduceOnly?: boolean
      slippage: string
    }

    const result = await executeMarketOrder(context, body)
    return NextResponse.json({
      ...result,
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
