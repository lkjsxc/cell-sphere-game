# Planetary Sky Composition v2

Status: terminal local implementation evidence.

Current visual calibration is superseded by
[`../orbital-starfield-fidelity-v1/`](../orbital-starfield-fidelity-v1/).
This package remains historical evidence only; its broad chromatic field and
`124/210/300` star totals are not present-tense product authority.

## Starting state

- Branch `main` began at `f22cb34a8dfcd268adaa0dade2bdbc045eb0e384`,
  exactly aligned with `origin/main` (`0` ahead / `0` behind). The configured
  fetch/push remote is `https://github.com/lkjsxc/cell-sphere-game`.
- Starting tracked user work is the 61,702-byte root `AGENTS.md` replacement.
  Its changes are the durable Balanced-quality, layered-sky, directional-cloud,
  visual-iteration, and deferred activity-aware-camera contract for this work.
- The 68,420-byte untracked transfer artifact is
  `docs/work/202609030029.md`, SHA-256
  `f23858275e6417982e95f6803318630fa63fb5966906173243b3f4cdf505e1f8`.
  It remains byte-for-byte untouched, is excluded only by that exact path in
  `.git/info/exclude`, and is not canonical or part of campaign commits.
- No package was active. The starting exact-revision Actions run
  `33630445223` passed both `verify` (`100248274415`) and Pages
  (`100251573054`); GitHub Pages deployment `6222590754` targets the starting
  revision. This is orientation evidence, not v2 completion evidence.
- Node is `v24.18.1`; the local maintained browser is Chrome for Testing
  `152.0.7977.64` through the cached library and font sysroot.

## Confirmed causes and selected decisions

- Fresh settings persist public `quality: "auto"`; invalid current-schema
  quality also falls back to `auto`. Automatic often resolves to Balanced, but
  that does not satisfy an explicit fresh Balanced preference.
- The WebGL background is a plain dark gradient plus one jittered `20×12`
  single-tint procedural point grid. Canvas draws one same-tint square-point
  catalog. Neither backend has broad chromatic deep-space structure.
- The shared `128×64` cloud field is equirectangular. WebGL adds
  `uCloudPhase` to longitude, and Canvas caches the same `u/v` longitude
  translation, exposing one fixed axis and special poles.
- Existing four-draw composition, one eligible foreground clock, fixed resource
  lifecycles, shooting schedule, cross-backend semantic projection, material
  order, context-loss transfer, and simulation authority remain the foundation.
- Selected first candidates are a deterministic `256×128` compact RGB
  deep-space field and one six-face `64×64` single-channel directional cloud
  field. Larger allowed sizes will be used only if controlled frames expose
  resampling or face artifacts.
- Automatic-camera activity targeting remains explicitly deferred and receives
  no setting, target projection, hook, or scaffold in this package.

## Baseline evidence

- PASSED — focused settings/celestial/renderer unit tests: `15/15`.
- PASSED — cell visual audit: four draws, shared current cloud field, and zero
  violations.
- PASSED — benchmark: `11,900 ticks/s`, authority hash `15863d52`, fixed trace
  `e32ad0ff` (median fixed-trace `10,518 ticks/s`).
- PASSED — Worker/WebGL2 planetary sky: full/empty p95 `2.0/2.0 ms`, report
  SHA-256 `26a2cc00317ff74870b167d038b4b39a28b8ee0981816aec830d288deb52fa99`.
- PASSED — fallback/WebGL2: full/empty p95 `2.1/2.0 ms`, report SHA-256
  `bd68a13d37fdf07b62a27601397d2ccf4b52bbca105a8228c5a69bad1f301062`.
- PASSED — fallback/Canvas: full/empty p95 `2.1/3.3 ms`, report SHA-256
  `562ce62597b2ec9724adfcea0c2c82c3045d7514135220c16ceae2aa8172f00b`.
- All three paths use cloud signature `bf4ca35f`, 8,192 cloud bytes, 72
  Balanced-effective stars, and the same authority. Worker context loss
  transfers the exact projection to playable Canvas; WebGL remains four draws.
- The baseline numeric star oracle changes only 24 Canvas or 28 WebGL sampled
  outside-globe pixels. Controlled frames visibly confirm large nearly empty
  black areas, one cool point treatment, and no broad galactic/nebular layer.
- Baseline path reports and twelve source screenshots are under
  `reports/planetary-sky-composition-v2/baseline/`. The `1460×1220`, 741,107-byte
  contact sheet is `baseline/contact-sheet.png`, SHA-256
  `b05f9c14d2f374c7d1b1d47bd93d944cbc0479791c2de5675ad5a2537fffcd1e`.
