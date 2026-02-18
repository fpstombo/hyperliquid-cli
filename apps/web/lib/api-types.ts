export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_ERROR"
  | "ORDER_ERROR"

export interface ApiError {
  error: {
    code: ApiErrorCode
    message: string
  }
}

export function createApiError(code: ApiErrorCode, message: string): ApiError {
  return {
    error: {
      code,
      message,
    },
  }
}

export interface BalanceItem {
  token: string
  total: string
  hold: string
  available: string
}

export interface BalancesResponse {
  perpBalance: string
  spotBalances: BalanceItem[]
  updatedAt: string
}

export interface PositionItem {
  coin: string
  size: string
  entryPx: string
  positionValue: string
  unrealizedPnl: string
  leverage: string
  liquidationPx: string
}

export interface PositionsResponse {
  positions: PositionItem[]
  accountValue: string
  totalMarginUsed: string
  updatedAt: string
}

export interface OrderItem {
  oid: number
  coin: string
  side: string
  sz: string
  limitPx: string
  timestamp: number
}

export interface OrdersResponse {
  orders: OrderItem[]
  updatedAt: string
  context?: OrderContext
}

export interface OrderContext {
  environment: "mainnet" | "testnet"
  user: string
  accountSource: "default_account_db" | "environment_variables"
  accountAlias: string | null
}


export interface PricesResponse {
  prices: Record<string, string>
  symbol?: string
  price?: string
  source: "server" | "info"
  updatedAt: string
}
