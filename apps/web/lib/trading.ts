import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid"
import { privateKeyToAccount } from "viem/accounts"
import { loadConfig } from "../../../src/lib/config.js"
import {
  buildCancelRequest,
  buildLimitOrderRequest,
  buildMarketOrderRequest,
  getAssetIndex,
  parseOrderError,
} from "../../../src/core/order.js"

export async function createTradingClients() {
  const config = loadConfig(true)
  if (!config.privateKey) {
    throw new Error("No API wallet configured. Run `hl account add` and set a default account first.")
  }

  const transport = new HttpTransport({ isTestnet: true })
  const wallet = privateKeyToAccount(config.privateKey)

  return {
    publicClient: new InfoClient({ transport }),
    walletClient: new ExchangeClient({ transport, wallet }),
    user: config.walletAddress ?? wallet.address,
  }
}

export async function executeMarketOrder(payload: {
  side: string
  size: string
  coin: string
  reduceOnly?: boolean
  slippage: string
}) {
  const { publicClient, walletClient } = await createTradingClients()
  const orderRequest = await buildMarketOrderRequest(publicClient, {
    side: payload.side,
    size: payload.size,
    coin: payload.coin,
    reduceOnly: payload.reduceOnly,
    slippagePercent: payload.slippage,
  })

  return walletClient.order(orderRequest)
}

export async function executeLimitOrder(payload: {
  side: string
  size: string
  coin: string
  price: string
  tif: string
  reduceOnly?: boolean
}) {
  const { publicClient, walletClient } = await createTradingClients()
  const orderRequest = await buildLimitOrderRequest(publicClient, payload)
  return walletClient.order(orderRequest)
}

export async function cancelOrder(payload: { oid: string; coin: string }) {
  const { publicClient, walletClient } = await createTradingClients()
  const assetIndex = await getAssetIndex(publicClient, payload.coin)
  return walletClient.cancel(buildCancelRequest({ assetIndex, orderId: payload.oid }))
}

export async function fetchOpenOrders() {
  const { publicClient, user } = await createTradingClients()
  return publicClient.openOrders({ user, dex: "ALL_DEXS" })
}

export function toApiError(error: unknown): { error: string } {
  return { error: parseOrderError(error) }
}
