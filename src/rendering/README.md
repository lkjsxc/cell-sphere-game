# src/rendering/

WebGL2 primary renderer with a playable Canvas 2D fallback. Both read immutable
world fields and presentation snapshots; neither can mutate simulation authority.

The ordinary world issues five steady-state WebGL2 draws: background, dual-cell
terrain and cellular life material, quiet/coast boundaries, connected drainage
ribbons, and atmosphere. Life is never rendered as a route, line, or point
sprite. Healthy, frontier, stressed, and critical states occupy
whole dual cells; dead detritus gets a separate remnant material, and frontier
uses a static broad inset in addition to color.
Rivers remain cool center-to-downstream geography.

Key modules:

- `camera.js`: orthonormal free-orbit frame, zoom, inertia, focus, picking ray.
- `picking.js`: offset-aware ray/sphere hit and nearest stable cell ID.
- `cell-geometry.js`: dual polygons, coast etching, and immutable river ribbons.
- `world-pass.js`: terrain, cellular life, cell-local events, Adaptation cell
  emphasis, rivers, atmosphere, and selection.
- `adaptation-propagation.js`: one bounded living-neighbor BFS per selection,
  reusable typed-array workspace, and a two-event presentation queue.
- `shaders*.js`: original GLSL for geography and cellular materials.
- `fallback2d.js`: projected dual cells, quiet/coast boundaries, rivers,
  selection, cell-local events, and cellular life states.
- `renderer.js`: five-draw composition and context-loss callback.

Invariants: static world buffers build once per world; snapshots upload only
compact per-cell life state. Adaptations upload one quantized cell-distance /
category field per event and animate with uniforms without adding a sixth draw.
No canvas readback; quality changes DPR/cadence only; analytic picking remains
on the documented unit sphere because visual relief is shallow.
