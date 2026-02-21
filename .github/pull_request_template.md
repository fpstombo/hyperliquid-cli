## Summary
- Describe what changed.

## Slice completion / artifact gate
> Before marking any slice checkbox as `[x]`, link the exact CI job run and test artifacts that prove completion.

- [ ] I am not marking any new slice checkbox as complete in this PR.
- [ ] If I marked any slice checkbox as complete, I added concrete artifact links (CI job URL, test logs, and relevant file/test references) in this PR description.

## Quality-gate commands (paste result links)
- [ ] `pnpm --filter web lint` — Artifact link:
- [ ] `pnpm --filter web typecheck` — Artifact link:
- [ ] `pnpm --filter web test` — Artifact link:
- [ ] `pnpm --filter web exec eslint apps/web/app/api --max-warnings=0` — Artifact link:
- [ ] `pnpm --filter web exec tsc --noEmit` — Artifact link:
- [ ] `pnpm --filter web test src/web/agent-onboarding-routes.test.ts src/web/api-routes-auth.test.ts` — Artifact link:
