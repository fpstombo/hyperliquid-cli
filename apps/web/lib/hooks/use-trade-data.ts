"use client"

import { fetchOrders, fetchPrices } from "../api-client"
import { usePollingResource } from "./use-polling-resource"

const TRADE_SNAPSHOT_CADENCE_MS = 400

export function useSymbolPrice(symbol: string, onTransientError?: (message: string) => void) {
  return usePollingResource({
    fetcher: () => fetchPrices(symbol),
    pollMs: 2000,
    presentationCadenceMs: TRADE_SNAPSHOT_CADENCE_MS,
    onTransientError,
  })
}

export function useTradeOrders(onTransientError?: (message: string) => void) {
  return usePollingResource({ fetcher: fetchOrders, pollMs: 5000, presentationCadenceMs: TRADE_SNAPSHOT_CADENCE_MS, onTransientError })
}
