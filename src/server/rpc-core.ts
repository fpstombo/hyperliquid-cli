import crypto from "node:crypto"
import type { ServerCache } from "./cache.js"

export type EndpointCategory = "auth" | "data" | "trade" | "system"

export interface RPCRequest {
  id: string
  method: string
  params?: Record<string, unknown>
}

export interface RPCResponse {
  id: string
  result?: unknown
  error?: string
  cached_at?: number
  trace_id?: string
}

export interface RequestContext {
  clientId: string
  receivedAt: number
  traceId: string
}

export interface StructuredLogger {
  (entry: Record<string, unknown>): void
}

export class FixedWindowRateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const existing = this.hits.get(key)
    if (!existing || now >= existing.resetAt) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs })
      return true
    }

    if (existing.count >= this.limit) {
      return false
    }

    existing.count += 1
    return true
  }
}

export class MetricsRegistry {
  private readonly counters = new Map<string, number>()
  private readonly latencyTotals = new Map<string, number>()

  increment(name: string, labels: Record<string, string>): void {
    const key = this.metricKey(name, labels)
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1)
  }

  observeLatency(method: string, elapsedMs: number): void {
    this.latencyTotals.set(method, (this.latencyTotals.get(method) ?? 0) + elapsedMs)
  }

  snapshot(): Record<string, unknown> {
    return {
      counters: Object.fromEntries(this.counters.entries()),
      latency_ms_totals: Object.fromEntries(this.latencyTotals.entries()),
    }
  }

  private metricKey(name: string, labels: Record<string, string>): string {
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",")
    return `${name}{${labelString}}`
  }
}

interface OrderRecord {
  id: string
  coin: string
  side: "buy" | "sell"
  size: number
  status: "open" | "cancelled"
  createdAt: number
}

const METHOD_CATEGORIES: Record<string, EndpointCategory> = {
  login: "auth",
  getDashboard: "data",
  getPrices: "data",
  getAssetCtxs: "data",
  getPerpMeta: "data",
  getSpotMeta: "data",
  getSpotAssetCtxs: "data",
  placeOrder: "trade",
  cancelOrder: "trade",
  getStatus: "system",
  getMetrics: "system",
  shutdown: "system",
}

const AUTH_REQUIRED_METHODS = new Set(["getDashboard", "placeOrder", "cancelOrder"])

export function validateRPCRequest(payload: unknown): { request?: RPCRequest; error?: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid JSON-RPC payload" }
  }

  const candidate = payload as Partial<RPCRequest>
  if (typeof candidate.id !== "string" || candidate.id.length === 0) {
    return { error: "Invalid request id" }
  }
  if (typeof candidate.method !== "string" || !(candidate.method in METHOD_CATEGORIES)) {
    return { error: `Unknown method: ${String(candidate.method)}` }
  }
  if (candidate.params !== undefined && (typeof candidate.params !== "object" || candidate.params === null)) {
    return { error: "Params must be an object" }
  }

  return {
    request: {
      id: candidate.id,
      method: candidate.method,
      params: (candidate.params as Record<string, unknown> | undefined) ?? undefined,
    },
  }
}

export class RPCGateway {
  private readonly authSessions = new Map<string, string>()
  private readonly orders = new Map<string, OrderRecord>()

  constructor(
    private readonly cache: ServerCache,
    private readonly isTestnet: boolean,
    private readonly startedAt: number,
    private readonly isConnected: () => boolean,
    private readonly onShutdown: () => void,
    private readonly logger: StructuredLogger,
    private readonly limiter = new FixedWindowRateLimiter(60, 60_000),
    private readonly metrics = new MetricsRegistry(),
  ) {}

  handleRequest(request: RPCRequest, ctx: RequestContext): RPCResponse {
    const started = Date.now()
    const category = METHOD_CATEGORIES[request.method] ?? "system"

    if (!this.limiter.allow(`${ctx.clientId}:${request.method}`, ctx.receivedAt)) {
      this.metrics.increment("rpc_requests_total", {
        method: request.method,
        category,
        status: "rate_limited",
      })
      return {
        id: request.id,
        error: "Rate limit exceeded",
        trace_id: ctx.traceId,
      }
    }

    const authError = this.assertAuthorized(request)
    if (authError) {
      this.metrics.increment("rpc_requests_total", { method: request.method, category, status: "unauthorized" })
      return { id: request.id, error: authError, trace_id: ctx.traceId }
    }

    const response = this.route(request, ctx)
    this.metrics.increment("rpc_requests_total", {
      method: request.method,
      category,
      status: response.error ? "error" : "ok",
    })
    this.metrics.observeLatency(request.method, Date.now() - started)

    this.logger({
      level: response.error ? "warn" : "info",
      event: "rpc.request",
      method: request.method,
      category,
      trace_id: ctx.traceId,
      client_id: ctx.clientId,
      status: response.error ? "error" : "ok",
      elapsed_ms: Date.now() - started,
    })

    return { ...response, trace_id: ctx.traceId }
  }

