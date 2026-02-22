# Web UI v1 Release Gate

This release gate combines the mandatory completion checks for visual quality, performance, streaming reliability, SIM compliance, boundary guardrails, and scope integrity.

## Gate inputs (all mandatory)

- Visual QA rubric and fail-condition checks from `docs/web-ui-execution-plan.md`.
- Performance hard limits and trend-table evidence from `docs/web-ui-v1-performance-checklist.md`.
- SIM viewport and semantics checks from `docs/sim-viewport-qa-checklist.md`.
- Scope caps and non-goal guardrails from `docs/web-ui-v1-scope-guardrails.md`.
- Confidence scoring from `docs/web-ui-v1-confidence-score.md`.

## Domain checks

### 1) Visual gate
- All applicable visual rubric checks pass.
- No visual auto-fail conditions.
- Screenshot evidence is attached for changed surfaces.

### 2) Performance gate
- `/dashboard` and `/trade/[symbol]` satisfy all hard limits.
- No route/chunk size cap misses.
- Hydration, TTI, update latency, and FPS checks pass.
- Trend table row is appended for the release PR.

### 3) Streaming gate
- Live price/order/account updates remain fresh under normal operation.
- Reconnect/retry behavior is validated for interrupted streams.
- Stale data states are surfaced clearly and recover correctly.
- Error-state UX does not block user recovery.

### 4) SIM gate
- Required SIM surfaces are above the fold at all required desktop viewports.
- SIM badges and labels use SIM semantics/styling (`SIM Pending`, `SIM Confirmed`, `SIM Rejected`).
- No SIM indicator regressions relative to baseline screenshots.

### 5) Boundary gate
- Route/page caps remain within v1 limits.
- Layering contract remains intact (no component-layer domain/server imports).
- Locked non-goals remain untouched unless explicitly approved as scope swaps.

### 6) Scope integrity gate
- Required PR sequence reporting is complete for all relevant slices.
- Lint/typecheck/test reports for web are attached and passing.
- Required artifacts are present and auditable.

## Decision matrix

| Gate domain | Pass requirement | Blocker trigger |
| --- | --- | --- |
| Visual | 100% checks pass | Any rubric fail or missing screenshots |
| Performance | 100% hard limits pass | Any limit miss or missing perf evidence |
| Streaming | >=99% required checks pass | Data freshness/recovery regression |
| SIM | 100% checks pass | Any viewport visibility or semantic mismatch |
| Boundary | 100% checks pass | Guardrail cap breach or non-goal violation |
| Scope integrity | 100% checks pass | Missing reports/artifacts |

## Hard completion rule (v1)

**Web UI v1 cannot be declared complete unless every release gate above passes and the computed confidence score is >=99.**

If any gate fails, v1 status remains **incomplete** until remediation evidence is merged and re-validated.
