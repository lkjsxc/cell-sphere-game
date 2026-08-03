# cell-sphere-game

> **Every extinction becomes memory.**

A calm, autonomous roguelite ecology on a living spherical world. Watch a
seeded life inoculate itself, spread cell by adjacent cell through whole-cell
lakes, shores, and forests, survive spatial crises, and inevitably collapse. Inspect any cell
without steering the run, review what happened in History, then turn extinction
into permanent Skill Cells on the spherical Evolution Globe.

**Play:** https://lkjsxc.github.io/cell-sphere-game/

The source is prepared for the canonical repository and Pages path. External
repository rename, push, workflow execution, and deployment are intentionally
not claimed by this worktree.

Submitted to the [ZEN Study Programming Contest 2026 Summer](https://progedu.github.io/webappcontest/2026/summer/index.html),
Web Page category, ZEN University division. The published deadline is
2026-09-13.

## How to play

1. Use the fixed **Home | World | Evolution | Trophies** selector, rotate the
   title world, then choose **Grow a world**.
2. Inoculation is selected autonomously from suitable seeded geography.
3. Watch growth at 1×–32×. Camera movement and inspection never change results.
4. **Automatic** Adaptation choices are the default: every three-card offer is
   selected uniformly by its own deterministic decision stream. Choose
   **Manual** in Menu → Preferences to queue offers and open them when convenient.
5. Adaptations, History, Event Log, Menu, metrics, and the cell inspector do not
   pause world time by default. A panel-pause preference is available in Menu.
6. At extinction, the exact terminal world and HUD stay visible while the shared
   left/mobile context shell opens **Result**. Choose **Next World**, or leave the
   result completely untouched for the nine-second Auto Next. The first genuine
   interaction cancels Auto Next for that result.
7. In the Evolution Globe, select an adjacent Skill Cell, read its details, and explicitly
   press **Unlock**. Several small Echo purchases improve later worlds.

Optional idle globe rotation is available in Menu → Preferences and defaults off.
Reduced motion always disables its effective motion without erasing the saved
preference.

## Technical highlights

- Explicit level-4 spherical dual: 2,562 stable cells, 7,680 boundaries,
  mostly hexagons, and exactly twelve fivefold World Knots.
- Deterministic graph-native terrain: bounded continents, private priority-flood
  drainage, 6–8 separated connected whole-cell lakes in ordinary worlds,
  lake shores and wetlands, climate, coherent forests, biomes, regions, and
  geography-backed landmarks.
- A checked-in 22-second title lifecycle generated from production simulation
  seed `20260701`: germination, branching, loop, pressure, and extinction.
- Fixed 10 Hz typed-array simulation in a module Worker or the identical
  main-thread `RunController` fallback. World, events, growth, inoculation,
  offers, and random decisions use isolated xoshiro128** streams.
- Non-blocking FIFO Adaptation offers with exact-uniform seeded automatic
  selection, manual delayed choices, versioned replay, weighted state-sensitive
  arrival fields, schema-4 History with bounded Trophy proof, and cell-only timeline checkpoints.
- Four-draw WebGL2 cellular renderer: geography, life stages, crises,
  Adaptation propagation, History, selection, and Evolution Globe skills are
  materials on the same cells. There are no detached route or prerequisite lines.
  Canvas 2D remains an observationally complete cellular fallback.
- One orthogonal authority/scene model, one fixed four-scene selector, and one
  physical context shell for Result, History, Event Log, Menu, SCORE, ENTROPY,
  REACH, Adaptations, Inspector, Skill details, and Trophy details.
- Read-only cell inspector with static geography plus low-cadence authoritative
  living detail.
- Exactly 642 validated, purchasable Skill Cells fill a separate 642-cell
  Evolution Globe across Reach, Flow, Reserve, Ecology, Perception, and
  Continuity. A current purchase needs enough Echoes and any one physically
  adjacent unlocked cell; exactly six canonical roots bootstrap a fresh save.
  Every purchase has a concrete compiled effect, and the semantic grouped list
  shares the same authority.
- A separate 162-cell Trophy Sphere with exactly 96 difficult achievements in
  six families. Rich validated conditions consume bounded whole-cell lake,
  ecology, crisis, Manual/Automatic, morphology, SCORE, and cumulative proof.
  Earned cells are monotonic; simultaneous acquisitions use a persisted FIFO
  notification with names/reasons, unread badge, sequential accessible reveal,
  and no world-cell highlight leakage.
- Canonical `cell-sphere-game:*` schema-8 progression, schema-3 Settings, and
  schema-4 semantic History adopt verified legacy namespaces transactionally,
  without deleting recovery sources or duplicating balances/rewards. Persisted
  result keys keep completion idempotent across reloads. The newest ten validated
  visual bundles migrate asynchronously by record ID between IndexedDB databases;
  strict `INHV` v1 remains an explicit supported legacy visual codec. New JSON
  exports are canonical while legacy product exports remain accepted.
- No runtime dependencies, engine, framework, CDN, remote media, analytics, or
  post-load network requirement.

## Local development

```bash
npm run serve             # http://127.0.0.1:8080
npm test                  # unit + integration
npm run test:browser:file   # real Chrome/WebGL2 over CDP pipe
npm run test:browser:canvas # force the real-Chrome Canvas 2D fallback
npm run audit:lakes         # 500-seed connected-lake distribution audit
npm run audit:skills        # exhaustive Evolution physical-frontier/economy audit
npm run audit:trophies      # 24 fresh worlds + 240-world modeled mastery campaign
npm run audit:identity      # canonical package/source/storage/browser identity
npm run audit:cell-visuals  # reject sub-cell production geography
npm run verify              # structure/test/audit/balance/benchmark/link gates
```

Docker: `docker compose up serve` / `docker compose run --rm verify`.

## Repository map

```text
index.html       four semantic scenes, stable HUD, selector, and one context shell
styles/          authored responsive CSS
src/core/        PRNG, hash, clock, state machine, math
src/world/       topology, terrain, hydrology, ecology, landmarks
src/simulation/  deterministic authority, inspection, replay, History events
src/game/        Adaptations, scoring, 642 skills, and 96 Trophy criteria
src/rendering/   WebGL2 + Canvas 2D, camera, picking, static/dynamic passes
src/history/     strict bounded visual codec, recorder, preview projection
src/interface/   screen/overlay composition and player intent
src/platform/    capabilities, Settings, progression, History persistence
tests/ scripts/  production-module tests, balance, benchmark, Chrome evidence
docs/            design, architecture, evidence, and truthful status
```

Every source directory has a README. Structure gates warn above 200 lines or 16
direct children and retain hard caps at 400 lines or 24 children. Link gates
enforce repository-relative deployment paths and no runtime third-party imports.

## Privacy, license, and media

All settings, History, Echoes, Evolution Globe skills, and Imprints stay in local browser
storage. Code is Apache-2.0. Visuals and interface materials are procedural or
authored in this repository.
