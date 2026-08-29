# Inertial Rotation Regression v1

Status: terminal for the authorized local implementation at
`b5186064112d06c348ac1b9e7f0a27297342ad19`.

## Starting state

- Branch `main` at `bf4ea8ff88a1a1e3007113a5d308b989b691181a`, equal to
  `origin/main` (`0` ahead, `0` behind).
- Tracked worktree clean. The user transfer artifact
  `docs/work/202608291928.md` remains untracked, locally excluded, and preserved
  byte-for-byte (`59,554` bytes; SHA-256
  `39b29f503ff9fbd401fa48fe172c4f703830354070b41f0c0145ef441aa7cee9`).
- No package was active. The terminal atmosphere work did not change camera or
  globe-input sources relative to its starting revision.

## Confirmed root cause and baseline

- The current direct-transfer cutover deleted the progressive release response
  but retained that response's `0.30 rad/s` release threshold. The earlier camera
  policy used `0.08 rad/s`; the retained value creates a presentation dead zone
  more than three times as large after the response curve it supported is gone.
- Fresh Chrome 152 Worker/WebGL2 evidence on the starting revision records a
  deliberate `16.4268 CSS px` (`0.078` projected-radius) drag at
  `0.259740 rad/s` and exactly zero inertial travel. The medium
  `1.411559 rad/s` trace does enter inertia and travels `0.191120` turns, so the
  motion integrator and production input binding are live; the release threshold
  is the narrow contradiction reported by the user.
- Baseline command: `npm run test:browser:file` with the maintained cached Chrome
  runtime and fontconfig sysroot. Receipt:
  `reports/kinetic-sphere-fidelity-v2-final-worker-webgl2.json`, `68,655` bytes,
  SHA-256 `44baa9331f55f7c4ff8eac02b2489679cac9075eb3a493a9fe252f9a1ef8715d`.
- Two earlier browser attempts did not reach camera acceptance: Chrome aborted in
  font discovery and the harness reported a CDP viewport timeout. They are
  environment-start failures, not passes or product failures. Supplying the
  cached fontconfig sysroot produced the passing baseline above.
- Focused unit baseline passes `11/11` camera-motion tests. It intentionally
  enshrines the `0.30 rad/s` dead zone and therefore does not disprove the report.

## Selected correction

- Restore the smallest faithful release threshold to `0.08 rad/s`, retaining
  direct measured-vector transfer, the six-sample/120 ms estimator, natural
  damping, rest threshold, bounded integration, cancellation, and reduced-motion
  suppression unchanged.
- Replace the browser oracle that calls the `0.260 rad/s` drag "slow inspection"
  with two distinct cases: that deliberate drag must carry measurably after
  release, while a genuinely sub-threshold drag must remain precise and still.
- Do not add amplification, saturation, a tuning setting, a second motion owner,
  or any simulation/persistence change.

## Completed phases

- Reconciled branch, upstream, dirty state, package authority, camera/input
  owners, current documentation, and the current local browser path.
- Reproduced the dead zone through the production browser scenario and tied it to
  the retained threshold rather than the atmosphere renderer cutover.
- Restored the `0.08 rad/s` threshold without changing input normalization,
  estimator shape, velocity transfer, damping, cancellation, or lifecycle code.
- Split the browser oracle into a deliberate gentle release and a genuinely
  sub-threshold precision drag across all maintained renderer/authority paths.

## Focused verification

- PASS — `node --test tests/unit/presentation/camera-motion.test.js` (`11/11`).
- PASS — corrected-environment `npm run test:browser:file` on starting content;
  Worker/WebGL2, SCORE `192,888`, four draws, zero browser errors.
- PASS — corrected `npm run test:browser:file`; gentle `0.259740 rad/s`,
  `0.032496` turns, `2,018.2 ms`; precision `0.0499995 rad/s`, zero release
  travel; SCORE `192,888`, four draws, authority unchanged, zero browser errors.
  Receipt `73,246` bytes, SHA-256
  `687a766d9e3de073564ffb4b98d15222ef406406b3c5362453519af1deada6d8`.
- PASS — corrected `npm run test:browser:fallback`; gentle `0.260260 rad/s`,
  `0.032432` turns, `1,989.8 ms`; precision `0.0500621 rad/s`, zero release
  travel; SCORE `192,888`, four draws, authority unchanged, zero browser errors.
  Receipt `73,154` bytes, SHA-256
  `7797ef8d730cab782ba66cc7740a234b79cc6d23f1ed12739bebfb5b4db4a0c6`.
- PASS — corrected `npm run test:browser:canvas`; gentle `0.260000 rad/s`,
  `0.032399` turns, `2,027.8 ms`; precision `0.0499995 rad/s`, zero release
  travel; Canvas remains playable, authority unchanged, zero browser errors.
  Receipt `72,665` bytes, SHA-256
  `2286b4a22b4bebbe63fefbd58735cf22219804f6fd29fe49331dfe7c9fcc3284`.
- PASS — `npm run check:structure`; only existing maintainability warnings.
- PASS — `npm run check:links` (`136` modules, `11` HTML references).
- PASS — `npm run showcase:check`; canonical `30`-frame, `230,904`-byte
  artifact remains current at SHA-256 `a89fdfaf1d181b9c0a61b1a41873ebc6e1336a433c52123aa7db4629a6beb6fd`.
- PASS — `npm run benchmark`; `12,564 ticks/s`, authority hash `471ba1cc`,
  profile hashes `dcc3bafe` / `60bb9841` / `bec4a764`, all complete and finite.
- PASS — fresh `npm run verify` on exact implementation revision
  `b5186064112d06c348ac1b9e7f0a27297342ad19`; all `26/26` gates pass, including
  unit `211/211`, integration `72/72`, and a valid `12,132 ticks/s` benchmark
  with authority hash `471ba1cc` and unchanged profile hashes.
- PASS — implementation diff review: the production change is one presentation
  threshold; tests split gentle carry from precision stopping; documentation
  records D29; no simulation, protocol, renderer, persistence, or setting changed.

## Evidence not obtained

- The user's exact device, pointer hardware, stored motion setting, and physical
  gesture trace are unavailable. Reduced Motion must continue to suppress inertia
  by contract; this package does not relabel that intentional behavior as a bug.
- Remote push, CI, Pages, cache-busted served-byte checks, and deployed-browser
  proof were not run because this request did not authorize publication. No
  external success is claimed.

## Exact next step

If the user authorizes publication, normally push the two coherent local commits
and verify the exact remote ref, CI, Pages deployment, and deployed gentle-release
behavior. Otherwise, none within the authorized local scope.
