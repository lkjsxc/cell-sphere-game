# incremental-network-game

> **Every extinction becomes memory.**

A calm, autonomous roguelite ecology on a living spherical world. Watch a
seeded network inoculate itself, follow rivers and forests, survive spatial
crises, and inevitably collapse. Inspect any cell without steering the run,
review what happened in History, then turn extinction into permanent paths on
a dense spherical Memory atlas.

**Play:** https://lkjsxc.github.io/incremental-network-game/

Submitted to the [ZEN Study Programming Contest 2026 Summer](https://progedu.github.io/webappcontest/2026/summer/index.html),
Web Page category, ZEN University division. The published deadline is
2026-09-13.

## How to play

1. Rotate the title world, tap a cell to inspect it, then choose **Grow a world**.
2. Inoculation is selected autonomously from suitable seeded geography.
3. Watch growth at 1×–32×. Camera movement and inspection never change results.
4. **AUTO: RANDOM** is the default: every three-card Adaptation offer is
   selected uniformly by its own deterministic decision stream. Switch to
   **MANUAL** in one action to queue offers and open them when convenient.
5. Adaptations, History, Settings, and the cell inspector do not pause world
   time by default. A panel-pause preference is available in Settings.
6. At extinction, review score/cause/History, enter Memory, select a visible
   node, read its details, and explicitly press **Unlock**.
7. Spend several small Echo purchases, then grow the next world with compiled
   permanent Memory.

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
  selection, manual delayed choices, versioned replay, schema-2 semantic
  History, and bounded approximate cell-only timeline checkpoints.
- WebGL2 primary renderer: seven steady-state draws for terrain, coast/cell
  etching, drainage ribbons, atmosphere, and living routes. Canvas 2D remains
  an observationally complete fallback.
- Read-only cell inspector with static geography plus low-cadence authoritative
  living detail.
- Exactly 108 validated Memory nodes across Reach, Flow, Reserve, Ecology,
  Perception, and Continuity; spherical selection precedes every purchase and
  an accessible grouped list shares the same source of truth.
- Separate validated stores for Settings, progression/Imprints, schema-2
  semantic History, and ten device-local IndexedDB visual bundles. JSON
  export/import intentionally remains semantic only.
- No runtime dependencies, engine, framework, CDN, remote media, analytics, or
  post-load network requirement.

## Local development

```bash
npm run serve             # http://127.0.0.1:8080
npm test                  # unit + integration
npm run test:browser:file # real Chrome/WebGL2 over CDP pipe
npm run verify            # fast structure/test/balance/benchmark/link gates
```

Docker: `docker compose up serve` / `docker compose run --rm verify`.

## Repository map

```text
index.html       semantic screens, HUD, and overlays
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
