# Rendering

WebGL2 primary renderer; Canvas 2D fallback. The renderer consumes immutable
snapshots and never mutates simulation state.

## Draw passes (target ≤ 8 draw calls/frame)

Current steady-state implementation issues **6** draws: background, dual-cell
surface, quiet boundaries, atmosphere, organism routes, and frontier tips.
`world-pass.js` owns the first three world-space passes; `network-pass.js` owns
the two dynamic organism passes. Camera, picking, dual geometry, and instance
packing are unit-tested in Node. `scripts/browser-file-test.mjs` exercises the
WebGL2 path, free-orbit input, extinction, Imprint, Memory purchase, and restart
through real Chrome/CDP when the container blocks same-origin sockets.

1. **Background** — restrained mineral-twilight gradient and one quiet orbit
   trace; no random star field.
2. **Dual cells** — explicit Goldberg-like polygon fans: 2,562 discrete cells,
   mostly hexagons with twelve pentagonal World Knots. Per-cell fields select
   ocean, terrain, stress, life, entropy, and Memory material.
3. **Quiet boundaries** — static raised ribbon quads with stronger fivefold
   World Knot accents and semantic fading.
4. **Atmosphere** — indexed primal sphere enlarged into a cheap additive rim.
5. **Organism routes** — instanced ribbons on each active edge's exact dual
   boundary, not center-to-center floating triangles; width comes from
   conductance and color/phase from stress and flux.
6. **Tips/junctions** — instanced quads for living frontier cells.

Memory mode reuses these passes with graphite cell material and a bounded
strongest-corridor Imprint derived from the just-finished run.

Dynamic uploads per snapshot: one compact edge-state buffer (active edges
only: endpoints' positions/normals + width + color) and one small node-state
buffer. No per-frame geometry rebuilds; no canvas readbacks in the loop.

## Shaders

Small original GLSL ES 3.00 shaders, compiled once, uniform locations cached.
Compile/link errors surface through diagnostics and trigger the Canvas
fallback. No shader strings built per frame.

## Camera

The unit-sphere camera stores an orthonormal direction/right/up frame instead
of yaw/pitch. Screen-axis drag rotates that frame as a grabbed object: a fixed
surface point follows the pointer horizontally and vertically. There are no
pole clamps, so repeated vertical revolutions remain finite and preserve a
stable screen frame. Release inertia uses the same rotation and damping;
reduced motion disables ambient movement. Pinch/wheel zoom remains bounded.

Picking uses NDC ray → analytic sphere intersection → nearest-cell scan (2,562
centres, measured negligible per tap). Projection offsets are included in the
ray. Tap versus drag uses touch-oriented distance and time thresholds.

## Quality modes

Eco (30 FPS target, DPR ≤ 1.25, minimal particles) · Balanced (45–60 FPS,
DPR ≤ 1.5) · Luminous (60 FPS, DPR ≤ 2.0). Auto-select from viewport, DPR,
`hardwareConcurrency`, `deviceMemory`, `saveData`, plus a short frame-time
calibration with hysteresis. Simulation resolution never changes with
quality. Adaptive downshift on sustained missed frames.

## Snapshot cadence and interpolation

Simulation publishes snapshots at ~10 Hz (1×) down to per-batch (Turbo,
10–15 rendered FPS). Renderer exponentially smooths displayed biomass toward
the newest snapshot for visual continuity; canonical state is untouched.
Events and death are never extrapolated.

## Canvas 2D fallback

Orthographic projection of sphere points; shaded disc with biome dots;
veins as stroked lines with conductance-scaled width; back-face culling by
normal·view. Simplified shading, same information, fully playable.

## Share card

Canvas 2D, 1200×630: title + mark, fossil rendered from compact final
edge list, exact Network Score with separators, rank, survival time, peak
coverage, phenotype, seed code, repository identity. Generated locally;
never an online service.
