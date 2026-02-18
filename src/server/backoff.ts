export interface BackoffOptions {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitterRatio?: number
  sleep?: (ms: number) => Promise<void>
}

export async function withBackoff<T>(operation: () => Promise<T>, options: BackoffOptions): Promise<T> {
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
  const jitterRatio = options.jitterRatio ?? 0.2

  let attempt = 0
  while (attempt < options.maxAttempts) {
    attempt += 1
    try {
      return await operation()
    } catch (error) {
      if (attempt >= options.maxAttempts) {
        throw error
      }

      const exponential = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** (attempt - 1))
      const jitter = exponential * jitterRatio * Math.random()
      await sleep(Math.round(exponential + jitter))
    }
  }

  throw new Error("Backoff exhausted")
}
