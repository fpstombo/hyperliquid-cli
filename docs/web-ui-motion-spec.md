# Web UI Motion Specification

This spec standardizes micro-interactions for `apps/web`.

## Motion tokens

Defined in `apps/web/app/globals.css`:

- `--motion-hover-duration`: `120ms`
- `--motion-focus-duration`: `160ms`
- `--motion-value-update-duration`: `220ms`
- `--motion-panel-duration`: `200ms`
- `--motion-ease-standard`: `cubic-bezier(0.3, 0, 0.2, 1)`
- `--motion-ease-emphasized`: `cubic-bezier(0.2, 0, 0, 1)`

## Interaction rules

- Hover/focus motion uses color, border-color, box-shadow, and opacity only.
- Value updates (`ValueFlash`, table numeric updates) animate color + text-shadow only.
- Panel interactions (`PanelShell`, metric cards) animate border/background/shadow only.
- Do **not** animate layout-affecting properties (`width`, `height`, `margin`, `padding`, `left`, `top`, `grid-*`, etc.).

## Reduced motion

- Respect `prefers-reduced-motion: reduce` globally.
- Under reduced motion, animation/transition durations collapse to effectively instant.
- Value flash highlight visuals are disabled under reduced motion.

## Visual QA fail criteria

Fail visual QA if any of the following are observed:

1. One surface uses a noticeably different timing/easing profile than the shared motion tokens.
2. Value update flashes persist longer than ~250ms or stack repeatedly during a single refresh tick.
3. Panels/metric cards visibly shift layout position or size during hover/focus.
4. Table rows/cells jump or reflow due to update animation.
5. Reduced-motion mode still shows glow/flash emphasis instead of near-instant state changes.
