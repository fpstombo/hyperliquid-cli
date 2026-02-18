import { NextResponse } from "next/server"
import { cancelOrder, toApiError } from "../../../../lib/trading"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { oid: string; coin: string }
    const result = await cancelOrder(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(toApiError(error), { status: 400 })
  }
}
