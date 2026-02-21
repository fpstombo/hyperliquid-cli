# Web UI v1 Scope Guardrails

These guardrails are hard caps for v1 delivery and apply to all roadmap/planning and implementation PRs.

## Hard caps

- **Max top-level pages:** 3 (`/auth`, `/dashboard`, `/trade/[symbol]`)
  - Any additional top-level page is out of v1 scope unless explicitly approved.
- **Max primary composite panels per page:** 4
  - Composite panels are major workspace regions (for example: market selector, chart, order ticket, open orders).
- **No multi-theme engine in v1**
  - v1 ships with the current dark-mode-first theme only.
- **No animation library in v1 unless justified**
  - Do not add Framer Motion or similar dependencies by default.
  - If an animation library is proposed, include a written justification (UX impact + perf/cost tradeoff) in the PR.

## In-scope boundary (v1)

v1 stays within **dashboard + trade** user journeys and **SIM/testnet validation paths**.

## Must not ship in v1

- Live execution paths on mainnet.
- Strategy builder / visual strategy composer.
- Multi-account orchestration (including cross-account controls or aggregate account routing).

## PR checklist requirements

Every web UI PR must include explicit confirmations:

- Changes remain inside dashboard/trade + SIM scope.
- No new top-level page/component beyond caps, **or** a rationale is provided.

If any new top-level component/page is introduced beyond cap, add a short rationale note in the PR description with:

1. Why existing components cannot support the use case.
2. Why this is still required for v1.
3. What is being deferred to keep scope contained.
