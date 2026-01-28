import { Command } from "commander";
import { getContext, getOutputOptions } from "../cli/program.js";
import { output, outputError, outputSuccess } from "../cli/output.js";
import {
  validatePositiveNumber,
  validateSide,
  validateTif,
  validatePositiveInteger,
} from "../lib/validation.js";

export function registerTradeCommands(program: Command): void {
  const trade = program
    .command("trade")
    .description("Execute trades (requires authentication)");

  trade
    .command("order")
    .description("Place an order")
    .argument("<coin>", "Coin symbol (e.g., BTC, ETH)")
    .argument("<side>", "Order side: buy or sell")
    .argument("<size>", "Order size")
    .argument("[price]", "Limit price (required for limit orders)")
    .option(
      "--type <type>",
      "Order type: limit, market, stop-loss, take-profit",
      "limit"
    )
    .option("--tif <tif>", "Time-in-force: Gtc, Ioc, Alo", "Gtc")
    .option("--reduce-only", "Reduce-only order")
    .option("--slippage <pct>", "Slippage percentage for market orders", "1")
    .option("--trigger <price>", "Trigger price for stop-loss/take-profit")
    .option("--tpsl", "Mark as TP/SL order for position management")
    .action(async function (
      this: Command,
      coin: string,
      sideArg: string,
      sizeArg: string,
      priceArg: string | undefined,
      options: {
        type: string;
        tif?: string;
        reduceOnly?: boolean;
        slippage?: string;
        trigger?: string;
        tpsl?: boolean;
      }
    ) {
      const ctx = getContext(this);
      const outputOpts = getOutputOptions(this);

      try {
        const client = ctx.getWalletClient();
        const publicClient = ctx.getPublicClient();

        const side = validateSide(sideArg);
        const size = validatePositiveNumber(sizeArg, "size");
        const isBuy = side === "buy";

        const orderType = options.type.toLowerCase();

        // Get asset index from meta
        const meta = await publicClient.meta();
        const assetIndex = meta.universe.findIndex(
          (a: { name: string }) => a.name.toUpperCase() === coin.toUpperCase()
        );
        if (assetIndex === -1) {
          throw new Error(`Unknown coin: ${coin}`);
        }

        let orderRequest: Parameters<typeof client.order>[0];

        if (orderType === "market") {
          // Market order: IOC at mid price + slippage
          const mids = await publicClient.allMids();
          const midPrice = parseFloat(mids[coin.toUpperCase()]);
          if (!midPrice) {
            throw new Error(`Cannot get mid price for ${coin}`);
          }

          const slippagePct = parseFloat(options.slippage || "1") / 100;
          const limitPx = isBuy
            ? midPrice * (1 + slippagePct)
            : midPrice * (1 - slippagePct);

          orderRequest = {
            orders: [
              {
                a: assetIndex,
                b: isBuy,
                p: limitPx.toFixed(6),
                s: size.toString(),
                r: options.reduceOnly || false,
                t: { limit: { tif: "Ioc" } },
              },
            ],
            grouping: "na",
          };
        } else if (orderType === "stop-loss" || orderType === "take-profit") {
          // Trigger orders
          if (!options.trigger) {
            throw new Error(
              `--trigger price is required for ${orderType} orders`
            );
          }
          if (!priceArg) {
            throw new Error(`Limit price is required for ${orderType} orders`);
          }

          const triggerPx = validatePositiveNumber(
            options.trigger,
            "trigger price"
          );
          const limitPx = validatePositiveNumber(priceArg, "price");
          // tpsl is required for trigger orders
          const tpsl: "tp" | "sl" =
            orderType === "take-profit" ? "tp" : "sl";

          orderRequest = {
            orders: [
              {
                a: assetIndex,
                b: isBuy,
                p: limitPx.toString(),
                s: size.toString(),
                r: options.reduceOnly || false,
                t: {
                  trigger: {
                    triggerPx: triggerPx.toString(),
                    isMarket: false,
                    tpsl,
                  },
                },
              },
            ],
            grouping: options.tpsl ? "normalTpsl" : "na",
          };
        } else {
          // Limit order (default)
          if (!priceArg) {
            throw new Error("Price is required for limit orders");
          }

          const limitPx = validatePositiveNumber(priceArg, "price");
          const tif = validateTif(options.tif || "Gtc");

          orderRequest = {
            orders: [
              {
                a: assetIndex,
                b: isBuy,
                p: limitPx.toString(),
                s: size.toString(),
                r: options.reduceOnly || false,
                t: { limit: { tif } },
              },
            ],
            grouping: "na",
          };
        }

        const result = await client.order(orderRequest);

        if (outputOpts.json) {
          output(result, outputOpts);
        } else {
          // result.status is "ok" for successful responses (errors throw)
          const statuses = result.response.data.statuses;
          for (const status of statuses) {
            if (typeof status === "string") {
              // "waitingForFill" or "waitingForTrigger"
              outputSuccess(`Order status: ${status}`);
            } else if ("filled" in status) {
              outputSuccess(
                `Order filled: ${status.filled.totalSz} @ ${status.filled.avgPx}`
              );
            } else if ("resting" in status) {
              outputSuccess(`Order placed: ID ${status.resting.oid}`);
            }
          }
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  trade
    .command("cancel")
    .description("Cancel an order")
    .argument("<coin>", "Coin symbol")
    .argument("<order-id>", "Order ID to cancel")
    .action(async function (
      this: Command,
      coin: string,
      orderIdArg: string
    ) {
      const ctx = getContext(this);
      const outputOpts = getOutputOptions(this);

      try {
        const client = ctx.getWalletClient();
        const publicClient = ctx.getPublicClient();

        const orderId = validatePositiveInteger(orderIdArg, "order-id");

        // Get asset index from meta
        const meta = await publicClient.meta();
        const assetIndex = meta.universe.findIndex(
          (a: { name: string }) => a.name.toUpperCase() === coin.toUpperCase()
        );
        if (assetIndex === -1) {
          throw new Error(`Unknown coin: ${coin}`);
        }

        const result = await client.cancel({
          cancels: [{ a: assetIndex, o: orderId }],
        });

        if (outputOpts.json) {
          output(result, outputOpts);
        } else {
          // Successful cancels don't throw
          outputSuccess(`Order ${orderId} cancelled`);
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  trade
    .command("leverage")
    .description("Set leverage for a coin")
    .argument("<coin>", "Coin symbol")
    .argument("<leverage>", "Leverage value")
    .option("--cross", "Use cross margin")
    .option("--isolated", "Use isolated margin")
    .action(async function (
      this: Command,
      coin: string,
      leverageArg: string,
      options: { cross?: boolean; isolated?: boolean }
    ) {
      const ctx = getContext(this);
      const outputOpts = getOutputOptions(this);

      try {
        const client = ctx.getWalletClient();
        const publicClient = ctx.getPublicClient();

        const leverage = validatePositiveInteger(leverageArg, "leverage");

        // Get asset index from meta
        const meta = await publicClient.meta();
        const assetIndex = meta.universe.findIndex(
          (a: { name: string }) => a.name.toUpperCase() === coin.toUpperCase()
        );
        if (assetIndex === -1) {
          throw new Error(`Unknown coin: ${coin}`);
        }

        // Default to cross margin if neither specified
        const isCross = options.cross || !options.isolated;

        const result = await client.updateLeverage({
          asset: assetIndex,
          isCross,
          leverage,
        });

        if (outputOpts.json) {
          output(result, outputOpts);
        } else {
          // Successful updates don't throw
          outputSuccess(
            `Leverage set to ${leverage}x (${isCross ? "cross" : "isolated"}) for ${coin.toUpperCase()}`
          );
        }
      } catch (err) {
        outputError(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
