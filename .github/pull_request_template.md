## Summary
- Describe what changed.

## Slice completion / artifact gate
> Before marking any slice checkbox as `[x]`, link the exact CI job run and test artifacts that prove completion.

- [ ] I am not marking any new slice checkbox as complete in this PR.
- [ ] If I marked any slice checkbox as complete, I added concrete artifact links (CI job URL, test logs, and relevant file/test references) in this PR description.


## v1 scope guardrails
- [ ] This PR stays within dashboard/trade + SIM scope (no expansion into out-of-scope v1 items).
- [ ] This PR does not add a new top-level page/component beyond v1 caps from `docs/web-ui-v1-scope-guardrails.md`.
- [ ] If this PR adds any top-level page/component beyond cap, I included a rationale note (why needed for v1 + what is deferred) and linked explicit approval.

## Web performance evidence (required for dashboard/trade-impacting PRs)
> Record measured values and exact measurement method from `docs/web-ui-v1-performance-checklist.md`.

### Measured values
| Metric | `/dashboard` | `/trade/[symbol]` | Hard limit |
| --- | --- | --- | --- |
| Initial route JS (gzip, KB) | | | 220 / 240 |
| Hydration complete (s) | | | 2.6 / 3.0 |
| TTI (s) | | | 3.5 / 4.0 |
| Price update latency response->paint (ms) | | | 350 |
| Orders/positions update latency response->paint (ms) | | | 500 |
| Toast/error response->paint (ms) | | | 250 |
| FPS floor during active updates | | | >=55 |

### Measurement method + artifacts
- Build command + output artifact link:
- Lighthouse/DevTools command(s) + trace/report links:
- Sampling window + environment (throttling/device profile):

### Regression declaration (merge gate)
- [ ] No performance regression versus the latest trend-table row.
- [ ] Regression present and explicitly approved (approval link required):

### Trend table update
- Link to the new row appended in `docs/web-ui-v1-performance-checklist.md`:

## Quality-gate commands (paste result links)
- [ ] I confirmed UI component/page changes use token-backed colors (no raw hex/rgb/hsl literals outside token definition files).
- [ ] `pnpm --filter web lint` — Artifact link:
- [ ] `pnpm --filter web typecheck` — Artifact link:
- [ ] `pnpm --filter web test` — Artifact link:
- [ ] `pnpm --filter web exec eslint apps/web/app/api --max-warnings=0` — Artifact link:
- [ ] `pnpm --filter web exec tsc --noEmit` — Artifact link:
- [ ] `pnpm --filter web exec eslint apps/web/components --max-warnings=0` — Artifact link:
- [ ] `pnpm --filter web test src/web/agent-onboarding-routes.test.ts src/web/api-routes-auth.test.ts` — Artifact link:
