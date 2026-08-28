# Kinetic Sphere Release v1

## Starting state

- Branch: `main`.
- Starting revision: `ecce3c961368b9d1afacfd483964242638af0c57`, equal to
  `origin/main`; this is also the mandate's nonbinding orientation revision.
- Relevant starting changes: the user-supplied companion update to root
  `AGENTS.md`, plus preserved untracked user mandates under `docs/campaigns/`.
- No prior work package was active. The completed autonomous-World and living-
  boundary packages remain terminal evidence.

## Confirmed root causes

- Release velocity currently passes directly through a minimum check and a
  `2.4 rad/s` clamp. With the current `360 ms` half-life and `2,500 ms` hard
  lifetime, the canonical strong trace travels `1.23636 rad` (`0.19677` turns)
  after release at 60 Hz.
- The canonical medium trace produces raw/mapped speed `1.41156 rad/s` and
  travels `0.72542 rad` (`0.11545` turns). The canonical slow inspection trace
  produces `0.26926 rad/s` and still drifts `0.13206 rad` (`0.02102` turns).
- The existing browser assertion samples only a short endpoint displacement;
  it cannot measure travel that wraps around a full turn.
- CDP-generated pointer events previously inherited command-delivery timing.
  Under browser load, equivalent touch and wide-screen fixtures could leave only
  one movement inside the 120 ms release window. The intermittent failure was a
  harness-timestamp defect, not evidence for a wider production sample window.
- The cached Chrome executable is not on `PATH`. The initial discovered-browser
  attempt also blocked because stderr was piped but never drained.

## Selected decisions and deviations

- Keep the existing input sampling, direct manipulation, free-orbit camera,
  analytic exponential integration, lifecycle state machine, and calm idle
  orbit.
- Add one quadratic progressive response in `camera-motion.js` using the
  mandate's unchanged `0.30 / 2.20 / 8.00 / 600 / 0.025 / 5,000` calibration.
- Strengthen the existing browser scenario with bounded cumulative basis travel
  and bounded diagnostics. Drain browser stderr into a bounded diagnostic list
  so the trusted harness can run in the current environment.
- Give trusted CDP flick fixtures explicit monotonic input timestamps. This
  preserves their authored angular trace and independently exercises queued
  handler delivery without changing production input sensitivity.
- Integrate inertia as one simultaneous body-frame angular delta. The existing
  sequential horizontal/vertical primitive made the larger selected release
  exceed the one-degree all-basis cadence bound; no permitted calibration-only
  set satisfied every strong, medium, and cadence band. Direct drag retains the
  original primitive and remains unchanged.
- No calibration deviation was required.

## Completed coherent phases

- Reconciled branch, upstream, worktree, current documentation, source owners,
  tests, workflow, and Pages state.
- Captured pure 30/60/120/144 Hz strong, medium, and slow baselines.
- Captured same-host benchmark baseline: `12,267 ticks/s`, authority hash
  `471ba1cc`, fresh-profile hash `bec4a764`.
- Focused baseline tests pass `33/33`.
- Cut production directly to one progressive response and removed the former
  raw-speed-to-`2.4 rad/s` clamp-only behavior and its old calibration.
- Added pure threshold, monotonicity, direction, saturation, malformed input,
  strong/medium/slow path, absolute bound, 30/60/120/144 Hz, delayed observation,
  lifecycle cancellation, fixed-capacity, and 10,000-step frame tests.
- Replaced the endpoint browser oracle with a bounded pointer-up-to-rest
  cumulative camera-basis trace and added raw/mapped speed receipts.
- Strengthened the existing trusted scenario across mouse, touch, slow drag,
  cancellation sources, reduced motion, idle orbit, and portrait/landscape/wide
  layouts; no parallel harness or product telemetry was added.

## Focused verification

- Current focused command
  `node --test tests/unit/presentation/camera-motion.test.js tests/unit/shell.test.js tests/unit/renderer.test.js`
  — pass, `36/36`.
- Canonical final pure traces at 60 Hz:
  - strong: raw `8.86707`, mapped `8.00000`, `6.90347 rad`
    (`1.09872` turns), `5,000 ms`;
  - medium: raw `1.41156`, mapped `2.73809`, `2.34854 rad`
    (`0.37378` turns), `4,066.67 ms`;
  - slow: raw `0.26926`, mapped `0`, zero post-release travel.
- At 30/60/120/144 Hz, strong travel spans only
  `1.098720766172–1.098720766183` turns; medium spans
  `0.373781654528–0.373792668770` turns. Maximum basis error is
  `2.23e-16`. Observed handler delays of 0/150/350 ms produce identical medium
  raw speed, travel, and duration while shifting only the idle deadline.
- `npm run benchmark` — pass, `12,267 ticks/s`; authority hash `471ba1cc`.
- `npm run test:browser:file` — skipped without Chrome on `PATH`; not a pass.
- Initial cached-Chrome attempts failed before product evidence due to undrained
  stderr/font configuration. Later strengthened attempts exposed endpoint-oracle,
  synthetic-delivery, hidden-transition, and short idle-rate fixture defects;
  each failed attempt remains classified as not a product pass.

## Evidence not obtained

- Pen and physical-device evidence are unavailable on this host.
- Stable final Worker/fallback, WebGL2/Canvas, benchmark, full verification, CI,
  Pages, deployed-byte, and deployed-browser evidence remain pending.

## Exact next coherent step

Finish the stable trusted Worker/WebGL2 run, then run fallback/WebGL2 and
Worker/Canvas, reconcile current status, and execute the fresh final release
verification and authorized publication sequence.
