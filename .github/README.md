# incremental-network-game

> **Every extinction becomes memory.**

A calm, autonomous roguelite ecology on a living spherical world. Watch a
seeded life inoculate itself, spread cell by adjacent cell through rivers and
forests, survive spatial crises, and inevitably collapse. Inspect any cell
without steering the run, review what happened in History, then turn extinction
into permanent adjacent cells on a spherical Memory atlas.

**Play:** https://lkjsxc.github.io/incremental-network-game/

Submitted to the [ZEN Study Programming Contest 2026 Summer](https://progedu.github.io/webappcontest/2026/summer/index.html),
Web Page category, ZEN University division. The published deadline is
2026-09-13.

## How to play

1. Rotate the title world, tap a cell to inspect it, then choose **Grow a world**.
2. Inoculation is selected autonomously from suitable seeded geography.
3. Watch growth at 1×–32×. Camera movement and inspection never change results.
4. **Automatic** Adaptation choices are the default: every three-card offer is
   selected uniformly by its own deterministic decision stream. Choose
   **Manual** in Settings to queue offers and open them when convenient.
5. Adaptations, History, Settings, and the cell inspector do not pause world
   time by default. A panel-pause preference is available in Settings.
6. At extinction, the world stays visible behind a compact result strip. Review
   History or Memory, choose **Next World**, or let the nine-second countdown
   continue unattended.
7. In Memory, select an adjacent atlas cell, read its details, and explicitly
   press **Unlock**. Several small Echo purchases improve later worlds.

Optional idle globe rotation is available in Settings and defaults off.
Reduced motion always disables its effective motion without erasing the saved
preference.

## Technical highlights

- Explicit level-4 spherical dual: 2,562 stable cells, 7,680 boundaries,
  mostly hexagons, and exactly twelve fivefold World Knots.
- Deterministic graph-native terrain: bounded continents, priority-flood
  drainage, connected rivers/tributaries/mouths, climate, coherent forests,
  biomes, regions, and geography-backed landmarks.
- Fixed 10 Hz typed-array simulation in a module Worker or the identical
  main-thread `RunController` fallback. World, events, growth, inoculation,
  offers, and random decisions use isolated xoshiro128** streams.
- Non-blocking FIFO Adaptation offers with exact-uniform seeded automatic
  selection, manual delayed choices, versioned replay, weighted state-sensitive
  arrival fields, schema-2 History, and bounded cell-only timeline checkpoints.
- Four-draw WebGL2 cellular renderer: geography, life stages, crises,
  Adaptation propagation, History, selection, and Memory are materials on the
  same cells. There is no organism-route, tip-sprite, or Memory-path pass.
  Canvas 2D remains an observationally complete cellular fallback.
- Read-only cell inspector with static geography plus low-cadence authoritative
  living detail.
- Exactly 108 validated Memory cells on a separate 642-cell level-3 atlas
  across Reach, Flow, Reserve, Ecology, Perception, and Continuity. Every
  prerequisite is directly adjacent, every purchase has a concrete compiled
  effect, and a semantic grouped list shares the same source of truth.
- Separate validated stores for Settings, progression/Imprints, schema-2
  semantic History, and ten device-local IndexedDB visual bundles. JSON
  export/import intentionally remains semantic only.
- No runtime dependencies, engine, framework, CDN, remote media, analytics, or
  post-load network requirement.

## Local development

```bash
npm run serve             # http://127.0.0.1:8080
npm test                  # unit + integration
npm run test:browser:file   # real Chrome/WebGL2 over CDP pipe
npm run test:browser:canvas # force the real-Chrome Canvas 2D fallback
npm run verify              # structure/test/balance/benchmark/link gates
```

Docker: `docker compose up serve` / `docker compose run --rm verify`.

## Repository map

```text
index.html       semantic screens, HUD, and nonmodal context surfaces
styles/          authored responsive CSS
src/core/        PRNG, hash, clock, state machine, math
src/world/       topology, terrain, hydrology, ecology, landmarks
src/simulation/  deterministic authority, inspection, replay, History events
src/game/        Adaptations, scoring, strains, 108-node Memory content
src/rendering/   WebGL2 + Canvas 2D, camera, picking, static/dynamic passes
src/history/     strict bounded visual codec, recorder, preview projection
src/interface/   screen/overlay composition and player intent
src/platform/    capabilities, Settings, progression, History persistence
tests/ scripts/  production-module tests, balance, benchmark, Chrome evidence
docs/            design, architecture, evidence, and truthful status
```

Every source directory has a README. Structure gates enforce files ≤200 lines,
directories ≤16 children, repository-relative deployment paths, and the absence
of runtime third-party imports.

## Privacy, license, and media

All settings, History, Echoes, Memory, and Imprints stay in local browser
storage. Code is Apache-2.0. Visuals and interface materials are procedural or
authored in this repository.
