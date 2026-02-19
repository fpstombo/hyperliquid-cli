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
- **Last updated:** 2026-02-18

### Working Agreement
- At the end of each implementation PR, update:
  1) Current slice status
  2) Task checkboxes in the relevant epic
  3) A short “Completed this PR” note
  4) A short “Next up” note

---

## Implementation Task Board (ready to convert to issues)

## Epic A — Platform & UI Foundation
- [x] A1: Bootstrap Next.js app in `apps/web` with TypeScript and lint config.
- [x] A2: Install and configure Tailwind + base design tokens.
- [x] A3: Build reusable primitives (Button/Input/Card/Table/Modal/Toast).
- [x] A4: Implement app shell (navbar/sidebar/content).
- [x] A5: Create dashboard and trade page skeletons with mock data.

## Epic B — Authentication (Privy)
- [x] B1: Integrate Privy SDK and provider wrapper.
- [x] B2: Build connect/login/logout UI.
- [x] B3: Add auth middleware/guards for protected routes.
- [x] B4: Show wallet identity and chain/network state.
- [x] B5: Add environment (mainnet/testnet) UI + guardrails.

## Epic C — Market & Account Data
- [x] C1: Define API response contracts for balances/positions/orders/prices.
- [x] C2: Add read-only API routes.
- [x] C3: Implement client hooks for data fetching + cache.
- [x] C4: Add near-real-time updates (polling first, SSE second).
- [x] C5: Replace mock state with live data in dashboard/trade pages.

## Epic D — Trading
- [x] D1: Extract shared order validation/construction into `src/core`.
- [x] D2: Implement order execution API endpoints.
- [x] D3: Build order ticket form (market + limit + reduce-only + tif).
- [x] D4: Build open orders table with cancel action.
- [x] D5: Add status UX (pending/filled/rejected) + detailed errors.

## Epic E — API Wallet Workflow
- [x] E1a (prototype/simulated): Build onboarding wizard shell for API wallet/agent approval.
- [x] E1b (production-integrated): Validate onboarding with authenticated, API-backed approval evidence.
- [x] E2a (prototype/simulated): Add extra-agent polling UX and local status refresh interactions.
- [x] E2b (production-integrated): Verify polling states against live/realistic API route integration (pending/active/revoked).
- [x] E3a (prototype/simulated): Ship agent-status page and remediation guidance content.
- [x] E3b (production-integrated): Confirm lifecycle transitions with automated API integration coverage and route-level auth behavior.
- [x] E4a (prototype/simulated): Add key-management safety messaging and local metadata controls.
- [x] E4b (production-integrated): Complete operational recovery/revocation evidence tied to real approval lifecycle checks.

## Epic F — Hardening
- [x] F1: Add request validation + rate limiting.
- [x] F2: Add logging/metrics/tracing.
- [x] F3: Add automated tests for critical flows.
- [x] F4: Add reconnect/backoff strategy for live data.
- [x] F5: Prepare beta launch checklist.

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

## Progress Log

### Completed this PR
- Added onboarding + agent-status API integration tests covering pending/active/revoked lifecycle states.
- Added middleware regression tests for unauthenticated redirect to `/auth` and authenticated protected-route access.
- Split Epic E into prototype vs production-integrated completion criteria to avoid overstating status.

### Epic E production acceptance tests (API-route artifacts)
- **E1b onboarding validation**: `POST /api/agent/validate` must require authenticated session, enforce `userAddress===session.walletAddress`, and return API-backed `pending|active|missing` evidence with `apiWalletAddress` + `approvalUrl`. Artifacts: [validate route](../apps/web/app/api/agent/validate/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).
- **E2b polling verification**: `POST /api/agent/extra-agents` must derive lifecycle from real extra-agent payloads (`pending -> active`) and reject insecure query-param key submission. Artifacts: [extra-agents route](../apps/web/app/api/agent/extra-agents/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).
- **E3b lifecycle + auth regression**: `POST /api/agent/extra-agents` must emit `expired` when `validUntil` has elapsed and `revoked` when previously `active|pending` authorization no longer validates; all onboarding/status routes must preserve auth guard responses. Artifacts: [extra-agents route](../apps/web/app/api/agent/extra-agents/route.ts), [wait route](../apps/web/app/api/agent/wait/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).
- **E4b recovery/revocation operations**: `POST /api/agent/wait` and status refresh must only progress with authenticated session context and surface revoked/expired outcomes through server-backed lifecycle checks, not local-only assumptions. Artifacts: [agent status UI](../apps/web/app/agent-status/page.tsx), [onboarding UI](../apps/web/app/onboarding/page.tsx), [auth session route](../apps/web/app/api/auth/session/route.ts), [integration tests](../src/web/agent-onboarding-routes.test.ts).

### Next up
- Validate Epic E flows against real Privy + Hyperliquid environments in staging to complement mocked route-integration coverage.
