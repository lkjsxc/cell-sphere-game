# Current status

## Autonomous World Contract Closure v1

- The ordinary native Game speed control exposes exactly 0.25×, 0.5×, 0.75×,
  1×, 1.25×, and 1.5×. One runtime-speed policy maps those values to effective
  game rates 1, 2, 3, 4, 5, and 6. `1×` remains the default and intended normal
  pace. Explicit developer mode adds 2×, 4×, 8×, 16×, 32×, and 64×.
- Settings schema 8 resets mismatched documents to `1×`; it does not migrate
  the retired public 2× value to 1.5× or persist diagnostic values. Worker
  protocol 12 remains current because its generic numeric relative multiplier
  and shared-validation semantics did not change.
- Game time, wall-clock delivery, and animation time remain separate. Every
  authoritative tick executes at every standard and diagnostic speed. Camera
  motion and Result presentation are not multiplied by speed.
- Result has one identity-checked continuation authority with an exact 13,500 ms
  default. The existing nonnumeric ring, ceiling-based assistive seconds, hidden
  pause, trusted cancellation, preference disablement, one-shot firing, and
  fixed manual actions remain projections of that authority.
- World/Home projected diameter remains about 1.08 of the shorter usable canvas
  in portrait, 0.98 near square/tablet, and 0.90 in wide layouts. Portrait stays
  centered; sufficiently wide layouts approach two-thirds of usable width,
  with one continuous transition and shared WebGL2/Canvas picking geometry.
- The existing orthonormal camera, release inertia, 4.5-second idle delay, calm
  Home/World orbit, trusted-interaction resets, reduced motion, zoom bounds,
  autonomous copy, and no-offline-progress contract are unchanged.
- Simulation, Environment, Evolution, SCORE, Echoes, History, Trophies,
  atmosphere, cell-boundary rendering, balance, and the four-draw WebGL2 World
  path are unchanged by this package.

## Current local evidence

- Fifty-six focused policy and integration tests pass, including exact option
  order/conversion, current-only settings reset, all-speed and mixed-speed
  fallback result equality, Worker/fallback parity, exact continuation timing,
  hidden/cancel/disabled states, layout continuity, picking, and camera motion.
- Structured Chrome for Testing 152 reports pass for Worker/WebGL2,
  fallback/WebGL2, and Worker/Canvas 2D. Worker pacing over fresh eight-second
  foreground windows measured 0.998, 1.997, 3.029, 4.045, 4.982, and 5.956 game
  seconds per wall second. Fallback measured 0.997, 1.993, 2.996, 3.977, 4.941,
  and 5.990; Canvas measured 0.999, 1.998, 2.998, 3.997, 4.996, and 5.996.
- Real default continuation elapsed 13,657.8 ms in Worker, 13,667.7 ms in
  fallback, and 13,538.5 ms in Canvas from its authoritative start. All three
  paths also pass hidden pause, trusted cancellation, disabled state, bounded
  ring progress, exact assistive cadence, 200% text, reduced motion, and forced
  colors.
- Home and World measure center ratios 0.500 in portrait; wide ratios are
  0.6667 at 844×390, 0.6665 at 1024×600, and 0.6565 at 1440×900. Corresponding
  left:right ratios are 2.000, 1.999, and 1.912. All eight required viewports
  retain target diameter within 0.01, center picking, bounded controls, and no
  horizontal overflow.
- The full trusted Worker, fallback, and Canvas browser scenarios pass camera
  gestures, queued-input repair, responsive shell, Result actions, History,
  Evolution, Trophies, renderer continuity, and World replacement. WebGL2
  remains at four World draws.
- The stable-suite benchmark measured 12,701 ticks/s versus the 12,768-tick/s
  active-checkout baseline (−0.5%), with unchanged authority hash `471ba1cc` and
  fresh profile hash `bec4a764`. Balance smoke retains the fresh 131.7-second
  median and every fixture distribution.
- Final `npm run verify` passes all 26 gates, including 193 unit tests, 72
  integration tests, production audits, terminal smoke, balance smoke,
  generated-showcase identity, structure, links, and the benchmark.

## External and unavailable evidence

The starting revision `ec02fede…` has successful workflow run `33148901208` and
Pages deployment `6137086894`. The closure content has not yet been pushed, so
those identities are orientation evidence rather than release evidence for this
change. Physical-device mouse, touch, pen, safe-area hardware, high-refresh,
thermal, and physical-screen-reader evidence is unavailable on this host.
