import { NextResponse } from "next/server"
import { requireApiAuth, verifyAuthorizedTradingAccount } from "../../../../lib/api-auth"
import { createApiError } from "../../../../lib/api-types"
import { executeMarketOrder, toApiError } from "../../../../lib/trading"

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
    const body = (await request.json()) as {
      side: string
      size: string
      coin: string
      reduceOnly?: boolean
      slippage: string
    }

    const result = await executeMarketOrder(body)
    return NextResponse.json(result)
  } catch (error) {
    const body = error instanceof SyntaxError ? createApiError("BAD_REQUEST", "Invalid request payload") : toApiError(error)
    return NextResponse.json(body, { status: 400 })
  }
}
