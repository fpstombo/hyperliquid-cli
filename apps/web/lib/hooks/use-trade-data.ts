"use client"

import { fetchOrders, fetchPrices } from "../api-client"
import { usePollingResource } from "./use-polling-resource"

export function useSymbolPrice(symbol: string, onTransientError?: (message: string) => void) {
  return usePollingResource({
    fetcher: () => fetchPrices(symbol),
    pollMs: 2000,
    onTransientError,
  })
}

export function useTradeOrders(onTransientError?: (message: string) => void) {
  return usePollingResource({ fetcher: fetchOrders, pollMs: 5000, onTransientError })
}
