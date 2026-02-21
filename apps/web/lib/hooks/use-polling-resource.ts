"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface PollingState<T> {
  data: T | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  lastSuccessAt: number | null
  lastAttemptAt: number | null
  retry: () => Promise<void>
}

type PollingOptions<T> = {
  fetcher: () => Promise<T>
  pollMs?: number
  onTransientError?: (message: string) => void
}

const TRANSIENT_STATUS_CODES = [408, 429, 500, 502, 503, 504]

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
  onTransientError,
}: PollingOptions<T>): PollingState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null)
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    setLastAttemptAt(Date.now())
    setIsRefreshing(true)
    try {
      const nextData = await fetcher()
      if (!mountedRef.current) {
        return
      }
      setData(nextData)
      setError(null)
      setLastSuccessAt(Date.now())
    } catch (err) {
      if (!mountedRef.current) {
        return
      }
      const message = err instanceof Error ? err.message : "Request failed"
      setError(message)
      if (isTransientError(err)) {
        onTransientError?.(message)
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false)
        setIsLoading(false)
      }
    }
  }, [fetcher, onTransientError])

  useEffect(() => {
    mountedRef.current = true
    void refresh()

    const interval = setInterval(() => {
      void refresh()
    }, pollMs)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [pollMs, refresh])

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    lastSuccessAt,
    lastAttemptAt,
    retry: refresh,
  }
}
