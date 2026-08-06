# `src/rendering/`

WebGL2 is primary and Canvas 2D is a playable semantic fallback. Both consume
immutable snapshots and scene projections; neither mutates simulation authority.
The WebGL world path remains exactly four steady-state draws.

## Sources of truth

- `renderer.js`: four-draw composition, world/scene binding, blank-frame and
  context-loss teardown.
- `world-pass.js`: whole-cell terrain, ecology, charge, History, selection, and
  Evolution status uploads.
- `shaders*.js`: cellular geography, life, event material, atmosphere, and
  charge-local emission.
- `fallback2d.js`: matching whole-cell resource, transformation, charge, and
  Evolution semantics without fine geometry.
- `cell-geometry.js`, `camera.js`, and `picking.js`: stable dual cells, orbit, and
  pointer-to-cell selection.
- `blank-snapshot.js`: typed zero-life `starting` frame before new authority.

The Evolution scene is the frequency-5 252-cell topology. Its projection
visually distinguishes locked/reachable, affordable, selected-ready, owned,
owned-ready, selected-owned-ready, and recently upgraded states with material,
inset/outline/relief, text-backed semantics, and reduced-motion-safe treatment.
Rendering never purchases; interface transaction authority handles the required
select-first, later-second-activation state machine.

Luminous visuals come only from authoritative per-cell charge bytes. Zero charge
emits no light; production, local variation, decay, day/night emphasis, and
mastery development remain bounded whole-cell material in both backends. There
are no rivers, roads/routes, ribbons, electricity wires, terrain glyph overlays,
or ownership-only false light.

Gates: renderer unit tests, `test:browser:file`, `test:browser:canvas`,
`audit:cell-visuals`, and `audit:luminous`; WebGL evidence must retain four draws.
