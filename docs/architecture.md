# Architecture

## Authority direction

```text
core exact primitives
→ game schedule/profile/content
→ simulation authority
→ Worker/fallback protocol and immutable world identity
→ result transaction, current storage, History, Trophies
→ interface, rendering, fair agents, audits
```

Simulation imports no DOM, storage, WebGL, wall clock, or frame-cadence state.
Rendering consumes immutable snapshots and never mutates authority.

## Environment Level and chronic pressure

`src/game/environment-level.js` owns the direct exact schedule:

```text
levelAtTick(0) = 0
tickForLevel(0) = 0
tickForLevel(L ≥ 1) = 1200 + (L − 1) × 600
```

`challenge-profile.js` compiles public level minus Evolution defense into finite
chronic coefficients. State retains current/next profiles and bounded progress;
it does not retain event schedules, footprints, or a director.

## Tick order

`RunController.step()` increments authoritative time, installs due chronic
profiles, applies ecology, updates connectivity/REACH/SCORE/History, then checks
causal terminal conditions. Speed changes how many complete ticks execute, never
their content.

## Identity and replacement

World identity contains only immutable session/run IDs, seed, presentation
generation, environment model/schedule version/hash, immutable start hash, and
result transaction key. Atomic replacement is first-wins: retire old authority,
clear renderer state, render one blank Level-0 frame, reserve identity, then
start one controller. Stale Worker/fallback messages are rejected.

## Persistence

Current-only storage uses meta schema 15, History schema 10, settings schema 8,
and transaction WAL schema 5. Old or mismatched documents start fresh; there are
no migration maps. Worker protocol 12 carries a public relative speed whose
meaning is converted once before clock accumulation. A terminal result validates
its schedule, Level-0 start, exposure, profile evidence, and SCORE before one
transaction applies Echoes, records, History, and Trophies.

## Rendering and interaction

WebGL2 remains four world draw calls and keeps duplicated cell corners on one
continuous position shell; Canvas 2D receives the same semantic cell states over
an opaque globe substrate. One input path freezes the visible sphere radius for
each one-pointer gesture and converts CSS-pixel movement to angular deltas. One
constant-space presentation policy maps the sampled release direction through
one progressive bounded response and damps it from animation time under
a finite rest threshold and hard lifetime. World/Home distance
derives from projected globe geometry; the layout policy transitions horizontal
composition from centered portrait to near two-thirds of usable width on wide layouts. Primary scenes are
Home, World, Evolution, and Trophies. History is
the single durable temporal surface. Fair agents use production authority and
see no future seeds, RNG, raw arrays, or hidden maps.
