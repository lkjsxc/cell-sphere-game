# Kinetic Sphere Release v1

Status: active under the explicit `202608290133.md` reaffirmation; exact local
implementation evidence is complete and publication evidence is pending.

## 2026-08-29 reaffirmation record

### Starting state

- Branch `main` at `d85c6f04967c8ea506e5e7e95a5733b1f3a6d810`, equal to
  `origin/main` (`0` ahead, `0` behind). The mandate orientation
  `ecce3c961368b9d1afacfd483964242638af0c57` is an ancestor and is superseded
  by later fidelity, atmosphere, and gentle-inertia work.
- Starting user changes are the supplied root `AGENTS.md` replacement and the
  untracked mandate initially at `docs/work/202608290133.md` (SHA-256
  `efe4a38fd1e8534bc50dbf0a676943dbcaf2cd99f41c45270dfdfe218e4a63ec`).
  The mandate is preserved byte-for-byte outside the canonical planning tree at
  `/home/coder/workspace/cell-sphere-game-preserved/202608290133.md` so the
  repository structure gate does not treat the transfer artifact as a second
  package. No unrelated dirty file was present.
- No package was active. This package was completed historical evidence for an
  earlier bounded-release implementation, then superseded by Kinetic Sphere
  Fidelity v2 and Inertial Rotation Regression v1. The current mandate
  explicitly selects this path and current-only bounded policy again without
  reopening the autonomous-World or living-boundary packages.
- Starting Actions run `33255817603` succeeds for exact starting `HEAD`: verify
  job `99109205821` and Pages job `99110763469` both succeed.

### Confirmed root causes and baseline

- Current input is correctly radius-normalized, immediate, timestamped, and
  fixed-capacity. Current release sampling transfers every above-threshold raw
  vector directly and has no maximum speed or hard lifetime.
- At 60 Hz the canonical traces are: strong raw/mapped `8.8670739 rad/s`,
  `7.6538772 rad` (`1.2181524` turns), `5,083.33 ms`; medium
  `1.4115594 rad/s`, `1.2004401 rad` (`0.1910560` turns), `3,500 ms`; and the
  mandate's slow trace `0.2692582 rad/s`, `0.2116647 rad` (`0.0336875` turns),
  `2,066.67 ms`. A `32 rad/s` release reaches `27.6782748 rad`
  (`4.4051342` turns) over `6,200 ms`.
- The direct-transfer policy therefore already places the canonical strong and
  medium fixtures inside their bands, but fails slow precision, maximum-path,
  maximum-speed, and lifetime requirements. Direct drag scale is not the cause.
- The same traces agree across 30/60/120/144 Hz; medium handler observation at
  0/150/350 ms preserves identical raw speed, path, and duration while moving
  only the idle deadline.
- Focused baseline passes `37/37`. Same-host benchmark baseline is
  `12,145 ticks/s`, authority hash `471ba1cc`, with profile hashes
  `dcc3bafe`, `60bb9841`, and `bec4a764`.
- Corrected cached Chrome 152 Worker/WebGL2 captured mouse/touch strong travel
  `1.2198060/1.2197422` turns, medium `0.1913081`, gentle `0.0325611`, and
  precision `0`, with sample high-water six, basis error at most `4.44e-16`,
  no browser errors, unchanged paused authority fingerprint, and observed idle
  orbit `0.0226931 rad/s`. Ignored receipt
  `reports/kinetic-sphere-fidelity-v2-final-worker-webgl2.json` is `73,202`
  bytes, SHA-256
  `06edf7159feade6f2d7ae92a52ac3ce915dabe7da9f3ec7e28cc884989df28e5`.
- The first configured Chrome launch failed in font discovery. The corrected
  broad run later failed an unrelated rapid Evolution-button assertion after
  writing the passing camera receipt. Neither attempt is a complete broad
  browser pass.

### Selected decisions and deviations

- Restore one quadratic progressive response in the current camera-motion
  owner with `0.30 / 2.20 / 8.00 / 600 / 0.025 / 5,000` calibration.
- Retain the newer projected-radius input mapping, strict timestamp validation,
  simultaneous body-frame rotation, visible foreground debt, lifecycle holds,
  calm idle orbit, renderer work, and all simulation authority unchanged.
- Rename diagnostics to raw and mapped release speed and strengthen the current
  browser receipt back to bounded release classes. No calibration deviation is
  selected from baseline evidence.

### Completed coherent phases

- Reconciled the branch, upstream, worktree, user artifacts, contract, package
  history, camera/input/render owners, tests, browser path, Actions, and Pages.
