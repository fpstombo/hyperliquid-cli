# Visual polish sprint punch list (time-boxed)

## Scope + prioritization
- **Time box:** 1 focused sprint pass, optimize for visible UX wins rather than refactors.
- **Routes sampled:** Dashboard, Trade workspace, Onboarding.
- **Breakpoints checked:** desktop (1440px) + mobile (390px).

## Punch list

### 1) Spacing / alignment / truncation rough edges
- [x] **Dashboard status rail:** improve status meta readability during live refresh (`Updated ... · Syncing now`) and prevent retry control jitter.
- [x] **Trade action rows on mobile:** prevent cramped button/shortcut collisions by wrapping action rows and allowing full-width buttons on narrow viewports.
- [x] **Onboarding progress + step chips:** remove inconsistent inline spacing styles and align to shared token-based spacing/radius treatment.
- [x] **Toast placement/corners:** unify floating toast shape and shadow with panel language; constrain width on desktop and anchor safely on mobile.

### 2) Copy + micro-interaction polish
- [x] Updated transient toast copy from generic API language to user-facing "Live sync hiccup".
- [x] Added clear retry button state text (`Retrying…`) in dashboard summary + status rail.
- [x] Improved row action copy affordance with `Copying…` / `Copied ✓` states.
- [x] Added toast auto-dismiss behavior for lower interaction cost while preserving manual dismiss.

### 3) Perceived speed cues
- [x] Added explicit sync state cue in dashboard status metadata while requests are refreshing.
- [x] Added optimistic dashboard refresh feedback toast (`Dashboard refreshed.`).
- [x] Added short first-load floor in polling resource to reduce flash/jank when data returns too quickly.

### 4) Consistency sweep (tokens/motion/state)
- [x] Replaced onboarding inline styles with tokenized class styles for progress, chip, preview, and completion states.
- [x] Reused existing motion tokens for width transitions and control state transitions.
- [x] Standardized white-space handling for chip-like controls (retry/action hints/meta pills).
