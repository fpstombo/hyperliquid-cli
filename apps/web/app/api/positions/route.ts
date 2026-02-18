import { NextResponse } from "next/server"
import { fetchPositions, getWebRuntimeConfig } from "../../../../../src/lib/web-readonly-adapter"
import type { ApiError, PositionsResponse } from "../../../../lib/api-types"

export async function GET() {
  try {
    const data = await fetchPositions(getWebRuntimeConfig())
    const response: PositionsResponse = {
      ...data,
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(response)
  } catch (error) {
    const body: ApiError = { error: error instanceof Error ? error.message : "Failed to fetch positions" }
    return NextResponse.json(body, { status: 500 })
  }
}
