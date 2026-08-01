# src/rendering/

WebGL2 renderer with a playable Canvas 2D fallback. Reads immutable
snapshots; never mutates simulation state.

| Module | Responsibility |
|---|---|
| `mat4.js` | Minimal column-major matrices: perspective, lookAt, multiply, vector ops. |
| `camera.js` | Orbit camera (yaw/pitch/dist), bounded zoom, inertia, analytic ray construction, unit-sphere intersection. |
| `picking.js` | Pointer → NDC → ray → sphere hit → nearest-node linear scan (2,562 nodes, negligible per tap). |
| `gl-utils.js` | Shader compile/link with error logs, uniform caching, buffer helpers, static uniform-name parser. |
| `shaders.js` | Original GLSL ES 3.00: background stars, biome globe with entropy decay + event/signal fields, atmosphere rim. |
| `shaders-network.js` | Original GLSL ES 3.00: instanced vein ribbons and frontier-tip sprites. |
| `instances.js` | Per-snapshot instance buffer fills (veins, frontier tips) into preallocated arrays; event tint table. |
| `network-pass.js` | `NetworkPass`: owns vein/tip instance payloads, uploads globe event/signal overlays, issues the two instanced draws. |
| `renderer.js` | `GLRenderer`: world-surface programs + VAOs, 5 draw calls/frame, delegates the network to `NetworkPass`, context-loss hook. |
| `fallback2d.js` | `Canvas2DRenderer`: same interface; facing-culled dots/lines, event discs, signal rings. |
| `quality.js` | Eco/Balanced/Luminous profiles, conservative auto-select, frame-time governor with hysteresis. |
| `share-card.js` | 1200×630 share image from run data *(lands with Gate F)*. |

## Invariants

- ≤ ~8 draw calls/frame; one compact dynamic edge upload per snapshot; no
  per-frame geometry rebuilds; no canvas readbacks in the loop.
- Vein width comes from ribbon geometry, never `gl.lineWidth` (clamped on
  many implementations).
- Network geometry is offset +0.007 along normals to avoid z-fighting.
- Pulse/twinkle terms are gated by a `uPulse` uniform so reduced-motion
  needs no recompile.
- Quality modes change DPR/particles/frame cap only — never simulation
  resolution or results.
- Renderer failures throw; callers fall back to Canvas 2D and report it.
