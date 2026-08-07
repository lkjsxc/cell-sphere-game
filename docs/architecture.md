# Architecture

## Authority direction

```text
exact progression primitives
→ Environment schedule/profile/exposure
→ simulation authority and bounded event director
→ Worker/fallback protocol and immutable session identity
→ result transaction, storage, History, Trophies
→ interface, rendering, fair agents, audits
```

Simulation imports no DOM, storage, WebGL, or presentation wall clock. Rendering
consumes snapshots and never mutates authority.

## Environment Progression v2

`src/game/environment-level.js` is the single production source for the exact
within-world schedule:

```text
levelAtTick(0) = 0
tickForLevel(0) = 0
tickForLevel(L ≥ 1) = 1200 + (L − 1) × 600
```

All values at JSON/storage/History/agent/hash boundaries are canonical decimal
strings. Direct inverse evaluation uses one exact subtraction/division; it does
not enumerate prior levels or retain a threshold table. The schedule version and
hash are immutable start configuration facts.

`challenge-profile.js` compiles an exact public level minus compiled Evolution
defense into finite dynamic pressure dimensions. State retains only current and
next profiles plus fixed-point progress. It interpolates prospective coefficients
only; the player-visible pressure summary carries both profile hashes, progress,
and the same effective coefficients. Topology, seed, inoculation, and Level-0
resource stock are immutable.

`environment-exposure.js` aggregates bounded exact pressure-time and quality
evidence at summary/transition/result boundaries, not in cell or edge loops.
SCORE v5 consumes the same exposure evidence.

## Tick order

`RunController.step()` applies one deterministic order:

1. increment authoritative tick;
2. derive schedule state and install each due transition exactly once, including
   the bounded terminal-collapse fade;
3. compile/install current/next pressure state and advance the bounded director;
4. apply conditionals, environment, metabolism, transport, worldmaking, growth,
   death, resource ecology, and liveness;
5. update connectivity, SCORE, exposure, snapshots, and bounded History;
6. evaluate causal natural terminal state.

Speed changes how many complete ticks execute, never their content. Worker and
fallback call this same controller.

## Bounded event director

`events.js` owns a deterministic isolated-RNG rolling director with at most six
future/active event geometries and eight recent evidence entries. It derives
candidates only when capacity/cadence permits, enforces a player-visible
100-tick minimum telegraph despite summary cadence, uses whole-cell footprints,
and reclaims expired geometry. Snapshot
and agent projections expose only active player-visible events, not future
queues. The versioned onboarding modifier suppresses harmful candidates for
worlds one and two without changing the schedule.

## Identity and replacement

`WORLD_IDENTITY_FIELDS` contain only immutable facts: session/run IDs, seed,
presentation generation, environment model/schedule version/hash, immutable
start-config hash, onboarding modifier version, and result transaction key.
Mutable Environment Level and profile hash are snapshot/result fields and are
not compared as identity.

Atomic replacement is first-wins: abandon/retire old authority, clear renderer
state, render one static blank Level-0 frame, reserve immutable identity, then
start one Level-0 controller. Stale Worker/fallback messages are rejected by
identity and protocol v7.

## Persistence and result transaction

A terminal result validates dynamic model/schedule/version, Level-0 start,
final/peak/transition/exposure consistency, exact World Potential, and SCORE
before atomically applying Echoes, best records, History, Trophies, and seed
cursor. Re-delivery returns the prior transaction outcome.

Meta schema 13 stores `bestEnvironmentLevelReached`, `bestEnvironmentExposure`,
and `longestWorldTicks`. Older `highestEnvironmentLevel` is retained only as
inert `legacyEnvironmentFrontier`; it cannot select a new start level. History
schema 8 tags old static attempts as model 1 and records new model-2 start,
final, peak, exposure, onboarding, bounded transition evidence, and compact
interpolation endpoints/effective coefficients.

## Rendering and interaction

WebGL2 remains four world draw calls; Canvas 2D receives the same semantic
snapshot. Both render whole-cell charge without wires. Primary scenes are Home,
World, Evolution, and Trophies. Evolution uses a shared select-then-second-
activation purchase transaction across pointer, touch, keyboard, semantic tree,
and button paths.

The fair agent boundary uses the production controller. It can start a Level-0
world, advance bounded authoritative chunks, inspect a public checkpoint, and
continue under an explicit external budget. It cannot select or retry a static
Environment Level and never sees future events, seeds, RNG, raw arrays, or
hidden maps.
