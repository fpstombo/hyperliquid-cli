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

---

## Implementation Task Board (ready to convert to issues)

## Epic A — Platform & UI Foundation
- [x] A1: Bootstrap Next.js app in `apps/web` with TypeScript and lint config.
- [x] A2: Install and configure Tailwind + base design tokens.
- [x] A3: Build reusable primitives (Button/Input/Card/Table/Modal/Toast).
- [x] A4: Implement app shell (navbar/sidebar/content).
- [x] A5: Create dashboard and trade page skeletons with mock data.

## Epic B — Authentication (Privy)
- [ ] B1: Integrate Privy SDK and provider wrapper.
- [ ] B2: Build connect/login/logout UI.
- [ ] B3: Add auth middleware/guards for protected routes.
- [ ] B4: Show wallet identity and chain/network state.
- [ ] B5: Add environment (mainnet/testnet) UI + guardrails.

## Epic C — Market & Account Data
- [ ] C1: Define API response contracts for balances/positions/orders/prices.
- [ ] C2: Add read-only API routes.
- [ ] C3: Implement client hooks for data fetching + cache.
- [ ] C4: Add near-real-time updates (polling first, SSE second).
- [ ] C5: Replace mock state with live data in dashboard/trade pages.

## Epic D — Trading
- [ ] D1: Extract shared order validation/construction into `src/core`.
- [ ] D2: Implement order execution API endpoints.
- [ ] D3: Build order ticket form (market + limit + reduce-only + tif).
- [ ] D4: Build open orders table with cancel action.
- [ ] D5: Add status UX (pending/filled/rejected) + detailed errors.

## Epic E — API Wallet Workflow
- [ ] E1: Build onboarding wizard for API wallet/agent approval.
- [ ] E2: Integrate extra-agent listing + approval polling.
- [ ] E3: Add status page and remediation guidance.
- [ ] E4: Add key-management and safety copy/recovery UX.

## Epic F — Hardening
- [ ] F1: Add request validation + rate limiting.
- [ ] F2: Add logging/metrics/tracing.
- [ ] F3: Add automated tests for critical flows.
- [ ] F4: Add reconnect/backoff strategy for live data.
- [ ] F5: Prepare beta launch checklist.

## Suggested Build Sequence (practical)
1. A1–A5
2. B1–B5
3. C1–C5
4. D1–D5
5. E1–E4
6. F1–F5

This sequence ships value early (beautiful UI + auth + read-only data), then layers trading and operational hardening.
