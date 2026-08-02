# src/rendering/

WebGL2 primary renderer with a playable Canvas 2D fallback. Both read immutable
world fields and snapshots; neither can mutate simulation authority.

Balanced WebGL2 issues seven steady-state draws: background, dual-cell terrain,
quiet/coast boundaries, connected drainage ribbons, atmosphere, organism
routes, and organism tips/Memory nodes. Rivers are static cool center-to-
downstream ribbons; organism routes are warm animated boundary-aligned veins.
Forests and relief stay in the cell material pass.

Key modules:

- `camera.js`: orthonormal free-orbit frame, zoom, inertia, focus, picking ray.
- `picking.js`: offset-aware ray/sphere hit and nearest stable cell ID.
- `cell-geometry.js`: dual polygons, coast etching, and immutable river ribbons.
- `world-pass.js`: terrain, boundaries, rivers, atmosphere, and selection.
- `network-pass.js`: bounded dynamic vein/tip buffers and event uniforms.
- `shaders*.js`: original GLSL for geography, life, and Memory materials.
- `fallback2d.js`: explicit biomes, rivers, selection, events, and routes.
- `renderer.js`: draw composition and context-loss callback.

Invariants: static world buffers build once per world; snapshots upload only
life/route state; no canvas readback; reduced motion removes pulses; quality
changes DPR/cadence only; analytic picking remains on the documented unit
sphere because visual relief is shallow.