- FAILED — the first browser command had no configured Chrome path and exited
  `77`; this is unavailable environment discovery, not a product pass.
- FAILED — the first two cached-Chrome attempts omitted `FONTCONFIG_SYSROOT`;
  one stopped during keyboard dispatch and forced Canvas exposed a fatal
  Fontconfig error. Restoring the cached sysroot produced the three passing
  baselines above; the failed attempts are not counted as passes.

## Completed coherent phases

- Reconciled active checkout, contract, transfer artifact, upstream, starting
  external state, source owners, tests, audits, and current documentation.
- Captured and inspected comparable starting browser frames, numeric/resource
  reports, context loss, timing, and authoritative benchmark evidence.
- Cut fresh and invalid Quality directly to public Balanced without changing
  schema `8`; unit and browser reload checks preserve every valid stored quality
  value and the independent Motion, Contrast, Auto-continue, and speed fields.
- Replaced the point-only background with one deterministic `256×128×3`
  (98,304-byte) generated field, signature `afe9c9db` for browser sky seed
  `1851429315`, and three fixed faint/bright/anchor strata. Balanced uses
  `160/42/8` stars, Eco `96/24/4`, and High `224/64/12`.
- WebGL samples the field in its existing background draw; Canvas constructs one
  cached raster from the exact bytes. Generation, upload, and raster counters
  remain unchanged across steady frames and diagnostic sky isolation. WebGL
  remains exactly four draws.
- Rejected candidate 1 because its broad field was technically measurable but
  visually too subdued at normal display size. Its 401,935-byte Home frame is
  `reports/planetary-sky-composition-v2/candidate-1-subdued-nebula/home-worker-webgl2.png`,
  SHA-256 `1326e3baee773a95b2bddcb1273b397bfc5a7cd64b1155aa8e783e55f8af2238`.
- Selected candidate 2 after WebGL2 and Canvas inspection: the asymmetric cool
  band, warm concentration, and negative rift are legible without outranking
  the globe. WebGL background-only deltas change `86.56%` of 163,401 sampled
  outside-globe pixels at mean `14.79`, while repeat noise is exactly zero;
  star-only deltas locate all three bounded strata without a grid owner.
- Replaced the equirectangular producer, longitude uniform, Canvas `u/v` maps,
  and phase cache with one `64×64×6` directional field. Browser World seed
  `3531364387` produces signature `d5b85ea2`, 24,576 bytes, and `36.03%`
  thresholded coverage. The shared directional sampler's maximum calibrated
  cube-edge delta is below `0.000009`.
- Selected normalized axes
  `[0.429442, 0.788975, 0.439429]` and
  `[-0.708232, 0.279303, 0.648381]`: their separation is `78.40°`, and their
  nearest-cardinal separations are above `37°`. Direct 52- and 109-minute
  eligible-time rotations use bounded phase state and selected starting angles
  `15π/8` and `3π/8`; no accumulated matrix or World-cardinal pole exists.
- Rejected the first zero-angle cloud composition because the opening view was
  an excessively clear patch even though the cube was continuous. A second
  candidate improved distribution but still left the deterministic opening too
  clear. The selected coverage and starting orientation make both Home and
  World visibly cloud-bearing while retaining terrain, resources, life edges,
  selection, atmosphere, and text hierarchy.
- Canvas caches exact unit directions in typed storage and uses 2,048 buckets
  per angle. Its fastest interval is approximately `1.52 s`; adjacent spherical
  probes change the opacity byte by at most `4/255` with mean below `0.26/255`.
  The hot sampler allocates no object per cell.
- Revision `be464212910f5c26518c10cc029f439af54965f6` passed local verification,
  exact-revision Actions/Pages, deployed-byte equality, and all three deployed
  browser paths, but it is superseded as terminal evidence: review found that
  its browser fixture had visual inspection and catalog dispersion checks but no
  independent rendered-image Fourier/autocorrelation oracle. This was an
  acceptance-evidence gap, not a diagnosed product or composition defect.

## Focused verification

PASSED — unit `246/246`, integration `76/76`, `19/19` selected
settings/celestial/field/renderer tests, and the cell-visual audit. PASSED —
camera Worker/WebGL2, fallback/WebGL2, and fallback/Canvas reports
`2829a3f0…`, `90d46ace…`, and `809e66a2…`; life-boundary WebGL/Canvas reports
`eced4084…` and `888c21fd…`; atmosphere WebGL/Canvas reports `21bbf60a…` and
`3d1130f9…`. Picking/manipulation, life edges, material hierarchy, atmosphere,
and context-loss behavior therefore remain on their maintained production
paths.

