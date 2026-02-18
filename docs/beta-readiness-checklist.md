# Beta Readiness Checklist

## Reliability
- [x] Request validation enforced for all RPC endpoints.
- [x] Per-endpoint fixed-window rate limiting enabled.
- [x] Polling/backoff strategy implemented for metadata refresh flows.

## Observability
- [x] Structured JSON logs emitted with trace IDs.
- [x] Metrics exposed through `getMetrics` endpoint.
- [x] Auth/data/trade endpoint categories tracked.

## Quality
- [x] Unit tests for shared core validation/rate-limit/backoff logic.
- [x] Integration tests for API routes (orders + balances auth guards + agent onboarding/agent-status endpoints).
- [x] Route-level auth regression checks for unauthenticated → `/auth` redirect and authenticated protected-route access.
- [x] E2E flow tests for login, dashboard, place/cancel order.
- [x] CI quality gates configured for lint + typecheck + tests.

### Test Artifacts
- `src/web/api-routes-auth.test.ts` — auth guard + protected order/balance route behavior.
- `src/web/agent-onboarding-routes.test.ts` — onboarding/agent-status lifecycle API integration coverage.
- `src/web/middleware-auth-redirects.test.ts` — middleware auth gating transitions across protected routes.
- `src/server/flows.e2e.test.ts` — critical login/dashboard/place/cancel order flow.

## Product + Launch
- [x] Activation funnel and key events documented.
- [x] Launch notes drafted for beta release.
