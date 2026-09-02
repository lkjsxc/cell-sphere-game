# `src/rendering/`

WebGL2 is primary and Canvas 2D is a playable semantic fallback. Both consume
immutable snapshots and scene projections; neither mutates simulation authority.
The WebGL world path remains exactly four steady-state draws.

## Sources of truth

- `renderer.js`: four-draw composition, world/scene binding, blank-frame and
  context-loss teardown.
- `cloud-field.js` and `celestial-projection.js`: one shared seamless fixed byte
  field and defensive immutable semantic projection for both backends.
- `fallback-celestial.js`: Canvas drawing/caches for that shared projection;
  it owns no independent clock, schedule, field, or random source.
- `atmosphere-geometry.js`: one fixed, argument-free unit icosphere for the
  decorative WebGL atmosphere silhouette; it has no gameplay-topology input.
- `life-edges.js`: the pure one-byte-per-canonical-edge ordinary-life
  classification shared by both backends.
- `world-pass.js`: whole-cell terrain/ecology/charge uploads and accepted-
  snapshot updates to the existing WebGL boundary draw, selected through the
  single World/Evolution/Trophy scene mode in `scene-mode.js`.
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

Evolution renders the level-4 2,562-cell topology as 2,562 authoritative
progression cells carrying 42 repeated archetypes. The shared exact-cell
projection supplies both backends with local state and
quiet/reachable-perimeter/ownership-perimeter/recent/selected edge classes.
Ownership is the exact owned/unowned graph cut; a separate subordinate
reachable perimeter marks only the unowned reachable/locked cut. Owned-owned
and same-reachability edges remain dynamically quiet. Beneath it, one fixed-seed
call to the maintained World field owner supplies coherent oceans, landmasses,
biomes, relief, lakes, and shores. Both backends begin from those same fields;
domain/kind glyphs and state insets remain small local marks instead of broad
whole-cell fills. Fine boundaries come from the existing static boundary phase;
state perimeters reuse the existing dynamic boundary draw and Canvas batches.
WebGL ownership is continuous while reachability uses the static along-edge
coordinate for a segmented treatment; Canvas uses continuous and dashed strokes
for the same classes. WebGL remains four draws. Trophy retains its independent
field and atlas material path.
Locked/reachable, affordable, selected-ready, owned, owned-ready,
selected-owned-ready, recently upgraded, and fine-Imprint states remain
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
`test:browser:life-boundaries:canvas`, the three `test:browser:planetary-sky*`
paths, `test:browser:file`, `test:browser:canvas`,
`audit:cell-visuals`, and `audit:luminous`; browser runs measure a developer-only
uniform fixture at center and limb plus an isolated radial atmosphere contour,
and normal WebGL evidence must retain four draws.