  private assertAuthorized(request: RPCRequest): string | null {
    if (!AUTH_REQUIRED_METHODS.has(request.method)) {
      return null
    }

    const token = request.params?.authToken
    if (typeof token !== "string" || !this.authSessions.has(token)) {
      return "Unauthorized"
    }

    return null
  }

  private route(request: RPCRequest, _ctx: RequestContext): RPCResponse {
    const { id, method, params } = request

    switch (method) {
      case "login": {
        const wallet = params?.wallet
        if (typeof wallet !== "string" || wallet.length < 6) {
          return { id, error: "Invalid wallet" }
        }
        const token = `sess_${crypto.randomUUID()}`
        this.authSessions.set(token, wallet)
        return { id, result: { token, wallet } }
      }
      case "getDashboard": {
        const mids = this.cache.getAllMids()
        return {
          id,
          result: {
            cache: this.cache.getStatus(),
            prices: mids?.data ?? {},
            updatedAt: mids?.updatedAt,
          },
        }
      }
      case "placeOrder": {
        const coin = params?.coin
        const side = params?.side
        const size = params?.size
        if (typeof coin !== "string" || (side !== "buy" && side !== "sell") || typeof size !== "number" || size <= 0) {
          return { id, error: "Invalid order params" }
        }
        const orderId = `ord_${crypto.randomUUID()}`
        this.orders.set(orderId, {
          id: orderId,
          coin,
          side,
          size,
          status: "open",
          createdAt: Date.now(),
        })
        return { id, result: { orderId, status: "open" } }
      }
      case "cancelOrder": {
        const orderId = params?.orderId
        if (typeof orderId !== "string") {
          return { id, error: "Invalid orderId" }
        }
        const order = this.orders.get(orderId)
        if (!order) {
          return { id, error: "Order not found" }
        }
        order.status = "cancelled"
        return { id, result: { orderId, status: order.status } }
      }
      case "getPrices": {
        const entry = this.cache.getAllMids()
        if (!entry) {
          return { id, error: "No data available" }
        }
        const coin = params?.coin as string | undefined
        if (coin) {
          const key = coin.toUpperCase()
          const price = entry.data[key]
          if (price === undefined) {
            return { id, error: `Coin not found: ${coin}` }
          }
          return { id, result: { [key]: price }, cached_at: entry.updatedAt }
        }
        return { id, result: entry.data, cached_at: entry.updatedAt }
      }
      case "getAssetCtxs": {
        const entry = this.cache.getAllDexsAssetCtxs()
        if (!entry) {
          return { id, error: "No data available" }
        }
        return { id, result: entry.data, cached_at: entry.updatedAt }
      }
      case "getPerpMeta": {
        const entry = this.cache.getAllPerpMetas()
        if (!entry) {
          return { id, error: "No data available" }
        }
        return { id, result: entry.data, cached_at: entry.updatedAt }
      }
      case "getSpotMeta": {
        const entry = this.cache.getSpotMeta()
        if (!entry) {
          return { id, error: "No data available" }
        }
        return { id, result: entry.data, cached_at: entry.updatedAt }
      }
      case "getSpotAssetCtxs": {
        const entry = this.cache.getSpotAssetCtxs()
        if (!entry) {
          return { id, error: "No data available" }
        }
        return { id, result: entry.data, cached_at: entry.updatedAt }
      }
      case "getStatus": {
        return {
          id,
          result: {
            running: true,
            testnet: this.isTestnet,
            connected: this.isConnected(),
            startedAt: this.startedAt,
            uptime: Date.now() - this.startedAt,
            cache: this.cache.getStatus(),
          },
        }
      }
      case "getMetrics":
        return { id, result: this.metrics.snapshot() }
      case "shutdown": {
        setTimeout(() => this.onShutdown(), 100)
        return { id, result: { ok: true } }
      }
      default:
        return { id, error: `Unknown method: ${method}` }
    }
  }
}

export function createTraceId(): string {
  return crypto.randomUUID()
}
