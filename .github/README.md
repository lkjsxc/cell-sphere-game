# cell-sphere-game

**Every extinction becomes memory.**

A deterministic browser-native incremental roguelite ecology on a living sphere.
Worlds grow autonomously, consume finite local reserves, collapse, and convert
run quality into Echoes. Echoes buy permanent Skill Cells that materially change
every future world.

**Play:** https://lkjsxc.github.io/cell-sphere-game/

## Current game

1. Choose **Grow a world**. Growth is autonomous; camera, quality, frame rate,
   menus, and game speed never alter simulation authority or SCORE.
2. A normal world lasts about 270–330 game seconds and ends through ecological
   limits. The first two worlds have no harmful events.
3. World 3 introduces one mild environmental pressure late in the run. Later
   world eras add pressure gradually and deterministically.
4. Extinction awards Echoes from current-model SCORE.
5. Spend Echoes on the **252-cell Evolution Globe**. A cell needs enough Echoes
   and at least one directly adjacent owned cell—nothing else.
6. Evolution's Fertility, Freshwater, Scarcity, Cryogenic, Marine, and Luminous
   affinities combine into visible builds. These unlock whole-cell habitats,
   reclamation, cryolakes, maritime forests, and energized cells.
7. A full late build can pursue sustained exact **REACH 100%**; the world still
   becomes extinct afterward. The separate Trophy Sphere preserves 96 achievements.

There is no active mid-run Adaptations system. Archived records from older saves
remain readable legacy evidence but cannot affect current worlds or SCORE.

Normal play exposes 1×, 2×, 4×, and 8×. For deterministic diagnostics, opening
with `?dev=1` visibly enables session-only `DEV` speeds through 256×; these speeds
and developer mode are never imported or exported as player preferences. Every
authoritative tick still executes. At extinction the persistent metric sequence
becomes `SCORE | ENTROPY | REACH | RESULT`, with RESULT as the recommended action.

## Progression model

- Evolution topology: frequency-5 geodesic sphere, exactly **252 Skill Cells**,
  12 pentagons, 240 hexagons, and 750 direct boundaries.
- Six environmental affinities, 42 cells each: Fertility, Freshwater, Scarcity,
  Cryogenic, Marine, and Luminous. Pattern, text, and habitat meaning accompany color.
- Economy: **17,820 Echoes** total; every purchase shows gameplay and World
  Potential before → after, affinity, cost, build progress, and new neighbors.
- Versioned World Potential: 16,000 fresh, 19,000 after a first root, and
  1,200,000 at full Evolution. Sixteen visible build recipes compile from Skills.
- SCORE model v3 is monotone during a world and reports cumulative Survival,
  Exploration, Presence, Coherence, Stewardship, and Worldmaking.
- Measured fresh 500-seed medians: SCORE 8,782, duration 312.0 seconds, and 27.5%
  peak land occupancy; 73.5% of living-cell time was in the richest quintile.
- A paired 60-seed first-root check moved World Potential 16,000 → 19,000 and
  median next-world SCORE 8,892 → 10,676, not an order-of-magnitude jump.
- Full-Evolution SCORE is capped at 1,099,200; a 300-seed full-build audit
  produced exact sustained REACH 100% in 2.7% of deterministic seeds.

## Technical guarantees

- Same seed, world ordinal, and start configuration produce the same authority at
  every speed and under Worker or fallback execution.
- Simulation imports no DOM, WebGL, storage, or wall-clock presentation state.
- WebGL2 is primary; Canvas 2D is a tested semantic fallback.
- Worlds use whole-cell geography and effects. There are no sub-cell rivers,
  routes, ribbons, or terrain glyph overlays.
- Result transactions, rewards, purchases, migrations, and Trophy recognition
  are idempotent.
- Schema-9 persistence migrates every recognized graph-v4 Skill through an
  explicit 642→252 manifest, preserves ownership and legacy evidence, refunds
  only positive represented-spend differences, and is repeat-safe.

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
npm run audit:skills
npm run audit:trophies
npm run audit:adaptations
npm run audit:campaign
npm run terminal:soak
npm run agent:smoke
npm run agent:campaign
```

`audit:campaign` runs the deep production-authority progression audit, including
at least 200 fresh seeds plus campaign policies and quarter/half/full Evolution
checkpoints. Browser gates use real CDP pointer and keyboard input.

## Repository map

```text
src/core/         deterministic primitives and world identity
src/world/        geodesic topology and whole-cell geography
src/simulation/   authoritative ecology, resources, habitats, events, protocol
src/game/         SCORE, 252 Skills, migration manifest, and 96 Trophies
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
