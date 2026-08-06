# cell-sphere-game

**Every extinction becomes memory.**

A deterministic browser-native incremental roguelite ecology on a living sphere.
Worlds grow autonomously, consume finite local reserves, collapse, and convert
run quality into Echoes. Echoes buy permanent Evolution cells that materially change
every future world.

**Play:** https://lkjsxc.github.io/cell-sphere-game/

## Current game

1. Choose **Grow a world**. Growth is autonomous; camera, quality, frame rate,
   menus, and game speed never alter simulation authority or SCORE.
2. A normal world lasts about 270–330 game seconds and ends through ecological
   limits. The first two worlds have no harmful events.
3. Worlds 1–2 use protected **Environment Level 0**; World 3 attempts Level 1.
   Completing the frontier unlocks exactly its next unlimited level, while retry
   keeps the same level and advances the deterministic world seed.
4. Extinction awards Echoes from current-model SCORE.
5. Spend Echoes on the **252-cell Evolution Globe**. First activation selects a
   cell; a later activation of that same selected, ready cell buys exactly one level.
6. Evolution's Fertility, Freshwater, Scarcity, Cryogenic, Marine, and Luminous
   affinities combine into visible builds. These unlock whole-cell habitats,
   reclamation, cryolakes, maritime forests, and charged cells.
7. A capable late build can pursue sustained exact **REACH 100%**; the world still
   becomes extinct afterward. The separate Trophy Sphere preserves 96 achievements.

There is no active mid-run Adaptations system. Archived records from older saves
remain readable legacy evidence but cannot affect current worlds or SCORE.
Luminous authority is local whole-cell charge: zero charge means no light, charge
decays, and neither renderer draws electricity wires.

Normal play exposes 1×, 2×, 4×, and 8×. For deterministic diagnostics, opening
with `?dev=1` visibly enables session-only `DEV` speeds at 16×, 32×, 64×, 128×,
and 256×; these speeds and developer mode are never imported or exported as
player preferences. Every authoritative tick still executes. At extinction the
persistent metric sequence becomes `SCORE | ENTROPY | REACH | RESULT`, with
RESULT as the recommended action.

## Progression model

- Evolution topology: a frequency-5 geodesic sphere with exactly **252 cells**,
  12 pentagons, 240 hexagons, and 750 direct boundaries.
- Six environmental affinities, 42 cells each: Fertility, Freshwater, Scarcity,
  Cryogenic, Marine, and Luminous. Pattern, text, and habitat meaning accompany color.
- The canonical level vector is exact, sparse, and stable-ID ordered. Omitted cells
  are Level 0 (locked); Level 1 is the authored identity; Level 2+ upgrades are unlimited.
- Level 0 → 1 needs enough Echoes and one directly adjacent Level-1+ cell. The six
  roots may bootstrap a fresh vector. Later upgrades need only ownership and Echoes.
- Buying all 252 Level-1 identities costs **17,820 Echoes** and gives World
  Potential **1,200,000**. This is level-one breadth, not completion.
- World Potential v3 is 16,000 fresh and 19,000 after any first root, then grows
  exactly without a terminal anchor. Sixteen builds retain breadth activation and
  gain unlimited, bounded-mechanics mastery from relevant levels.
- SCORE v4 is monotone, exact, and shared by HUD, Result, History, audits, and fair
  agents. Environment credit is exposure/performance gated rather than instant-death farming.
- Levels, costs, Echoes, Potential, SCORE, and Environment Levels use exact `bigint`
  arithmetic internally and canonical base-10 strings at JSON/storage/History/
  agent/hash boundaries.

## Technical guarantees

- Same seed, world ordinal, and start configuration produce the same authority at
  every speed and under Worker or fallback execution.
- Simulation imports no DOM, WebGL, storage, or wall-clock presentation state.
- WebGL2 is primary; Canvas 2D is a tested semantic fallback.
- Worlds use whole-cell geography and effects. There are no sub-cell rivers,
  routes, ribbons, or terrain glyph overlays.
- Result transactions, rewards, Evolution purchases, migrations, frontier changes,
  and Trophy recognition are idempotent and reject stale expected revisions/levels.
- Meta schema 11 and History schema 6 preserve exact values, migrate recognized
  642-cell legacy ownership to Level 1 through an explicit manifest, and keep
  archived Adaptation evidence inert.
- Agent save and observation schemas are version 2. Replay and run protocol are
  version 5; Worker and fallback consume the same bounded compiled start data.

## Run locally

```bash
npm run serve
# open http://localhost:8080/
```

No runtime package install is required; production is browser-native HTML, CSS,
and ES modules.

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
npm run balance
npm run audit:cell-visuals
npm run audit:resources
npm run audit:freshwater
npm run audit:score-trace
npm run audit:transformations
npm run audit:reach100
npm run audit:lakes
npm run audit:events
npm run audit:habitats
npm run audit:evolution-levels
npm run audit:environment-levels
npm run audit:luminous
npm run audit:progression-numbers
npm run audit:trophies
npm run audit:adaptations
npm run audit:campaign
npm run terminal:soak
npm run agent:smoke
npm run agent:campaign
npm run agent:long
npm run balance:holdout
```

`audit:campaign` runs production-authority campaign cohorts; the focused endless
progression, Environment, Luminous, exact-number, long-agent, and holdout gates are
listed above. Browser gates use real CDP pointer and keyboard input, including the
select-then-second-activation Evolution transaction.

## Repository map

```text
src/core/         deterministic primitives and world identity
src/world/        geodesic topology and whole-cell geography
src/simulation/   authoritative ecology, resources, habitats, events, protocol
src/game/         SCORE, Environment Levels, 252-cell Evolution, and 96 Trophies
src/rendering/    WebGL2 and Canvas 2D semantic renderers
src/interface/    scene selector, details, result, settings, and interaction
src/platform/     validated persistence, History, and namespace migration
scripts/audits/   production-backed balance, migration, and presentation evidence
tests/            unit and integration authority coverage
```

See [`docs/status.md`](docs/status.md), [`docs/balancing.md`](docs/balancing.md),
[`docs/architecture.md`](docs/architecture.md), and
[`docs/testing.md`](docs/testing.md) for the current evidence and contracts.

## License

Apache-2.0.
