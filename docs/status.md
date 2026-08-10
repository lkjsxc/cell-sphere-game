# Current status

## Product Simplification v1

- World HUD and routing use SCORE → REACH → ENV LEVEL → RESULT.
- ENV LEVEL opens current-world History with Environment records emphasized.
- History is the sole durable temporal surface and patches live current-world
  records while open.
- Gameplay-disaster authority has been removed. Chronic Environment pressure is
  profile-driven and has no director, footprints, telegraphs, onboarding event
  exception, snapshot fields, renderer buffers, or result fields.
- Persistence is current-only: meta 14, settings 5, History 9, agent save 5,
  result/replay 8, and Worker protocol 8. Old or mismatched documents reset
  instead of migrating.
- The no-disaster audit verifies source, profile, authority, and deterministic
  run absence of retired gameplay-disaster concepts.

## Verification recorded in this worktree

- `npm run test:unit` — 184/184 passed.
- `npm run test:integration` — 71/71 passed.
- `npm run test:browser:file`, `test:browser:canvas`, and `test:browser:fallback` — passed.
- `npm run check:links` — passed.
- `npm run check:structure` — passed with existing size/count warnings.
- `npm run audit:no-disaster -- --count=12` — passed.
- `node scripts/audits/environment-level-audit.mjs --smoke` — passed.
- `npm run audit:trophies` — passed; fresh cohort median was one Trophy and
  modeled campaign horizons remained within the audit ranges.
- `npm run balance:smoke` — passed, while still measuring the rejected long-run
  baseline pending the resource-limited retune.
- `npm run verify` — passed all 26 configured local gates.
- `npm run benchmark` — passed at 6,484 ticks/s (3,000 minimum).

## Remaining product work

World Potential removal, realized-only SCORE reconstruction, the authored
compact Evolution sphere, resource-limited balance retuning, and final
Luminous/coastal evidence remain pending. No deployment, CI, or physical-device
claim is recorded here.
