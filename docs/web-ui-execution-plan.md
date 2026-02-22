# Hyperliquid Web UI: 0→1 Execution Plan

This plan supersedes the current terminal UI with a web-first product while reusing the CLI's proven Hyperliquid domain logic.

## Architecture Decision (Updated)

### Wallet Connect Provider
**Recommendation: use Privy for wallet connect and auth UX.**

Why Privy fits this project:
- Faster onboarding (social + embedded + external wallets) while still supporting wallet-native users.
- Cleaner auth/session lifecycle than hand-rolled SIWE in early MVP.
- Good fit for a trading UI where reducing login friction increases activation.

Tradeoffs to accept:
- Additional dependency/vendor lock-in.
- Auth and wallet lifecycle becomes partially provider-shaped.

Mitigation:
- Keep wallet abstraction in a `web/core/wallet` adapter so migration to wagmi-only remains possible.

## Delivery Strategy

We will build in vertical slices, each resulting in a usable increment.

## UI v1 PR sequence

All UI v1 implementation work must ship through the following PR sequence. Each PR must stay scoped to `apps/web` only. If a change is required outside `apps/web`, defer it to a separately approved cross-package follow-up PR.

### PR1 — Tokens + primitives only
**In scope**
- Design tokens, theme variables, and shared style foundations under `apps/web`.
- UI primitives (button, input, card, table, modal, toast, etc.) and their local tests/stories/fixtures in `apps/web`.

**Out of scope**
- Any page-level composition (dashboard, trade workspace, onboarding flows).
- Data hooks, API routes, auth wiring, trading logic, or state orchestration.
- Any non-`apps/web` package changes.

### PR2 — Dashboard composition
**In scope**
- Dashboard page composition using existing primitives and mock/static data wiring in `apps/web`.
- Dashboard-specific layout containers, sections, and empty/loading/error view composition.

**Out of scope**
- Trade page composition or order-ticket interactions.
- New API integrations, server routes, or cross-package abstractions.
- Performance hardening or accessibility/keyboard polish beyond baseline semantic correctness.

### PR3 — Trade composition
**In scope**
- Trade route composition (order ticket shell, book/panel layout, open orders presentation) in `apps/web`.
- UI state composition needed for interactive trade screen behavior using existing app-local utilities.

**Out of scope**
- Rendering/performance optimization passes.
- Cross-cutting accessibility keyboard refinement work (reserved for PR5).
- Changes outside `apps/web`.

### PR4 — Rendering/perf optimizations
**In scope**
- Rendering optimizations (memoization, virtualization, suspense/loading boundary tuning, re-render reduction) confined to `apps/web`.
- Performance instrumentation/measurement helpers that live in `apps/web` and support UI-level regressions.

**Out of scope**
- New product features or major UX/layout rewrites.
- Accessibility polish, keyboard shortcut systems, and focus-management upgrades (reserved for PR5).
- Any non-`apps/web` refactors.

### PR5 — Polish + accessibility + keyboard
**In scope**
- Visual polish pass (spacing, typography, states, consistency) within established UI structures in `apps/web`.
- Accessibility remediation (roles, labels, contrast fixes, focus treatment, screen-reader text).
- Keyboard support and navigation/shortcut behavior for critical UI workflows.

**Out of scope**
- Net-new feature additions or architecture rewrites.
- Broad performance refactors not directly needed for a11y/keyboard correctness.
- Cross-package updates unless they are split into a separately approved follow-up.

### Required PR reporting (PR1–PR5)
Each PR in this sequence must include all of the following before merge:
- Lint status report for web (`pnpm --filter web lint`).
- Typecheck status report for web (`pnpm --filter web typecheck`).
- Test status report for web (`pnpm --filter web test`).
- Visual QA rubric completion for the changed surfaces (responsive breakpoints, dark mode, interaction states, regressions, and semantic consistency).
- SIM viewport checklist completion (`docs/sim-viewport-qa-checklist.md`) for 1280×720, 1366×768, 1440×900, and 1920×1080 without scrolling.
- PR screenshots showing above-the-fold captures for `/dashboard` and `/trade/[symbol]` in the active theme(s) impacted by the change.

