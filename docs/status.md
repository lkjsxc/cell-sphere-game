# Current status

## Kinetic Sphere Fidelity v2

- One input owner freezes the projected sphere radius in CSS pixels at
  pointerdown. Both axes use the same `delta / radius` mapping, and the exact
  immediately applied angular delta enters the fixed six-sample/120 ms release
  estimator.
- Every finite valid release above `0.30 rad/s` transfers its measured vector
  directly. The former response curve, `8 rad/s` ceiling, duplicate mapped-speed
  diagnostic, and five-second lifetime are deleted. A `600 ms` half-life and
  `0.025 rad/s` rest threshold dissipate finite motion naturally; lifecycle and
  trusted-interaction cancellation remain immediate.
- Pure references pass exact identity transfer through `32 rad/s`. That release
  remains active after five seconds, rests near `6,193.16 ms`, and travels about
  `4.40511` turns. The `8.86707 rad/s` reference rests near `5,082.23 ms` after
  about `1.21815` turns. Paths agree across 30/60/120/144 Hz and handler delays
  of 0/150/350 ms.
- Chrome 152 Worker/WebGL2, fallback/WebGL2, and Worker/Canvas 2D preliminary
  receipts pass. One-radius direct paths across all eight viewports are
  `0.99999996–1.00000017 rad`; post-wheel zoom and mid-gesture resize paths also
  remain one radian. Strong, faster, medium, and slow measured releases are
  approximately `8.867`, `16.16`, `1.412`, and `0.260 rad/s`, producing about
  `1.218`, `2.223`, `0.191`, and zero release turns. Mouse/touch parity differs
  by at most `0.13%`, basis error is below `4.5e-16`, sample high-water is six,
  SCORE remains `192,888`, both WebGL2 runs retain four draws, and browser errors
  are zero.
- The paused authoritative snapshot fingerprint and tick remain unchanged across
  every camera gesture in all three browser paths. Unit tests pass `207/207`,
  integration tests pass `72/72`, and the restored structure gate passes.
- One fresh `npm run verify` passes all 26 gates on stable implementation
  content. Its benchmark is `12,454 ticks/s` with unchanged authority/profile
  hashes; the separately isolated final benchmark is `12,351 ticks/s` versus
  the `12,323` predecessor baseline (`+0.23%`).
- Simulation, Worker protocol, World identity, renderer semantics, game time,
  Environment, Evolution, History, SCORE, Echoes, settings, persistence, and
  balance are unchanged. Exact committed browser receipts, CI, Pages, deployed
  bytes, and deployed-browser evidence remain pending.
- Pen and physical-device mouse, touch, high-refresh, thermal, screen-reader,
  forced-colors, and safe-area evidence remain unavailable; emulated evidence is
  not classified as physical.

## Living Boundary Semantics v1 (retained)

- Implementation commits `d55addf` and `b9a2f8a` establish one pure
  renderer-semantic owner for ordinary World life on canonical topology edges
  and atomically cut WebGL2 and Canvas 2D over to it.
- Critical outranks stress, which outranks active living/frontier, which outranks
  residual remains. Adjacency independently classifies active edges as quiet
  internal or stronger exposed frontier. One byte represents one edge.
- WebGL2 uploads a reusable 7,680-byte canonical buffer and a 30,720-byte
  four-vertex attribute to the existing boundary pass only when an accepted
  snapshot changes. Canvas reuses the same canonical buffer and eight fixed
  typed style batches. WebGL remains four draws.
- Ordinary living/frontier whole-cell tint, inset fill, and dark-side emission
  are deleted. Stress, critical state, and remains retain restrained subordinate
  interior support. Biome, resources, transformations, coast/lake geography,
  selection, History, and authoritative whole-cell Luminous charge remain
  independent.
- Simulation, RNG, snapshot shape, Worker protocol, World identity, History
  codec, settings, persistence, Environment, Evolution, SCORE, Echoes, camera,
  speed, Result, and balance are unchanged.

