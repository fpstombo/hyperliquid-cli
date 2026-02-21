import { NextResponse } from "next/server"
import { fetchOpenOrders, resolveTradingContext, toApiError } from "../../../../lib/trading"
import { requireAuthenticatedSession } from "../../../../lib/server-session"
import { requireApiAuth, verifyAuthorizedTradingAccount } from "../../../../lib/api-auth"

export async function GET(request: Request) {
  const auth = await requireApiAuth(request)
  if (auth instanceof Response) {
    return auth
  }

  const accountError = verifyAuthorizedTradingAccount(auth)
  if (accountError) {
    return accountError
  }

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
    if (error instanceof Error && error.message.includes("No trading account resolved")) {
      return NextResponse.json({
        orders: [],
        context: {
          environment: auth.environment,
          user: auth.tradingAccount,
          accountSource: "environment_variables",
          accountAlias: null,
        },
      })
    }

    const body = toApiError(error)
    return NextResponse.json(body, { status: 400 })
  }
}
