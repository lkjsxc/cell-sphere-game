# Architecture

Zero-dependency static HTML/CSS/native ES modules. All URLs are repository
relative and work under the GitHub Pages subpath.

## Dependency direction

`interface → rendering → simulation → world → core`; `game` supplies frozen
content/effects to simulation and interface; `platform` contains browser
adapters only. Simulation imports no DOM, WebGL, storage, audio, or interface.
Rendering consumes immutable world fields/snapshots and never mutates authority.

## Three independent state concerns

```text
primary screen: title → starting → running → result → memory → starting
simulation:     idle | running | terminal-collapse | extinct
pause reasons:  manual, hidden, optional panel lease
overlay:        none | inspector | adaptations | history | settings |
                result-details | memory-node | memory-list
```

An Adaptation offer is queued data, never a primary/simulation phase. One
overlay is active at a time. Closing a panel releases only its own pause reason
and cannot resume a manually paused world. The result countdown is a pure
presentation policy: hidden documents and open detail surfaces suspend its
remaining time, while interaction cancels it; starting the next world never
spends Echoes or purchases Memory.

## Execution topology

The module Worker owns canonical typed-array state and fixed-step timing. A
small adapter falls back to the identical `RunController` on the main thread.
Each controller generation rejects stale Worker callbacks. Static topology and
WorldModel are regenerated deterministically on each side and are never sent in
snapshots.

Main → Worker:

- `init {cfg}` / `start`
- `speed {value}` / `pause` / `resume`
- `set-adaptation-mode {mode}`
- `choose-adaptation {offerId, cardId}`
- `inspect-cell {requestId, node}`
- `history-preview {requestId, tick}` / `history-buffer {requestId}`
- `snapshot-now`

Worker → main:

- `ready` / `started {inoculationCell}`
- transferable cell-only `snapshot` (`biomass`, `stress`, `alive`, `lifeState`)
- `adaptation-offered` / `adaptation-selected` / `adaptation-mode`
- `history-batch` / `event`
- `cell-inspection {requestId, cell}`
- transferable `history-preview` / `history-buffer` with matching request IDs
- `extinct {summary}` / `error`

Snapshot cadence is bounded at about 10 Hz even at 32×; rendering is reduced to
about 15 fps at high speed. Inspector records refresh at no more than about 3 Hz.
Static rivers, forests, biomes, and landmarks never cross the Worker boundary.

## World and Memory

The run world keeps the stable 2,562-cell icosphere and immutable graph-native
geography. Central biome tables precompute growth, upkeep, uptake, renewal, and
transport factors. Memory switches the same renderer and picking contract to a
separate 642-cell level-3 atlas. Its 108 unique progression cells form a DAG in
which every prerequisite relation is also direct spherical adjacency. Imprints
are bounded cell material; no Memory path geometry exists.

## Persistence

Separate localStorage documents own:

- Settings schema 3 (`settings:v2`), including automatic continuation and safe
  migration from earlier values;
- progression schema 5 (`meta:v1`), including Echoes, 108-cell ownership,
  cell-converted Imprints, graph version, quarantine, and one migration notice;
- semantic History schema 2 (`history:v2`, migrating `history:v1`), retaining
  24/32 timelines, ≤80 events and ≤8 primary cells/event, ≤128 Memory
  purchases, and a hard 700 KB serialized cap;
- device-local IndexedDB visual History: strict `INHV` v1 cell-only bundles,
  newest ten completed worlds, each at most 256 KiB.

Parse/validate is field-by-field. Progress purchases persist before in-memory
currency is committed. Result awards pass through an idempotent transaction,
so repeated completion delivery cannot duplicate Echoes, History, or Imprints.
Storage failure leaves the session playable and is communicated honestly. JSON
export/import remains semantic only; visual checkpoints are explicitly
approximate and device-local.

## Determinism boundary

The run digest includes seed, inoculation, simulation/replay version, compiled
Memory effects/conditions, Adaptation mode changes, offers, and selections.
World/events/growth/content/decision/inoculation streams are isolated xoshiro
streams. Camera, selection, panel views, quality, motion, cellular Adaptation waves,
and History viewing never enter authority or consume RNG. Tests compare
no-observation runs against hundreds of inspection/snapshot queries. A separate
100-world test drives result transactions, hidden countdown leases, automatic
continuation, and unresolved Manual offers without input.