PASSED — directional-cloud Worker/WebGL2, fallback/WebGL2, and fallback/Canvas
production-browser paths, including fresh/stored settings, field/star
isolation, lifecycle bounds, semantic hierarchy, real context loss on the
Worker path, four draws, forced colors, high contrast, touch/keyboard access,
four responsive viewports at 200% text, Full/Reduced, hidden time, both rotation
components, and all six cube-face/former-seam/pole camera families. Milestone
reports under
`reports/planetary-sky-composition-v2/final/` have SHA-256
`6c499bf5d9fe4a5c676a3d3033d8e22008495b6475030c5cb93b79c4683d78ba`
(Worker/WebGL2),
`79bf1e7366764f11e1edcba4914b63cf2a277f1dea0bda743449b6be7d170dd4`
(fallback/WebGL2), and
`bcbb9ce85db5436482d9e3adc1ee5bb5f533b0a3a64fb641b2067834ef025a18`
(fallback/Canvas).

PASSED — the corrective browser oracle finds connected star centroids in the
actual field-only versus star-composed pixels, then measures axial Fourier
frequencies `8–28`. Worker and fallback WebGL2 each report 93 rendered
components and peak `0.20572`, below deterministic-control mean `0.21163`, p95
`0.24805`, and calibrated limit `0.26805`. Canvas reports 70 components and peak
`0.28508`, below control p95 `0.29577` and limit `0.31577`. Each limit is the
matched 64-cohort random p95 plus `0.02` raster-centroid headroom. A deterministic
jittered `20×12` lattice sensitivity control reports `0.94883` (WebGL2) and
`0.94863` (Canvas), so the oracle independently distinguishes the selected
rendered distribution from an axial lattice. All 64-control-cohort checks pass
on Worker/WebGL2, fallback/WebGL2, and fallback/Canvas; precommit receipts are
`9d1ee06f…`, `8907ac89…`, and `91cf9fe8…` respectively.

The inspected final composition, orientation, and responsive contact sheets are
respectively `1472×1856` / 1,243,463 bytes / SHA-256
`d9b4429ac1cda51d3df670b0950bca481484844168bf490aabe44091dcc1126d`,
`1472×1856` / 989,161 bytes /
`1b7a2d7cd78567c60f3b12a104b2f0673844375e0dbff6e2d305cbf26ce9c23d`,
and `1472×1240` / 593,606 bytes /
`d555383c34d99bf9217ca8dcbd68137569f819ed9488557e52c5a2431ba9ede0`.
They are ignored evidence under `reports/planetary-sky-composition-v2/final/`,
not repository assets.

The three final same-process full/neutral p95 samples are `2.1/2.2 ms`
(Worker/WebGL2), `2.2/2.2 ms` (fallback/WebGL2), and `2.2/2.4 ms`
(fallback/Canvas). Selected-path full-sky p95 changed from baseline by at most
`0.1 ms` (`5%`), below the investigation threshold. Deep-space generation and
upload/raster counts remain one; WebGL cloud field/face upload counts remain
one/six; unchanged frames do not increase them. WebGL remains four draws.

PASSED — isolated final benchmark `12,048 ticks/s` versus baseline `11,900`
(`+1.24%`) with authority hash `15863d52` and fixed trace `e32ad0ff`; fixed-trace
median `10,237` versus `10,518` (`−2.67%`). PASSED — one fresh `npm run verify`
completed all 26 gates on stable content; its post-suite benchmark is
`12,374 ticks/s` with the same authority hash and a `10,426 ticks/s`
deterministic fixed trace. PASSED — README identity, structure, links, predecessor search,
`git diff --check`, and ignored-report/transfer-artifact exclusion checks.

The old point-grid constants, `celestial-constants.js`, `uCloudPhase`,
equirectangular dimensions/sampler, Canvas `u/v` maps, and old phase-bucket
assumptions have no production consumer. D39 supersedes D38's visual/field
details while retaining the eligible-time and authority boundary. The camera
policy and simulation/reward/persistence authorities are unchanged.

## Evidence not obtained

- No physical-device, thermal, physical screen-reader, or physical forced-color
  evidence is claimed.
- No v2 CI, Pages, deployment, deployed-byte, or deployed-browser evidence
  is claimed by this pre-publication local record. Exact revision publication
  evidence belongs to the final implementation handoff.

## Exact next coherent step

Publish normally only if a fresh fetch confirms the expected upstream, then
verify the replacement exact revision through Actions, Pages, cache-busted bytes,
and focused deployed browser paths. No further local product step remains.
