import type {
  ApiError,
  BalancesResponse,
  OrdersResponse,
  PositionsResponse,
  PricesResponse,
} from "./api-types"
import { HttpError } from "./hooks/use-polling-resource"

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" })
  const body = (await response.json()) as T | ApiError

  if (!response.ok) {
    const message = (body as ApiError).error?.message ?? "Request failed"
    throw new HttpError(message, response.status)
  }

  return body as T
}

export function fetchBalances(): Promise<BalancesResponse> {
  return requestJson<BalancesResponse>("/api/balances")
}

export function fetchPositions(): Promise<PositionsResponse> {
  return requestJson<PositionsResponse>("/api/positions")
}

export function fetchOrders(): Promise<OrdersResponse> {
  return requestJson<OrdersResponse>("/api/orders")
}

export function fetchPrices(symbol?: string): Promise<PricesResponse> {
  const search = symbol ? `?symbol=${encodeURIComponent(symbol)}` : ""
  return requestJson<PricesResponse>(`/api/prices${search}`)
}
