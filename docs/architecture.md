# Architecture

## Authority boundaries

```text
validated start configuration
  → Worker transport or deterministic fallback
  → simulation RunController
  → immutable snapshots / terminal result
  → pure SCORE + idempotent result transaction
  → validated persistence

selected scene: Home | World | Evolution | Trophies
  → renderer + picking + synchronized semantic structure
  → shared detail shell: Result | History | Event Log | Menu | Metric |
    Inspector | Skill | Trophy | New World confirmation
```

Simulation imports no DOM, WebGL, storage, or wall-clock presentation state.
Rendering consumes snapshots and never mutates authority. A running world remains
the same authority while another primary scene is selected.

## World lifecycle

`run-protocol.js` accepts start, advance, speed-independent command sequencing,
and abandonment. Every command is acknowledged or explicitly rejected.
`transport.js` chooses Worker or fallback while preserving the same serialized
configuration and sequencing. `RunController` owns the deterministic state and
advances fixed ticks.

A world replacement uses an explicit coordinator:

1. first request wins;
2. live authority acknowledges abandonment;
3. old timers, pending work, overlays, snapshots, and renderer dynamic state are
   retired;
4. exactly one static blank starting frame is rendered;
5. one new identity and seed are reserved;
6. the new authority starts.

Result, reward, replacement, and abandonment keys make retries idempotent.

## Simulation layout

- `state.js`: typed-array authority and bounded counters.
- `environment.js`: terrain and world-era environmental inputs.
- `metabolism.js`: local finite reserve consumption, uptake, and maintenance.
- `lifecycle/`: deterministic birth, death, growth, and Reach ledger.
- `habitats.js`: capability requirements and biome access decisions.
- `events.js`: world-ordinal event-era scheduling and graph fields.
- `snapshot.js` / `result.js`: plain immutable projections.
- `replay.js`: hashes and deterministic replay evidence.

Growth rejects an inaccessible biome before consuming growth RNG. Habitat access
is compiled from permanent Evolution ownership and transported in the start
configuration.

## World and progression topologies

The living world uses the existing high-resolution geodesic topology. Generated
geography includes whole-cell land, ocean, lakes, cold biomes, moisture,
resources, forests, and landmarks.

Evolution uses a separate frequency-5 topology:

- 252 cells;
- 750 direct boundaries;
- 12 degree-5 cells and 240 degree-6 cells;
- six connected 42-cell territories.

Purchase eligibility is held Echoes plus one directly adjacent owned cell. Roots
are the only fresh exception. Compiled output contains smooth bounded scalar
effects, conditional rules, capability unlocks, World Potential, and stable
hashes. Purchase preview compares compiled before/after values.

Trophy Sphere uses its own 162-cell topology. Exactly 96 current Trophy cells
occupy six connected constellations; the remaining cells are inert substrate.
Trophies consume completed facts-v4 proof and never feed simulation or SCORE.

## SCORE

Terminal SCORE is pure:

```text
quality = weighted six-axis Run Quality
score = round(quality × World Potential × Challenge)
```

World Potential is compiled before world start and included in state, snapshot,
result, History, and metric explanations. Legacy SCORE is stored separately and
never competes with current-model best SCORE.

## Rendering

WebGL2 is primary and uses four draws: world cells, life, whole-cell event
material, and atmosphere. Canvas 2D consumes the same semantic state. Neither
backend creates sub-cell rivers, paths, symbols, or ribbons.

The title showcase is generated deterministically from production modules and
checked by hash. Renderer context loss replaces the canvas and activates Canvas
2D without changing authority.

## Interaction

The scene selector is persistent. Details use one bounded physical shell. Same
trigger toggles, a different trigger replaces, Escape/Close dismiss, and globe
drag does not dismiss an open detail. Opening a detail does not move the camera.
Synchronized offscreen tree/grid structures provide keyboard access to Evolution
and Trophy cells.

## Persistence

Canonical documents are:

- schema-9 meta under `cell-sphere-game:meta:v1`;
- validated settings under `cell-sphere-game:settings:v3`;
- schema-4 bounded History under `cell-sphere-game:history:v2`;
- a one-transaction crash-recovery journal coupling completed rewards and History;
- IndexedDB visual checkpoints as optional presentation evidence.

Schema 9 migrates graph-v4 ownership through the versioned 642-entry manifest,
separates legacy SCORE, recognizes retired Trophy aliases, and keeps archived
legacy run records inert. Validation degrades corruption field by field.
Storage-unavailable sessions remain playable and report temporary persistence.

## Determinism contract

The following may not change authority or SCORE:

- speed;
- frame cadence;
- renderer backend or quality;
- camera or selected scene;
- open menus, metrics, Inspector, History, or Trophies;
- document visibility presentation policy.

Unit and integration tests compare Worker/fallback, speed lanes, replay hashes,
result transactions, migration idempotence, and repeated replacement.
