# Autonomous World Feel v1

## Historical status

Completed historical evidence. The current six-step public speed catalog,
13.5-second Result duration, and two-thirds wide composition supersede this
package's measured three-speed, nine-second, and earlier horizontal-framing
values; see
[`../autonomous-world-contract-closure-v1/README.md`](../autonomous-world-contract-closure-v1/README.md).
The measurements below remain the evidence for the implementation that existed
at that revision and are not current policy.

## Starting point

- Branch: `main`, starting revision `9fa658516ab763394b845c02819652a857a8e55a`, tracking `origin/main` at the same revision.
- Commits after the orientation revision: none.
- Relevant starting worktree: the user-supplied replacement `AGENTS.md` is modified and the full mandate is preserved as untracked `cell-sphere-game-codex-mandate-202608281253.md`.
- Prior package: `ecology-experience-v2` is complete; it is historical evidence, not active work.

## Confirmed root causes

- At the starting revision, public speed meant the raw effective multiplier:
  normal options were `[1, 2, 4, 8]`, settings schema 6 stored that scale, and
  both Worker and fallback multiplied it directly into tick delivery.
- At the starting revision, globe input rotated only during pointer movement;
  release velocity and idle automatic motion had no production owner.
- At the starting revision, World/Home framing came from aspect-dependent
  distance constants rather than a projected-diameter target.
- At the starting revision, Result continuation had one sound nine-second
  authority but projected a changing `Next world in N` visible label.

## Decisions and deviations

- Preserve all simulation, scoring, Evolution, Environment, History, renderer-pass, and draw-count authority.
- Use the mandate's selected speed mapping, camera constants, projected-size targets, and one continuation projection.
- Chrome was absent from the host. Chrome for Testing 152.0.7977.64 and runtime libraries were installed only under the user cache for trusted browser evidence; no shipped dependency was added.
- Pointer velocity uses the PointerEvent monotonic timestamp while idle deadlines
  use observed animation time. This preserves the 120 ms sample contract when a
  busy synchronous fallback delays handler delivery; incompatible legacy epoch
  timestamps fall back to observed time.

## Completed phases

- Baseline repository, upstream, current CI, and deployed-byte reconciliation is complete.
- Baseline focused tests, benchmark, balance smoke, and trusted Worker/WebGL2 browser scenario are complete.
- Structured baseline pacing/layout/interaction/Result evidence is complete.
- Milestone 1 is complete: public speed, settings, Worker/fallback clocks, protocol, cadence, time dial, UI, tests, and browser harness now use one relative-multiplier policy.
- Milestone 2 is complete: one fixed-capacity camera-motion policy owns release inertia, idle orbit, presentation holds, and reduced/hidden behavior; World/Home framing derives from projected diameter.
- Milestone 3 is complete: the existing continuation authority now projects one
  bounded World-cycle ring, non-live exact assistive text, and explicit paused,
  cancelled, disabled, firing, and completed states; Home uses the selected
  autonomous-play copy.

## Focused evidence

- Focused baseline: 61/61 unit and integration tests passed.
- `npm run benchmark`: 12,579 ticks/s, authoritative hash `471ba1cc`, fresh profile hash `bec4a764`.
- `npm run balance:smoke`: fresh median 131.7 game seconds, p25–p75 121.1–137.9; no authority changes made.
- `npm run test:browser:file`: passed with trusted Worker/WebGL2, four draws, Canvas continuity fixture, all required responsive shell viewports, and Result 200% text assertions.
- Baseline report: `reports/autonomous-world-feel-baseline.json` (ignored), SHA-256 `b2bbdeb9ec8b0e5eba555986fb045a7ec151537619f780fb5f20e3d620510b95`; old 1×/2×/4×/8× measured 0.998/2.019/4.037/7.938 game-s per wall-s over eight-second windows.
- Speed cutover focused tests: 40/40 passed, including every constant and mixed public speed through production fallback authority plus Worker/fallback terminal parity.
- Speed cutover trusted Worker/WebGL2 browser scenario passed: public `[0.5, 1, 2]`, developer `[0.25, 0.5, 1, 2, 4, 8, 16, 32, 64]`, effective-8 terminal path, effective-256 diagnostic path, and four draws.
- Camera/framing pure tests passed at 30/60/120 Hz and across 10,000 integration steps; samples stayed at the six-entry cap and the free-orbit frame remained orthonormal.
- Trusted Worker/WebGL2 browser camera scenario passed mouse flick, touch flick, tap, pinch, pointer cancellation, wheel cancellation, surface hold with exposed-canvas drag, focus reset, hidden reset, reduced motion, fresh-World stillness, and Home idle orbit.
- Required viewport projected-diameter ratios are 1.080 at 320×568, 360×640, 390×844, and 430×932; 0.989 at 768×1024; and 0.900 at 844×390, 1024×600, and 1440×900. Every primary control center remained outside the inner 70%, center picking succeeded, and no horizontal overflow occurred.
- Post-camera `npm run test` passed 187 unit and 72 integration tests; benchmark measured 12,768 ticks/s with unchanged `471ba1cc` and `bec4a764` authority hashes.
- Continuation-focused tests and the trusted Worker/WebGL2 browser scenario
  passed static visible copy, exact one-second assistive cadence, bounded trace
  updates, hidden freeze/resume, cancellation, disabled state, reduced motion,
  forced colors, stable footer geometry, 200% text, and unattended one-shot
  replacement.
- Stable-content Worker/WebGL2, synchronous fallback/WebGL2, and forced Canvas
  production scenarios passed. Forced Canvas exposed and then proved the strict
  2.4-rad/s clamp and developer-HUD inner-70% clearance at 320×568.
- Final `npm run test` passed 193 unit and 72 integration tests. The final
  benchmark measured 12,300 ticks/s against the 12,579-tick/s baseline (−2.2%)
  with unchanged authority hashes. Balance smoke retained the 131.7-second
  fresh median and every measured fixture distribution.
- Showcase generation/check, link validation, and repository structure pass;
  structure has maintainability warnings only.
- Final `npm run verify` passed all 26 gates, including 193 unit tests, 72
  integration tests, terminal extinction, balance smoke, benchmark, showcase,
  structure, and link validation.
- An exact-commit fallback run exposed handler-time sample expiry during a
  synthetic touch flick. The input-timestamp repair passed focused queued-event
  tests, the full fallback/WebGL2 scenario (2.204 rad/s release), and forced
  Canvas (strict 2.4 rad/s release).
- Latest remote workflow `31463707001` and Pages deployment `5845430553` succeeded for the starting revision; cache-busted deployed `index.html`, runtime-speed, and identity bytes equal the checkout.

## Evidence not obtained

- Physical mouse, touch, pen, high-refresh display, and physical-device thermal evidence are unavailable on this host.
- Final structured pacing and release evidence was not obtained within this
  historical package; the successor package owns that closure.

## Exact next coherent step

None for this completed package. Continue only through the successor work
package linked above.
