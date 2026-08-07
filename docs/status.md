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
SCORE v5, protocol/replay v6, meta 12, History 7, WAL 3, agent schemas 3, and
Trophy facts 6 share this boundary. Old static `highestEnvironmentLevel` is
inert `legacyEnvironmentFrontier`; old History levels are static-attempt
records, not dynamic peaks.

## Local verification

The uncommitted worktree passed `npm run verify` (all 26 local gates), WebGL2
Worker/fallback and Canvas browser suites, strict 30-run-per-policy balance,
full campaign audit, REACH 100 audit, agent smoke/campaign/long, and untouched
holdout cohorts.

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

## Release boundary

The active work package at
[`docs/work/environment-progression-v2/`](work/environment-progression-v2/)
contains current matrices and command evidence. CI, Pages, and cache-busted
deployed bytes have **not** yet been checked for this uncommitted revision; do
not treat baseline deployment reports as v2 evidence.
