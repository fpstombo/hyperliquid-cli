import { NextResponse } from "next/server"
import { requireApiAuth, verifyAuthorizedTradingAccount } from "../../../../lib/api-auth"
import { fetchOpenOrders, toApiError } from "../../../../lib/trading"

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
    const orders = await fetchOpenOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json(toApiError(error), { status: 400 })
  }
}
