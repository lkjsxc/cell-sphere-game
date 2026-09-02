# Planetary Sky v1

Status: terminal local implementation evidence. The implementation commit is
`ba0fa2320b84800646255e931ddaf29871f62c5c`; exact-revision remote, CI, Pages,
byte, and deployed-browser receipts belong to the final implementation handoff.

## Starting state

- Branch `main` began at `1afa2c40598d4dda624641d84d19f5fd01a2c2e5`,
  exactly aligned with `origin/main` (`0` ahead / `0` behind).
- Starting user work was the supplied 1,205-line root `AGENTS.md` replacement
  and the 61,415-byte untracked transfer artifact
  `docs/work/202609021823.md` (SHA-256
  `7ae01504c28e43bb84becbf3ab64df5c0614618cb01b261cfce1b5f71514549a`).
  The contract is in scope for the coherent commit. The transfer artifact is
  unchanged, locally excluded through `.git/info/exclude`, untracked, and
  noncanonical.
- No work package was active. The orientation branch, revision, commit title,
  upstream relation, successful Actions run `33597799238`, and successful Pages
  deployment `6216763849` were confirmed for that starting revision.
- Node is `v24.18.1`; the maintained local browser is Chrome for Testing
  `152.0.7977.64` using the cached runtime/font sysroot.

## Confirmed causes and rejected hypotheses

- Fresh Motion was selected from `prefers-reduced-motion` in
  `defaultSettings()`. Stored `full` and `reduced` values already validated
  independently, so no schema bump, migration, or unrelated reset was needed.
- WebGL2 had one gradient background draw and a cellular globe material; Canvas
  had a gradient/halo and cellular material. Neither had a celestial clock,
  star field, cloud field, event schedule, or cloud texture.
- The gap was presentation composition, not simulation resolution, atmosphere
  topology, ecology, camera geometry, or progression. The existing background
  and globe draws were sufficient; no fifth draw, particle system, external
  asset, dependency, second loop, or simulation change was needed.
- Raising cell resolution, applying a screen-space cloud veil, or retuning
  ecology would not have produced sphere-adherent clouds or a deterministic
  background schedule and was rejected.

## Baseline

- Production Home/World captures were a nearly empty gradient with no stars,
  clouds, or shooting star.
- Matched Chrome repeat noise was zero. WebGL2 life/material steady/update p95
  was `1.6/1.9 ms`; Canvas was `1.8/2.1 ms`.
- Baseline ignored reports were
  `reports/life-boundary-baseline-webgl2.json` (SHA-256 prefix `1c504c27`) and
  `reports/life-boundary-baseline-canvas2d.json` (`8d60c193`).
- Starting benchmark was `12,116 ticks/s`, authority hash `15863d52`, and fixed
  trace `e32ad0ff`.
- The broad Worker/WebGL2 shell reached production code but retained the known
  unrelated `1024×600` Result-footer overrun of `0.1875 px`.
- Automatic Chrome discovery first skipped, then two host starts failed before
  app load for missing cached runtime/library and font configuration. Those
  attempts are superseded environment setup evidence, not product passes.

## Selected design and empirical answers

### One presentation owner

`src/interface/policies/celestial-presentation.js` owns one fixed-size state:
eligible foreground animation time, stable sky seed/catalog, quality budget,
active visual seed/cloud field, phase, one cached slot descriptor, and the
active-or-inactive event projection. App lifecycle code supplies monotonic frame,
visibility, scene, Motion, Quality, and visual-seed changes. Renderers only
normalize and consume the immutable projection.

Eligible time advances only while visible, Full motion, and in Home or World.
Each frame contributes at most `100 ms`; excess, hidden, Reduced, Evolution, and
Trophy time is discarded rather than backfilled. Public/developer speed never
enters the policy.

### Cloud field and material

- Representation: deterministic seamless equirectangular `Uint8Array`,
  `128×64`, exactly `8,192` bytes. This was the smallest permitted candidate and
  passed seam, adjacent-frequency, center/limb, near/far, WebGL, and Canvas
  checks; no `256×128` field was needed.
- Structure: four periodic low-frequency layers at `10×7`, `20×13`, `40×25`,
  and `64×41`, weighted `0.44/0.29/0.18/0.09`; seed-relative 66th/90th
  quantiles bound coverage without topology-sized noise.
- Seed lifecycle: cloud seed is a fixed mix of the active presentation visual
  seed. Home uses the maintained title seed, live World uses its run visual
  seed, visual History uses the selected World's seed, and Evolution/Trophy
  disable clouds. Renderer replacement, camera, resize, and quality do not
  select a new field.
- Selected World field signature is `bf4ca35f`; Home is `1d553af7`. Raw field
  coverage is `0.2894287109375`. Clear projected coverage at the calibrated
  `>18` RGB-delta threshold is about `0.3593` WebGL and `0.2336` Canvas, within
  the selected `18–42%` envelope.
- Maximum material mix is `0.18`. WebGL applies it after geography/resources and
  before semantic overlays, then established lighting makes the night side
  non-emissive. Canvas uses a fixed daylight-scaled `0.05–0.18` contribution.