- Captured pure, benchmark, and trusted Worker/WebGL2 selected-scope baselines.
- Cut the current camera-motion owner directly to one quadratic progressive
  response and hard lifetime while retaining normalized input, strict timestamp
  validation, body-frame integration, foreground debt, lifecycle holds, and
  calm idle orbit.
- Replaced direct-transfer/natural-only unit assertions with threshold,
  monotonicity, direction, saturation, malformed-input, strong/medium/slow,
  extreme-bound, cadence, delayed-observation, debt, cancellation, reduced-
  motion, idle-orbit, and long-run orthonormality evidence.
- Strengthened the existing production browser receipt for raw/mapped speed,
  strong/extreme saturation, medium carry, slow/precision stopping, bounded
  cumulative travel, all existing lifecycle boundaries, normalized input, and
  paused authority. No parallel harness or product trace was added.
- Reconciled current camera documents and retained the later input and atmosphere
  work as current while marking direct-transfer release policy historical.
- Coherent implementation commit
  `5259ba95ea0dbaa0f18177d38d09f8a37c04ca05` contains the companion contract,
  one production cutover, strengthened existing browser oracle, focused tests,
  and current documentation. The exact committed tree was clean for all final
  local browser and verification runs.

### Exact trace evidence

- PASS — pure 60 Hz strong raw/mapped speed is
  `8.867073925/8.000000000 rad/s`, cumulative travel is `6.903466175 rad`
  (`1.098720766` turns), and release duration is `5,000 ms`.
- PASS — pure 60 Hz medium raw/mapped speed is
  `1.411559421/2.738092736 rad/s`, cumulative travel is `2.348539400 rad`
  (`0.373781655` turns), and release duration is `4,066.67 ms`.
- PASS — pure slow raw/mapped speed is `0.269258240/0 rad/s`, with zero release
  duration and travel. Extreme `32 rad/s` input saturates at `8 rad/s` and the
  same `1.098720766`-turn bounded path.
- PASS — at 30/60/120/144 Hz, strong travel spans only
  `1.098720766179–1.098720766183` turns and medium travel spans
  `0.373781654531–0.373792668775` turns. Maximum basis error is `2.23e-16`.
  Equivalent 0/150/350 ms observed-handler delays have identical raw speed,
  mapped speed, path, and duration; only the observed-animation-time idle
  deadline shifts.

### Exact production-browser evidence

- PASS — Chrome `152.0.7977.64` Worker/WebGL2 at exact implementation revision:
  strong mouse/touch `1.098719977/1.098720766` turns, extreme
  `1.098720371`, medium `0.372898201`, and slow/precision zero. Report
  `reports/kinetic-sphere-release-final-worker-webgl2.json` is `72,020` bytes,
  ignored, SHA-256
  `6c0ce029af892d0689fc89896efc1db18cbcaa04eece74437961867e051a1981`.
- PASS — Chrome fallback/WebGL2: strong mouse/touch
  `1.098720766/1.098719977` turns, extreme `1.098720766`, medium
  `0.373845748`, and slow/precision zero. Report
  `reports/kinetic-sphere-release-final-fallback-webgl2.json` is `71,872`
  bytes, ignored, SHA-256
  `769d7b6a6dd509a0f2165a8ac0a0599fae07e8c95b60d6e9f8eea0faaec52a7f`.
- PASS — Chrome Worker/Canvas 2D: strong mouse/touch
  `1.098719977/1.098719977` turns, extreme `1.098719582`, medium
  `0.372832271`, and slow/precision zero. Report
  `reports/kinetic-sphere-release-final-worker-canvas2d.json` is `71,440`
  bytes, ignored, SHA-256
  `95c41d7247f54439daa01173977a1136374a10351e7683d3c8a5ad691f7dd912`.
- PASS — all three exact-revision paths keep sample high-water six, maximum
  basis error `4.44e-16`, raw-equivalent mouse/touch parity, zero browser
  errors, SCORE `192,888`, unchanged paused authority, and four WebGL2 draws.
  Observed idle orbit remains `0.02198–0.02232 rad/s` around the unchanged
  `0.022` policy.
- PASS — the existing broad scenario retains tap, pinch, wheel, pointer cancel,
  pointer-down, keyboard, trusted focus, surface hold/direct drag, programmatic
  focus framing, hidden/visible, reduced-motion, scene/World replacement,
  repeated release/cancel, 200% text, forced colors, portrait `390×844`, wide
  `1440×900`, and small-landscape `844×390` evidence. Direct drag remains
  radius-normalized and immediate; non-tap gestures do not select.
