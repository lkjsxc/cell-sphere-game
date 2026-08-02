# Status

Truthful current state. Updated every substantial session.

- **Starting commit (2026-08-02 rebuild turn):** `a01a989`
- **Latest product commit:** `10d8d47` — complete dual-cell visual rebuild and
  first extinction-to-memory transaction, pushed to `origin/main`.
- **Supporting commit:** `7fbba68` — explicit spherical dual mesh and renderer.
- **Protective baseline tag:** `pre-rebuild-2026-08-02` points to `a01a989` and
  is pushed to origin.
- **Branch / upstream:** `main` tracks `origin/main`.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/>.
  GitHub Actions run `30747205702` completed successfully for `10d8d47`.
  Cache-busted public fetches returned HTTP 200 and matched unique rebuild text
  in `index.html`, `dual-mesh.js`, `memory.js`, and `app-controller.js`.

## Playable now

- The title is already a real interaction: drag/inertia, wheel, pinch, and tap
  work before starting. Tap reseeds a bounded cosmetic organism that grows on
  real world adjacency and never affects score or saves.
- The planet is an explicit dual of the level-4 geodesic graph: 2,562 discrete
  cells, 7,680 shared boundaries, mostly hexagons, and exactly twelve warm
  pentagonal World Knots. Ocean/land material is procedural and cell-discrete.
- Living transport occupies canonical shared boundaries rather than unrelated
  floating triangular ribbons. Cell life/stress, spatial events, Signals,
  atmosphere, and entropy all feed the render state.
- The production deterministic run remains playable through Worker or the
  same `RunController` fallback: Signal, five adaptation drafts in the demo
  seed, crises, 1×–32×, pause, extinction cause, score, and Echo reward.
- Result now enters a functioning graphite **Memory Globe**. The first run can
  purchase **First Trace** for 2 Echoes; the filament persists in the versioned
  save and the next run visibly starts with `Signal 4 / 4`.
- Six bounded Memory nodes form an initial prerequisite graph. This is a real
  progression path, but not yet the complete campaign tree.

## Evidence from this turn

- `npm run verify` passed after the rebuild: structure, **89 unit tests**,
  **7 integration tests**, balance smoke, benchmark, and link/path checks.
- Benchmark on Node v22.22.3 / Linux x64: 3,396 ticks in 205 ms = **16,572
  ticks/s**, 7 MB reported heap, stable hash `d02cae0d`.
- `npm run test:browser:file` passed in real headless Chrome WebGL2 through CDP
  pipe at 390×844: title tap changed the rendered PNG; a 32× run completed in
  **9.65 s**, score 704,131, five drafts, Memory purchase, persisted filament,
  and next-run `Signal 4 / 4`; no browser errors were observed.
- A separate 1440×900 Chrome/WebGL2 CDP capture booted with no observed
  exceptions. Generated evidence is git-ignored under `reports/`:
  `browser-file-title.png`, `browser-file-title-tap.png`,
  `browser-file-memory.png`, and `browser-file-title-desktop.png`.
- `npm run test:browser` still exits **77** honestly because this container
  blocks Chrome network sockets (`ERR_ACCESS_DENIED`). The socket-free test is
  strong browser/GPU evidence but not a same-origin HTTP or public Pages test.
- A 100-run sequential production-simulation soak completed 306,932 ticks in
  18.015 s with 0 invalid runs. Forced-GC heap moved 4.77 → 4.83 MB; final RSS
  was 66.52 MB. This is Node simulation evidence, not a browser heap claim.
- Balance smoke medians remain: balanced 361 s, expansion 325.4 s, resilience
  360.5 s. Balanced and resilience still miss the 270–330 s target.

## Incomplete / not claimed

- The full four-run campaign, **Beyond the Last Cell**, Imprints, archive,
  trophies, Policies, auto-retry, sharing, audio, PWA, challenges, and broad
  world/strain selection are not implemented.
- English is now coherent across the exposed title/result/memory and current
  Adaptation drafts, but complete Japanese localization and an accessible
  language switch are not done.
- Memory currently preserves authored prerequisite filaments, not a selected
  morphology-derived Imprint from the just-finished run.
- The WebGL2 primary path has the new dual-cell art direction. Canvas 2D remains
  playable but still uses the older simplified dot/speckle substrate.
- No physical phone, thermal, real-user, screen-reader, 200% text zoom, or
  unrestricted public-URL Chrome visual observation is claimed. Public
  deployment bytes were verified with cache-busted Node fetches only.
- The authoritative simulation remains 10 Hz Float32; the 8 Hz rebaseline is a
  target, not an implementation claim.

## Next actions (contest impact order)

1. Derive a compact Imprint from the terminal morphology and carry that exact
   state into Memory; expand the six-node path into the tested four-run
   **Beyond the Last Cell** campaign.
2. Make run morphology less locally dense and improve collapse/Memory visual
   transitions, then capture abundance, crisis, collapse, and result at the
   four required viewports.
3. Complete English/Japanese switching and keyboard/screen-reader/reduced-motion
   flows, then obtain same-origin/public Pages Chrome and physical Android
   performance/thermal evidence.
