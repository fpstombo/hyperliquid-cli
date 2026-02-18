import { validatePositiveInteger, validatePositiveNumber, validateTif } from "../lib/validation.js"

export type Side = "buy" | "sell"
export type TimeInForce = "Alo" | "Ioc" | "Gtc"

export interface HyperliquidInfoClient {
  allPerpMetas: () => Promise<Array<{ universe: Array<{ name: string }> }>>
  spotMeta: () => Promise<{ universe: Array<{ name: string }> }>
  allMids: () => Promise<Record<string, string>>
}

export interface MarketOrderInput {
  side: string
  size: string | number
  coin: string
  reduceOnly?: boolean
  slippagePercent: string | number
}

export interface LimitOrderInput {
  side: string
  size: string | number
  coin: string
  price: string | number
  reduceOnly?: boolean
  tif?: string
}

export interface CancelOrderInput {
  assetIndex: number
  orderId: string | number
}

export function validateSideWithAliases(value: string): Side {
  const lower = value.toLowerCase()
  if (lower === "long" || lower === "buy") {
    return "buy"
  }
  if (lower === "short" || lower === "sell") {
    return "sell"
  }
  throw new Error('Side must be "buy", "sell", "long", or "short"')
}

export async function getAssetIndex(publicClient: HyperliquidInfoClient, coin: string): Promise<number> {
  const allPerpMetas = await publicClient.allPerpMetas()

  for (let dexIndex = 0; dexIndex < allPerpMetas.length; dexIndex++) {
    const dex = allPerpMetas[dexIndex]
    const marketIndex = dex.universe.findIndex((a) => a.name === coin)
    if (marketIndex !== -1) {
      return dexIndex === 0 ? marketIndex : 100000 + dexIndex * 10000 + marketIndex
    }
  }

  const spotMeta = await publicClient.spotMeta()
  const spotIndex = spotMeta.universe.findIndex((a) => a.name === coin)
  if (spotIndex !== -1) {
    return 10000 + spotIndex
  }

  throw new Error(`Unknown coin: ${coin}`)
}

export async function buildMarketOrderRequest(
  publicClient: HyperliquidInfoClient,
  input: MarketOrderInput,
): Promise<{ orders: Array<{ a: number; b: boolean; p: string; s: string; r: boolean; t: { limit: { tif: "Ioc" } } }>; grouping: "na" }> {
  const side = validateSideWithAliases(input.side)
  const isBuy = side === "buy"
  const size = validatePositiveNumber(String(input.size), "size")
  const slippagePct = validatePositiveNumber(String(input.slippagePercent), "slippage") / 100
  const assetIndex = await getAssetIndex(publicClient, input.coin)

  const mids = await publicClient.allMids()
  const midPrice = parseFloat(mids[input.coin])
  if (!midPrice) {
    throw new Error(`Cannot get mid price for ${input.coin}`)
  }

  const limitPx = isBuy ? midPrice * (1 + slippagePct) : midPrice * (1 - slippagePct)

  return {
    orders: [
      {
        a: assetIndex,
        b: isBuy,
        p: limitPx.toFixed(6),
        s: size.toString(),
        r: input.reduceOnly ?? false,
        t: { limit: { tif: "Ioc" } },
      },
    ],
    grouping: "na",
  }
}

export async function buildLimitOrderRequest(
  publicClient: HyperliquidInfoClient,
  input: LimitOrderInput,
): Promise<{ orders: Array<{ a: number; b: boolean; p: string; s: string; r: boolean; t: { limit: { tif: TimeInForce } } }>; grouping: "na" }> {
  const side = validateSideWithAliases(input.side)
  const size = validatePositiveNumber(String(input.size), "size")
  const price = validatePositiveNumber(String(input.price), "price")
  const tif = validateTif(input.tif || "Gtc")
  const assetIndex = await getAssetIndex(publicClient, input.coin)

  return {
    orders: [
      {
        a: assetIndex,
        b: side === "buy",
        p: price.toString(),
        s: size.toString(),
        r: input.reduceOnly ?? false,
        t: { limit: { tif } },
      },
    ],
    grouping: "na",
  }
}

export function buildCancelRequest(input: CancelOrderInput): { cancels: Array<{ a: number; o: number }> } {
  return {
    cancels: [
      {
        a: input.assetIndex,
        o: validatePositiveInteger(String(input.orderId), "oid"),
      },
    ],
  }
}

export function parseOrderError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (lower.includes("margin") || lower.includes("insufficient")) {
    return `Insufficient margin: ${message}`
  }
  if (lower.includes("invalid") || lower.includes("bad request") || lower.includes("parameter")) {
    return `Invalid order parameters: ${message}`
  }
  if (lower.includes("size") || lower.includes("price") || lower.includes("side") || lower.includes("tif")) {
    return `Validation error: ${message}`
  }

  return `Order rejected: ${message}`
}
