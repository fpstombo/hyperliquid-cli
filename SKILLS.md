# Hyperliquid CLI Skills for AI Agents

This document describes how AI agents can use the `hl` command-line tool to interact with Hyperliquid DEX.

## Overview

The `hl` CLI provides programmatic access to Hyperliquid perpetual futures trading. Use this tool when users want to:

- Check cryptocurrency prices, market data, or order books
- View trading positions or open orders
- Place limit, market, stop-loss, or take-profit orders
- Cancel orders or adjust leverage
- Manage referral codes

## Prerequisites

- The `hl` command must be installed and available in PATH
- For trading commands: `HYPERLIQUID_PRIVATE_KEY` environment variable must be set
- For testnet: add `--testnet` flag to any command

## Command Reference

### Global Options

All commands support these options:

| Option | Description |
|--------|-------------|
| `--json` | Output structured JSON (recommended for parsing) |
| `--testnet` | Use Hyperliquid testnet |

### Info Commands (No Authentication Required)

#### `hl info prices`

Get current mid prices for all or specific assets.

```bash
# Get all prices
hl info prices --json

# Get specific asset price
hl info prices --pair BTC --json
```

**Output (JSON):**
```json
{"coin": "BTC", "price": "89500.0"}
```

#### `hl info meta`

Get asset metadata including decimals and max leverage.

```bash
hl info meta --json
```

#### `hl info allPerpMetas`

Get all perpetual market metadata.

```bash
hl info allPerpMetas --json
```

#### `hl info markets`

Get comprehensive market data including funding rates and open interest.

```bash
hl info markets --json
```

**Output includes:** coin, szDecimals, maxLeverage, funding, openInterest, markPx, midPx, oraclePx, dayNtlVlm

#### `hl info book <coin>`

Get order book for a specific asset.

```bash
hl info book BTC --json
```

#### `hl info positions`

Get account positions.

```bash
# With configured wallet
hl info positions --json

# With specific address (read-only)
hl info positions --user 0x... --json
```

**Output (JSON):**
```json
{
  "positions": [
    {
      "coin": "BTC",
      "size": "0.001",
      "entryPx": "85000.0",
      "unrealizedPnl": "45.0",
      "leverage": {"type": "cross", "value": 10}
    }
  ],
  "marginSummary": {"accountValue": "1000.0", "totalMarginUsed": "85.0"}
}
```

#### `hl info orders`

Get open orders.

```bash
hl info orders --json
hl info orders --user 0x... --json
```

### Trade Commands (Authentication Required)

#### `hl trade order <coin> <side> <size> [price]`

Place an order.

**Limit Order:**
```bash
hl trade order BTC buy 0.001 85000 --json
hl trade order ETH sell 0.1 3500 --tif Ioc --json
```

**Market Order:**
```bash
hl trade order BTC buy 0.001 --type market --json
hl trade order ETH sell 0.1 --type market --slippage 0.5 --json
```

**Stop-Loss Order:**
```bash
hl trade order BTC sell 0.001 48000 --type stop-loss --trigger 49000 --json
```

**Take-Profit Order:**
```bash
hl trade order BTC sell 0.001 55000 --type take-profit --trigger 54000 --json
```

**Options:**

| Option | Values | Description |
|--------|--------|-------------|
| `--type` | `limit`, `market`, `stop-loss`, `take-profit` | Order type (default: limit) |
| `--tif` | `Gtc`, `Ioc`, `Alo` | Time-in-force (default: Gtc) |
| `--reduce-only` | flag | Only reduce position |
| `--slippage` | number | Slippage % for market orders (default: 1) |
| `--trigger` | price | Trigger price for stop/TP orders |
| `--tpsl` | flag | Mark as TP/SL for position management |

**Success Output:**
```json
{
  "status": "ok",
  "response": {
    "type": "order",
    "data": {
      "statuses": [{"resting": {"oid": 12345}}]
    }
  }
}
```

#### `hl trade cancel <coin> <order-id>`

Cancel an order by ID.

```bash
hl trade cancel BTC 12345 --json
```

#### `hl trade leverage <coin> <leverage>`

Set leverage for an asset.

```bash
# Cross margin (default)
hl trade leverage BTC 10 --json

# Isolated margin
hl trade leverage BTC 10 --isolated --json
```

### Referral Commands

#### `hl referral set <code>`

Set a referral code.

```bash
hl referral set MYCODE --json
```

#### `hl referral status`

Get referral information.

```bash
hl referral status --json
```

## Common Workflows

### Check Market Before Trading

```bash
# 1. Get current price
hl info prices --pair BTC --json

# 2. Check order book depth
hl info book BTC --json

# 3. Review funding rate
hl info markets --json | jq '.[] | select(.coin == "BTC") | {funding, openInterest}'
```

### Open a Position

```bash
# 1. Set leverage
hl trade leverage BTC 5 --json

# 2. Place limit order
hl trade order BTC buy 0.01 85000 --json

# 3. Verify order placed
hl info orders --json
```

### Close a Position

```bash
# 1. Check current position
hl info positions --json

# 2. Close with market order
hl trade order BTC sell 0.01 --type market --reduce-only --json
```

### Set Stop-Loss and Take-Profit

```bash
# After opening a long position at 85000

# Stop-loss at 83000
hl trade order BTC sell 0.01 82500 --type stop-loss --trigger 83000 --tpsl --json

# Take-profit at 90000
hl trade order BTC sell 0.01 90500 --type take-profit --trigger 90000 --tpsl --json
```

### Cancel All Orders for an Asset

```bash
# Get all order IDs for BTC
ORDERS=$(hl info orders --json | jq -r '.[] | select(.coin == "BTC") | .oid')

# Cancel each order
for oid in $ORDERS; do
  hl trade cancel BTC $oid --json
done
```

## Error Handling

Commands exit with code 1 on error and print to stderr:

```bash
hl trade order BTC buy 0.001 85000 --json
# Error: HYPERLIQUID_PRIVATE_KEY environment variable is required for this command
```

Common errors:
- Missing `HYPERLIQUID_PRIVATE_KEY` for trade commands
- Invalid coin symbol
- Insufficient balance/margin
- Invalid order parameters

## Tips for AI Agents

1. **Always use `--json`** for reliable parsing
2. **Check prices first** before placing orders to validate parameters
3. **Use `jq`** to filter and extract specific fields from JSON output
4. **Validate coin symbols** using `hl info meta --json` to get valid asset names
5. **For testnet testing**, always add `--testnet` flag
6. **Handle errors gracefully** - check exit codes and stderr
7. **Market orders use IOC** with slippage - may partially fill or fail in low liquidity

## Asset Symbol Reference

Common perpetual assets: BTC, ETH, SOL, AVAX, BNB, ARB, OP, DOGE, MATIC, ATOM, LINK, UNI, AAVE, etc.

Get full list:
```bash
hl info meta --json | jq '.universe[].name'
```
