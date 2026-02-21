import { NextResponse } from "next/server"
import { fetchOpenOrders, resolveTradingContext, toApiError } from "../../../lib/trading"
import { requireAuthenticatedSession } from "../../../lib/server-session"
import type { OrdersResponse } from "../../../lib/api-types"
import { requireApiAuth, verifyAuthorizedTradingAccount } from "../../../lib/api-auth"

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
    const data = await fetchOpenOrders(context)

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
    if (error instanceof Error && error.message.includes("No trading account resolved")) {
      const response: OrdersResponse = {
        orders: [],
        updatedAt: new Date().toISOString(),
        context: {
          environment: auth.environment,
          user: auth.tradingAccount,
          accountSource: "environment_variables",
          accountAlias: null,
        },
      }
      return NextResponse.json(response)
    }

    const body = toApiError(error)
    return NextResponse.json(body, { status: 400 })
  }
}