- PASS — six supplemental ignored screenshots cover `844×390` and `1440×900`
  for each path. SHA-256 values are `8518a621…`, `78f2fa93…`, `9ebbd4c4…`,
  `b87eb7e2…`, `d3f1e4e7…`, and `fcefce31…`; screenshots do not decide motion.

### Complete local verification

- PASS — focused camera/shell/renderer command (`37/37`), unit (`211/211`),
  integration (`72/72`), links (`136` modules and `11` HTML references),
  structure, README mirror equality, and `git diff --check`.
- PASS — corrected-browser `npm run audit:autonomous-feel`; all six effective
  game-rate measurements, `13,686.9 ms` Result continuation, and all eight
  projected-globe rows remain inside their established bands.
- PASS — fresh exact-content `npm run verify`; all 26 gates pass. Its loaded
  embedded benchmark is `10,777 ticks/s`, above the `3,000` floor, with
  authority/profile hashes `471ba1cc`, `dcc3bafe`, `60bb9841`, and `bec4a764`.
- PASS — isolated final benchmark is `11,393 ticks/s` versus same-host baseline
  `12,145` (`-6.19%`, below the 10% investigation threshold), again with all
  four hashes unchanged. A preliminary isolated final run measured `12,611`
  (`+3.84%`), identifying ordinary host variance rather than camera-path cost;
  the production response remains constant-time and allocation-free.

### Failed, skipped, and unavailable evidence

- FAILED (baseline harness/environment) — the first configured Chrome launch
  failed font discovery. A corrected pre-cutover broad run later failed an
  unrelated rapid Evolution-button assertion after writing a passing selected
  camera receipt. Neither is a product pass and neither recurs in exact final
  runs.
- SKIPPED — unconfigured browser and autonomous-feel commands exited `77`
  because cached Chrome is not on `PATH`; configured reruns pass and the skips
  remain skips.
- UNAVAILABLE — physical mouse, touch, pen, high-refresh display, safe-area
  hardware, thermal, physical screen-reader, and physical forced-colors proof.
- NOT RUN — publication, final remote equality, CI, Pages, cache-busted deployed
  bytes, and deployed trusted-browser evidence remain pending.

### Exact next coherent step

Commit this exact local evidence, publish normally, verify the exact remote CI
and Pages identities, compare deployed bytes, and exercise the deployed trusted
Worker/WebGL2 path.

---

## Historical 2026-08-28 implementation record

## Starting state

- Branch: `main`.
- Starting revision: `ecce3c961368b9d1afacfd483964242638af0c57`, equal to
  `origin/main`; this is also the mandate's nonbinding orientation revision.
- Relevant starting changes: the user-supplied companion update to root
  `AGENTS.md`, plus preserved untracked user mandates under `docs/campaigns/`.
- No prior work package was active. The completed autonomous-World and living-
  boundary packages remain terminal evidence.

## Confirmed root causes

- At the starting revision, release velocity passed directly through a minimum
  check and a `2.4 rad/s` clamp. With its `360 ms` half-life and `2,500 ms` hard
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
- Implementation commit `ea32b505dd29d51159583ce1e428e7c9b2f52e49`
  contains the complete direct cutover, browser oracle, tests, companion
  contract, and current documentation.

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
- `npm run test:unit` and `npm run test:integration` — pass, `204/204` and
  `72/72`. Links and showcase identity also pass.
- `npm run audit:autonomous-feel` — pass in Chrome 152 with the six expected
  effective pacing rates, 13.681-second observed Result continuation, and all
  eight projected-geometry rows.
- Exact committed tree `5f0a86fb31dbea70c6c966cc82566cb9a55d46f9`
  passes all 26 `npm run verify` gates from a clean checkout: structure,
  identity, 204 unit tests, 72 integration tests, every production audit,
  benchmark, and links. The verifier benchmark measured `12,195 ticks/s` with
  the same four authority/profile hashes. README mirror equality and
  `git diff --check` also pass.
- Final `npm run benchmark` — pass, `12,382 ticks/s`, up `0.9%` from the same-
  host `12,267` baseline. Authority hash `471ba1cc`, fresh hash `bec4a764`,
  breadth hash `dcc3bafe`, and deep-Luminous hash `60bb9841` are unchanged.
