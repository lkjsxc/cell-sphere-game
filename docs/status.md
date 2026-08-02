# Status

Truthful handoff after Gate 6: Adaptation propagation through living cells.

- **Starting commit:** `8b1e31b2f3aa7c5026600da9f1d635608ba352ae`.
- **Gate 6 commit:** repository HEAD with subject
  `feat(game): propagate Adaptations through living cells`.
- **Branch:** isolated detached worktree; not pushed.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/> remains
  the earlier release and does not contain this isolated worktree commit.

## Gate 6 implemented

- Every selected Adaptation emits presentation-only `originCell`, stable six-way
  category, and living-component ID metadata. Origin selection consumes no RNG:
  it combines biomass, energy, low stress, component-centroid centrality, and
  local living degree with a stable cell-ID tie break.
- Rendering prepares one direct-living-neighbor BFS per selection with reusable
  `Uint32` queue / `Uint16` distance workspace. Dead and disconnected cells stay
  unreachable. Quantized event distance storage is one byte per world cell.
- WebGL uploads the expanded distance/category cell attribute once per visual
  event. The existing cell shader animates Reach, Metabolism, Resilience,
  Transport, Ecology, and Perception materials from uniforms for 2,000 ms. Draw
  count remains exactly five; no routes, particles, remote jumps, or authority
  effects were added.
- Shader material precedence is selection, Adaptation, event/crisis, life, then
  geography. Canvas 2D has the same bounded cell-only event and reduced-motion
  origin treatment.
- The full visual queue is capped at two events. A third discards the oldest;
  result/world transitions release queued arrays and captions. At level 4 each
  event retains 2,562 bytes, two retain at most 5,124 bytes, reused BFS workspace
  is 15,372 bytes, and the expanded one-time GPU upload is 35,844 bytes.
- Reduced motion uses a 220 ms static origin emphasis without an expanding wave.
  The bottom, nonblocking caption uses canonical card name/effect copy for
  2,500 ms and stacks below context sheets instead of using the generic toast.

## Evidence

- Determinism tests compare origin metadata at chunk sizes 1 and 32, assert every
  origin is living, and compare hash/cause/offers/score/Imprint with visual BFS
  preparation and time queries enabled versus disabled.
- Unit coverage verifies direct adjacency, no dead-cell jump, unreachable
  disconnected life, quantized bounded distance, queue cap/discard, retained
  bytes, reduced-motion static behavior, and timeout release.
- `npm run verify`: structure, 110/110 unit, 12/12 integration, balance smoke,
  benchmark, and link checks pass in 6.12 s.
- Node v22.22.3/Linux x64 benchmark: 2,910 ticks in 162 ms = 17,970 ticks/s;
  deterministic hash remains `98333073`.
- `npm run test:browser:file`: pass in real headless Chrome/WebGL2; 32× run
  reached result in 8.32 s; five draws; title render mean 0.08 ms, p95 0.20 ms.
  It checks caption copy, start/mid/end time progression, queue ≤2, 5,124-byte
  queue ceiling, 220 ms reduced static path, and zero retained result state.
- Browser evidence: `reports/browser-adaptation-wave-start.png` (SHA-256
  `78e7ef51…`), `browser-adaptation-wave-mid.png` (`bc04b1b8…`),
  `browser-adaptation-wave-end.png` (`384b59dc…`), and
  `browser-adaptation-reduced.png` (`230f0bf4…`).

## Honest limitations / next actions

- Canvas fallback is production-implemented and source/unit-covered, but this
  turn did not force Canvas in Chrome for a dedicated screenshot.
- Browser evidence is headless 390×844 emulation, not a physical phone. GPU
  timing, thermal behavior, forced colors, screen-reader review, and 200% zoom
  remain unmeasured.
- Adaptation propagation deliberately does not cross disconnected living
  components; no secondary origin was added because a single clear origin is
  more legible and simpler.
