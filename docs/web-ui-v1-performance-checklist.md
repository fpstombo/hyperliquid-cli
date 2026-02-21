# Web UI v1 Performance Checklist

## Performance budgets and targets

### Route bundle budgets (gzip)
- `/dashboard`: **<= 220 KB** initial JS payload.
- `/trade/[symbol]`: **<= 240 KB** initial JS payload.
- Secondary dashboard panels chunk (lazy loaded): **<= 45 KB**.
- Any newly introduced route chunk: **<= 60 KB** unless exempted in release notes.

### User-centric responsiveness targets
- **TTI (Time to Interactive)** on cold load (Fast 3G, 4x CPU):
  - `/dashboard`: **<= 3.5 s**
  - `/trade/[symbol]`: **<= 4.0 s**
- **INP (Interaction to Next Paint)** p75 on key interactions: **<= 200 ms**.
- **FPS goal** during list updates/scroll: sustain **>= 55 FPS** with no long jank streaks (> 200 ms).
- **Data update latency thresholds** (server response to painted UI):
  - Price card updates: **<= 350 ms**
  - Orders/positions table refresh paint: **<= 500 ms**
  - Toast/error-state surface: **<= 250 ms**

## Implementation checklist

- [ ] Route-level lazy loading is enabled for non-critical/secondary surfaces.
- [ ] Secondary dashboard context panels are split into a deferred chunk.
- [ ] Primary dashboard and trade surfaces are skeleton-first during initial load.
- [ ] Spinners/"Loading..." placeholders are not used on primary above-the-fold panels.
- [ ] Expensive row/cell render paths are memoized.
- [ ] Callback and derived-model props are stabilized (e.g., `useCallback`/`useMemo`) to prevent prop churn.

## Measurement method

### 1) Build analysis + route/chunk size checks
1. Install and build:
   ```bash
   pnpm --filter @hyperliquid/web build
   ```
2. Record generated route sizes from Next.js build output.
3. Pass criteria:
   - Initial JS for `/dashboard` and `/trade/[symbol]` stays within budget.
   - Deferred secondary chunk exists and is not part of initial route payload.

### 2) Lighthouse lab audit (TTI/INP)
1. Run production server:
   ```bash
   pnpm --filter @hyperliquid/web start
   ```
2. Use Chrome DevTools Lighthouse or CLI with mobile throttling:
   ```bash
   npx lighthouse http://localhost:3000/dashboard --preset=desktop
   npx lighthouse http://localhost:3000/trade/BTC --preset=desktop
   ```
3. Pass criteria:
   - TTI at or under route targets.
   - INP p75 at or under 200 ms.

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

## Regression gate
- Treat budget/target misses as release blockers unless documented with mitigation and explicit approval.
