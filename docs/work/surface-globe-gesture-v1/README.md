# Surface Globe Gesture v1

Status: terminal local implementation; no external publication was authorized.

## Starting state

- Branch `main` at `55588d9e7508b163fa20a4af69d86b9dbacffd21`, equal to
  `origin/main` (`0` ahead, `0` behind).
- The tracked worktree was clean. Five user transfer artifacts under
  `docs/work/202608*.md` were untracked and are preserved without modification.
- No work package was active before this package. The completed Evolution
  ability-region package is historical evidence and does not own this focused
  presentation interaction correction.

## Confirmed root cause

The shared context shell visually and hit-test-wise covers part of the globe,
especially the compact Evolution detail sheet. `bindGlobeInput` currently binds
pointer, pinch, and wheel listeners only to `#gl-canvas`, so a gesture that
starts in the open detail shell cannot reach the sole camera-input owner.

## Selected correction

Keep one globe-input and camera-motion owner. Give the shared detail shell one
clearly marked, non-control gesture strip and bind that strip as a gesture-only
input proxy. It may rotate or zoom the globe but never inspect, select, or buy a
cell; native detail controls and scroll ownership remain unchanged. Opening a
surface still suppresses release inertia as required by the camera policy.

## Evidence to obtain

- Production-browser reproduction of the blocked compact Evolution detail
  gesture, followed by Worker/WebGL2, fallback/WebGL2, and fallback/Canvas
  regression proof through the strip.
- Focused input ownership, tap suppression, responsive, keyboard, forced-color,
  reduced-motion, and draw-count checks.
- Fresh repository verification after stable final content.

## Completed coherent phase

- Measured the starting revision in a disposable detached worktree with the
  production Evolution browser fixture at `390×844`. A gesture beginning in the
  open `memory-node-panel` had no proxy, `0` camera-direction travel, and no
  wheel or pinch distance change (`5.5 → 5.5 → 5.5`). It retained the selected
  cell and detail, confirming an input-routing defect rather than a transaction
  or camera-motion defect.
- Added one non-focusable 44 CSS px `Drag globe` strip to the physical context
  shell. The retained `bindGlobeInput` owner accepts that strip as a proxy,
  retains native detail focus, owns pointer capture on the originating target,
  and disables tap-to-inspect only for proxy gestures.
- The surface coordinator now recognizes the proxy as intentional gesture
  chrome, preventing its short taps from being interpreted as blank-shell
  dismissal. The slot reserves the strip height, so the native detail footer is
  still hit-testable and inside the shell.
- Moved the production-browser measurement into its own focused fixture module
  to retain the repository's bounded-file rule. It tests compact detail drag,
  wheel, pinch, proxy tap suppression, retained selection/local levels/open
  detail, and the subsequent native Unlock action.

## Focused evidence

- PASS — `npm run test:unit`: `232/232`, including proxy rotation/zoom/tap
  suppression and shared-shell target classification.
- PASS — `npm run check:links`: `144` modules and `11` HTML references.
- PASS — Chrome 152 `npm run test:browser:evolution-cells`: Worker/WebGL2;
  proxy direction travel `0.420832`, camera distance `5.5 → 5.94 → 1.7`, exact
  selection retained, one native purchase accepted, four draws, no browser
  errors. Ignored receipt
  `reports/evolution-ability-regions-v1-final-worker-webgl2.json` (`29,466`
  bytes; SHA-256
  `5d458241d4bee22eb84a86d130812681ad8120615adc3da1b8798d75a42c8a3d`).
- PASS — Chrome 152 `npm run test:browser:evolution-cells:fallback`:
  fallback/WebGL2 with the same proxy and exact-cell checks. Ignored receipt
  `reports/evolution-ability-regions-v1-final-fallback-webgl2.json` (`29,534`
  bytes; SHA-256
  `156f8ce0714b751a16325e842e36db8ee4b334e18e827890a9921b065be9c63c`).
- PASS — Chrome 152 `npm run test:browser:evolution-cells:canvas`:
  fallback/Canvas 2D with the same proxy and exact-cell checks. Ignored receipt
  `reports/evolution-ability-regions-v1-final-fallback-canvas2d.json` (`29,456`
  bytes; SHA-256
  `9259cb08b1321a913cc1d0213efa285276ab51bcd495555ff7e38752a26fc0a4`).
- PASS — `git diff --check`.
- FAILED, not a pass — fresh `npm run verify` at
  `f987efacac321cb974c128e55415b9fd4ceb69ca` passed its other `25/27` gates but
  `check:structure` and `audit:identity` rejected the missing mirror update in
  `.github/README.md`. The implementation, unit/integration, audits, agent
  smoke, balance smoke, benchmark, and links gates all passed. This documented
  mirror correction is the sole follow-up.
- PASS — fresh clean-worktree `npm run verify` at
  `d4bbe836c365282a78c73474e8e2054c351a0ce1`: all `27/27` gates passed in
  `322.329 s`. This includes `232/232` unit tests, `76/76` integration tests,
  production audits, agent and balance smoke, benchmark, link checks, and the
  corrected structure and identity audits.

## Failed iteration

The first proxy browser run rotated and zoomed correctly but a short proxy tap
closed the detail. The document-level shell classifier treated the new sibling
as blank chrome. Classifying `[data-globe-gesture]` explicitly fixed that path;
the failure is not counted as a pass.

## Exact next step

None. The local implementation and its fresh complete verification are closed;
no push is authorized for this request.
