# cell-sphere-game

**Every extinction becomes memory.**

A deterministic, browser-native incremental roguelite ecology on a living sphere.

**Play:** https://lkjsxc.github.io/cell-sphere-game/

## The loop

```text
start a new autonomous world at Environment Level 0
→ observe growth, resources, geography, pressure, and extinction
→ Environment Level rises from authoritative ticks inside that world
→ record sustained survival and quality as SCORE/Echoes
→ improve permanent Evolution
→ start the next world at Environment Level 0
```

Environment Level is an unlimited public survival clock, not a campaign
selection or unlock frontier. The direct schedule begins Level 1 at tick 1200
(120 game seconds) and each later level 600 ticks later. Evolution changes
finite effective pressure and survivability; it never changes the displayed
clock. The first two worlds visibly suppress harmful events through a separate
onboarding modifier while retaining the same clock. World 3 can receive mild,
telegraphed events.

Every world begins from the same Level-0 topology and resource baseline. Later
levels only apply prospective, transition-compiled pressure to renewal,
maintenance, transport, climate, toxicity, recovery, and a bounded event
director. No normal rewarded timeout ends a world: finite ecologies die through
causal ecological failure under escalating pressure. External test/agent budgets
return incomplete, reward-free status.

## Progression

- Evolution is a frequency-5 geodesic sphere with **252 cells**, 750 boundaries,
  12 pentagons, 240 hexagons, and six connected 42-cell affinities: Fertility,
  Freshwater, Scarcity, Cryogenic, Marine, and Luminous.
- Level 0 is locked, Level 1 is authored identity, and Level 2+ is an unlimited
  exact upgrade. First activation selects a cell; a later discrete activation of
  that same selected ready cell buys exactly one level.
- Evolution uses exact canonical decimal values for levels, costs, Echoes,
  World Potential, SCORE, records, and hashes. `bigint` never crosses JSON,
  storage, History, or agent boundaries.
- SCORE v5 is monotone live and combines authoritative quality with World
  Potential and sustained dynamic pressure exposure. Reaching a level and dying
  immediately is not a reward farm.
- Luminous authority is whole-cell charge: zero charge means no glow; charge
  decays and neither renderer draws wires.
- REACH 100% is sustained simultaneous life in every authoritative world cell;
  it remains rare and never makes a finite build immortal.

Result shows final/peak Environment Level, pressure exposure, time at peak,
SCORE, Echoes, causal extinction, powered ecology, and Trophies. Its primary
action is **Next World**, which always resets to Level 0.

## Deterministic contracts

- Worker and fallback use the same `RunController`, schedule, profiles, event
  director, and result authority.
- Camera, selected scene, menus, renderer, quality, frame cadence, speed, and
  tab visibility never alter authoritative ticks or SCORE.
- Normal speeds are 1×, 2×, 4×, and 8×. `?dev=1` visibly enables session-only
  16×–256× diagnostics; every authoritative tick still executes.
- WebGL2 uses four world draw calls. Canvas 2D is a semantic fallback.
- Meta schema 13 preserves old static `highestEnvironmentLevel` only as inert
  `legacyEnvironmentFrontier`; new achieved records are
  `bestEnvironmentLevelReached` and bounded pressure exposure. History schema 8
  explicitly distinguishes legacy static attempts from dynamic worlds.
- Result/run protocol/replay are v7; agent save and observation schemas are v4.

## Run locally

```bash
npm run serve
# open http://localhost:8080/
```

No runtime package installation is required.

## Verification

```bash
npm run test:unit
npm run test:integration
npm run balance:smoke
npm run benchmark
npm run check:links
npm run check:structure
npm run verify
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
npm run audit:environment-levels
npm run audit:events
npm run audit:luminous
npm run audit:progression-numbers
npm run audit:trophies
npm run terminal:soak
npm run agent:smoke
npm run agent:campaign
npm run agent:long
npm run balance:holdout
```

See [`docs/work/environment-progression-v2/`](docs/work/environment-progression-v2/)
for the active migration evidence and verification matrix.
