# Atmosphere Silhouette Independence v1

Status: terminal. Implementation revision
`c2008ea3b1fa81fb3ac2208ffcb9060dd3f50f0b` is published and verified; no
selected-scope implementation work remains.

## Starting state

- Branch `main` started at `4a5ae0574c882d01250744956327a86b2700c54c`,
  exactly aligned with `origin/main` (`0` ahead / `0` behind).
- Starting user work is the tracked two-line `AGENTS.md` atmosphere rule plus
  the untracked 59,554-byte transfer artifact `docs/work/202608291928.md`
  (`39b29f503ff9fbd401fa48fe172c4f703830354070b41f0c0145ef441aa7cee9`).
  Both are nonconflicting and preserved; the exact transfer path is locally
  excluded from Git discovery so repository structure checks do not mistake it
  for a competing package.
- The work index named no active package. No newer package or four-draw renderer
  contract superseded this objective.
- Node is `v24.18.1`; the maintained local Chrome for Testing build is
  `152.0.7977.64`.
- Historical orientation only: Actions run `33245111135`, Pages job
  `99082912021`, and Pages deployment `6154392448` passed for the starting
  revision. They are not evidence for this change.

## Confirmed root cause and baseline

- Starting `world-pass.js` uploaded gameplay `topo.positions` and
  `topo.triangles` into the atmosphere VAO and drew
  `topo.triangles.length`. The shader expanded that level-4 gameplay shell by
  `1.095`; Canvas already used a topology-independent analytic radial halo.
- An exact detached checkout of the starting revision supplied production
  bytes to the calibrated Chrome fixture. At DPR 1, eight viewports, default
  and maximum zoom, four camera orientations, and three identical repetitions,
  repeat noise was `0 CSS px`. The resulting fixed acceptance thresholds were
  `0.35 CSS px` p95 and `0.75 CSS px` maximum.
- The gameplay level-4 contour measured `0.174 CSS px` p50, `0.613 CSS px` p95,
  and `1.525 CSS px` maximum cross-orientation spread, with no holes or
  disconnected eligible arcs. The source-level defect was visibly measurable.
- Renderer constructions against gameplay levels 2, 3, and 4 changed the
  atmosphere signature (`1743b301`, `dd9e4635`, `dde9c0ad`) and buffer size
  (3,864, 15,384, 61,464 bytes), proving structural topology ownership.
- The largest supported projected atmosphere radius is `1067.101991 CSS px` at
  `768x1024` and maximum zoom (`camera.dist = 1.7`). Portrait maximum-zoom
  framing can crop the entire outer contour; the deterministic bound covers
  those cases while the fixture measures every visible default/max contour arc.
- The current level-4 maximum angular edge is `0.082628124 rad`, giving
  `0.910563 CSS px` conservative sagitta. Midpoint refinement 5 is the first
  deterministic pass: `0.041341239 rad` and `0.227965 CSS px`.
- Official ignored baseline reports and SHA-256 digests are:
  `reports/atmosphere-silhouette-baseline-cohort-{1,2,3}-webgl2.json`
  (16,911/16,926/16,942 bytes;
  `3420edf6b1f6503d2a277ae825f439d55504d9357ff6ef7d54b51c762d3ce258`,
  `bc446af8eedd0b58d73034465c161210d10c1d42ba9e52dfddf4a16e5c4dfab0`,
  `dcd49265f1f502c762b99d2faefe3e7f7fe677fcd5de1ce3ecf2766bbf24cfbe`)
  and
  `reports/atmosphere-silhouette-baseline-cohort-1-canvas2d.json`
  (5,737 bytes;
  `8f35beaa519a6d82682ef6469c441be00dad2766d4fa84df94c59b75ae8e2511`).

## Implemented cutover

- `src/rendering/atmosphere-geometry.js` now creates one module-scoped,
  argument-free refinement-5 unit icosphere. It imports no World code and owns
  only positions, indices, counts, byte metadata, maximum angular edge, and the
  stable signature `atmosphere-v1-l5-5de68f8d`.
- Its exact shape is 10,242 vertices, 20,480 triangles, and 61,440
  `Uint16Array` indices: 122,904 position bytes plus 122,880 index bytes, or
  245,784 CPU and GPU buffer bytes. Against the former level-4 atmosphere this
  is +7,680 vertices, +15,360 triangles, +46,080 indices, and +184,320 bytes.
- `WorldPass` binds that fixed object to the existing atmosphere VAO and draw.
  No atmosphere position, index, index type, count, signature, or quality now
  derives from gameplay topology. The topology-derived predecessor is deleted,
  with no flag, alias, or fallback.
