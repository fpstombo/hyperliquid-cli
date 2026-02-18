import { NextResponse } from "next/server"
import { executeLimitOrder, toApiError } from "../../../../lib/trading"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      side: string
      size: string
      coin: string
      price: string
      tif: string
      reduceOnly?: boolean
    }

    const result = await executeLimitOrder(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(toApiError(error), { status: 400 })
  }
}
