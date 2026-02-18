import { NextResponse } from "next/server"
import { fetchOpenOrders, toApiError } from "../../../../lib/trading"

export async function GET() {
  try {
    const orders = await fetchOpenOrders()
    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json(toApiError(error), { status: 400 })
  }
}
