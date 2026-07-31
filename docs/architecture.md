# Architecture

Zero-dependency static site: `index.html` + native CSS + ES modules.
Works from any static server under any subpath (relative URLs only).

## Module boundaries and dependency direction

```
main.js  (composition root, small)
  ├─ platform/   persistence, settings, capabilities, audio, share, lifecycle
  ├─ interface/  DOM screens, user intent, state-machine wiring
  ├─ rendering/  WebGL2 renderer, Canvas2D fallback, camera, picking, share card
  ├─ game/       adaptations, phenotypes, strains, events content, scoring,
  │              echoes, memory nodes, trophies, challenges, autoplay, balance
  ├─ simulation/ deterministic run state + tick (no DOM/audio/storage/WebGL)
  ├─ world/      icosphere topology + static environmental fields
  └─ core/       PRNG, fixed-point math, clock, state machine, hashing, seeds
```

Allowed direction: upper layers import lower layers. `simulation` may import
`world`, `game` (content/balance data), and `core` — never `rendering`,
`interface`, or `platform`. `rendering` reads snapshots; it never mutates
simulation state. No circular imports (checked by review; keep it that way).

## Execution topology

Preferred: simulation runs in a **module Web Worker**; main thread renders
and handles input. Fallback: the same `Simulator` class runs on the main
thread when workers fail. No `SharedArrayBuffer` (GitHub Pages lacks
cross-origin isolation headers).

### Worker protocol (JSON messages + transferable typed arrays)

main → worker:
- `{t:'init', seed, config}` — build world + run state
- `{t:'start', strain, challenge, memoryEffects, inoculate}` — begin
- `{t:'decide', card}` / `{t:'signal', node}` / `{t:'reroll'}`
- `{t:'speed', value}` / `{t:'pause'}` / `{t:'resume'}` / `{t:'policy', p}`

worker → main:
- `{t:'ready'}` / `{t:'snapshot', tick, buffers…, metrics}` (transferable)
- `{t:'draft', options, tick}` — simulation pauses until `decide`/`reroll`
- `{t:'event', family, phase, center, radius}`
- `{t:'extinct', summary}` — final metrics, hash, replay digest

Static topology is generated independently by both sides from the seed —
never transmitted.

## State ownership

- Canonical simulation state: worker (or fallback driver). Typed arrays, SoA.
- Permanent progression/settings/archive: `platform/storage.js`
  (localStorage, versioned schema, validated on load, corruption-safe).
- UI state: explicit finite state machine in `interface/app-state.js`.
  Screens never toggle via ad-hoc class changes.

### App states

boot → title → strain-select → inoculation → running ⇄ adaptation-draft /
paused → extinction → result → (memory-globe | trophy-gallery | archive |
settings | diagnostics overlays) → title/strain-select. Overlays keep the
underlying state explicit.

## Persistence

One localStorage document per concern (`settings:v1`, `progress:v1`,
`archive:v1`). Load = parse → validate → default-on-failure with a preserved
raw copy for recovery. IndexedDB only if archive volume proves to need it.

## Failure recovery

- Worker startup failure → main-thread fallback, same code path.
- WebGL2 failure → Canvas 2D fallback renderer (playable, simplified).
- Storage failure → in-memory session, honest notice, retry on next boot.
- Shader compile failure → diagnostics + fallback renderer.
- A blank screen is never acceptable: boot errors render a message.

## Determinism contract

Seedable PRNG (xoshiro128**) only; `Math.random` is banned in simulation and
content selection. Fixed iteration order. `Math.fround` at state-write
boundaries. Render timing never feeds simulation. Same seed + same decision
log = identical final hash at any speed, in worker or main-thread mode.
