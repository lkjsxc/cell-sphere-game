# Kinetic Sphere Fidelity v3

Status: active implementation package.

## Starting state

- Branch `main` at `c4ef679e43310a8cde51c4fc1af0a45e6bf8d549`, equal to
  `origin/main` after a fresh fetch (`0` ahead, `0` behind).
- The tracked starting change is the user-supplied companion `AGENTS.md`
  replacement. Its diff changes only the standing camera and shared-surface
  contract from bounded D30 behavior to faithful release and natural damping.
- Seven timestamped transfer artifacts are untracked under `docs/work/`:
  `202608300500.md`, `202608300855.md`, `202608301243.md`,
  `202608302226.md`, `202608311044.md`, `202608312102.md`, and
  `202609010214.md`. They are preserved byte-for-byte in place as user work and
  excluded from campaign commits. The final file is this campaign's transfer
  artifact; it is not a second planning authority.
- No local commit is ahead of upstream and no local-only camera controller,
  setting, timer, event path, or other attributable Terra residue exists.
  Recent upstream Evolution graph-cut, connected-region, substrate, exact-cell,
  and shared detail-shell gesture work is authorized and retained.
- Starting Actions run `33403906768` succeeds for the exact starting revision:
  verify job `99526621074`, Pages job `99530957242`, deployment `6183508899`,
  and deployment status `17574042795` all succeed.

## Confirmed root causes

- `camera-motion.js` uses a `0.30 rad/s` dead zone, quadratic response,
  `8 rad/s` saturation, and `5,000 ms` lifetime instead of faithful measured-
  vector transfer and natural termination.
- Release and frame advance both reject `surfaceOpen`, so the maintained shared
  detail-shell route rotates only while held and cannot carry after release.
- The projected-radius input owner, six-sample/120 ms estimator, free-orbit
  frame, elapsed-time damping, bounded foreground debt, lifecycle cancellation,
  and shared gesture routing remain suitable and will be retained.

## Selected decisions and deviations

- Restore the `0.08 rad/s` precision threshold and transfer each finite
  qualifying vector component directly in the existing camera-motion owner.
- Delete the response curve, input knee, output ceiling, duplicate mapped-speed
  diagnostic, and fixed inertia lifetime. Natural damping to `0.025 rad/s`
  owns rest.
- Permit newly released inertia while a nonmodal surface remains open; keep
  automatic orbit held there and return natural rest to `held`.
- No deviation from the mandate is selected.

## Completed coherent phases

- Reconciled branch, upstream, dirty state, active-package authority, companion
  contract, relevant predecessor packages, source/test owners, current CI, and
  the maintained README mirror rule.
- Classified all starting differences without deleting or rewriting user work.
- Captured the predecessor pure traces, trusted Worker/WebGL2 camera receipt,
  focused Evolution detail-shell receipt, and same-host benchmark.
- Cut the sole production camera-motion owner over to the `0.08 rad/s`
  inclusive threshold, exact measured-vector transfer, natural damping, and
  surface-active inertia. Deleted D30's mapper, input knee, output cap,
  mapped-speed duplicate, fixed lifetime, release veto, and frame-advance veto.
- Replaced predecessor pure assertions with exact vector identity, controlled
  precision-through-extreme classes, analytic/cadence/delay agreement, natural
  multi-turn rest, bounded debt/storage, lifecycle cancellation, and open-
  surface rest-state evidence. D37 explicitly supersedes D30.

## Focused verification

- PASS — starting focused camera/state command: `24/24`.
- PASS — starting benchmark: `12,338 ticks/s`, authority hash `15863d52`,
  fixed-trace hash `e32ad0ff`, and valid bounded profiles.
- PASS — exact controlled 60 Hz predecessor speeds `0.05 / 0.08 / 0.26 /
  1.411559421 / 8.867073925 / 16 / 32 rad/s` store respectively `0 / 0 / 0 /
  2.738092734 / 8 / 8 / 8 rad/s`. Travel is `0 / 0 / 0 / 0.373781654 /
  1.098720766 / 1.098720766 / 1.098720766` turns; nonzero durations are
  `4,066.67 / 5,000 / 5,000 / 5,000 ms`.
- PASS — Chrome 152 Worker/WebGL2 starting camera receipt reproduces strong and
  faster input at `8.867073464 / 16.135324119 rad/s`, both stored at `8`, both
  travelling `1.09872` turns. `0.259740317 rad/s` gentle and
  `0.049999523 rad/s` precision releases both carry zero. Open World detail
  release is `held` at zero. Paused authority remains tick `16`, hash
  `4780e0b3`, with identical World identity; draw count and renderer semantics
  are unchanged and browser errors are zero. Ignored report
  `reports/kinetic-sphere-release-final-worker-webgl2.json` is `74,637` bytes,
  SHA-256 `3f537b8a…`.
- PASS — focused Chrome 152 Worker/WebGL2 Evolution detail route retains cell
  `578`, exact levels, overlay, proxy hit target, native 44 px action, and four
  draws while rotating directly by `0.420832`. The predecessor fixture does not
  measure post-release carry, confirming the browser-proof gap. Ignored report
  SHA-256 is `a1d5f6a2…`.
- FAILED (unrelated broad baseline) — after the camera receipt passed, the broad
  scenario rejected a pre-existing `1024×600` Result-action rectangle extending
  `0.1875 px` beyond the viewport. It is not a camera pass or product failure
  for this campaign.
- FAILED (environment start) — the first cached-Chrome launch lacked its cached
  runtime library path and never reached the app. The configured rerun above
  supersedes it for camera evidence.
- PASS — current focused camera/state command: `25/25`. Exact component
  identity error is at most `1e-12` through `32 rad/s`; sample high-water is
  six; the open-surface pure trace advances inertia and naturally returns to
  `held` without automatic orbit.
- PASS — controlled 60 Hz current travel/duration is: precision `0/0`, gentle
  `0.032399984 turns / 2,033.33 ms`, medium `0.191055982 / 3,500 ms`, strong
  `1.218152397 / 5,083.33 ms`, faster `2.200858592 / 5,600 ms`, and extreme
  `4.405134245 / 6,200 ms`. Measured and stored speeds are identical at
  `0.26 / 1.411559421 / 8.867073925 / 16 / 32 rad/s`; precision measures
  `0.05` and stores zero.
- PASS — 30/60/120/144 Hz current travel spans respectively: gentle
  `0.032377967–0.032399984`, medium `0.191022989–0.191055982`, strong
  `1.218152397–1.218217994`, faster `2.200847609–2.200858592`, and extreme
  `4.405112244–4.405134245` turns. Durations stay within one 30 Hz frame of the
  analytic reference. Medium observation delays `0/150/350 ms` preserve the
  exact vector, `0.191055982` turns, and `3,500 ms` duration.

## Evidence not obtained

- Physical mouse, touch, pen, high-refresh, thermal, safe-area hardware,
  physical screen-reader, and physical forced-colors evidence are unavailable
  on this host unless later evidence proves otherwise.

## Exact next coherent step

Replace the D30 browser oracle and prove trusted canvas and shared-shell release
through the maintained Worker/fallback and WebGL2/Canvas paths.