- Wrap duration is `3,000,000 ms` (`50 min`). It was the slowest tested rate
  that retained a clear 30-second change: WebGL mean/max delta about
  `2.89/27`; Canvas remained clearly above its calibrated threshold.
- Canvas consumes the exact bytes through three fixed spherical/light maps and
  byte-amount/phase-epoch caches. Its 1,024 phase buckets are one eighth of a
  field texel and refresh lazily in the existing visible-cell loop about every
  `2.93 s`, avoiding imperceptible per-frame resampling.

### Stars

- Stable sky seed is `0x6e5a91c3` (`1851429315`). Quality budgets are exactly
  `48/72/96` for eco/balanced/high; the policy's maximum catalog is a fixed
  1,536-byte `Float32Array`.
- Canvas draws that catalog without per-star object allocation. WebGL uses the
  same policy seed and density budget in one deterministic `20×12` procedural
  grid evaluation inside the existing background fragment draw. Exact pixels
  may differ, while seed, quality, stability, density order, and scene state
  agree.
- Normalized placement remains stable across frames, Worlds, ordinary scene
  changes, and resize. Pixel-space distance keeps points circular. Selected
  background sampling is nonempty and repeat frames are byte-identical.

### Shooting-star schedule

- Eligible time is partitioned into exact `300,000 ms` slots. One descriptor is
  derived and cached per slot from the stable sky seed and slot index, yielding
  exactly 12 identities in every aligned eligible hour and 288 in the tested
  24-hour span. Only the current slot can be active.
- Duration is deterministically within `700–1,200 ms`; start/end, width,
  intensity, and tail are finite and bounded inside the usable field. The
  representative cross-backend event is `sky-1-38b3c574`, duration
  `716.8572728289291 ms`.
- The event is drawn in the existing background phase. A controlled path changed
  84 sampled pixels outside the globe and exactly zero under the conservative
  planet mask, proving later globe draws provide natural occlusion.

### Motion settings and persistence

- Settings schema remains version `8`. Fresh or invalid settings now select
  `motion: "full"` without consulting `matchMedia`.
- Valid explicit stored Full/Reduced and independent Contrast, Quality,
  Auto-continue, and speed values remain authoritative. Browser OS-preference
  changes do not mutate them.
- Reduced freezes eligible time/cloud phase, suppresses the travelling streak,
  and retains static stars, cloud presence, direct manipulation, semantic state,
  and static UI. No celestial clock, phase, slot, catalog, or texture is
  persisted.
- No `automaticCamera` field, setting, alias, migration, or path was added.

## Implementation phases and ownership

1. Added the settings cutover, shared field generator, central eligible-time
   policy, defensive renderer projection, and app lifecycle wiring.
2. Extended the WebGL background and globe material without changing its four
   draws; added one lifecycle-owned repeating `R8` texture with deletion and
   context-loss fallback.
3. Extended Canvas's existing background and visible-cell material loop using
   the exact field/event projection and fixed caches.
4. Added one shared focused browser fixture and three dispatcher scripts rather
   than duplicating the browser harness. Existing atmosphere, life, Luminous,
   camera, context-loss, settings, and source audits remain the regression
   oracles.
5. Reconciled README, status, rendering, accessibility, performance, testing,
   decision D38, module documentation, package scripts, and this package.

No predecessor visual implementation existed. Deleted/rejected temporary paths
were the OS-derived fresh Motion branch, an all-stars-per-fragment WebGL loop,
uncached per-frame Canvas cloud sampling, and temporary per-cell cloud color
allocation. No feature flag or dormant empty-sky authority remains.

## Bounded resources and performance

- WebGL draw count: exactly four.
- Shared field: `8,192` bytes; WebGL `R8` texture: `8,192` bytes; maximum policy
  catalog: `1,536` bytes; at most one event descriptor/projection.
- Canvas cloud maps/caches: `38,430` fixed bytes for 2,562 cells. No per-frame
  field generation/upload, star object, timer, DOM particle, Worker, or second
  RAF exists.
- WebGL cloud upload/field-upload counters remain `1/1` across 360 interleaved
  final render probes. Canvas field-change count remains stable; only lazy fixed
  cache samples advance.
- Final same-process 120-frame full/empty p95 samples are Worker/WebGL2
  `2.1/2.0 ms`, fallback/WebGL2 `2.1/2.2 ms`, and fallback/Canvas
  `2.0/2.0 ms`; medians differ by at most `0.1 ms`.
- Focused benchmark was `12,374 ticks/s`; the fresh complete verifier measured
  `12,182 ticks/s`. Both retained authority hash `15863d52`, fixed trace
  `e32ad0ff`, and finite complete profiles. Presentation did not change
  authoritative results.

## Focused evidence

- PASSED — unit `242/242`; integration `76/76` on current implementation.
- PASSED — settings under absent/false/true OS media states, invalid schema,
  explicit Reduced, and unrelated-value preservation.
