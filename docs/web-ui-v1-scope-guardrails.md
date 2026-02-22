# Web UI v1 Scope Guardrails

These guardrails are hard caps for v1 delivery and apply to all planning and implementation PRs touching the web UI.

## Hard caps (non-negotiable)

- **Max top-level pages:** 3 (`/auth`, `/dashboard`, `/trade/[symbol]`)
  - Any additional top-level page is out of v1 scope unless explicitly approved as a scope swap.
- **Max above-the-fold primary blocks per page:** 4
  - Above-the-fold primary blocks are the first-view task-critical regions a user sees without scrolling.
- **Max primary composite components per page:** 4
  - Primary composite components are major workspace regions (for example: market selector, chart, order ticket, open orders).
- **No theming expansion in v1**
  - v1 ships with the current dark-mode-first theme only (no theme system expansion, no additional theme variants).
- **No animation library in v1 unless justified**
  - Do not add Framer Motion or similar dependencies by default.
  - If an animation library is proposed, include a written justification (UX impact + perf/cost tradeoff) in the PR.

## In-scope boundary (v1)

v1 stays within **dashboard + trade** user journeys and **SIM/testnet validation paths**.

## Locked non-goals (must not ship in v1)

- No live trading paths on mainnet.
- No strategy builder / visual strategy composer.
- No theming expansion beyond the current dark-mode-first approach.
- No multi-account orchestration (including cross-account controls or aggregate account routing).

## Layout change rule

- **Any new panel requires displacement or demotion.**
  - If a new primary panel/component is added, one existing primary panel/component must be removed, merged, or demoted to a secondary/overflow surface.
  - PRs must identify the displaced/demoted element explicitly.

## Required UI PR checklist compliance

Every web UI PR must include a checklist section that explicitly confirms guardrail compliance:

- [ ] Changes remain inside dashboard/trade + SIM scope.
- [ ] No net-new top-level page beyond cap.
- [ ] No net-new above-the-fold primary block beyond cap.
- [ ] No net-new primary composite component beyond cap.
- [ ] Any new panel includes explicit displacement or demotion.
- [ ] Locked non-goals remain untouched (no live trading path, no strategy builder, no theming expansion in v1).

If a cap exception is requested, include a short rationale note in the PR description with:

1. Why existing components cannot support the use case.
2. Why this is still required for v1.
3. What is being deferred to keep scope contained.
