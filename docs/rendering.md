# Rendering

WebGL2 is primary; Canvas 2D is an honestly maintained cellular fallback. Both
consume immutable world fields/snapshots and share camera/picking cell IDs.

## Four-draw hierarchy

Steady-state WebGL2 submits exactly four draws:

1. mineral-twilight background;
2. one dual-cell surface carrying geography and all dynamic cellular material;
3. quiet closed region/ocean/lake boundaries;
4. atmosphere.

Lakes remain static world data in the same globe draw. Lake depth and shore
status occupy the existing terrain material; lake cells have flat relief and
full-cell depth color. The existing boundary pass emphasizes only shared
lake/ocean cell edges. Canvas uses the same full-cell fills and shared edges;
there is no interior waterway geometry or separate lake draw.

The cell surface expresses living, stressed, critical, frontier, and dead-remain
states by whole-cell fill, inset, edge, roughness, and light response. Events
and crises use the authority's transferred per-cell family/strength bytes; no
shader or Canvas path reconstructs a spherical cap. A selected cell gets a pale material edge.
Adaptations use an authoritative exact-tick weighted arrival field: a 140 ms
origin charge, narrow state/category-sensitive front, and 420 ms trail complete
within 2.2 seconds without normalizing to the whole component. History uploads
an approximate cell checkpoint and primary-cell
highlight. Evolution Globe replaces the world fields with a graphite 642-cell atlas and
explicit locked, unaffordable, affordable, owned, selected, Imprint, and brief
unlock-emphasis materials.

There is no organism route, vein, tip, node-sprite, background-orbit, or
prerequisite-path draw. The deleted passes no longer receive edge, conductance, or flux
snapshot payloads. Presentation snapshots contain four cell arrays totaling
25,620 bytes at level 4, down from 102,426 bytes before the redesign. Static
topology/geography buffers build once; only bounded cell attributes update.
Each world renderer binds the immutable world-session tuple. Replacement first
rejects the retired tuple, zeros life/event/Adaptation buffers, clears selection
and History highlights, clears the full Canvas/WebGL framebuffer, and accepts one
typed `starting` snapshot with zero life before authority startup. Both backends
reject a snapshot whose session or presentation generation does not match.

## Title showcase

The title decodes 89 cell-only frames generated from production seed `20260701`.
Its 22-second nonlinear timeline preserves germination, a 535-cell branched peak,
a recorded loop, environmental pressure, fragmentation, and a blank terminal
beat before reset. Source hash `3f3e9227…` and data hash `22ac0d97…` are checked
by `showcase:check`; no production simulation runs in the title runtime. Hidden
documents freeze its clock and reduced motion holds a mature frame.

## Camera, surfaces, and picking

The camera stores an orthonormal direction/right/up frame, allowing repeated
pole crossings without yaw/pitch clamps. Drag follows the grabbed point;
pinch/wheel zoom is bounded. Analytic offset-aware ray/sphere picking returns
the nearest stable cell. Relief is deliberately shallow, so picking remains on
the documented unit sphere.

Wide-screen scenes reserve a stable left composition column and anchor the
globe at a continuous aspect-derived right bias. Context surfaces use that
negative space and never affect camera offset, basis, or distance. Narrow
screens use a translucent bottom sheet capped near 42% of viewport height
without reframing the globe.
History uses a bottom timeline sheet at all widths. The result is a compact
bottom strip, so the terminal world stays visible. These are nonmodal surfaces:
they neither create a backdrop nor pause authority unless the explicit panel-
pause preference owns a pause lease.

Idle rotation is optional, defaults off, completes a revolution in roughly 55
or 90 seconds, stops on manipulation/selection/surface/hidden document, resumes
after four seconds of true idle, and is effectively disabled by reduced motion.

## Fallback and evidence

Canvas 2D draws the same cellular semantics as polygons. Lakes, shores, and
wetlands are full-cell terrain fills; only existing shared cell boundaries
emphasize water edges. Its world-session reset performs a full-canvas clear;
WebGL2 resets and uploads all three dynamic attribute buffers. WebGL context-loss
teardown removes the exact registered listener and disposal is idempotent.
Organism and skill paths do not exist. The forced-fallback real-Chrome scenario completes a run,
opens visual History, renders the 642-cell Evolution Globe, captures mobile and
desktop evidence, and reports no browser errors.

Current WebGL2 evidence covers 390×844, 430×932, 768×1024, 1024×768,
1440×900, and 1920×1080. The atomic-session run reported four draws and
JavaScript render submission mean 1.17 ms / p95 1.50 ms. It also intercepted
and validated the first zero-life replacement frame; forced Canvas validated the
same contract. These are not GPU timings. Physical-mobile thermal behavior and
actual GPU frame time remain unmeasured.
