import { NextResponse } from "next/server"
import { executeLimitOrder, resolveTradingContext, toApiError } from "../../../../lib/trading"
import { requireAuthenticatedSession } from "../../../../lib/server-session"
import { requireApiAuth, verifyAuthorizedTradingAccount } from "../../../../lib/api-auth"
import { createApiError } from "../../../../lib/api-types"
import { executeLimitOrder, toApiError } from "../../../../lib/trading"

export async function POST(request: Request) {
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
    const body = (await request.json()) as {
      side: string
      size: string
      coin: string
      price: string
      tif: string
      reduceOnly?: boolean
    }

    const result = await executeLimitOrder(context, body)
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
    const body = error instanceof SyntaxError ? createApiError("BAD_REQUEST", "Invalid request payload") : toApiError(error)
    return NextResponse.json(body, { status: 400 })
  }
}
