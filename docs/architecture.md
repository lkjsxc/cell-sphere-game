# Architecture

Zero-dependency static HTML/CSS/native ES modules. All URLs are repository
relative and work under the GitHub Pages subpath.

## Dependency direction

`interface → rendering → simulation → world → core`; `game` supplies frozen
content/effects to simulation and interface; `platform` contains browser
adapters only. Simulation imports no DOM, WebGL, storage, audio, or interface.
Rendering consumes immutable world fields/snapshots and never mutates authority.

## Orthogonal authority, scene, and surface state

```text
world phase:    idle | starting | running | result
selected scene: home | world | evolution | trophies
simulation:     idle | running | terminal-collapse | extinct
pause reasons:  manual, hidden, optional panel lease
authored slot:  none | result | history | event-log | menu | metric |
                inspector | adaptations | skill | trophy | new-world-confirmation
```

World phase never masquerades as a memory or Trophy scene. A running authority
continues under the visible-document and pause policy while Home, Evolution, or
Trophies is selected; the one render loop draws only the selected scene. Each
scene stores its camera, so World restores the exact active or terminal globe.
Skill purchases during a run compile only into the next world. One fixed
`role=tablist` selector owns primary scene navigation.

One physical context shell owns desktop-left/mobile-bottom geometry, z-order,
focus, scrim, and active content. Opening another mode replaces the child in
that slot without changing globe layout. An Adaptation offer is queued data,
never an authority phase. Closing a surface releases only its own pause reason
and cannot resume a manually paused world. The result countdown is a pure
presentation policy: hidden documents pause elapsed time, while the first trusted
pointer, touch, wheel, keyboard, control, focus, surface, metric, cell, globe, or
scene interaction permanently cancels it for that result. Opening and closing a
surface never rearms it. Starting the next world never spends Echoes or unlocks a Skill Cell.

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
- `snapshot-now` / `status` / `abort`

Every command and response carries the exact immutable tuple
`{worldSessionId, runId, seed, presentationGeneration, resultTransactionKey}`.
The driver reserves it and the app publishes it before Worker or synchronous
fallback startup. Driver, Worker, app routing, commands, observations, History,
and Inspector callbacks reject any tuple mismatch.

Worker → main:

- `ready` / `started {inoculationCell}`
- transferable cell-only `snapshot` (`biomass`, `stress`, `alive`, `lifeState`)
- `adaptation-offered` / `adaptation-selected` with transferable weighted arrival field / `adaptation-mode`
- `history-batch` / `event`
- `cell-inspection {requestId, cell}`
- transferable `history-preview` / `history-buffer` with matching request IDs
- `terminal-collapse` / `extinct {summary}` / `aborted {summary}` / `heartbeat` / `error`

Snapshot cadence is bounded at about 10 Hz even at 32×; rendering is reduced to
about 15 fps at high speed. Inspector records refresh at no more than about 3 Hz.
Static whole-cell lakes, shores, forests, biomes, and landmarks never cross the Worker boundary.

## World and Evolution Globe

The run world keeps the stable 2,562-cell icosphere and immutable graph-native
geography. Central biome tables precompute growth, upkeep, uptake, renewal, and
transport factors. Evolution Globe switches the same renderer and picking
contract to a separate 642-cell level-3 globe. All 642 cells are Skill Cells in
six exact 107-cell territories. Authority precomputes the stable ID-to-cell map
and all 1,920 physical level-3 boundaries: enough Echoes plus any one adjacent
owned cell permits a non-root purchase. Six canonical roots remain bootstrap
choices under the initial-save rule. Imprints are bounded cell material; no progression-path geometry
exists. Trophy Sphere switches the same renderer to a 162-cell level-2
topology. Exactly 96 read-only Trophy cells occupy six connected constellations;
66 substrate cells remain neutral and unselectable. Trophy recognition consumes
only completed facts-v3 proof and never feeds simulation, SCORE, or Echoes.
Bounded birth-time markers plus the existing one-second summary cadence record
whole-cell lake/shore reach, lake diversity/type/salinity, ecology combinations,
sustained lake living/loops, and lake-region drought/freeze survival. These
facts intentionally join the final deterministic hash but consume no RNG.

## Persistence

Separate localStorage documents own:

- Settings schema 3 (`settings:v2`), including automatic continuation and safe
  migration from earlier values;
- progression schema 8 (`meta:v1`), including Echoes, graph-4 642-cell ownership,
  cell-converted Imprints, current Trophy IDs, separate Legacy ownership,
  persisted unread FIFO, facts-v3 cumulative aggregates, graph versions,
  quarantine, a seed cursor, and one migration notice;
- semantic History schema 4 (`history:v2`, migrating earlier schemas), retaining
  24/32 timelines, ≤80 events and ≤8 primary cells/event, ≤128 skill
  purchases, and a hard 700 KB serialized cap;
- device-local IndexedDB visual History: strict `INHV` v1 cell-only bundles,
  newest ten completed worlds, each at most 256 KiB.

Parse/validate is field-by-field. Every recognized owned ID is preserved even
when old ownership forms disconnected islands; each island becomes a physical
frontier source, while unknown IDs remain quarantined. No migration closes
ownership, refunds, charges, or auto-purchases. Progress purchases persist before
in-memory currency is committed. Result awards pass through an idempotent transaction,
so repeated completion delivery cannot duplicate Echoes, History, Imprints, a
Trophy Cell, semantic Trophy event, or notification ID. The global presentation
queue is not retired with a world generation; Trophy-Sphere emphasis reads only
that queue and never becomes an old-world cell highlight.
Storage failure leaves the session playable and is communicated honestly. JSON
export/import remains semantic only; visual checkpoints are explicitly
approximate and device-local.

## Determinism boundary

The run digest includes seed, inoculation, simulation/replay version, compiled
skill effects/conditions, Adaptation mode changes, offers, and selections.
World/events/growth/content/decision/inoculation streams are isolated xoshiro
streams. Scene selection, camera, selection, shell views, quality, motion,
cellular Adaptation waves, metrics, Event Log, and History viewing never enter
authority or consume RNG. Tests compare
no-observation runs against hundreds of inspection/snapshot queries. Separate
100-cycle tests drive the production replacement coordinator and real result
transactions: one seed/authority/blank frame/reward per generation, hidden
countdown pause ownership, duplicate races, unresolved Manual offers, bounded
registries, and persistence caps.
