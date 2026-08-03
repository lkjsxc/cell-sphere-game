# Passive living-world rebuild notes

The authoritative interaction contract changed on 2026-08-02:

- ordinary globe taps select cells for inspection and cannot influence growth;
- autonomous inoculation uses a dedicated seeded weighted stream;
- Adaptation offers remain queued data while simulation status stays running;
- exact-uniform Random automatic selection is the new-save/migration default;
- title/run/result/Memory idle rotation is a setting and defaults off;
- world generation is explicit graph-native geography rather than unrelated
  scalar fields;
- History is semantic/bounded and separate from progression;
- the six-node proof tree migrated to a 108-node spherical atlas.

The removed direct-placement mechanic was deleted from state arrays, tick
logic, growth probability, replay, result, snapshots, worker messages, shader
uniforms, fallback rendering, HUD, progression effects, and player copy. Its
old paid proof-node value maps once to a bounded Perception resilience root;
no duplicate refund is granted. Historical save fixtures retain the removed
field name only to prove migration deletes it.

Why: the planet is now a living atlas and autonomous ecological machine. The
player chooses attention, Adaptations, automation, and permanent Memory rather
than steering biological authority with pointer coordinates. This makes
ambient zero-input play, observational neutrality, accessibility, and exact
replay one coherent product contract.

## World-first correction baseline — 2026-08-02

Protective tag: `pre-world-first-interface-20260802` at `540f31a`. Real
Chrome/WebGL2 evidence reproduced the rejected interface before redesign:

- the ordinary globe's terrain is promising, but repeated mint tip sprites,
  short warm/cyan route fragments, and a decorative background orbit compete
  with cell state and make life look placed above the world;
- rivers, organism routes, boundaries, and dots require explanation rather than
  reading immediately as geography or biology;
- the selected-cell sheet is nearly opaque, covers most of the 390×844 globe,
  and includes generic landmark cycling unrelated to the selected cell;
- Adaptations and History are opaque full-height documents that replace the
  world; policy is exposed as implementation labels in both run chrome and the
  surface;
- the result is a large centered card, obscures the terminal globe, and has no
  unattended-next-world path;
- Memory combines distant path ribbons, many tiny status dots, a large dark
  atlas, giant premise copy, a wide action button, top-right navigation, and
  opaque node details. Ownership and the next adjacent purchase are not the
  dominant reading;
- 430×932 title remains usable but layers controls, globe, and copy tightly;
  at 768×1024 the captured title globe disappeared entirely while controls and
  copy remained, making tablet framing a baseline regression.

Live Apple Human Interface Guidelines were consulted from their current DocC
JSON. Acceptance follows their guidance to minimize virtual controls over game
content, retain place through material, use modality only for clear benefit,
keep passive feedback near its subject, make motion brief/purposeful/optional,
reserve toolbars for frequent commands, use strong defaults with few settings,
and avoid relying on one sensory channel. These are principles, not copied
Apple assets or platform styling.

### Visible-line audit

| Producer | Current meaning | Keep internally | Keep visually | Required action |
|---|---|---:|---:|---|
| cell boundary | shared topology | yes | yes, quiet | retain without Knot line accents |
| coastline | land/water boundary | yes | yes | retain as geography |
| river ribbon | downstream drainage | yes | yes | make terrain-bound and unmistakable |
| organism ribbon | adjacent transfer | optional | no | remove production pass and snapshot payload |
| frontier sprite | living/dead frontier | optional state | no | replace with cell material |
| Memory path | distant prerequisite route | no | no | adjacent atlas cells only |
| background orbit | decoration | no | no | delete shader equation |
| Imprint filament | fossil corridor | migrate | no | convert bounded edge endpoints to cells |
| favicon lines/dots | old network mark | no | no | replace with cellular mark |

Only 9 of the existing 162 Memory prerequisite relations are cell-adjacent;
153 require the rejected path renderer. The existing seven-draw WebGL frame
uploads up to 471,096 dynamic bytes, including route/tip buffers rebuilt every
render. Pair arrays account for 69,120 of 102,426 snapshot bytes even though
only cell state is needed by the new presentation. This is the measured
before-state for the cell-only renderer gate.

### Implemented correction

- Deleted organism route/tip shaders, geometry builders, passes, imports, and
  edge presentation payloads; deleted the decorative orbit equation.
- Moved all living, crisis, selection, Adaptation, History, and Memory meaning
  into direct cell materials. WebGL2 now submits four draws and presentation
  snapshots total 25,620 bytes.
- Replaced opaque/full-height documents with one coordinated translucent left
  surface on wide screens or ≤42% bottom sheet on narrow screens; History is a
  visual bottom timeline and result is a compact strip.
- Added deterministic two-second living-neighbor Adaptation propagation with a
  reduced-motion static origin and bounded two-event presentation queue.
- Added strict cell-only visual History checkpoints, primary-cell event focus,
  nearest-frame scrub, immediate Live restoration, and newest-ten IndexedDB
  retention. A detailed run is 101 frames / 259,594 bytes.
- Rebuilt Evolution on a separate 642-cell level-3 globe: all 642 cells are
  purchasable through 636 direct-adjacency prerequisites and six connected
  107-cell branches. Mapping hash `d6bdc218`, schema-5 edge-Imprint→cell
  migration, and a 2,462-Echo economy are validated; every cell has an effect.
- Added compact result details plus enabled-by-default nine-second unattended
  continuation with interaction cancellation, hidden/surface suspension, and
  idempotent result awards.
- Real Chrome now covers six WebGL2 viewport sizes and a forced cellular Canvas
  fallback. A 100-world no-input transition soak found zero invalid/duplicate
  awards with forced-GC heap growth of 1.62 MiB.
