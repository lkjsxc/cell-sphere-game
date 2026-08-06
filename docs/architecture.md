# Architecture

## Authority boundaries

```text
validated meta + selected Environment Level
  → fixed-size Evolution and challenge compilers
  → Worker transport or deterministic fallback (run protocol v5)
  → simulation RunController
  → immutable snapshots / terminal result / replay v5
  → pure SCORE v4 + idempotent result transaction
  → validated exact-value persistence

selected scene: Home | World | Evolution | Trophies
  → renderer + picking + synchronized semantic structure
  → shared detail shell: Result | History | Event Log | Menu | Metric |
    Inspector | Evolution | Trophy | New World confirmation
```

Simulation imports no DOM, WebGL, storage, or wall-clock presentation state.
Rendering consumes snapshots and never mutates authority. A running world remains
the same authority while another primary scene is selected.

## World lifecycle

`run-protocol.js` v5 accepts start, advance, speed-independent command sequencing,
and abandonment. Every command is acknowledged or explicitly rejected.
`transport.js` chooses Worker or fallback while preserving the same serialized
configuration and sequencing. `RunController` owns the deterministic state and
advances fixed ticks. Exact Evolution and Environment values are reduced once at
world start; arbitrary-precision arithmetic never enters the tick loop.

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
- `environment.js`: terrain and bounded run-start challenge coefficients.
- `resource-ecology.js`: immutable local baselines, finite stocks, quantized
  depletion/recovery state, freshwater catchments, and conservation proofs.
- `metabolism.js`: local finite reserve consumption, uptake, and maintenance.
- `lifecycle/`: pre-RNG ecological access, deterministic birth/death/growth,
  Reach ledger, and sustained exact-coverage proof.
- `worldmaking.js`: whole-cell reclamation, cryolakes, littoral succession, and
  bounded bioelectric illumination compiled from active builds.
- `habitats.js`: capability requirements and biome access decisions.
- `events.js`: bounded telegraphed event schedules and whole-cell graph fields
  driven by the compiled challenge profile.
- `snapshot.js` / `result.js`: plain immutable projections.
- `replay.js`: protocol-v5 hashes and deterministic replay evidence.

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
- six connected 42-cell environmental affinities: Fertility, Freshwater,
  Scarcity, Cryogenic, Marine, and Luminous.

The canonical level-vector schema v1 is exact, sparse, duplicate-free, and stable-ID
ordered. Omission means Level 0 (locked), Level 1 is the authored identity, and
Level 2+ is unlimited. Level 0 → 1 requires enough Echoes and a directly adjacent
Level-1+ cell; the six roots alone may bootstrap a fresh vector. An owned cell's
next level requires only ownership and Echoes.

All 252 Level-1 purchases cost 17,820 Echoes and compile to World Potential v3
`"1200000"`; this is level-one breadth, not completion. Cost v1, effect compiler
v2, and Build mastery v1 scan the fixed catalog independently of level magnitude.
Later levels preserve finite ecology through bounded direct refinements while
exact depth, defense, mastery, Potential, and costs remain unbounded between worlds.
Previews and transactions use canonical decimal strings, reject stale expected
level/meta revision, debit once, and increment exactly one cell by one level.

`environment-level.js` keeps world ordinal, selected Environment Level, and durable
frontier distinct. Worlds 1–2 use protected Level 0 and World 3 attempts Level 1;
frontier completion unlocks exactly one next level and retry keeps the attempted
level with a new deterministic seed. Challenge-profile compiler v1 computes any
unlimited level directly across six dimensions and maps exact public rating minus
Evolution defense to bounded finite scarcity, renewal, climate, toxicity,
maintenance, and event coefficients. It never allocates or loops per prior level.

Trophy Sphere uses its own 162-cell topology. Exactly 96 current Trophy cells
occupy six connected constellations; the remaining cells are inert substrate.
Trophies consume completed facts-v5 proof and never feed simulation or SCORE.

## SCORE and exact progression

SCORE model/formula v4 is pure, exact, and monotone during a run:

