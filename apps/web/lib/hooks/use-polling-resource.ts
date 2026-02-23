"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface PollingState<T> {
  data: T | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  isStale: boolean
  lastSuccessAt: number | null
  lastAttemptAt: number | null
  retry: () => Promise<void>
}

type PollingOptions<T> = {
  fetcher: () => Promise<T>
  pollMs?: number
  presentationCadenceMs?: number
  onTransientError?: (message: string) => void
}

const TRANSIENT_STATUS_CODES = [408, 429, 500, 502, 503, 504]
const INITIAL_LOAD_FLOOR_MS = 240

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function isTransientError(error: unknown): boolean {
  return error instanceof HttpError && TRANSIENT_STATUS_CODES.includes(error.status)
}

export function usePollingResource<T>({
  fetcher,
  pollMs = 5000,
  presentationCadenceMs = 350,
  onTransientError,
}: PollingOptions<T>): PollingState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null)
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null)
  const mountedRef = useRef(true)
  const lastPresentationRef = useRef<number | null>(null)
  const pendingDataRef = useRef<T | null>(null)
  const hasSnapshotRef = useRef(false)

  useEffect(() => {
    hasSnapshotRef.current = data !== null || lastSuccessAt !== null
  }, [data, lastSuccessAt])

  const flushData = useCallback(() => {
    if (!mountedRef.current || pendingDataRef.current === null) {
      return
    }

    setData(pendingDataRef.current)
    pendingDataRef.current = null
    lastPresentationRef.current = Date.now()
  }, [])

  const refresh = useCallback(async () => {
    const requestStartedAt = Date.now()
    setLastAttemptAt(requestStartedAt)
    setIsRefreshing(true)
    setError(null)
    try {
      const nextData = await fetcher()
      if (!mountedRef.current) {
        return
      }
      pendingDataRef.current = nextData
      if (lastPresentationRef.current === null) {
        flushData()
      }
      setError(null)
      setIsStale(false)
      setLastSuccessAt(Date.now())
    } catch (err) {
      if (!mountedRef.current) {
        return
      }
      const message = err instanceof Error ? err.message : "Request failed"
      setError(message)
      setIsStale(hasSnapshotRef.current)
      if (isTransientError(err)) {
        onTransientError?.(message)
      }
    } finally {
      const elapsed = Date.now() - requestStartedAt
      const remaining = hasSnapshotRef.current ? 0 : Math.max(INITIAL_LOAD_FLOOR_MS - elapsed, 0)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }
      if (mountedRef.current) {
        setIsRefreshing(false)
        setIsLoading(false)
      }
    }
  }, [fetcher, flushData, onTransientError])

  useEffect(() => {
    mountedRef.current = true
    void refresh()

    const interval = setInterval(() => {
      void refresh()
    }, pollMs)

    const presentationInterval = setInterval(() => {
      flushData()
    }, presentationCadenceMs)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
      clearInterval(presentationInterval)
    }
  }, [flushData, pollMs, presentationCadenceMs, refresh])

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    isStale,
    lastSuccessAt,
    lastAttemptAt,
    retry: refresh,
  }
}
