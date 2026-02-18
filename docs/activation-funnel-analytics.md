# Activation Funnel Analytics (Beta)

## Funnel Stages
1. **Visit**: user reaches the dashboard shell.
2. **Authenticate**: `login` API success returns session token.
3. **Load Data**: `getDashboard` completes with cache + price payload.
4. **Intent to Trade**: user opens order ticket and submits `placeOrder`.
5. **First Completed Trade Loop**: `cancelOrder` or fill-state callback acknowledged.

## Key Product Events
- `auth.login.succeeded`
- `auth.login.failed`
- `dashboard.load.succeeded`
- `dashboard.load.failed`
- `trade.place_order.succeeded`
- `trade.place_order.failed`
- `trade.cancel_order.succeeded`
- `trade.cancel_order.failed`
- `api.rate_limited`

## Required Event Properties
- `trace_id`
- `session_id`
- `endpoint`
- `latency_ms`
- `network` (`mainnet`/`testnet`)
- `error_code` (if applicable)

## KPI Targets (Beta)
- Login success rate: **>98%**
- Dashboard successful load after login: **>95%**
- Place-order success on testnet: **>90%**
- P95 endpoint latency on core endpoints: **<250ms**