```text
bounded cumulative quality × exact World Potential v3
× bounded exposure/performance-gated Environment credit
→ exact SCORE
```

The six cumulative axes remain Survival, Exploration, Presence, Coherence,
Stewardship, and Worldmaking. HUD, terminal Result, History, audits, and agent
observation call the same production function; Result adds no correction and an
instant high-level death earns no useful Environment credit. Named ranks continue
procedurally after onboarding tiers.

Levels, costs, Echo balances, Potential, SCORE, and Environment Levels use a
shared non-negative `bigint` boundary. JSON, storage, History, agents, diagnostics,
and hashes carry canonical base-10 strings; bounded fixed-point projections enter
start configuration. Raw `bigint` is never serialized and arbitrary strings are
never converted wholesale to `Number`. Legacy SCORE versions remain readable and
do not compete with v4 bests.

## Rendering

WebGL2 is primary and keeps exactly four world draws; Canvas 2D consumes the same
semantic state. Neither backend creates sub-cell rivers, paths, symbols, ribbons,
or electricity wires. Luminous material is driven only by authoritative per-cell
charge bytes: production, decay, day/night emphasis, and zero-charge darkness are
local to whole cells and bounded by compiled mastery.

The title showcase is generated deterministically from production modules and
checked by hash. Renderer context loss replaces the canvas and activates Canvas
2D without changing authority.

## Interaction

The scene selector is persistent and details use one bounded physical shell. A
different detail replaces the current one; Escape/Close dismisses; globe drag does
not dismiss or purchase; opening detail never moves the camera.

Evolution has an explicit second-activation state machine shared by rendered cells,
touch/pointer picking, the synchronized semantic tree, keyboard, and detail button:
first activation selects and opens detail without buying; a later activation of
the same selected ready cell purchases exactly one level. Selecting another cell,
blank taps, drag/pinch/wheel/inertia/cancellation, and non-ready activation never
purchase. After success the cell stays selected with its new level and next cost;
activating an already selected Evolution cell never closes its detail.

## Persistence

Canonical documents are:

- meta schema 11 under `cell-sphere-game:meta:v1`;
- validated settings under `cell-sphere-game:settings:v3`;
- bounded History schema 6 under `cell-sphere-game:history:v2`;
- a one-transaction crash-recovery journal coupling result, exact reward, History,
  Environment frontier, and purchase evidence;
- IndexedDB visual checkpoints as optional presentation evidence;
- separate validated agent-save schema 2, never imported as a browser save.

Schema 11 migrates recognized graph-v4/252 ownership to exact Level 1 through the
versioned 642-entry manifest, separates legacy SCORE by version, preserves exact
Echoes/frontier/seed cursors, and keeps archived Adaptations inert. History 6
records bounded exact purchase and Environment evidence. Validation degrades
corruption field by field; storage-unavailable sessions remain playable and
truthfully report temporary persistence.

## Determinism contract

The following may not change authority or SCORE:

- speed;
- frame cadence;
- renderer backend or quality;
- camera or selected scene;
- open menus, metrics, Inspector, History, or Trophies;
- document visibility presentation policy.

The development-only `src/agent/` boundary projects observation schema 2 over the
same production simulation, Evolution/challenge compilers, SCORE v4, Trophy,
History 6, and meta transactions. It exposes current Environment/frontier,
pressure summary, exact formatted progression, per-cell levels/eligibility,
mastery/builds, and curated completed results—never future seeds/events, RNG,
replay authority, raw arrays, or diagnostics. Agent saves are schema 2.

Normal speeds are exactly 1×/2×/4×/8×; explicit visible developer mode adds
16×/32×/64×/128×/256×. Every lane executes every authoritative tick. Canonical
focused gates are `audit:evolution-levels`, `audit:environment-levels`,
`audit:luminous`, `audit:progression-numbers`, `agent:long`, and
`balance:holdout`, alongside Worker/fallback, replay-v5, transaction, migration,
REACH, replacement, browser-pointer, and Canvas/WebGL coverage.