- The shader, atmosphere scale/color/light/entropy/blending/culling/depth/order,
  Canvas analytic halo, renderer composition, camera, picking, simulation,
  protocol, snapshot, progression, reward, History, settings, and persistence
  are unchanged. Existing disposal owns the two replacement buffers, so no
  lifecycle correction or second WebGL path was needed.
- Unit and source-audit gates prove finite unit vertices, valid bounded indices,
  outward nondegenerate winding, exact deterministic counts/signature, the
  supported-envelope sagitta, single module construction, topology-independent
  binding, and absence of the old path.

## Controlled final evidence

- Three same-host Chrome cohorts each report repeat noise `0`, contour p50/p95/
  maximum `0.031/0.308/0.721 CSS px`, no holes or disconnected eligible arcs,
  no over-threshold spike, identical count/bytes/signature for gameplay levels
  2/3/4, exactly four draws, two initialization uploads, zero frame uploads, and
  disposal of all 13 created renderer buffers.
- The final contour passes both calibrated thresholds. It improves baseline p95
  by `1.99x` and maximum by `2.12x`; it does not reach the mandate's aspirational
  fourfold reduction. Refinement 6 was measured and also did not reach fourfold
  (`0.213/0.687 CSS px`) because remaining variation is raster coverage rather
  than topology-scale faceting. The selected smallest passing refinement keeps
  the explicit deterministic and absolute browser criteria without quadrupling
  geometry memory.
- Median-of-three synchronized frame costs are baseline versus final:
  steady p50 `0.800 -> 0.900 ms`, steady p95 `1.000 -> 1.000 ms`, rotating p50
  `0.900 -> 1.200 ms`, and rotating p95 `1.500 -> 1.300 ms`. Cohort ranges
  overlap, neither p95 regresses, and no performance investigation threshold is
  reached. No per-frame allocation, construction, or upload was observed.
- Final WebGL reports
  `reports/atmosphere-silhouette-final-cohort-{1,2,3}-webgl2.json` are
  17,028/16,954/16,948 bytes with SHA-256
  `9f91d0ab0edce9a0da200786efbc2fecca9ddfe96e49cdfccf86cef8362f71ce`,
  `bdd9a13b9246aa4c107d0f527281942bcf7f610c6ddee5ac1c49def4f3400a21`,
  and `e378f91e8000432eabd9ad0a8cdd44708c57331552e338facb2b61537327fe35`.
  Final Canvas report `reports/atmosphere-silhouette-final-canvas2d.json` is
  5,732 bytes with SHA-256
  `79dc07ec30f9d80f84eba06c8d4411aaf58b258d4d03e52742e9c666ae844fe9`;
  it retains zero observed contour variation plus positive calm/pressure response.
- Supplemental 390x844/1440x900 WebGL screenshot hashes are baseline
  `27917172…`/`45612d16…` and final `cf191727…`/`33d698ad…`; Canvas final hashes
  are `3f71b7b3…`/`8ac8bce4…`. Visual review agrees with the quantitative result.
- Focused geometry plus renderer tests pass `25/25`; `audit:cell-visuals` passes
  with fixed-atmosphere ownership and four draws. Baseline `npm run benchmark`
  was `12,151 ticks/s`; the stable local result is `12,123 ticks/s` (`-0.23%`).
  Both report authority hash `471ba1cc`, fresh-profile hash `bec4a764`, terminal
  tick 2,036, finite profiles, and the same maintenance-starvation cause.
- Maintained Worker/WebGL2 and simulation-fallback/WebGL2 scenarios both pass
  with SCORE `192,888`, exactly four draws, all eight responsive layouts,
  pointer/touch drag and zoom, picking/selection, keyboard Inspector and focus
  restoration, History, Evolution, Luminous/zero-charge ordering, reduced
  motion, forced colors, 200% text, and no browser errors. The Worker path also
  passes real WebGL context loss into playable Canvas.
- The full forced-Canvas scenario passes with SCORE `192,888`, analytic
  atmosphere, camera and keyboard behavior, History, Evolution/Trophies,
  Luminous decay, and continuous center/limb coverage. Focused life-boundary
  reports pass in WebGL2 (`4b0fb8f…`) and Canvas (`a38d8b48…`) with zero repeat
  noise and the established edge/resource/stress/selection/History hierarchy.
- `check:links`, `check:structure`, `showcase:check`, fixture syntax,
  `git diff --check`, and focused source/unit gates pass. Structure reports its
  normal maintainability warnings, including the new cohesive 230-line fixture,
  but no hard violation.
- A fresh exact-tree `npm run verify` passes all 26 ordered gates: unit
  `211/211`, integration `72/72`, all deterministic audits/cohorts, balance and
  terminal smokes, showcase, structure, links, and benchmark. Its post-suite
  benchmark is a valid `12,695 ticks/s` with authority hash `471ba1cc`,
  fresh-profile hash `bec4a764`, and unchanged finite profile hashes. An earlier
  broad run on the same stable content also passed at `9,226 ticks/s`; it is
  retained as valid host-variance evidence rather than substituted for the
  later exact-tree receipt.
