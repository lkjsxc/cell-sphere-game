# Status

Truthful current state. Updated every substantial session.

- **Starting commit (2026-08-02 free-orbit turn):** `ddfcf28`
- **Latest product commit:** `e133c9f` — free two-axis globe orbit and
  morphology-derived Imprints, pushed to `origin/main`.
- **Branch / upstream:** `main` tracks `origin/main`.
- **Protective rebuild tag:** `pre-rebuild-2026-08-02` remains pushed at
  baseline commit `a01a989`.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/>.
  GitHub Actions run `30748071582` completed both `verify` and `pages` for
  `e133c9f`. Cache-busted public fetches returned HTTP 200 and matched the
  free-orbit camera, Imprint module, result markup, and controller integration.

## Playable now

- The title globe responds before play: tap reseeds a bounded organism on real
  adjacency; drag, inertia, wheel, and pinch use the production camera.
- Globe grabbing now follows the pointer horizontally instead of moving in the
  opposite direction. The camera stores an orthonormal direction/right/up
  frame, not clamped yaw/pitch, so vertical drag can pass through either pole
  and continue through repeated complete revolutions without flipping axes.
- The explicit spherical dual remains authoritative for rendering: 2,562
  cells, 7,680 shared boundaries, mostly hexagons, and twelve World Knots.
- The deterministic Worker/fallback run supports Signal, Adaptations, spatial
  crises, pause, 1×–32×, causal extinction, Network Score, and Echo rewards.
- Every completed run now derives a bounded **strongest-corridor Imprint** from
  per-edge peak conductance. The result identifies its boundary count; up to
  eight validated 28-boundary Imprints persist in the versioned local save.
- Entering Memory draws the latest real run corridor on the graphite globe and
  frames it automatically. Purchased Memory filaments remain separate and the
  first purchase still changes the next run to `Signal 4 / 4`.

## Evidence from this turn

- Focused camera/simulation/storage/determinism suite: **32/32 passed**.
  Regression tests prove a fixed grabbed point follows rightward and downward
  drag, and 96 vertical steps complete a full 2π orbit with finite matrices and
  no direction/up drift.
- `npm run verify` passed: structure, **91 unit tests**, **7 integration tests**,
  balance smoke, benchmark, and link/deployment-path checks.
- Benchmark on Node v22.22.3 / Linux x64: 3,396 ticks in 203 ms = **16,712
  ticks/s**, 8 MB reported heap, deterministic hash `6965ed2a`.
- `npm run test:browser:file` passed in real headless Chrome WebGL2 at 390×844:
  a horizontal drag plus a 580 px vertical drag rendered visibly; title tap
  responded; the deterministic 32× run completed in **9.65 s** with score
  704,131 and five drafts; the run Imprint persisted, Memory purchase
  conserved Echoes, and restart showed `Signal 4 / 4`. No browser errors were
  observed.
- Generated git-ignored visual evidence:
  `reports/browser-file-title.png`, `browser-file-title-drag.png`,
  `browser-file-title-tap.png`, and `browser-file-memory.png`. The Memory image
  shows the actual latest corridor centered on the globe.
- A 100-run production-simulation soak completed 306,932 ticks and 2,736 total
  Imprint edges in **22.047 s** with 0 invalid runs. Forced-GC heap moved
  4.12 → 4.86 MB; final RSS was 69.89 MB. This is Node simulation evidence,
  not a browser heap or physical thermal claim.
- Balance smoke remains unchanged: balanced median 361 s, expansion 325.4 s,
  resilience 360.5 s. Balanced and resilience miss the 270–330 s target.

## Incomplete / not claimed

- Imprints are selected automatically as the strongest connected corridor.
  A post-run choice between several morphology artifacts is not implemented.
- The full four-run campaign, **Beyond the Last Cell**, archive, trophies,
  Policies, auto-retry, share cards, audio, PWA, challenges, and broad world
  selection remain incomplete.
- English is coherent across exposed screens, but complete Japanese
  localization and an accessible language switch are not done.
- Canvas 2D uses the free camera frame but still renders the older simplified
  substrate rather than filled dual polygons.
- `npm run test:browser` over a local HTTP socket still exits 77 in this
  container; the CDP-pipe file test is real browser/GPU evidence but not a
  same-origin HTTP browser pass.
- No physical Android, thermal, real-user, screen-reader, 200% text zoom, or
  unrestricted public-URL Chrome visual observation is claimed.
- The simulation remains 10 Hz Float32; 8 Hz remains a target.

## Next actions (contest impact order)

1. Offer two or three truthful terminal Imprints (corridor, loop, surviving
   component) and bind the player's choice into the first four-run continuity
   campaign culminating in **Beyond the Last Cell**.
2. Replace the abrupt result-to-Memory reframe with a state-derived extinction
   transition and improve run morphology/collapse screenshots at all required
   desktop and mobile viewports.
3. Complete English/Japanese switching and keyboard/screen-reader/reduced-motion
   flows, then obtain same-origin Chrome and physical Android thermal evidence.
