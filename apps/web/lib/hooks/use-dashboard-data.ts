"use client"

import { fetchBalances, fetchOrders, fetchPositions } from "../api-client"
import { usePollingResource } from "./use-polling-resource"

export function useBalances(onTransientError?: (message: string) => void) {
  return usePollingResource({ fetcher: fetchBalances, pollMs: 5000, presentationCadenceMs: 350, onTransientError })
}

export function usePositions(onTransientError?: (message: string) => void) {
  return usePollingResource({ fetcher: fetchPositions, pollMs: 5000, presentationCadenceMs: 350, onTransientError })
}

export function useOrders(onTransientError?: (message: string) => void) {
  return usePollingResource({ fetcher: fetchOrders, pollMs: 5000, presentationCadenceMs: 350, onTransientError })
}
