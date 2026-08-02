# Status

Truthful current state. Updated every session.

- **Starting commit (this turn):** `de47194`
- **Playable implementation commit:** `adbe1f0` — `feat(interface): make deterministic runs playable in browser`.
- **Branch / upstream:** `main` tracks `origin/main`. The missing GitHub remote
  reported in the prior session was recreated as a **public** repository at
  <https://github.com/lkjsxc/incremental-network-game>; the existing local
  history was pushed without rewriting it.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/>.
  GitHub Pages is configured for the workflow source and run
  [`30731782437`](https://github.com/lkjsxc/incremental-network-game/actions/runs/30731782437)
  completed successfully for `adbe1f0`. A no-cache Node fetch then received
  HTTP 200 for the public index and `src/interface/app-controller.js`, checking
  the deployed Begin control and production controller text.
- **Contest readiness:** browser Gate D vertical slice is now implemented;
  contest-ready completion is still far away. No physical mobile or GPU run is
  claimed from this container.

## Playable now

- The title globe has one live **ネットワークを始める** action.
- A normal run starts the production Web Worker (or the identical
  `RunController` fallback), displays authoritative Score / Pressure / Reach /
  Signal data, supports pointer drag rotation and tap Signal placement, speed
  1×–32×, pause, visibility pause, and a five-minute simulation arc.
- Production adaptation drafts use an accessible dialog and pause ticks; the
  terminal result shows an authoritative deterministic score, rank, cause,
  breakdown, Echoes, and immediate restart.
- The old `?preview=1` path remains a development visual tool; browser smoke
  now opens the normal `?demo=1` app route.

## Complete and verified

- Structure: 117 files / 18 directories, all within source and directory
  limits and with required READMEs.
- Deterministic simulation remains green; terminal score is now asserted equal
  for identical full production runs.
- `npm run verify` passed on 2026-08-02: 82 unit tests, 7 integration tests,
  balance smoke, benchmark, structure, and link checks.
- Benchmark: 3,396 ticks / 183 ms = **18,517 ticks/s** on Node v22.22.3,
  Linux x64, 20 CPUs; 7 MB heap; stable hash `d02cae0d`.
- Balance smoke still records medians: balanced 361 s, expansion 325.4 s,
  resilience 360.5 s. This misses the 270–330 s median goal for two policies.
- `npm run test:browser` correctly skipped with exit 77: this container's
  Chrome is blocked from opening sockets by seccomp (`ERR_ACCESS_DENIED`).
  This is not a browser/GPU pass.

## Incomplete

- Memory Globe, Imprints, permanent spending, archive, trophies, campaign
  resolution, automation, share card, audio, PWA, save export/import, and
  challenge/world breadth.
- Complete English/Japanese localization, full accessibility audit, real-user
  playtests, physical Android Chrome, GPU, performance, and thermal evidence.
- Required numeric rebaseline: 8 Hz fixed-point simulation; current green
  simulation remains 10 Hz Float32 (documented decision D9).
- Score display is an interim deterministic six-axis projection; calibrate its
  bands and reconcile the final five-axis product specification before claims.

## Next actions (contest impact order)

1. Rebalance pressure so standard median extinction is 270–330 s, then
   rebaseline the planned 8 Hz fixed-point authority in one measured change.
2. Build Memory Globe / Imprints / Echo persistence and the first four-run
   campaign resolution; do not add visible unfinished controls.
3. Complete English and Japanese localization plus keyboard/screen-reader and
   reduced-motion validation for the new run flow.
4. Obtain real desktop GPU and physical Android Chrome / thermal observations;
   retain the current browser-skip limitation until then.
5. Add archive, trophies, worlds, automation, sharing, and PWA only after the
   complete extinction-to-memory loop is present and tested.
