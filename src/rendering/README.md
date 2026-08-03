# src/rendering/

WebGL2 primary renderer with a playable Canvas 2D fallback. Both read immutable
world fields and presentation snapshots; neither can mutate simulation authority.

The renderer issues four steady-state draws: background, dual-cell surface,
quiet/water boundaries, and atmosphere. Lakes, lake shores, and wetlands are
full-cell terrain materials; lake relief is flattened and lake edges use only
shared cell boundaries. Life is never a route, line, or point sprite. Healthy, frontier, stressed, critical,
and dead-remnant states occupy cells; frontier also has a static inset.

Key modules:

- `camera.js`: orthonormal free orbit, zoom, inertia, focus, and picking ray.
- `picking.js`: offset-aware ray/sphere hit and stable nearest cell ID.
- `cell-geometry.js`: dual polygons and closed ocean/lake/interior etching.
- `world-pass.js`: terrain, life, History, Adaptation, Memory, and selection.
- `adaptation-propagation.js`: bounded weighted arrival fields and two-event queue.
- `shaders*.js`: original GLSL for geography and cellular materials.
- `fallback2d.js`: equivalent full-cell lake/ecology semantics without fine geography.
- `renderer.js`: four-draw composition and context-loss callback.

Memory reconfigures the same renderer for a dedicated 642-cell level-3 atlas.
Status, branch, tier, kind, selection, and morphology fossils are cellular;
there are no prerequisite lines or path cells. Static geometry builds once per
world/atlas entry. Snapshot and visual-event uploads are compact per-cell data;
Adaptation motion uses uniforms and adds no draw. There is no canvas readback.
