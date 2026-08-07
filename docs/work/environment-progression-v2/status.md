# Status — 2026-08-07

## Active state

- **Phase A: complete; Phase B: beginning.** Repository, branch, upstream, instruction, package-script, source/version inventory, and baseline behavior inspection completed.
- The supplied root `AGENTS.md` revision 2026-08-07 is intentionally present as an uncommitted update and must be included with the completed coherent change; no unrelated work was reset/discarded.
- This work package is created before invasive implementation.

## Baseline evidence actually run

| Command | Result |
| --- | --- |
| `node --test tests/unit/environment-level.test.js` | pass: 9/9; suite explicitly validates static frontier/retry/completion advancement semantics. |
| `node scripts/audits/environment-level-audit.mjs` | exit 0; audits static independently selected levels including huge decimal input. |
| `npm run benchmark` | exit 0; 3,176 ticks / 451 ms = 7,042 ticks/s; reported heap used 24 MB. Per-sample environment level digit cases were 1/1/513. |
| `npm run balance:smoke` | exit 0; balanced: median 321 s (304.1–361.9); expansion: 361.9 s; resilience: 361.9 s. This exposes the rejected normal ceiling. |
| GitHub Actions baseline | `verify` run `31131847628` for `2454b6d` failed only at Benchmark; all preceding structure, unit, integration, balance, audit, agent, and terminal transaction steps passed; Pages was skipped. |
| Cache-busted deployed HTML | `https://lkjsxc.github.io/cell-sphere-game/?baseline=2454b6d…` returned 200 (21,133 bytes) and contained static `Next · Environment Level 0` copy, confirming deployed old semantics. |

## Immediate next steps

1. Implement pure schedule/profile/exposure boundary with direct huge-value tests.
2. Replace static simulation authority/event schedule/normal cap with dynamic bounded authority.
3. Propagate coherent changes through result, session/protocol, persistence, UI, agents, audits, docs, and verification.

## External state

- Remote: `origin` → `https://github.com/lkjsxc/cell-sphere-game`.
- Branch was synchronized with `origin/main` at baseline.
- Baseline CI and cache-busted deployed HTML were inspected; final revision CI/Pages/deployed-byte/browser verification remains required and must not be claimed early.

## Source-inspection evidence

- Profile initialization in `createRunState()` currently scales immutable resource state and pre-schedules all events from a selected static level.
- `RunController.step()` increments tick and then runs conditionals/environment/metabolism/transport/worldmaking/growth; it needs live schedule derivation before consumers.
- `world-session`, Worker/fallback driver, snapshot/result/replay all currently commit a mutable level/profile hash as identity.
- Meta schema 11 and History schema 6 interpret `highestEnvironmentLevel`/`environmentLevel` as frontier/attempt evidence.
- Agent actions/observations and Result UI retain retry/selection behavior; browser tests assert the old labels.

## Known blockers

None identified locally. Credentials/infrastructure access for final GitHub Actions/Pages verification remains to be checked later.