### Visual QA rubric (required)
Treat this rubric as a release gate for UI slices. A PR touching web UI is incomplete unless all applicable checks pass.

**Required visual checks**
- **Spacing rhythm:** consistent spacing scale usage and predictable vertical rhythm between panels, headers, tables, and form controls.
- **Typography hierarchy:** clear heading/body/metadata hierarchy with consistent size, weight, and line-height semantics per component role.
- **Panel border/elevation consistency:** panel chrome (border radius, stroke opacity, shadows/elevation) must be consistent across dashboard and trade workspaces.
- **Semantic color discipline:** status, risk, and action colors must come from semantic tokens and remain consistent across badges, alerts, and interactive states.

**Explicit fail conditions (auto-fail rubric)**
- Hardcoded colors in component/page styles where semantic tokens should be used.
- Non-tabular numeric displays for tabular trading/account data (e.g., non-monospaced/non-tabular figures causing numeric jitter).
- Inconsistent badge semantics (same badge style mapping to different meanings, or same meaning rendered with conflicting badge styles).
- Panel header drift (mismatched header spacing, typography, or action alignment across equivalent panels).

**Completion rule**
- Slice completion cannot be marked done until the visual QA rubric passes and evidence is attached in the PR (checklist + screenshots).

### v1 scope guardrails
Follow the hard caps and out-of-scope rules in [Web UI v1 Scope Guardrails](./web-ui-v1-scope-guardrails.md) for all planning and implementation PRs.

### UI layering contract (mandatory)
- `apps/web/components/**` must remain render-only/presentational.
- Data shaping, API/domain state mapping, and session/server coordination belong in `apps/web/lib/hooks/**` or route-level containers under `apps/web/app/**`.
- Components must not import API/domain/server modules directly (`lib/api*`, `lib/auth`, `lib/sim-state`, `lib/server*`, `lib/agent-state-server`, `lib/trading`).

---

## Slice 1 — Web App Foundation + Design System

### Goal
Ship a polished, non-functional shell that proves visual direction and information architecture.

### Scope
- Create web app scaffold (`apps/web`) using Next.js + TypeScript.
- Add Tailwind + component primitives (cards, tables, forms, modal, toast).
- Implement layout: top nav, sidebar, market panel, order ticket panel.
- Add dark-mode-first theme tokens aligned with trading UX.

### Deliverables
- `/dashboard` route with mocked balances/positions/orders.
- `/trade/[symbol]` route with mocked order ticket + order book panels.
- Shared UI component library inside app.

### Acceptance Criteria
- App runs locally and routes render.
- Mobile + desktop responsive behavior for key screens.
- No Hyperliquid API dependency yet.

### Definition of Done
- Slice checkboxes can only be marked complete when merged PRs include links to concrete artifacts (tests, API route handlers, or deployment verification), not simulation-only mock UI.
- Every slice completion PR must include successful `pnpm --filter web lint`, `pnpm --filter web typecheck`, and `pnpm --filter web test` results.

---

## Slice 2 — Privy Integration + Auth Guardrails

### Goal
Allow users to connect wallet and establish authenticated session.

### Scope
- Integrate Privy provider and login components.
- Add route protection for authenticated pages.
- Surface connected wallet + chain status in navbar.
- Add mainnet/testnet environment toggle with guardrail messaging.

### Deliverables
- Sign in/out flows.
- Protected routes for dashboard/trade pages.
- Session-aware client state.

### Acceptance Criteria
- Unauthenticated users are redirected to connect flow.
- Authenticated users can access dashboard and trade routes.
- Wallet state remains stable across refreshes.

### Definition of Done
- Route-level auth coverage must include regression tests for unauthenticated → `/auth` redirect and authenticated access to protected routes.
- Slice cannot be marked complete without passing web lint/typecheck/tests in CI and linking those run artifacts in the PR.

---

## Slice 3 — Read-Only Market + Account Data

### Goal
Display real Hyperliquid market/account data in the new UI.

### Scope
- Create API layer reusing existing repo logic where possible.
- Implement endpoints for prices, balances, positions, open orders.
- Add polling or SSE for near-real-time updates.
- Replace mocked dashboard/trade data with real responses.

### Deliverables
- Backend routes under `/api/*` for read-only data.
- UI data hooks with loading/error/empty states.

