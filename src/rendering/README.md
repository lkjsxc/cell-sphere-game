# `src/rendering/`

WebGL2 is primary and Canvas 2D is a playable semantic fallback. Both consume
immutable snapshots and scene projections; neither mutates simulation authority.
The WebGL world path remains exactly four steady-state draws.

## Sources of truth

- `renderer.js`: four-draw composition, world/scene binding, blank-frame and
  context-loss teardown.
- `life-edges.js`: the pure one-byte-per-canonical-edge ordinary-life
  classification shared by both backends.
- `world-pass.js`: whole-cell terrain/ecology/charge uploads and accepted-
  snapshot updates to the existing WebGL boundary draw.
- `shaders*.js`: cellular geography, edge-primary World life, severe/remains
  interior support, Evolution material, atmosphere, and charge-local emission.
- `fallback2d.js`: matching whole-cell resource, transformation, charge, and
  Evolution semantics plus fixed typed life-edge batches, over an opaque globe
  substrate.
- `continuity-fixture.js`: developer-only uniform shell colors used by the
  trusted browser seam measurement; it is never normal product presentation.
- `cell-geometry.js`, `camera.js`, and `picking.js`: stable dual cells, orbit, and
  pointer-to-cell selection.
- `blank-snapshot.js`: typed zero-life `starting` frame before new authority.

The Evolution scene is the authored frequency-2 42-cell topology. Its projection
visually distinguishes locked/reachable, affordable, selected-ready, owned,
owned-ready, selected-owned-ready, and recently upgraded states with material,
inset/outline/relief, text-backed semantics, and reduced-motion-safe treatment.
Rendering never purchases; interface transaction authority handles the required
select-first, later-second-activation state machine.

Luminous visuals come only from authoritative per-cell charge bytes. Zero charge
emits no light; production, local variation, decay, day/night emphasis, and
Luminous development remain bounded whole-cell material in both backends. The
World shell never radially displaces duplicated cell corners: depth comes from
fragment material, and Canvas establishes opaque disk coverage before its
translucent cell materials. There are no rivers, roads/routes, ribbons,
electricity wires, terrain glyph overlays, or ownership-only false light.

Ordinary living/frontier interiors remain terrain/resource material. Internal
living edges are quiet, exposed active frontier is stronger, stress and critical
use progressively stronger static boundary cues, and remains is muted residual
state. Selection, History emphasis, and coast/lake edges remain independent.
The canonical dynamic buffer is 7,680 bytes for the current topology; WebGL
expands it into the existing four boundary vertices without adding a draw, and
Canvas rebuilds its fixed batches only for an accepted snapshot change.

Gates: renderer unit tests, `test:browser:life-boundaries`,
`test:browser:life-boundaries:canvas`, `test:browser:file`, `test:browser:canvas`,
`audit:cell-visuals`, and `audit:luminous`; browser runs measure a developer-only
uniform fixture at center and limb with zero background intrusion, and normal
WebGL evidence must retain four draws.
