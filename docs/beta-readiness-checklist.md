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
- [x] Web-slice completion gate enforced: no slice can be marked complete unless web route lint, typecheck, and tests all pass in CI for that PR.
- [x] API route quality gate enforced for `apps/web/app/api/**`: compile/lint checks must pass and duplicate-import/syntax regressions must be covered by targeted tests.

### Required Quality-Gate Commands (must pass before marking slice completion)
- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
- `pnpm --filter web test`
- `pnpm --filter web exec eslint apps/web/app/api --max-warnings=0`
- `pnpm --filter web exec tsc --noEmit`
- `pnpm --filter web exec eslint apps/web/components --max-warnings=0`
- `pnpm --filter web test src/web/agent-onboarding-routes.test.ts src/web/api-routes-auth.test.ts`

### Test Artifacts
- `src/web/api-routes-auth.test.ts` — auth guard + protected order/balance route behavior.
- `src/web/agent-onboarding-routes.test.ts` — onboarding/agent-status lifecycle API integration coverage.
- `src/web/middleware-auth-redirects.test.ts` — middleware auth gating transitions across protected routes.
- `src/server/flows.e2e.test.ts` — critical login/dashboard/place/cancel order flow.

## Product + Launch
- [x] Activation funnel and key events documented.
- [x] Launch notes drafted for beta release.

### Completed this PR
- [x] Web-slice completion gate enforcement is now codified in CI and PR intake requirements. _(Artifacts: `.github/workflows/ci.yml`, `.github/pull_request_template.md`)_
- [x] API route quality gate enforcement now requires dedicated eslint/tsc/targeted route tests in CI plus PR artifact links. _(Artifacts: `.github/workflows/ci.yml`, `.github/pull_request_template.md`)_

### Next up
- [ ] Attach concrete CI run URLs for this PR in the merged PR description so future slice-checkbox promotions can cite immutable job artifacts. _(Artifacts: `.github/pull_request_template.md`)_
