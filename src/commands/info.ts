import { Command } from "commander"
import { getContext, getOutputOptions } from "../cli/program.js"
import { output, outputError } from "../cli/output.js"
import { validateAddress } from "../lib/validation.js"
import type { Address } from "viem"

export function registerInfoCommands(program: Command): void {
  const info = program.command("info").description("Get market information (read-only)")

  info
    .command("prices")
    .description("Get mid prices for all assets")
    .option("--pair <coin>", "Filter by specific coin")
    .action(async function (this: Command, options: { pair?: string }) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        const client = ctx.getPublicClient()
        const mids = await client.allMids()

        if (options.pair) {
          const coin = options.pair.toUpperCase()
          const price = mids[coin]
          if (price === undefined) {
            outputError(`Coin not found: ${coin}`)
            process.exit(1)
          }
          output({ coin, price }, outputOpts)
        } else {
          const prices = Object.entries(mids).map(([coin, price]) => ({
            coin,
            price,
          }))
          output(prices, outputOpts)
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  info
    .command("meta")
    .description("Get asset metadata")
    .action(async function (this: Command) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        const client = ctx.getPublicClient()
        const meta = await client.meta()
        output(meta, outputOpts)
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  info
    .command("allPerpMetas")
    .description("Get all perpetual market metadata")
    .action(async function (this: Command) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        const client = ctx.getPublicClient()
        const allPerpMetas = await client.allPerpMetas()

        output(allPerpMetas, outputOpts)
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
  info
    .command("markets")
    .description("Get full market data (prices, funding, open interest)")
    .action(async function (this: Command) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        const client = ctx.getPublicClient()
        const data = await client.metaAndAssetCtxs()
        const [meta, contexts] = data

        const markets = meta.universe.map(
          (asset: { name: string; szDecimals: number; maxLeverage: number }, i: number) => ({
            coin: asset.name,
            szDecimals: asset.szDecimals,
            maxLeverage: asset.maxLeverage,
            ...contexts[i],
          }),
        )

        output(markets, outputOpts)
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  info
    .command("book")
    .description("Get order book for a coin")
    .argument("<coin>", "Coin symbol (e.g., BTC, ETH)")
    .action(async function (this: Command, coin: string) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        const client = ctx.getPublicClient()
        const book = await client.l2Book({ coin: coin.toUpperCase() })
        output(book, outputOpts)
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  info
    .command("positions")
    .description("Get account positions")
    .option("--user <address>", "User address (defaults to configured wallet)")
    .action(async function (this: Command, options: { user?: string }) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        let user: Address
        if (options.user) {
          user = validateAddress(options.user)
        } else {
          user = ctx.getWalletAddress()
        }

        const client = ctx.getPublicClient()
        const state = await client.clearinghouseState({ user })

        // Extract positions with non-zero size
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
            leverage: p.leverage,
            liquidationPx: p.liquidationPx,
          }))

        if (outputOpts.json) {
          output(
            {
              positions,
              marginSummary: state.marginSummary,
              crossMarginSummary: state.crossMarginSummary,
            },
            outputOpts,
          )
        } else {
          if (positions.length === 0) {
            console.log("No open positions")
          } else {
            output(positions, outputOpts)
          }
          console.log(`\nAccount Value: ${state.marginSummary.accountValue}`)
          console.log(`Total Margin Used: ${state.marginSummary.totalMarginUsed}`)
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })

  info
    .command("orders")
    .description("Get open orders")
    .option("--user <address>", "User address (defaults to configured wallet)")
    .action(async function (this: Command, options: { user?: string }) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        let user: Address
        if (options.user) {
          user = validateAddress(options.user)
        } else {
          user = ctx.getWalletAddress()
        }

        const client = ctx.getPublicClient()
        const orders = await client.openOrders({ user })

        if (orders.length === 0 && !outputOpts.json) {
          console.log("No open orders")
        } else {
          type Order = {
            oid: number
            coin: string
            side: string
            sz: string
            limitPx: string
            timestamp: number
          }
          const formatted = orders.map((o: Order) => ({
            oid: o.oid,
            coin: o.coin,
            side: o.side,
            sz: o.sz,
            limitPx: o.limitPx,
            timestamp: o.timestamp,
          }))
          output(formatted, outputOpts)
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err))
        process.exit(1)
      }
    })
}