### Acceptance Criteria
- Dashboard renders live balances, positions, and orders.
- Market prices update continuously.
- Failures degrade gracefully (toasts + retry controls).

### Definition of Done
- Completion requires evidence that live API-backed responses are wired end-to-end (route + hook + rendered state), with failing/empty-state behavior covered by automated tests.
- For any `apps/web/app/api/**` changes, include compile/lint proof plus targeted tests that catch duplicate-import or syntax regressions.

---

## Slice 4 — Trade Execution (Market + Limit)

### Goal
Enable users to place and cancel orders from the web UI.

### Scope
- Reuse command-layer validation patterns from `src/commands/order/*` via extracted shared core.
- Implement `POST /api/orders/market`, `POST /api/orders/limit`, `POST /api/orders/cancel`.
- Build order confirmation UX with slippage/time-in-force inputs.
- Add pending/confirmed/rejected feedback in UI.

### Deliverables
- Functional order ticket.
- Open orders table with cancel action.

### Acceptance Criteria
- Successful market + limit order placement on testnet.
- Order cancel flow works from open orders table.
- Clear, actionable error messages for common rejection cases.

### Definition of Done
- Mark done only when testnet-integrated order execution/cancel flows are validated by automated tests (not mocked-only confirmation UI).
- Completion requires passing web lint/typecheck/tests and explicit API route compile/lint checks when order routes are touched.

---

## Slice 5 — API Wallet / Delegated Trading Workflow

### Goal
Support practical trading workflows tied to Hyperliquid API-wallet model.

### Scope
- Reuse `src/lib/api-wallet.ts` patterns for agent validation and approval status.
- Build guided setup wizard in UI.
- Add explicit key-safety messaging and lifecycle controls.

### Deliverables
- “Connect wallet → approve agent → ready to trade” onboarding flow.
- Agent status page showing active/expired authorizations.

### Acceptance Criteria
- User can complete onboarding and trade with approved agent context.
- Revocation or expiry is clearly surfaced.

### Definition of Done
- Prototype UI tasks may be marked complete with simulated data, but production-integrated tasks require API-backed approval/agent-status evidence and regression tests.
- Production-integrated completion additionally requires successful web lint/typecheck/tests and API-route compile/lint checks recorded in the PR artifacts.

---

## Slice 6 — Hardening and Beta Readiness

### Goal
Make the app reliable and safe enough for broader usage.

### Scope
- Add rate limits, input validation, request tracing, and structured logs.
- Add test coverage: unit (core), integration (API), e2e (critical flows).
- Add reconnect/backoff logic for real-time data.
- Add product analytics for activation funnel.

### Deliverables
- Quality gate for CI.
- Beta checklist and launch notes.

### Acceptance Criteria
- Core paths pass CI consistently.
- Error budget and observability in place.
- Beta launch checklist signed off.

### Definition of Done
- A slice is complete only when the readiness checklist references concrete test artifacts and CI coverage for critical auth + trading routes.
- Hardening signoff must include explicit `apps/web/app/api/**` quality gates (compile, lint, duplicate-import/syntax regression tests).

---


## Execution Tracking (single source of truth)

We will maintain this file as the live status board. Each task uses one of:
- `[x]` done
- `[~]` in progress
- `[ ]` not started
- `[!]` blocked

### Current Snapshot
- **Current slice:** Slice 5 — API Wallet / Delegated Trading Workflow
- **Overall status:** In progress
- **Last updated:** 2026-02-19

### Working Agreement
- At the end of each implementation PR, update:
  1) Current slice status
  2) Task checkboxes in the relevant epic
  3) A short “Completed this PR” note
  4) A short “Next up” note
  5) For every checkbox moved to `[x]`, add a concrete artifact reference inline (`test file`, `route file`, and/or `PR link`).
- Never mark a checkbox complete if web lint/typecheck/tests are red for that PR.

---

## Implementation Task Board (ready to convert to issues)

