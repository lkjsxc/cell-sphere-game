# Status — 2026-08-07

## Current model

Environment Progression v2 replaces the rejected static cross-world frontier.
Every world starts at Environment Level 0, its public level rises from
authoritative ticks in that world, extinction records final/peak/exposure, and
**Next World** starts at Level 0 again. Evolution changes effective pressure
and survivability, never the public clock.

Schedule v2 (`src/game/environment-level.js`) has Level 0 at tick 0, Level 1
at tick 1200, and later levels every 600 ticks. It evaluates/inverts directly
with canonical exact values and has no designed maximum. Profile/exposure v2,
SCORE v5, protocol/replay v6, meta 12, History 8, WAL 3, agent save schema 3 / observation schema 4, and
Trophy facts 6 share this boundary. Old static `highestEnvironmentLevel` is
inert `legacyEnvironmentFrontier`; old History levels are static-attempt
records, not dynamic peaks.

## Verification

The reviewed v2 source passed `npm run verify` (all 26 local gates; 194/194
unit and 78/78 integration), WebGL2 Worker/fallback and Canvas browser suites,
strict 30-run-per-policy balance, full campaign audit, REACH 100 audit, agent
smoke/campaign/long, and untouched holdout cohorts.

Follow-up authority hardening verifies terminal-collapse schedule boundaries,
player-visible summary-cadenced telegraphs, zero-net event defense, exact result
transition/profile evidence, interpolation disclosure, and a real production
Worker-thread/fallback terminal parity run. History is now schema 8 and fair
agent observation schema 4 to retain public interpolation evidence.

Measured anchors:

- strict balanced median: 296.7 game seconds;
- fresh campaign median: SCORE 10,504, 284.7 seconds;
- first-root median SCORE: 11,368;
- breadth-complete median SCORE: 1,099,367;
- first campaign resolution: 20.12 minutes;
- REACH 100: 19/300 breadth worlds, zero fresh worlds; all tested breadth runs
  naturally finished within the reward-free 10,000-tick audit budget;
- seven same-host benchmark runs: 6,026–6,690 ticks/s, median 6,346 (9.88%
  below the 7,042 baseline and inside the 10% target).

Browser evidence used a dynamic reference SCORE of 12,429, exactly four WebGL
world draws, Worker/fallback equality paths, Canvas fallback, charged-cell
Luminous evidence, and Evolution interaction.

## Release evidence

Follow-up authority commit `cd533e39db3dea51ab5bed6a96bb3c415b9363fe`
passed GitHub Actions [`verify` run 31158862198](https://github.com/lkjsxc/cell-sphere-game/actions/runs/31158862198)
in 32m00s. GitHub Pages deployment `5791190693` succeeded at
<https://lkjsxc.github.io/cell-sphere-game/>. Cache-busted deployed bytes
returned HTTP 200 for the updated simulator, event director, profile, and
History modules; they contain the terminal-fade clock, summary-cadence
telegraph allowance, zero-net event handling, and History 8 interpolation
projection. The deployed HTML contains `Next World` and Level-0 copy with no
static retry/next-level wording.

The preceding migration commit `35d5b8ec161cade16932e50102b2b1653f59ae08` passed GitHub Actions
[`verify` run 31147509396](https://github.com/lkjsxc/cell-sphere-game/actions/runs/31147509396)
in 32m05s, including Benchmark. Its GitHub Pages deployment
`5789047543` completed successfully at
<https://lkjsxc.github.io/cell-sphere-game/>.

A cache-busted deployed HTML/source-byte check returned HTTP 200 and confirmed
`Next World`, Level-0 copy, schedule model 2 (1200/600), SCORE v5 calibration,
and derived result validation; the deployment API records the same commit SHA.
A remote Chrome interaction attempt was blocked by that browser process's
`ERR_INTERNET_DISCONNECTED`, so this record does **not** claim a deployed
interactive reset/progression browser session. Local browser reset/progression
coverage is recorded above.

The active work package at
[`docs/work/environment-progression-v2/`](work/environment-progression-v2/)
contains matrices and full command evidence.