## Current local evidence

- All 36 life-state endpoint pairs and reversals pass deterministic symmetry,
  precedence, relation, malformed-input, stable-edge-order, one-byte bound, and
  four-vertex expansion tests. The affected life-edge and renderer set is 26/26.
- `audit:cell-visuals` requires both production consumers and rejects restoration
  of ordinary-life interior authority while retaining whole-cell geography and
  four draws. `audit:luminous` preserves the zero-charge and charged hierarchy.
- Chrome for Testing 152 controlled reports pass in production WebGL2 and forced
  Canvas with three exact renders per input, zero observed repeat noise, and a
  normalized `0.004` threshold. Ordinary interior delta is zero, occupied
  resource contrast retains 100%, exposed frontier is more than 9× internal
  edge salience, and every severe/remains, non-color urgency, Luminous,
  selection, History, transformation, geography-overlap, near/far/limb, and
  production textual-Inspector check passes. The reports are
  `999e9ac1…` (WebGL2) and `c46642a0…` (Canvas).
- Three matched starting/final cohorts show median WebGL steady/update p95 of
  1.2/2.0 ms versus 1.3/1.6 ms, and Canvas 1.9/2.3 ms versus 1.6/1.7 ms. The
  accepted-snapshot increase is bounded `O(edgeCount)` projection/batching and
  remains well inside the frame budget; one Canvas cohort was a documented host
  outlier.
- Fresh final-content Worker/WebGL2, fallback/WebGL2, and Worker/Canvas
  scenarios pass with the same realized score 192,888, keyboard Inspector entry
  and focus restoration, History, Luminous, selection, eight responsive
  layouts, 200% text, reduced motion, forced colors, release motion, and
  continuous center/limb coverage. Both WebGL runs retain four draws and title
  mean/p95 is `1.01/1.40 ms` for Worker and `1.03/1.40 ms` for fallback; the
  Worker run passes real context loss into Canvas. Real Tab entry, a system-
  color canvas focus outline, populated Inspector text, Escape, and focus
  restoration pass under forced colors in all three combinations.
- Exact committed tree `e3db4aa8f24aade98c30e5c81d1540815ba13f63`
  passes all 26 `npm run verify` gates: 201 unit tests, 72 integration tests,
  structure, links, showcase identity, every production audit, and benchmark.
  Benchmark is 13,123 ticks/s with unchanged authority hash `471ba1cc` and
  fresh-profile hash `bec4a764`. README mirror equality and `git diff --check`
  also pass. Active-workspace `check:structure` fails solely on the preserved
  untracked user mandate under `docs/campaigns/`; that failure is not a pass and
  the user artifact remains untouched.

## External and unavailable evidence

- Published implementation revision
  `7f4c25913caf2ccda46beccd905821fefc2de9fd` is aligned on remote `main`.
  Workflow run `33178892928` passed all gates in verify job `98874659899`, then
  Pages job `98879669340` published deployment `6142915509`; deployment status
  `17463962115` is successful.
- Cache-busted Pages bytes exactly match all eight changed production owners.
  Deployed WebGL2 and Canvas controlled reports (`3e3aee75…` and `e33ffe69…`)
  pass every life-edge inequality with zero repeat noise at threshold `0.004`.
  Their steady/update p95 is `1.5/2.0 ms` and `1.6/2.7 ms` respectively.
- A first deployed browser attempt encountered a transient HTTP 503 and is not
  a pass. Two subsequent broad shell attempts reached a live World but failed
  the old timing-sensitive touch-release camera assertion; they remain failed
  historical attempts. D26 supersedes that fixture with authored input timing
  and cumulative travel rather than reclassifying either attempt as a pass.
- Physical-device mouse, touch, pen, safe-area hardware, high-refresh, thermal,
  physical-screen-reader, and physical forced-colors evidence is unavailable on
  this host.
