import { Command } from "commander"
import { getContext, getOutputOptions } from "../../cli/program.js"
import { output, outputError, outputSuccess } from "../../cli/output.js"
import { select } from "../../lib/prompts.js"
import { buildCancelRequest, getAssetIndex, parseOrderError } from "./shared.js"

export function registerCancelCommand(order: Command): void {
  order
    .command("cancel")
    .description("Cancel an order (interactive if no OID provided)")
    .argument("[oid]", "Order ID to cancel")
    .action(async function (this: Command, oidArg?: string) {
      const ctx = getContext(this)
      const outputOpts = getOutputOptions(this)

      try {
        const client = ctx.getWalletClient()
        const publicClient = ctx.getPublicClient()
        const user = ctx.getWalletAddress()

        let orderId: number
        let assetIndex: number

        if (oidArg) {
          // Direct cancel with provided OID
          orderId = parseInt(oidArg, 10)

          // Fetch open orders to find the asset index for this order
          const orders = await publicClient.openOrders({ user, dex: "ALL_DEXS" })
          const orderToCancel = orders.find((o: { oid: number }) => o.oid === orderId)

          if (!orderToCancel) {
            throw new Error(`Order ${orderId} not found in open orders`)
          }

          assetIndex = await getAssetIndex(publicClient, orderToCancel.coin)
        } else {
          // Interactive mode: select from open orders
          const orders = await publicClient.openOrders({ user, dex: "ALL_DEXS" })

          if (orders.length === 0) {
            outputSuccess("No open orders to cancel")
            return
          }

          type Order = {
            oid: number
            coin: string
            side: string
            sz: string
            limitPx: string
          }

          const options = orders.map((o: Order) => ({
            value: String(o.oid),
            label: `${o.oid}: ${o.coin} ${o.side === "B" ? "Buy" : "Sell"} ${o.sz} @ ${o.limitPx}`,
          }))

          const selectedOid = await select("Select order to cancel:", options)
          orderId = parseInt(selectedOid, 10)

          const selectedOrder = orders.find((o: Order) => o.oid === orderId) as Order
          assetIndex = await getAssetIndex(publicClient, selectedOrder.coin)
        }

        const result = await client.cancel(buildCancelRequest({ assetIndex, orderId }))

        if (outputOpts.json) {
          output(result, outputOpts)
        } else {
          outputSuccess(`Order ${orderId} cancelled`)
        }
      } catch (err) {
        outputError(parseOrderError(err))
        process.exit(1)
      }
    })
}
