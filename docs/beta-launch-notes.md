# Beta Launch Notes

## Highlights
- Added RPC request validation and endpoint-level rate limiting.
- Added structured logging with trace IDs for request lifecycle visibility.
- Added baseline metrics for auth, data, trade, and system endpoints.
- Added exponential backoff for websocket readiness and metadata polling refresh.

## Quality and Testing
- New unit coverage for validation, limiter, and backoff primitives.
- New integration coverage for protected/public endpoint behavior.
- New e2e test flow covering login → dashboard → place order → cancel order.

## Operational Notes
- `getMetrics` can be queried by operators to inspect request counts and aggregate endpoint latency.
- Structured logs are written to `~/.hl/server.log` as JSON lines for ingestion into log tools.
