# Rendering

WebGL2 is primary; Canvas 2D is an honestly maintained cellular fallback. Both
consume immutable world fields/snapshots and share camera/picking cell IDs.

## Four-draw hierarchy

Steady-state WebGL2 submits exactly four draws:

1. mineral-twilight background;
2. one dual-cell surface carrying geography and all dynamic cellular material;
3. quiet closed region/coast boundaries;
4. atmosphere.

Hydrology remains world and biome data and contributes only subtle cell material;
there is no center-to-downstream line, ribbon, dash, or separate river draw.

The cell surface expresses living, stressed, critical, frontier, and dead-remain
states by whole-cell fill, inset, edge, roughness, and light response. Events
and crises tint affected cells. A selected cell gets a pale material edge.
Adaptations temporarily propagate through direct living neighbors in the same
shader. History uploads an approximate cell checkpoint and primary-cell
highlight. Memory replaces the world fields with a graphite 642-cell atlas and
explicit locked, unaffordable, affordable, owned, selected, Imprint, and brief
unlock-emphasis materials.

There is no organism route, vein, tip, node-sprite, background-orbit, or Memory
path draw. The deleted passes no longer receive edge, conductance, or flux
snapshot payloads. Presentation snapshots contain four cell arrays totaling
25,620 bytes at level 4, down from 102,426 bytes before the redesign. Static
topology/geography buffers build once; only bounded cell attributes update.

## Camera, surfaces, and picking

The camera stores an orthonormal direction/right/up frame, allowing repeated
pole crossings without yaw/pitch clamps. Drag follows the grabbed point;
pinch/wheel zoom is bounded. Analytic offset-aware ray/sphere picking returns
the nearest stable cell. Relief is deliberately shallow, so picking remains on
the documented unit sphere.

Wide-screen context surfaces use a translucent left material and shift/scale the
globe into the remaining safe region. Narrow screens use a translucent bottom
sheet capped near 42% of viewport height and keep the selected region above it.
History uses a bottom timeline sheet at all widths. The result is a compact
bottom strip, so the terminal world stays visible. These are nonmodal surfaces:
they neither create a backdrop nor pause authority unless the explicit panel-
pause preference owns a pause lease.

Idle rotation is optional, defaults off, completes a revolution in roughly 55
or 90 seconds, stops on manipulation/selection/surface/hidden document, resumes
after four seconds of true idle, and is effectively disabled by reduced motion.

## Fallback and evidence

Canvas 2D draws the same cellular semantics as polygons. Rivers are quiet
terrain-cell material rather than center-to-center lines; organism and Memory
paths do not exist. The forced-fallback real-Chrome scenario completes a run,
opens visual History, renders the 642-cell Memory atlas, captures mobile and
desktop evidence, and reports no browser errors.

Current WebGL2 evidence covers 390×844, 430×932, 768×1024, 1024×768,
1440×900, and 1920×1080. It reports four draws and JavaScript render submission
mean 0.07 ms / p95 0.20 ms. These are not GPU timings. Physical-mobile thermal
behavior and actual GPU frame time remain unmeasured.