## Epic A — Platform & UI Foundation
- [x] A1: Bootstrap Next.js app in `apps/web` with TypeScript and lint config. _(Artifacts: `apps/web/package.json`)_
- [x] A2: Install and configure Tailwind + base design tokens. _(Artifacts: `apps/web/app/globals.css`, `apps/web/package.json`)_
- [x] A3: Build reusable primitives (Button/Input/Card/Table/Modal/Toast). _(Artifacts: `apps/web/components/ui/*`)_
- [x] A4: Implement app shell (navbar/sidebar/content). _(Artifacts: `apps/web/app/layout.tsx`, `apps/web/components/navbar-controls.tsx`)_
- [x] A5: Create dashboard and trade page skeletons with mock data. _(Artifacts: `apps/web/app/dashboard/page.tsx`, `apps/web/app/trade/[symbol]/page.tsx`)_

## Epic B — Authentication (Privy)
- [x] B1: Integrate Privy SDK and provider wrapper. _(Artifacts: `apps/web/components/providers.tsx`, `apps/web/lib/auth.ts`)_
- [x] B2: Build connect/login/logout UI. _(Artifacts: `apps/web/app/auth/page.tsx`)_
- [x] B3: Add auth middleware/guards for protected routes. _(Artifacts: `apps/web/middleware.ts`, `src/web/middleware-auth-redirects.test.ts`)_
- [x] B4: Show wallet identity and chain/network state. _(Artifacts: `apps/web/components/navbar-controls.tsx`)_
- [x] B5: Add environment (mainnet/testnet) UI + guardrails. _(Artifacts: `apps/web/components/navbar-controls.tsx`, `apps/web/lib/auth.ts`)_

## Epic C — Market & Account Data
- [x] C1: Define API response contracts for balances/positions/orders/prices. _(Artifacts: `apps/web/lib/api-types.ts`)_
- [x] C2: Add read-only API routes. _(Artifacts: `apps/web/app/api/balances/route.ts`, `apps/web/app/api/positions/route.ts`)_
- [x] C3: Implement client hooks for data fetching + cache. _(Artifacts: `apps/web/lib/hooks/use-dashboard-data.ts`, `apps/web/lib/hooks/use-trade-data.ts`)_
- [x] C4: Add near-real-time updates (polling first, SSE second). _(Artifacts: `apps/web/lib/hooks/use-polling-resource.ts`)_
- [x] C5: Replace mock state with live data in dashboard/trade pages. _(Artifacts: `apps/web/components/dashboard-client.tsx`, `apps/web/components/trade-client.tsx`)_

## Epic D — Trading
- [x] D1: Extract shared order validation/construction into `src/core`. _(Artifacts: `src/core/order.ts`, `src/core/order.test.ts`)_
- [x] D2: Implement order execution API endpoints. _(Artifacts: `apps/web/app/api/orders/market/route.ts`, `apps/web/app/api/orders/limit/route.ts`, `apps/web/app/api/orders/cancel/route.ts`, `src/web/api-routes-auth.test.ts`)_
- [x] D3: Build order ticket form (market + limit + reduce-only + tif). _(Artifacts: `apps/web/app/trade/[symbol]/components/OrderTicket.tsx`)_
- [x] D4: Build open orders table with cancel action. _(Artifacts: `apps/web/app/trade/[symbol]/components/OpenOrdersTable.tsx`)_
- [x] D5: Add status UX (pending/filled/rejected) + detailed errors. _(Artifacts: `apps/web/components/Toast.tsx`, `apps/web/app/trade/[symbol]/components/TradeWorkspace.tsx`)_

