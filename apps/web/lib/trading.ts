import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid"
import { privateKeyToAccount } from "viem/accounts"
import { loadConfig } from "../../../src/lib/config.js"
import { type AppEnvironment } from "./auth"
import { type AuthenticatedSession } from "./server-session"
import {
  buildCancelRequest,
  buildLimitOrderRequest,
  buildMarketOrderRequest,
  getAssetIndex,
  parseOrderError,
} from "../../../src/core/order.js"

type AccountSource = "default_account_db" | "environment_variables"

export type TradingContext = {
  environment: AppEnvironment
  isTestnet: boolean
  user: string
  walletAddress: string | null
  accountSource: AccountSource
  accountAlias: string | null
}

function normalize(value: string) {
  return value.toLowerCase()
}

export function resolveTradingContext(session: AuthenticatedSession): TradingContext {
  const isTestnet = session.environment === "testnet"
  const config = loadConfig(isTestnet)

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
    accountSource: config.account ? "default_account_db" : "environment_variables",
    accountAlias: config.account?.alias ?? null,
  }
}

export function assertApiWalletConfigured(context: TradingContext) {
  const config = loadConfig(context.isTestnet)
  if (!config.privateKey) {
    throw new Error(
      `No API wallet configured for ${context.environment}. Attach an API wallet to the default account (hl account add/update) or set HYPERLIQUID_PRIVATE_KEY for server execution.`,
    )
  }
}

export async function createTradingClients(context: TradingContext, opts?: { requireApiWallet?: boolean }) {
  const config = loadConfig(context.isTestnet)
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
    slippagePercent: payload.slippage,
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
  return walletClient!.cancel(buildCancelRequest({ assetIndex, orderId: payload.oid }))
}

export async function fetchOpenOrders(context: TradingContext) {
  const { publicClient, user } = await createTradingClients(context, { requireApiWallet: false })
  return publicClient.openOrders({ user, dex: "ALL_DEXS" })
}

export function toApiError(error: unknown): { error: string } {
  return { error: parseOrderError(error) }
}
