# SIM Visibility Viewport QA Checks

Use this checklist for UI changes that alter SIM indicators.

## Desktop breakpoints (no scroll)

For each viewport below, verify all three SIM surfaces are visible above the fold **without scrolling**:

- 1280 × 720
- 1366 × 768
- 1440 × 900
- 1920 × 1080

## Required SIM surfaces

- `/dashboard` top bar: `SIM Pending` / `SIM Confirmed` / `SIM Rejected` badge.
- `/dashboard` intent panel row labels prefixed with `SIM`.
- `/trade/[symbol]` trade ticket action region badge: `SIM Pending` / `SIM Confirmed` / `SIM Rejected`.

## Pass criteria

- All required SIM surfaces render in the initial viewport.
- SIM badges use SIM-specific styling (blue SIM family), not connection-health colors.
- Status text always uses SIM semantics (`SIM Pending`, `SIM Confirmed`, `SIM Rejected`).
