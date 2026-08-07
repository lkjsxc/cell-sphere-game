# Status — 2026-08-07

## Active state

The cross-layer v2 migration is integrated on `main` after package commits
`6155236`/`0774056`, implementation commit `05e37ac`, and the hosted-CI
benchmark-floor correction `35d5b8e`. No unrelated work was reset or discarded.

## Implemented locally

- Exact schedule v2: Level 0 at tick 0, Level 1 at 1200, then 600-tick rungs;
  direct inversion/progress/hash and separate onboarding modifier.
- Level-0-only creation, dynamic current/peak/transition/exposure state,
  current/next profile installation before ecology, and bounded rolling events.
- Natural terminal authority; SCORE v5 with sustained exposure plus
  low-Potential calibration that preserves breadth-complete anchors; dynamic
  result, immutable identity, protocol/replay v6, and neutral Level-0 frame.
- Meta 12, History 7, WAL 3, agent schemas 3, inert legacy frontier/attempt
  migration, and dynamic HUD/Result/History/agent interfaces.

## Evidence actually run on this worktree

| Evidence | Result |
| --- | --- |
| `npm run verify` | exit 0; all 26 local gates passed (unit, integration, audits, smoke balance, benchmark, links, structure). |
| `npm run test:browser:file` | pass: WebGL2 Worker path, score 12,429, 4 draws, 8×/256×, Evolution interaction, visual IDB, Luminous evidence. |
| `npm run test:browser:canvas` | pass: Canvas fallback, unified shell/History/Evolution/Trophies, score 12,429. |
| `npm run test:browser:fallback` | pass: WebGL2 fallback simulation, 4 draws and the same dynamic shell evidence. |
| `npm run balance -- --strict` | exit 0; 30 runs each across six policies; balanced median 296.7 s (268.2–372.9), fresh anchors healthy. |
| `npm run audit:campaign` | exit 0; fresh median SCORE 10,504/duration 284.7 s, root median 11,368, breadth median 1,099,367, marginal-value first resolution 20.12 min. |
| `npm run audit:reach100` | exit 0; 19/300 breadth worlds achieved REACH 100, no fresh success, all tested breadth worlds naturally extinct within an explicit 10,000-tick external budget (median 3,256, max 4,019 ticks). |
| `npm run agent:smoke`, `agent:campaign`, `agent:long`, `balance:holdout` | all exit 0; long: 8 policies × 12 worlds; untouched holdout: 4 seeds × 22 policies × 6 worlds, no failures. |
| Benchmark | seven same-host runs: 6,026–6,690 ticks/s, median 6,346 versus 7,042 baseline (9.88% lower, inside 10% target); deterministic hash `02190894`. |

## Baseline contrast

At `2454b6d`, old frontier/retry tests passed, smoke exposed an approximately
362-second normal cap, benchmark measured 7,042 ticks/s, and deployed Pages
contained static frontier copy. This is historical evidence, not v2 proof.

## Release evidence and limitation

`35d5b8ec161cade16932e50102b2b1653f59ae08` passed GitHub Actions verify run
[31147509396](https://github.com/lkjsxc/cell-sphere-game/actions/runs/31147509396)
in 32m05s; its Pages deployment `5789047543` succeeded. Cache-busted deployed
HTML and source bytes returned HTTP 200 with Level-0/Next World copy, schedule
v2, SCORE v5, and derived result validation; the deployment API confirms the
same SHA.

A remote Chrome run could not load the public site because that browser process
reported `ERR_INTERNET_DISCONNECTED`. Therefore local browser evidence is real,
but no deployed interactive browser reset/progression claim is made.