- Exact-commit Chrome 152 receipts pass with zero browser errors, basis error at
  most `2.23e-16`, six samples maximum, and unchanged idle rates
  `0.02197–0.02217 rad/s`:
  - Worker/WebGL2: strong mouse/touch `1.098720/1.098720` turns, medium
    `0.385509`, slow `0`; report
    `reports/kinetic-sphere-release-final-worker-webgl2.json`, SHA-256
    `228186000f0a388fb6805cfa01eb88440ef767fc0c9def015b75482aa54d83ee`;
  - fallback/WebGL2: strong mouse/touch `1.098721/1.098720`, medium
    `0.385509`, slow `0`; report
    `reports/kinetic-sphere-release-final-fallback-webgl2.json`, SHA-256
    `805355646b21b5543469c187a0b76cfca840076120aaa5ad1b82635093de0a4b`;
  - Worker/Canvas 2D: strong mouse/touch `1.098720/1.098720`, medium
    `0.387400`, slow `0`; report
    `reports/kinetic-sphere-release-final-worker-canvas2d.json`, SHA-256
    `c92597fed162128ab67ef7f5e222f794c3e13ad2786c1091f910cedb96e32a38`.
- All three production scenarios retain SCORE `192,888`; both WebGL2 scenarios
  retain four draws. Pointer-down, wheel, tap, pinch, cancellation, keyboard,
  focus, scene, World reset, surface, focus framing, hidden/visible, reduced-
  motion, repeated-cycle, portrait, `844×390`, and `1440×900` checks pass.
  Broad 200% text, forced-colors, keyboard Inspector, History, Luminous,
  Evolution, and responsive checks also pass.
- Baseline browser report
  `reports/kinetic-sphere-release-baseline-browser.json` remains ignored at
  SHA-256 `8ca23526d25104809214e12ad0687e8994bb13bd8b3c7339109418c55fd93cff`.
  Final JSON receipts and their six viewport screenshots are also ignored,
  bounded evidence rather than shipped authority.
- `npm run test:browser:file` — skipped without Chrome on `PATH`; not a pass.
- Initial cached-Chrome attempts failed before product evidence due to undrained
  stderr/font configuration. Later strengthened attempts exposed endpoint-oracle,
  synthetic-delivery, hidden-transition, and short idle-rate fixture defects;
  each failed attempt remains classified as not a product pass.

## Published evidence

- Normal push aligned remote `main` with implementation-evidence revision
  `5f0a86fb31dbea70c6c966cc82566cb9a55d46f9`. Workflow run `33205507801`
  completed successfully: verify job `98965399146` passed every gate and Pages
  job `98969704461` published deployment `6147779527`; deployment status
  `17476361841` is successful.
- Cache-busted Pages bytes exactly match the committed copies of
  `camera-motion.js`, `camera.js`, `camera-motion-scenario.mjs`,
  `browser-file-test.mjs`, and the canonical identity owner. Their respective
  SHA-256 values are `a15a725e…`, `9ad9502a…`, `02a6bec0…`, `a33b6af4…`, and
  `c12c844c…` on both sides.
- The deployed Chrome 152 Worker/WebGL2 scenario passes with zero browser
  errors. Strong mouse/touch travel is `1.098720/1.098721` turns, medium is
  `0.386485`, slow is zero, mouse/touch parity error is below `0.000001`, idle
  orbit is `0.021909 rad/s`, basis error is at most `3.34e-16`, sample
  high-water is six, SCORE remains `192,888`, and WebGL remains four draws.
  Its ignored bounded report is
  `reports/kinetic-sphere-release-deployed-worker-webgl2.json`, SHA-256
  `cfbbff0af00c2080b9ff99436bfe8303981a465ec68765e9bd5acce6ebf7be51`.
- The deployed scenario also passes every selected cancellation and lifecycle
  boundary, reduced motion, keyboard Inspector, forced colors, 200% text,
  History, Luminous, portrait, `844×390`, and `1440×900` evidence. Its ignored
  landscape and wide screenshot hashes are `8bad7e53…` and `6e4bfa58…`.
- An attempted deployed-browser launch with a temporary cleanup command was
  rejected by the execution guard before Chrome started. It changed no product
  state and is not a browser pass.

## Evidence not obtained

- Pen and physical-device evidence are unavailable on this host.
- Physical high-refresh, thermal, screen-reader, forced-colors, mouse, and touch
  evidence remain unavailable and are not inferred from emulation.

## Exact next coherent step

None. The selected tactile contract and its local, production-browser, CI,
Pages, byte-identity, and deployed-browser evidence are complete. The final
documentation-only closure revision receives its own exact-revision remote
postcondition checks in the implementation handoff.
