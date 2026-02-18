import { NextResponse } from "next/server"
import { executeMarketOrder, toApiError } from "../../../../lib/trading"

export async function POST(request: Request) {
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
    return NextResponse.json(toApiError(error), { status: 400 })
  }
}
