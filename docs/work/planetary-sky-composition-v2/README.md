# Planetary Sky Composition v2

Status: active implementation.

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

## Focused verification

PASSED — `17/17` selected settings/celestial/field/renderer unit tests and the
cell visual audit. PASSED — candidate-2 Worker/WebGL2, fallback/WebGL2, and
fallback/Canvas production-browser paths, including fresh/stored settings,
field/star isolation, lifecycle bounds, semantic hierarchy, context loss on the
Worker path, four draws, forced colors, high contrast, touch/keyboard access,
and four responsive viewports. The preserved candidate-2 fallback reports have
SHA-256 `277a07c9bc10443b5c48c7b930a8d8e631ee2ba0d59239c6ff286b83cdc787da`
(WebGL2) and
`706a184f8fc1598a288e47de1da113ca0f85a33bf8d9024744acfa2df67ccaf4`
(Canvas).

## Evidence not obtained

- No physical-device, thermal, physical screen-reader, or physical forced-color
  evidence is claimed.
- No v2 CI, Pages, deployment, deployed-byte, or deployed-browser evidence
  exists before the implementation revision is pushed.

## Exact next coherent step

Replace the equirectangular cloud bytes, longitude offset, and Canvas `u/v`
phase cache in one cross-backend cutover with the selected six-face directional
field and two finite nonparallel rotations; then capture seam/pole/time evidence.
