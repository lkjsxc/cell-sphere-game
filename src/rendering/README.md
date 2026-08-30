# `src/rendering/`

WebGL2 is primary and Canvas 2D is a playable semantic fallback. Both consume
immutable snapshots and scene projections; neither mutates simulation authority.
The WebGL world path remains exactly four steady-state draws.

## Sources of truth

- `renderer.js`: four-draw composition, world/scene binding, blank-frame and
  context-loss teardown.
- `atmosphere-geometry.js`: one fixed, argument-free unit icosphere for the
  decorative WebGL atmosphere silhouette; it has no gameplay-topology input.
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

Evolution renders the level-4 2,562-cell topology as 42 authored territories.
The shared pure territory owner supplies both backends with fine-cell ownership
and internal/territory/selected/emphasized edge classes. Fine boundaries come
from the existing static boundary phase; stronger territory perimeters reuse the
existing dynamic boundary draw and Canvas batches, so WebGL remains four draws.
Locked/reachable, affordable, selected-ready, owned, owned-ready,
selected-owned-ready, recently upgraded, and coarse-Imprint states remain
text-backed and reduced-motion safe. Rendering never purchases; interface
transaction authority handles select-first, later-second-activation behavior.

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

Gates: renderer unit tests, `test:browser:atmosphere`,
`test:browser:atmosphere:canvas`, `test:browser:life-boundaries`,
`test:browser:life-boundaries:canvas`, `test:browser:file`, `test:browser:canvas`,
`audit:cell-visuals`, and `audit:luminous`; browser runs measure a developer-only
uniform fixture at center and limb plus an isolated radial atmosphere contour,
and normal WebGL evidence must retain four draws.
