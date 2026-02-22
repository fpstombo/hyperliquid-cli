# Web UI Visual Direction: Institutional Terminal + Liquid Energy

## Style Thesis
The Hyperliquid web UI should read as an **institutional trading terminal energized by controlled liquidity signals**: disciplined structure, high information density where needed, and selective kinetic accents that imply flow rather than noise.

- **Institutional terminal**: strong grid logic, restrained contrast, deterministic hierarchy, and stable data legibility.
- **Liquid energy**: selective cyan-electric accents, edge refractions, and shallow gradient movement where users orient first.
- **Design mandate**: confidence first, momentum second. Every signature effect must support scan speed and risk comprehension.

## Signature Elements and Exact Usage Rules

### 1) Accent Glow
A low-radius halo derived from the accent token family.

**Allowed**
- Top bar frame and active nav affordances.
- Hero strip containers and key headline values.
- Panel headers (title/context/action lane) on dashboard and trade shells.

**Disallowed**
- Dense table rows, table cells, or rapid-update numeric lists.
- Form field interiors or placeholder text.
- Repeated badge clusters where multiple glows would stack.

**Implementation rule**
- Use tokenized glows only (`--signature-accent-glow-*`).
- Never exceed one glow layer per region.

### 2) Edge Highlights
Hairline edge lighting that clarifies component boundaries on dark surfaces.

**Allowed**
- Top bar outer edge.
- Hero strip top/leading edges.
- Panel header separators and top rule accents.

**Disallowed**
- Table row dividers in dense data regions.
- Body copy containers that already rely on border contrast.

**Implementation rule**
- Use subtle alpha and tokenized highlights (`--signature-edge-highlight`).
- Edge highlight is additive to border, not a border replacement.

### 3) Gradients
Directional, low-amplitude tonal sweeps suggesting market flow.

**Allowed**
- Top bar background blend.
- Hero strip backgrounds.
- Premium surface layering for shell cards/panels.

**Disallowed**
- Dense table rows and table cell backgrounds.
- Numeric text fills, especially in PnL/price columns.

**Implementation rule**
- Gradients must be shallow (dark-on-dark) with accent only at the fringe.
- Use surface-tier tokens (`--surface-premium-*`) and signature gradient tokens.

## Placement Priority
Apply signature language in this order:
1. Shell/top bar
2. Hero strip
3. Panel headers
4. Deeper components (later phases only)

Current implementation target: **dashboard and trade shells first**.