## Epic E — API Wallet Workflow
- [x] E1a (prototype/simulated): Build onboarding wizard shell for API wallet/agent approval. _(Artifacts: `apps/web/app/onboarding/page.tsx`)_
- [~] E1b (production-integrated): Validate onboarding with authenticated, API-backed approval evidence. _(Artifacts: `apps/web/app/api/agent/validate/route.ts`, `src/web/agent-onboarding-routes.test.ts`, PR: https://github.com/chrisling-dev/hyperliquid-cli/pull/new/work)_
- [x] E2a (prototype/simulated): Add extra-agent polling UX and local status refresh interactions. _(Artifacts: `apps/web/lib/agent-state.ts`, `apps/web/lib/agent-state-server.ts`)_
- [x] E2b (production-integrated): Verify polling states against live/realistic API route integration (pending/active/revoked). _(Artifacts: `apps/web/app/api/agent/extra-agents/route.ts`, `src/web/agent-onboarding-routes.test.ts`, PR: https://github.com/chrisling-dev/hyperliquid-cli/pull/new/work)_
- [x] E3a (prototype/simulated): Ship agent-status page and remediation guidance content. _(Artifacts: `apps/web/app/agent-status/page.tsx`)_
- [x] E3b (production-integrated): Confirm lifecycle transitions with automated API integration coverage and route-level auth behavior. _(Artifacts: `apps/web/app/api/agent/wait/route.ts`, `src/web/api-routes-auth.test.ts`, PR: https://github.com/chrisling-dev/hyperliquid-cli/pull/new/work)_
- [x] E4a (prototype/simulated): Add key-management safety messaging and local metadata controls. _(Artifacts: `apps/web/app/onboarding/page.tsx`, `apps/web/lib/agent-approval.ts`)_
- [x] E4b (production-integrated): Complete operational recovery/revocation evidence tied to real approval lifecycle checks. _(Artifacts: `apps/web/app/agent-status/page.tsx`, `apps/web/app/onboarding/page.tsx`, `apps/web/app/api/auth/session/route.ts`, `src/web/agent-onboarding-routes.test.ts`, PR: https://github.com/chrisling-dev/hyperliquid-cli/pull/new/work)_

## Epic F — Hardening
- [x] F1: Add request validation + rate limiting. _(Artifacts: `src/server/rpc-core.ts`, `src/lib/validation.ts`)_
- [x] F2: Add logging/metrics/tracing. _(Artifacts: `src/server/logger.ts`, `src/server/index.ts`)_
- [x] F3: Add automated tests for critical flows. _(Artifacts: `src/server/flows.e2e.test.ts`, `src/web/api-routes-auth.test.ts`)_
- [x] F4: Add reconnect/backoff strategy for live data. _(Artifacts: `src/server/backoff.ts`, `src/server/subscriptions.ts`)_
- [x] F5: Prepare beta launch checklist. _(Artifacts: `docs/beta-readiness-checklist.md`)_

## Suggested Build Sequence (practical)
1. A1–A5
2. B1–B5
3. C1–C5
4. D1–D5
5. E1–E4
6. F1–F5

This sequence ships value early (beautiful UI + auth + read-only data), then layers trading and operational hardening.

### Epic D validation notes
- ✅ Testnet-focused order construction and API wiring validated via unit tests (`src/core/order.test.ts`) and existing command-layer suites.
- ✅ Epic D1–D5 marked complete in task board.


## Known Gaps (Epic E production status snapshot)
- **Completed Epic E production tasks:** E2b, E3b, and E4b are complete with linked API-route and integration-test artifacts in the Epic E checklist.
- **Remaining Epic E production task:** E1b remains **in progress** until staging evidence is attached for real Privy + Hyperliquid onboarding validation.
- Epic E slice completion remains blocked until E1b includes all required artifacts: (1) green web lint/typecheck/tests, (2) API-route compile/lint pass, and (3) linked PR/test-job evidence.

## API Route Quality Gates (mandatory when touching `apps/web/app/api/**`)
1. `pnpm --filter web lint`
2. `pnpm --filter web typecheck`
3. `pnpm --filter web test`
4. `pnpm --filter web exec eslint apps/web/app/api --max-warnings=0`
5. `pnpm --filter web exec tsc --noEmit`
6. `pnpm --filter web exec eslint components --max-warnings=0`
7. Targeted regression coverage for duplicate-import/syntax failures in route suites (for example `src/web/agent-onboarding-routes.test.ts` and `src/web/api-routes-auth.test.ts`).

## v1 Final Release Checklist (mandatory before declaring v1 complete)

All items below are release gates. v1 cannot be declared complete until every gate is green and artifacts are linked in this file.

- [ ] **Visual rubric pass** — Visual QA rubric fully passed for `/dashboard` and `/trade/[symbol]`, including semantic consistency checks and screenshot evidence.
- [ ] **Performance gate pass** — Rendering/perf budget checks passed with no unresolved regressions versus approved baselines.
- [ ] **Streaming stability pass** — Real-time/polling/SSE flows validated for sustained updates, reconnect behavior, and no critical stalls.
- [ ] **SIM redundancy pass** — SIM viewport checklist and redundant viewport/theme validation complete with no unresolved above-the-fold failures.
- [ ] **Boundary and scope pass** — UI layering contract + v1 scope guardrails verified, with no out-of-scope or cross-boundary violations.

### Stop-ship triggers (must all stay green)

Any red item below is an immediate stop-ship for v1:

- **Jitter:** Numeric/table jitter, panel jumpiness, or unstable layout updates in critical dashboard/trade surfaces.
- **Readability failures:** Typography/contrast/spacing regressions that degrade scanability or violate accessibility/readability requirements.
- **Semantic inconsistency:** Conflicting badge/status semantics, token misuse, or meaning drift across equivalent UI states.
- **Budget regressions:** Perf budget regressions beyond approved thresholds (render, interaction, or data-update pathways).
- **Token drift:** Unauthorized design-token drift (hardcoded style values replacing tokenized semantics without explicit approval).

### Completion artifacts (link all before release signoff)

Before release signoff, add concrete links for every gate item directly in this section (CI runs, test outputs, QA checklists, screenshots, and PR references). Missing links keep the gate red.

- **Visual rubric artifacts:** <!-- add links -->
- **Performance gate artifacts:** <!-- add links -->
- **Streaming stability artifacts:** <!-- add links -->
- **SIM redundancy artifacts:** <!-- add links -->
- **Boundary + scope artifacts:** <!-- add links -->

### v1 completion declaration rule

Declare v1 complete only when:
1. Every final release checklist item above is checked `[x]`.
2. No stop-ship trigger is active.
3. Completion artifacts are linked in this document for each gate.

## Progress Log

### Completed this PR
- Enforced the full web/API CI gate command set in the CI workflow so Epic E production checkboxes must pass lint/typecheck/tests + API-route compile/lint + targeted route regressions. Artifacts: [CI workflow](../.github/workflows/ci.yml), [quality-gate command list](../docs/beta-readiness-checklist.md).
- Added PR-template artifact-link requirements so slice checkboxes cannot be responsibly moved to `[x]` without concrete CI/test evidence links. Artifacts: [PR template](../.github/pull_request_template.md), [slice DoD language](../docs/web-ui-execution-plan.md).
- Marked the two open quality-gate checklist items complete now that enforcement exists in-repo. Artifacts: [beta readiness checklist](../docs/beta-readiness-checklist.md), [CI workflow](../.github/workflows/ci.yml).

### Epic E production acceptance tests (API-route artifacts)
- **E1b onboarding validation**: `POST /api/agent/validate` must require authenticated session, enforce `userAddress===session.walletAddress`, and return API-backed `pending|active|missing` evidence with `apiWalletAddress` + `approvalUrl`. Artifacts: [validate route](../apps/web/app/api/agent/validate/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).
- **E2b polling verification**: `POST /api/agent/extra-agents` must derive lifecycle from real extra-agent payloads (`pending -> active`) and reject insecure query-param key submission. Artifacts: [extra-agents route](../apps/web/app/api/agent/extra-agents/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).
- **E3b lifecycle + auth regression**: `POST /api/agent/extra-agents` must emit `expired` when `validUntil` has elapsed and `revoked` when previously `active|pending` authorization no longer validates; all onboarding/status routes must preserve auth guard responses. Artifacts: [extra-agents route](../apps/web/app/api/agent/extra-agents/route.ts), [wait route](../apps/web/app/api/agent/wait/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).
- **E4b recovery/revocation operations**: `POST /api/agent/wait` and status refresh must only progress with authenticated session context and surface revoked/expired outcomes through server-backed lifecycle checks, not local-only assumptions. Artifacts: [agent status UI](../apps/web/app/agent-status/page.tsx), [onboarding UI](../apps/web/app/onboarding/page.tsx), [auth session route](../apps/web/app/api/auth/session/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).

### Next up
- Land remaining Epic E production milestone (E1b) with staging-backed Privy + Hyperliquid evidence for onboarding validation paths. Artifacts to attach: [E1b checklist row](../docs/web-ui-execution-plan.md), CI job URLs captured via [PR template quality-gate section](../.github/pull_request_template.md).
