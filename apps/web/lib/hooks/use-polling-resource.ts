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
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPresentationRef = useRef(0)
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

  const scheduleDataCommit = useCallback(() => {
    const now = Date.now()
    const elapsed = now - lastPresentationRef.current
    const waitMs = Math.max(presentationCadenceMs - elapsed, 0)

    if (waitMs === 0) {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
      flushData()
      return
    }

    if (flushTimerRef.current) {
      return
    }

    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null
      flushData()
    }, waitMs)
  }, [flushData, presentationCadenceMs])

  const refresh = useCallback(async () => {
    setLastAttemptAt(Date.now())
    setIsRefreshing(true)
    try {
      const nextData = await fetcher()
      if (!mountedRef.current) {
        return
      }
      pendingDataRef.current = nextData
      scheduleDataCommit()
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
      if (mountedRef.current) {
        setIsRefreshing(false)
        setIsLoading(false)
      }
    }
  }, [fetcher, onTransientError, scheduleDataCommit])

  useEffect(() => {
    mountedRef.current = true
    void refresh()

    const interval = setInterval(() => {
      void refresh()
    }, pollMs)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
    }
  }, [pollMs, refresh])

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