- PASSED — 24 hours of slots, boundaries, multiple seeds, 30/60/120/144 Hz,
  hidden/ineligible/reduced transitions, bounded frame debt, field seam,
  coverage, determinism, and nonfinite defense.
- PASSED — Worker/WebGL2, fallback/WebGL2, fallback/Canvas focused sky paths with
  shared `bf4ca35f`, `sky-1-38b3c574`, phase `0.01` at 30 seconds, sky seed,
  quality counts, visual History lifecycle, scene suppression, speed
  independence, and zero page/browser errors.
- PASSED — real WebGL loss transfers exact field signature, phase, sky seed,
  star count, event identity, Reduced state, and a playable snapshot to Canvas.
- PASSED — controlled camera rotation, near/far, cloud-phase, projected coverage,
  stable-star, shooting visibility, and occlusion pixel probes.
- PASSED — established cloud-enabled geography, resource, life frontier, stress,
  critical, remains, zero/powered Luminous, selection, History,
  transformation, coast, and atmosphere oracles in WebGL and Canvas, with zero
  repeat noise.
- PASSED — exact-content hierarchy timing is WebGL `1.7/2.1 ms` and Canvas
  `1.8/2.3 ms` steady/update p95; the paired full/empty oracle above isolates
  the selected incremental cost from cross-process host jitter.
- PASSED — keyboard and touch Motion access, 44 px targets, fresh/stored Motion,
  forced colors, high contrast, Reduced, and 200% text at `320×568`, `390×844`,
  `844×390`, and `1440×900`, with no horizontal overflow or extra focus target.
- PASSED — camera fidelity on Worker/WebGL2, fallback/WebGL2, and
  fallback/Canvas after the final background design; direct manipulation,
  release vector, damping, detail-shell carry, and picking remain unchanged.
- PASSED — cell visual audit, structure, links, and `git diff --check`.
- PASSED — current ignored report SHA-256 values: planetary sky Worker/WebGL2
  `bcc83b826ff6add5923e2ddbe68fcd09e87c0a81c3cd46da300d05ac3a01b64e`,
  fallback/WebGL2
  `c2c23e12f5e6babadb54886587955f7a7591962c5139127c20465f666bf70f8c`,
  fallback/Canvas
  `3ea6627541c59e2b98418eed86e3e1aa875e1e0a60c334d183563195b922ad94`.
- PASSED — exact-source camera report digests are Worker/WebGL2 `f80ee251…`,
  fallback/WebGL2 `dcbe95eb…`, and fallback/Canvas `406c50f5…`; atmosphere is
  WebGL `72b2ab7d…` and Canvas `abee6507…`; hierarchy is WebGL `55194228…`
  and Canvas `231f0fd5…`.
- PASSED — fresh `npm run verify`: all `26/26` gates passed, including unit
  `242/242`, integration `76/76`, links, structure, visual and identity audits,
  balance/terminal smoke, and benchmark (`12,182 ticks/s`, authority hash
  `15863d52`, fixed trace `e32ad0ff`).
- PENDING — exact final commit, normal push, exact-revision CI, Pages,
  cache-busted byte comparison, and deployed focused browser receipt.

Ignored JSON and PNG evidence lives under `reports/`. It is not committed. Final
report digests and exact external receipts belong in the implementation handoff;
this package must not claim a future commit's own SHA.

## Failed and superseded attempts

- The first WebGL implementation looped over 72 uniform stars in every
  background fragment. Planetary pixels passed, but the long camera fixture
  accumulated presentation debt and timed out. The path was deleted; the
  bounded procedural grid then passed the complete camera matrix.
- The first Canvas implementation sampled every visible cloud cell every frame.
  Noisy p95 reached `3.7 ms`. The fixed phase cache removed that work; paired
  final full-sky p95 is below empty-sky on the selected cohort.
- Cross-process Canvas hierarchy p95 has noisy cohorts from `1.7` to `2.8 ms`
  steady. Zero pixel repeat noise, paired same-process full/empty measurements,
  the optimized cache, and reproduced low cohorts identify host/timer variance;
  high samples are retained as investigation evidence, not selected passes.
- The known broad `1024×600` Result footer overrun and superseded browser-host
  startup attempts are unrelated and are not planetary-sky passes. The final
  broad shell reproduced the same `600.1875 px` action bottom after all earlier
  selected-scope paths passed.

## Evidence unavailable on this host

Physical mouse, touch, pen, high-refresh, safe-area hardware, thermal, physical
screen-reader, and physical forced-colors evidence are unavailable. Emulated
browser input/media/layout evidence is not represented as physical evidence.

## Deferred concerns

- One persistent `Automatic camera` on/off preference, default on.
- Composition-aware varied automatic camera paths after that preference.
- The unrelated pre-existing `1024×600` Result-footer fraction.
- Physical-device and assistive-technology evidence listed above.

## Exact next coherent step

Run one fresh verifier on the exact terminal documentation commit, then perform
only the authorized normal push and exact-revision CI/Pages/cache-busted/deployed-
browser closure. Stop after recording those results in the implementation
handoff; do not enter the deferred camera campaign.
