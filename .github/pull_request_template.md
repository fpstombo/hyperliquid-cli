## Summary
- Describe what changed.

## Slice completion / artifact gate
> Before marking any slice checkbox as `[x]`, link the exact CI job run and test artifacts that prove completion.

- [ ] I am not marking any new slice checkbox as complete in this PR.
- [ ] If I marked any slice checkbox as complete, I added concrete artifact links (CI job URL, test logs, and relevant file/test references) in this PR description.


## v1 scope guardrails
- [ ] This PR stays within dashboard/trade + SIM scope (no expansion into out-of-scope v1 items).
- [ ] This PR does not add a new top-level page/component beyond v1 caps from `docs/web-ui-v1-scope-guardrails.md`.
- [ ] If this PR adds any top-level page/component beyond cap, I included a rationale note (why needed for v1 + what is deferred) and linked explicit approval.

## Quality-gate commands (paste result links)
- [ ] `pnpm --filter web lint` — Artifact link:
- [ ] `pnpm --filter web typecheck` — Artifact link:
- [ ] `pnpm --filter web test` — Artifact link:
- [ ] `pnpm --filter web exec eslint apps/web/app/api --max-warnings=0` — Artifact link:
- [ ] `pnpm --filter web exec tsc --noEmit` — Artifact link:
- [ ] `pnpm --filter web test src/web/agent-onboarding-routes.test.ts src/web/api-routes-auth.test.ts` — Artifact link:
