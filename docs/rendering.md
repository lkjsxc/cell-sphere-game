# Rendering

WebGL2 primary renderer; Canvas 2D fallback. The renderer consumes immutable
snapshots and never mutates simulation state.

## Draw passes (target ≤ 8 draw calls/frame)

Current steady-state implementation issues **5** draws (background, globe,
atmosphere, veins, tips). The two network draws live in `network-pass.js`,
with the organism shaders in `shaders-network.js` (split from `shaders.js`,
which holds the world-surface programs, to keep each module under the line
budget). Camera, picking, and instance packing are pure functions and are
unit-tested in Node; the GPU path is exercised by `scripts/browser-test.mjs`
where the environment's sandbox allows Chrome networking — see
`docs/testing.md` for the seccomp skip and `docs/decisions.md` D8.

1. **Background** — fullscreen triangle, procedural gradient + star hash.
2. **Globe** — indexed icosphere (same topology as simulation), per-vertex
   biome attributes; Lambert + rim lighting; entropy desaturation; event
   footprints and signal fields via uniform lists (≤4 events, ≤4 signals).
3. **Atmosphere** — slightly larger back-facing sphere, additive rim.
4. **Veins** — instanced ribbons: per active edge a camera-facing quad
   slightly offset along surface normals; width from conductance; color from
   stress/flux; pulse phase uniform. Avoids GL line-width clamping.
5. **Tips/junctions** — instanced quads for frontier tips and strong nodes.
6. **Extinction/memory overlays** — uniform-driven fade; memory mode recolors
   biological light into persistent violet veins.

Dynamic uploads per snapshot: one compact edge-state buffer (active edges
only: endpoints' positions/normals + width + color) and one small node-state
buffer. No per-frame geometry rebuilds; no canvas readbacks in the loop.

## Shaders

Small original GLSL ES 3.00 shaders, compiled once, uniform locations cached.
Compile/link errors surface through diagnostics and trigger the Canvas
fallback. No shader strings built per frame.

## Camera

Unit-sphere world; view = orbit (yaw/pitch) × zoom. Drag rotates with
optional inertia (settings + reduced-motion aware); pinch/wheel zoom bounded.
Picking: NDC ray → analytic sphere intersection → nearest-node linear scan
(2,562 nodes, negligible per tap). Tap vs drag distinguished by distance and
time thresholds tuned for touch.

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