- A clean-checkout rerun at the committed implementation reports the same
  `0.308/0.721 CSS px` contour p95/maximum and zero repeat noise. Its ignored
  report is
  `reports/atmosphere-silhouette-final-cohort-implementation-webgl2.json`
  (16,986 bytes; SHA-256
  `3541e51c796d63ac61ccabbd83a5fcf5bc9dd26bc2c9e78f3981b3a0cfd99a02`).
  The paired committed Canvas report is 5,748 bytes with SHA-256
  `e9feece789c4915af0384fb907df1c3585dfe3f91708d67889782895e028994e`.

## Failed and superseded evidence

- The first fixture sampled maximum RGB at `2.5/255`, below one stable
  antialias-coverage step. Its `0.890/2.027 CSS px` baseline and level-5/level-6
  trials were rejected as an unstable contour channel, not counted as product
  passes, and retained only as ignored diagnostic reports.
- The contour channel was fixed before final judgment at `32/255`, approximately
  half the expected calm-shell peak, and the exact starting revision was then
  remeasured. Refinement 6 was a rejected sizing experiment, not a shipped path.
- The first deployed contour invocation lacked the explicit local Chrome path
  and exited `77`; the next reached Pages while one resource returned HTTP 503
  and failed its developer-fixture precondition. Neither is a pass. The unchanged
  cache-busted retry passed after Pages returned 200.
- Two attempts to run the entire deployed shell regression failed before a
  product assertion when Chrome stopped answering
  `Emulation.setDeviceMetricsOverride`, once at the ordinary 10-second CDP
  limit and once at 60 seconds. Moving the temporary Chrome profile off the
  nearly full system `/tmp` did not change the failure, disproving profile disk
  location as the cause. These are failed host/browser transport attempts. The
  exact same source already passed that complete maintained scenario locally;
  a smaller deployed public-World smoke supplied the required deployed normal
  product evidence without reclassifying the failures.

## Published evidence

- Implementation commit `c2008ea3b1fa81fb3ac2208ffcb9060dd3f50f0b`
  was normally pushed to `origin/main`. Workflow run `33251258010` passed for
  that exact SHA: verify job `99097206599` completed all gates in `17m29s`, then
  Pages job `99099045537` published deployment `6155561941`; deployment status
  `17497986427` is `success`.
- Cache-busted Pages bytes exactly match the committed affected owners.
  `src/rendering/atmosphere-geometry.js` is 4,046 bytes with SHA-256
  `915ea53d79d067b5ec858bad6ac6151854ecf28de0bafefd37f991b74054540b`;
  `src/rendering/world-pass.js` is 11,042 bytes with SHA-256
  `7436d9508e851a73e358f4d77caf89fefa1caaa22b21a44be7170c3e61f32a96`.
- The cache-busted deployed Chrome 152 contour report is
  `reports/atmosphere-silhouette-final-cohort-deployed-implementation-retry-webgl2.json`
  (20,731 bytes; SHA-256
  `c255e03900fcda345790d7d7dfc7e67f66d7a63c3d68210b6f4f7b3f96be99c2`).
  It names the exact implementation SHA as source and harness, covers all eight
  viewports, both zoom extremes, four orientations, and three identical
  repetitions, and passes with zero repeat noise, contour p50/p95/maximum
  `0.031/0.308/0.721 CSS px`, no holes or spikes, four draws, zero frame
  uploads, equal level-2/3/4 geometry signatures, and no browser errors.
- A focused public-mode deployed World smoke names the exact implementation
  SHA and passes Worker/WebGL2 boot, four draws, active authoritative ticks,
  zero frame errors, drag and wheel response, one canvas, no page overflow, and
  no browser errors. Its ignored JSON is
  `reports/deployed-normal-c2008ea.json` (3,366 bytes; SHA-256
  `fdcf9aaee5c6476e536139d64fa6c1b9f1507b7933719490d88bfd9b1ad2a218`);
  the supplemental 99,133-byte screenshot SHA-256 is
  `8f1a68cf9fcf098be35f3a433f73fb38a3c006297f86d51400b108af4e23a8e2`.

## Evidence not obtained

- Physical-device mouse/touch/pen, high-refresh, thermal, safe-area hardware,
  physical screen-reader, and physical forced-colors evidence is unavailable on
  this host unless the environment changes.

## Exact next coherent step

None. The evidence-closure commit that makes this record terminal must itself be
normally pushed and checked against its exact remote ref, CI, Pages deployment,
and served bytes; those necessarily post-commit facts belong in the final Codex
evidence packet rather than a self-referential follow-up commit.
