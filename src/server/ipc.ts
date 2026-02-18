import { createServer, type Server, type Socket } from "node:net"
import { existsSync, unlinkSync } from "node:fs"
import type { ServerCache } from "./cache.js"
import type { SubscriptionManager } from "./subscriptions.js"
import { SERVER_SOCKET_PATH } from "../lib/paths.js"
import { RPCGateway, createTraceId, validateRPCRequest, type RPCResponse } from "./rpc-core.js"

export class IPCServer {
  private server: Server | null = null
  private cache: ServerCache
  private subscriptions: SubscriptionManager
  private isTestnet: boolean
  private startedAt: number
  private log: (msg: string) => void
  private logStructured: (entry: Record<string, unknown>) => void
  private onShutdown: () => void
  private gateway: RPCGateway

  constructor(
    cache: ServerCache,
    subscriptions: SubscriptionManager,
    isTestnet: boolean,
    startedAt: number,
    log: (msg: string) => void,
    logStructured: (entry: Record<string, unknown>) => void,
    onShutdown: () => void,
  ) {
    this.cache = cache
    this.subscriptions = subscriptions
    this.isTestnet = isTestnet
    this.startedAt = startedAt
    this.log = log
    this.logStructured = logStructured
    this.onShutdown = onShutdown
    this.gateway = new RPCGateway(
      cache,
      isTestnet,
      startedAt,
      () => this.subscriptions.isConnected(),
      this.onShutdown,
      this.logStructured,
    )
  }

  async start(): Promise<void> {
    // Remove existing socket file if it exists
    if (existsSync(SERVER_SOCKET_PATH)) {
      unlinkSync(SERVER_SOCKET_PATH)
    }

    return new Promise((resolve, reject) => {
      this.server = createServer((socket) => {
        this.handleConnection(socket)
      })

      this.server.on("error", (err) => {
        this.log(`IPC server error: ${err.message}`)
        reject(err)
      })

      this.server.listen(SERVER_SOCKET_PATH, () => {
        this.log(`IPC server listening on ${SERVER_SOCKET_PATH}`)
        resolve()
      })
    })
  }

  private handleConnection(socket: Socket): void {
    let buffer = ""
    const clientId = `${socket.remoteAddress ?? "local"}:${socket.remotePort ?? 0}:${Date.now()}`

    socket.on("data", (data) => {
      buffer += data.toString()

      // Process complete messages (newline-delimited)
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.trim()) {
          this.handleMessage(socket, line, clientId)
        }
      }
    })

    socket.on("error", (err) => {
      this.log(`Socket error: ${err.message}`)
    })
  }

  private handleMessage(socket: Socket, message: string, clientId: string): void {
    let payload: unknown
    try {
      payload = JSON.parse(message)
    } catch {
      this.sendResponse(socket, { id: "0", error: "Invalid JSON" })
      return
    }

    const validated = validateRPCRequest(payload)
    if (validated.error || !validated.request) {
      const id = (payload as { id?: string } | undefined)?.id ?? "0"
      this.sendResponse(socket, { id: typeof id === "string" ? id : "0", error: validated.error ?? "Invalid request" })
      return
    }

    const response = this.gateway.handleRequest(validated.request, {
      clientId,
      receivedAt: Date.now(),
      traceId: createTraceId(),
    })
    this.sendResponse(socket, response)
  }

  private sendResponse(socket: Socket, response: RPCResponse): void {
    try {
      socket.write(JSON.stringify(response) + "\n")
    } catch {
      // Socket may have closed
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.log("IPC server stopped")
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}
