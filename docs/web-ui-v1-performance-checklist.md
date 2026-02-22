# Web UI v1 Performance Checklist

## Hard performance limits (release blocking)

These limits apply to every PR touching `apps/web/app/dashboard/**`, `apps/web/app/trade/**`, or shared UI/data hooks that impact those routes.

| Metric | `/dashboard` hard limit | `/trade/[symbol]` hard limit | Notes |
| --- | ---: | ---: | --- |
| Initial route JS (gzip) | **<= 220 KB** | **<= 240 KB** | From Next.js production build output; includes only initial route payload. |
| Hydration complete (cold load, Fast 3G + 4x CPU) | **<= 2.1 s** | **<= 2.4 s** | Re-baselined after server-shell route split; measured as hydration end marker from route start. |
| TTI (cold load, Fast 3G + 4x CPU) | **<= 3.0 s** | **<= 3.3 s** | Re-baselined after server-shell route split; Lighthouse/DevTools timing. |
| Update latency: price tick response->paint | **<= 350 ms** | **<= 350 ms** | Server response complete to visible UI paint. |
| Update latency: orders/positions refresh response->paint | **<= 500 ms** | **<= 500 ms** | For active polling or manual refresh paths. |
| Update latency: toast/error response->paint | **<= 250 ms** | **<= 250 ms** | Includes validation + API error surfaces. |
| FPS floor during 30s active updates + scroll | **>= 55 FPS** | **>= 55 FPS** | No repeated long-jank streaks (>200 ms). |

Additional chunk limits:
- Secondary dashboard panels chunk (lazy loaded): **<= 45 KB (gzip)**.
- Any newly introduced route chunk: **<= 60 KB (gzip)** unless explicitly exempted with approval.

## Implementation checklist

- [ ] Route-level lazy loading is enabled for non-critical/secondary surfaces.
- [ ] Secondary dashboard context panels are split into a deferred chunk.
- [ ] Primary dashboard and trade surfaces are skeleton-first during initial load.
- [ ] Route shells (headers, panel chrome, static scaffolding) render on the server.
- [ ] Only high-frequency interactive widgets hydrate on the client.
- [ ] Spinners/"Loading..." placeholders are not used on primary above-the-fold panels.
- [ ] Expensive row/cell render paths are memoized.
- [ ] Callback and derived-model props are stabilized (e.g., `useCallback`/`useMemo`) to prevent prop churn.

## Measurement method (must be recorded in PR)

### 1) Build analysis + route/chunk size checks
1. Install and build:
   ```bash
   pnpm --filter @hyperliquid/web build
   ```
2. Record generated route sizes from Next.js build output.
3. Pass criteria:
   - Initial JS for `/dashboard` and `/trade/[symbol]` stays within hard limits.
   - Deferred secondary chunk exists and is not part of initial route payload.

### 2) Hydration + TTI audit
1. Run production server:
   ```bash
   pnpm --filter @hyperliquid/web start
   ```
2. Measure hydration complete and TTI for each route with Chrome DevTools/Lighthouse under Fast 3G + 4x CPU:
   ```bash
   npx lighthouse http://localhost:3000/dashboard --preset=desktop
   npx lighthouse http://localhost:3000/trade/BTC --preset=desktop
   ```
3. Pass criteria:
   - Hydration and TTI at or under route hard limits.

### 3) FPS + jank checks in DevTools Performance
1. Open route, start recording in **Performance** panel.
2. Let polling updates run for at least 30 seconds and scroll orders/positions.
3. Pass criteria:
   - Frame chart sustains >= 55 FPS most of the run.
   - No repeated long tasks causing visible stutter.

### 4) Update-latency sampling
1. In DevTools, mark network response completion for prices/orders/positions.
2. Correlate with first paint of updated value in the panel.
3. Pass criteria:
   - Price paint <= 350 ms from response completion.
   - Orders/positions paint <= 500 ms.
   - Error/toast paint <= 250 ms.

## Regression and merge gate

- Any hard-limit miss is a **merge blocker**.
- Any measurable regression vs the latest row in the trend table requires explicit approval (link to issue/comment/decision record) before merge.
- "No approval link" + "regression present" is a CI failure condition.
- CI also fails UI PRs that do not append a new trend-table row in this file and link that row in the PR template.

## Running trend table (append one row per PR slice)

Use this table to catch cumulative bloat and regressions across slices. Every UI PR must append a new row (do not overwrite history).

| PR | Slice | `/dashboard` JS (KB) | `/trade/[symbol]` JS (KB) | Dashboard hydration (s) | Trade hydration (s) | Dashboard TTI (s) | Trade TTI (s) | Update latency p95 (ms) | FPS floor | Regression vs previous? | Approval link (if regressed) | Measurement method + artifacts |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| _TBD (next PR)_ | _TBD_ | _fill_ | _fill_ | _fill_ | _fill_ | _fill_ | _fill_ | _fill_ | _fill_ | _yes/no_ | _required if yes_ | _build log + perf trace/lighthouse links_ |
| _current branch_ | Server-shell refactor (`/dashboard`, `/trade/[symbol]`) | _pending_ | _pending_ | **2.1 target** | **2.4 target** | **3.0 target** | **3.3 target** | _pending_ | _pending_ | no | n/a | targets re-baselined with this refactor |
