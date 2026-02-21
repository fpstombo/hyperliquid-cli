import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid"
import { privateKeyToAccount } from "viem/accounts"
import { getAddress } from "viem"
import { type AppEnvironment } from "./auth"
import { type AuthenticatedSession } from "./server-session"
import { createApiError, type ApiError } from "./api-types"

type AccountSource = "default_account_db" | "environment_variables"

type LocalConfig = {
  privateKey?: `0x${string}`
  walletAddress?: string
}

function loadRuntimeConfig(): LocalConfig {
  const privateKey = process.env.HYPERLIQUID_PRIVATE_KEY as `0x${string}` | undefined
  let walletAddress = process.env.HYPERLIQUID_WALLET_ADDRESS

  if (privateKey && !walletAddress) {
    walletAddress = privateKeyToAccount(privateKey).address
  }

  return {
    privateKey,
    walletAddress,
  }
}

function validatePositiveNumber(value: string, name: string): number {
  const num = parseFloat(value)
  if (Number.isNaN(num) || num <= 0) {
    throw new Error(`${name} must be a positive number`)
  }
  return num
}

function validatePositiveInteger(value: string, name: string): number {
  const num = parseInt(value, 10)
  if (Number.isNaN(num) || num <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }
  return num
}

function validateTif(value: string): "Gtc" | "Ioc" | "Alo" {
  const mapping: Record<string, "Gtc" | "Ioc" | "Alo"> = { gtc: "Gtc", ioc: "Ioc", alo: "Alo" }
  const result = mapping[value.toLowerCase()]
  if (!result) {
    throw new Error('Time-in-force must be "Gtc", "Ioc", or "Alo"')
  }
  return result
}

function validateSideWithAliases(value: string): "buy" | "sell" {
  const lower = value.toLowerCase()
  if (lower === "long" || lower === "buy") return "buy"
  if (lower === "short" || lower === "sell") return "sell"
  throw new Error('Side must be "buy", "sell", "long", or "short"')
}

