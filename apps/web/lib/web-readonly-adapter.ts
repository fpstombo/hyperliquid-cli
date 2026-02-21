import { HttpTransport, InfoClient } from "@nktkas/hyperliquid"
import { getAddress, type Address } from "viem"

export interface WebRuntimeConfig {
  user: string
  isTestnet: boolean
}

function createInfoClient(isTestnet: boolean): InfoClient {
  const transport = new HttpTransport({ isTestnet })
  return new InfoClient({ transport })
}

function normalizeUser(user: string): Address {
  return getAddress(user)
}

export async function fetchBalances(config: WebRuntimeConfig): Promise<{
  perpBalance: string
  spotBalances: Array<{ token: string; total: string; hold: string; available: string }>
}> {
  const user = normalizeUser(config.user)
  const client = createInfoClient(config.isTestnet)

  const [clearinghouseState, spotState] = await Promise.all([
    client.clearinghouseState({ user }),
    client.spotClearinghouseState({ user }),
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
  positions: Array<{
    coin: string
    size: string
    entryPx: string
    positionValue: string
    unrealizedPnl: string
    leverage: string
    liquidationPx: string
  }>
  accountValue: string
  totalMarginUsed: string
}> {
  const user = normalizeUser(config.user)
  const client = createInfoClient(config.isTestnet)
  const state = await client.clearinghouseState({ user })

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

export async function fetchPrices(config: WebRuntimeConfig): Promise<{ prices: Record<string, string>; source: "info" }> {
  const client = createInfoClient(config.isTestnet)
  const prices = await client.allMids()
  return { prices, source: "info" }
}
