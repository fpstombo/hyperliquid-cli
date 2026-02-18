import { HttpTransport, InfoClient } from "@nktkas/hyperliquid"
import { validateAddress } from "./validation.js"
import { tryConnectToServer } from "../client/index.js"
import type { Address } from "viem"

export interface WebRuntimeConfig {
  user: Address
  isTestnet: boolean
}

export interface BalanceContract {
  token: string
  total: string
  hold: string
  available: string
}

export interface PositionContract {
  coin: string
  size: string
  entryPx: string
  positionValue: string
  unrealizedPnl: string
  leverage: string
  liquidationPx: string
}

export interface OrderContract {
  oid: number
  coin: string
  side: string
  sz: string
  limitPx: string
  timestamp: number
}

function createInfoClient(isTestnet: boolean): InfoClient {
  const transport = new HttpTransport({ isTestnet })
  return new InfoClient({ transport })
}

export function getWebRuntimeConfig(): WebRuntimeConfig {
  const user = process.env.HYPERLIQUID_USER
  if (!user) {
    throw new Error("Missing HYPERLIQUID_USER environment variable")
  }

  return {
    user: validateAddress(user),
    isTestnet: process.env.HYPERLIQUID_TESTNET === "true",
  }
}

export async function fetchBalances(config: WebRuntimeConfig): Promise<{
  perpBalance: string
  spotBalances: BalanceContract[]
}> {
  const client = createInfoClient(config.isTestnet)

  const [clearinghouseState, spotState] = await Promise.all([
    client.clearinghouseState({ user: config.user }),
    client.spotClearinghouseState({ user: config.user }),
  ])

  const spotBalances = spotState.balances
    .filter((b: { total: string }) => parseFloat(b.total) !== 0)
    .map((b: { coin: string; total: string; hold: string }) => ({
      token: b.coin,
      total: b.total,
      hold: b.hold,
      available: (parseFloat(b.total) - parseFloat(b.hold)).toString(),
    }))

  return {
    perpBalance: clearinghouseState.marginSummary.accountValue,
    spotBalances,
  }
}

export async function fetchPositions(config: WebRuntimeConfig): Promise<{
  positions: PositionContract[]
  accountValue: string
  totalMarginUsed: string
}> {
  const client = createInfoClient(config.isTestnet)
  const state = await client.clearinghouseState({ user: config.user })

  type Position = {
    coin: string
    szi: string
    entryPx: string
    positionValue: string
    unrealizedPnl: string
    leverage: { type: string; value: number }
    liquidationPx: string | null
  }

  const positions = state.assetPositions
    .map((p: { position: Position }) => p.position)
    .filter((p: Position) => parseFloat(p.szi) !== 0)
    .map((p: Position) => ({
      coin: p.coin,
      size: p.szi,
      entryPx: p.entryPx,
      positionValue: p.positionValue,
      unrealizedPnl: p.unrealizedPnl,
      leverage: `${p.leverage.value}x ${p.leverage.type}`,
      liquidationPx: p.liquidationPx || "-",
    }))

  return {
    positions,
    accountValue: state.marginSummary.accountValue,
    totalMarginUsed: state.marginSummary.totalMarginUsed,
  }
}

export async function fetchOrders(config: WebRuntimeConfig): Promise<OrderContract[]> {
  const client = createInfoClient(config.isTestnet)
  const orders = await client.openOrders({ user: config.user, dex: "ALL_DEXS" })

  return orders.map((o: OrderContract) => ({
    oid: o.oid,
    coin: o.coin,
    side: o.side,
    sz: o.sz,
    limitPx: o.limitPx,
    timestamp: o.timestamp,
  }))
}

export async function fetchPrices(
  config: WebRuntimeConfig,
): Promise<{ prices: Record<string, string>; source: "server" | "info" }> {
  const serverClient = await tryConnectToServer()

  if (serverClient) {
    try {
      const { data } = await serverClient.getPrices()
      serverClient.close()
      return { prices: data, source: "server" }
    } catch {
      serverClient.close()
    }
  }

  const client = createInfoClient(config.isTestnet)
  const prices = await client.allMids()
  return { prices, source: "info" }
}
