# src/

Application source. Native ES modules, zero dependencies, browser + Node
compatible where the module is environment-independent (simulation, world,
core, and game logic all run under `node:test`).

| Directory | Responsibility | May import |
|---|---|---|
| `core/` | PRNG, fixed math, clock, state machine, hashing, seed codes | — |
| `world/` | Icosphere topology, static environmental fields | core |
| `simulation/` | Deterministic run-state evolution (tick) | core, world, game |
| `game/` | Content + rules: adaptations, phenotypes, strains, events, scoring, echoes, memory nodes, trophies, challenges, autoplay, balance constants | core, world |
| `rendering/` | WebGL2 renderer, Canvas 2D fallback, camera, picking, share card | core, world (reads snapshots only) |
| `history/` | Bounded visual checkpoint codec, recorder, and preview projection | core |
| `interface/` | DOM screens, HUD, user intent, app state machine | all above |
| `platform/` | Adapters: storage, settings, capabilities, audio, share, lifecycle | core |

`main.js` is the composition root and stays small.

Invariants:

- No DOM, audio, storage, or WebGL imports inside `simulation/`.
- No mutation of simulation state from `rendering/`.
- No circular imports. Dependency direction flows downward only.
- JSDoc types on public domain structures; assertions at external boundaries.
- No `eval`, no dynamic code generation, no unsafe HTML insertion.
