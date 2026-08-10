# Product simplification v1 — historical status

> Superseded by [`../ecology-experience-v2/status.md`](../ecology-experience-v2/status.md).
> The claims below record the prior contract and are not current product authority.

## Scope and fixed decisions

This work applied an earlier 2026-08-10 correction in coherent vertical slices.
The active contract is `AGENTS.md`.

- Starting revision: `a30f2661deeed591c069a6bb3d3cfcd8e2d8d7bf`
- Branch: `main`
- Phase 1 commit: `2e2f63a980a4080674485ebd39feca6ee3ea424a`
- Phase 2 commit: `e31c9d73a880d2719b14c41c9a3387d5005afe16`
- Phase 3 is the verified chronic-pressure and clean-reset slice described below.

## Baseline evidence

Before simplification, the same host measured a 282.2-second balanced smoke
median, 6,516 ticks/s, four WebGL draws, and warm Evolution/Trophy entry
medians of 61.8/23.0 ms. Those measurements describe the rejected prior balance
and performance baseline, not a current success criterion.

## Completed Phase 1 — World shell

- HUD order is SCORE, REACH, ENV LEVEL, RESULT.
- ENV LEVEL opens current-world History with Environment records emphasized.
- Result actions are Next World, Evolution, History.
- Public Entropy routing/control is removed.

## Completed Phase 2 — History only

- Deleted Event Log/current-event presentation and its controller route.
- History owns the bounded Timeline and patches live current-world batches.
- Short-landscape shell geometry no longer obscures World metrics.

## Current Phase 3 — chronic pressure and clean reset

- Deleted gameplay-disaster authority modules, content, render fields, state,
  snapshot/result/agent fields, onboarding exception, and crisis-dependent
  mechanics.
- Replaced profile v3 with chronic-pressure profile v4. Environment transitions
  now adjust finite ecological coefficients only.
- Added `audit:no-disaster`, which checks deleted modules, forbidden production
  fields, finite profiles, deterministic runs, and absence of disaster state.
- Current-only persistence now uses meta 14, settings 5, History 9, agent save
  5, result/replay 8, and Worker protocol 8. Old or mismatched localStorage,
  import, History, Trophy, WAL, and IndexedDB documents reset rather than
  migrate.
- Removed retired History adaptation/river records, legacy Trophy ownership and
  backfill, old namespace migration, legacy recent-run adoption, and binary
  Evolution ownership aliases.
- Hardened failed imports so a rollback cannot persist imported settings alone;
  browser coverage exercises that failure path.
- Regenerated the production title showcase after simulation changes.

## Verification in the current worktree

- `npm run test:unit` — 184/184 passed.
- `npm run test:integration` — 71/71 passed.
- `npm run test:browser:file`, `test:browser:canvas`, and `test:browser:fallback` — passed.
- `npm run check:links` — passed.
- `npm run check:structure` — passed with existing maintainability warnings.
- `npm run audit:no-disaster -- --count=12` — passed.
- `node scripts/audits/environment-level-audit.mjs --smoke` — passed.
- `npm run audit:trophies` — passed after raising early resource/pressure
  thresholds so fresh cohorts earn one Trophy median.
- `npm run balance:smoke` — passed but still measures the rejected long-world
  baseline pending a dedicated resource-limited retune.
- `npm run verify` — passed all 26 configured local gates.
- `npm run benchmark` — passed at 6,484 ticks/s.

CI, deployment, and physical-device verification have not been performed for
this slice.

## Next coherent slices

1. Remove World Potential and rebuild SCORE around realized outcomes only.
2. Replace the old Evolution graph with the authored compact one-root sphere.
3. Retune finite-resource cohorts, then complete Luminous/coastal visual and
   performance evidence.