async function getAssetIndex(publicClient: InfoClient, coin: string): Promise<number> {
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

async function buildMarketOrderRequest(
  publicClient: InfoClient,
  payload: { side: string; size: string; coin: string; reduceOnly?: boolean; slippage: string },
) {
  const side = validateSideWithAliases(payload.side)
  const isBuy = side === "buy"
  const size = validatePositiveNumber(String(payload.size), "size")
  const slippagePct = validatePositiveNumber(String(payload.slippage), "slippage") / 100
  const assetIndex = await getAssetIndex(publicClient, payload.coin)
  const mids = await publicClient.allMids()
  const midPrice = parseFloat(mids[payload.coin])
  if (!midPrice) {
    throw new Error(`Cannot get mid price for ${payload.coin}`)
  }

  const limitPx = isBuy ? midPrice * (1 + slippagePct) : midPrice * (1 - slippagePct)

  return {
    orders: [{ a: assetIndex, b: isBuy, p: limitPx.toFixed(6), s: size.toString(), r: payload.reduceOnly ?? false, t: { limit: { tif: "Ioc" as const } } }],
    grouping: "na" as const,
  }
}

async function buildLimitOrderRequest(
  publicClient: InfoClient,
  payload: { side: string; size: string; coin: string; price: string; tif: string; reduceOnly?: boolean },
) {
  const side = validateSideWithAliases(payload.side)
  const size = validatePositiveNumber(String(payload.size), "size")
  const price = validatePositiveNumber(String(payload.price), "price")
  const tif = validateTif(payload.tif || "Gtc")
  const assetIndex = await getAssetIndex(publicClient, payload.coin)

  return {
    orders: [{ a: assetIndex, b: side === "buy", p: price.toString(), s: size.toString(), r: payload.reduceOnly ?? false, t: { limit: { tif } } }],
    grouping: "na" as const,
  }
}

function buildCancelRequest(payload: { oid: string; assetIndex: number }) {
  return { cancels: [{ a: payload.assetIndex, o: validatePositiveInteger(String(payload.oid), "oid") }] }
}

function parseOrderError(error: unknown): string {
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

export type TradingContext = {
  environment: AppEnvironment
  isTestnet: boolean
  user: string
  walletAddress: string | null
  accountSource: AccountSource
  accountAlias: string | null
}

function normalize(value: string) {
  return getAddress(value).toLowerCase()
}

export function resolveTradingContext(session: AuthenticatedSession): TradingContext {
  const isTestnet = session.environment === "testnet"
  const config = loadRuntimeConfig()

  if (!config.walletAddress) {
    throw new Error(
      `No trading account resolved for ${session.environment}. Set a default account with \`hl account set-default <alias>\` or provide HYPERLIQUID_WALLET_ADDRESS.`,
    )
  }

  if (session.walletAddress && normalize(session.walletAddress) !== normalize(config.walletAddress)) {
    throw new Error(
      `Session wallet ${session.walletAddress} does not match resolved account ${config.walletAddress}. Switch account or re-authenticate before trading.`,
    )
  }

  return {
    environment: session.environment,
    isTestnet,
    user: config.walletAddress,
    walletAddress: session.walletAddress,
    accountSource: "environment_variables",
    accountAlias: null,
  }
}

export function assertApiWalletConfigured(context: TradingContext) {
  const config = loadRuntimeConfig()
  if (!config.privateKey) {
    throw new Error(
      `No API wallet configured for ${context.environment}. Attach an API wallet to the default account (hl account add/update) or set HYPERLIQUID_PRIVATE_KEY for server execution.`,
    )
  }
}

export async function createTradingClients(context: TradingContext, opts?: { requireApiWallet?: boolean }) {
  const config = loadRuntimeConfig()
  const requireApiWallet = opts?.requireApiWallet ?? true

  if (requireApiWallet && !config.privateKey) {
    assertApiWalletConfigured(context)
  }

  const transport = new HttpTransport({ isTestnet: context.isTestnet })
  const publicClient = new InfoClient({ transport })

  if (!config.privateKey) {
    return { publicClient, user: context.user }
  }

  const wallet = privateKeyToAccount(config.privateKey)

  return {
    publicClient,
    walletClient: new ExchangeClient({ transport, wallet }),
    user: context.user,
  }
}

export async function executeMarketOrder(
  context: TradingContext,
  payload: {
    side: string
    size: string
    coin: string
    reduceOnly?: boolean
    slippage: string
  },
) {
  const { publicClient, walletClient } = await createTradingClients(context, { requireApiWallet: true })
  if (!walletClient) {
    assertApiWalletConfigured(context)
  }

  const orderRequest = await buildMarketOrderRequest(publicClient, {
    side: payload.side,
    size: payload.size,
    coin: payload.coin,
    reduceOnly: payload.reduceOnly,
    slippage: payload.slippage,
  })

  return walletClient!.order(orderRequest)
}

export async function executeLimitOrder(
  context: TradingContext,
  payload: {
    side: string
    size: string
    coin: string
    price: string
    tif: string
    reduceOnly?: boolean
  },
) {
  const { publicClient, walletClient } = await createTradingClients(context, { requireApiWallet: true })
  if (!walletClient) {
    assertApiWalletConfigured(context)
  }

  const orderRequest = await buildLimitOrderRequest(publicClient, payload)
  return walletClient!.order(orderRequest)
}

export async function cancelOrder(context: TradingContext, payload: { oid: string; coin: string }) {
  const { publicClient, walletClient } = await createTradingClients(context, { requireApiWallet: true })
  if (!walletClient) {
    assertApiWalletConfigured(context)
  }

  const assetIndex = await getAssetIndex(publicClient, payload.coin)
  return walletClient!.cancel(buildCancelRequest({ assetIndex, oid: payload.oid }))
}

export async function fetchOpenOrders(context: TradingContext) {
  const { publicClient, user } = await createTradingClients(context, { requireApiWallet: false })
  return publicClient.openOrders({ user, dex: "ALL_DEXS" })
}

export function toApiError(error: unknown): ApiError {
  return createApiError("ORDER_ERROR", parseOrderError(error))
}
