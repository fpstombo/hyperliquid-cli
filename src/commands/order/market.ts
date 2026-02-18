import { Command } from "commander"
import { getContext, getOutputOptions } from "../../cli/program.js"
import { output, outputError, outputSuccess } from "../../cli/output.js"
import { getOrderConfig } from "../../lib/order-config.js"
import { buildMarketOrderRequest, parseOrderError } from "./shared.js"

export function registerMarketCommand(order: Command): void {
  order
    .command("market")
    .description("Place a market order")
    .argument("<side>", "Order side: buy, sell, long, or short")
    .argument("<size>", "Order size")
    .argument("<coin>", "Coin symbol (e.g., BTC, ETH)")
    .option("--reduce-only", "Reduce-only order")
    .option("--slippage <pct>", "Slippage percentage (overrides config)")
    .action(async function (
      this: Command,
      sideArg: string,
      sizeArg: string,
      coin: string,
      options: {
        reduceOnly?: boolean
        slippage?: string
      },
    ) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        const client = ctx.getWalletClient()
        const publicClient = ctx.getPublicClient()

        const config = getOrderConfig()
        const slippagePercent = options.slippage ? parseFloat(options.slippage) : config.slippage

        const orderRequest = await buildMarketOrderRequest(publicClient, {
          side: sideArg,
          size: sizeArg,
          coin,
          reduceOnly: options.reduceOnly || false,
          slippagePercent,
        })

        const result = await client.order(orderRequest)

        if (outputOpts.json) {
          output(result, outputOpts)
        } else {
          const statuses = result.response.data.statuses
          for (const status of statuses) {
            if (typeof status === "string") {
              outputSuccess(`Order status: ${status}`)
            } else if ("filled" in status) {
              outputSuccess(`Order filled: ${status.filled.totalSz} @ ${status.filled.avgPx}`)
            } else if ("resting" in status) {
              outputSuccess(`Order placed: ID ${status.resting.oid}`)
            }
          }
        }
      } catch (err) {
        outputError(parseOrderError(err))
        process.exit(1)
      }
    })
}
