# Orbital Starfield Fidelity v1

Status: terminal local implementation evidence.

## Starting state

- Branch `main` at `0125081a479886d452b307e1588a8bec14803df5`, tracking
  `origin/main` at `0/0` ahead/behind.
- The only starting dirty path is the user-supplied untracked transfer artifact
  `docs/work/202609031209.md`. It is preserved and excluded from campaign edits.
- The latest exact-revision workflow for the starting revision is successful:
  Actions run `33669386561` and Pages deployment `6229713847`.
- `planetary-sky-composition-v2` is terminal predecessor evidence. Its broad
  chromatic-field target is superseded by this package; its historical evidence
  is not rewritten as evidence for the new policy.

## Confirmed cause and selected decision

- One bounded celestial presentation policy already creates the immutable
  deep-space field and star semantics consumed by WebGL2 and Canvas 2D. WebGL2
  uses the existing background draw, and Canvas uses its existing background
  phase. No new authority, pass, loop, asset pipeline, or persistence work is
  needed.
- The deterministic `deep-space-field-v2` intentionally constructs a wide
  curved gas band, warm concentration, violet structure, and dark rift with
  channel amplitudes up to `48`. The selected browser seed has luminance
  `0..32`, mean `12.5620`.
- In rendered baseline output the field changes `86.56%` of sampled WebGL
  outside-globe pixels at mean maximum-channel delta `14.7941`; rendered stars
  change only `0.154%` at mean `0.0390`. Canvas changes `91.34%` for the field
  and `0.065%` for stars. Normal-size inspection shows the wide cool ribbon and
  lower chromatic mass reading as the reported nebula/cloud bank.
- The atmosphere remains a thin globe-owned limb and the sparse shooting event
  is absent from the stable baseline composition. Neither is a root cause, so
  both stay unchanged unless candidate evidence disproves this boundary.
- Cut over the current generated field in place to a near-black, low-amplitude,
  non-ribbon field and strengthen the same three bounded star strata. Add a
  rendered-output hierarchy oracle based on absolute backdrop luminance,
  low-frequency block variation, and detected star contrast/components. Retain
  the `256x128` local field, existing lifecycle, shared policy, three quality
  budgets, four WebGL2 draws, and Canvas semantic fallback.

## Baseline evidence

- PASSED — Chrome 152 Worker/WebGL2:
  `npm run test:browser:planetary-sky`; ignored report
  `reports/orbital-starfield-fidelity-v1/baseline/worker-webgl2/report.json`,
  SHA-256 `dd04e0e2fd11df7494f31893b5e6c759c4c2634409b44bc4e9816e621f000f84`;
  full/neutral p95 `2.0/2.1 ms`.
- PASSED — Chrome 152 fallback/WebGL2:
  `npm run test:browser:planetary-sky:fallback`; ignored report SHA-256
  `1af123ae966f962236182ccf23c09ee8bb00e5bfdf1535fe68a9facfd8e4272c`;
  full/neutral p95 `2.1/2.2 ms`.
- PASSED — Chrome 152 fallback/Canvas 2D:
  `npm run test:browser:planetary-sky:canvas`; ignored report SHA-256
  `cd7a8cb1e71bd600120d4f7cece319feb406586e05a397e13ddeb1bfa4082678`;
  full/neutral p95 `3.1/1.9 ms`.
- All baseline paths retain `210` Balanced stars, deep-space signature
  `afe9c9db`, cloud signature `d5b85ea2`, stable resources, accessibility and
  responsive gates, four WebGL2 draws, and empty browser errors.
- PASSED — starting benchmark: `12,083 ticks/s`, authority hash `15863d52`,
  deterministic fixed trace `e32ad0ff` at median `10,425 ticks/s`.
- The ignored baseline screenshots and reports are preserved under
  `reports/orbital-starfield-fidelity-v1/baseline/`.

## Completed coherent phases

- Reconciled branch, upstream, dirty state, complete repository contract,
  current docs, predecessor package, source/test owners, package scripts, and
  current remote CI/Pages state.
- Reproduced and measured the complaint on Worker/WebGL2, fallback/WebGL2, and
  fallback/Canvas 2D, then inspected the normal-size Home composition.
- Selected candidate 1. `deep-space-field-v3` deletes the authored gas band,
  warm concentration, violet structure, and rift, replacing them with a
  non-directional near-black field whose selected policy seed has luminance
  `0..2`, mean `1.0283`, and signature `673e97c5`.
- The shared faint/bright/anchor owner now defines counts, grid budgets, size,
  intensity, opacity, and halo semantics. Eco/Balanced/High totals are
  `224/356/500`; Balanced is `280/64/12`. Canvas consumes those definitions
  directly and the WebGL shader is generated from the same stratum metadata.
- The production-browser oracle now measures absolute outside-limb backdrop
  luminance, low-frequency block spread, detected star components and core
  pixels, star prominence over bright backdrop, non-lattice distribution,
  stability, lifecycle bounds, and existing cloud/event semantics. The
  maintained 200% text matrix now covers all eight contract viewports, and the
  fixture captures actual Home, World, Evolution, and Trophies frames.
- PASSED — candidate Worker/WebGL2, fallback/WebGL2, and fallback/Canvas 2D.
  Backdrop mean/p95 is approximately `0.99/1.86`, black fraction is `1.0`, and
  block spread is below `0.42` on both backends. WebGL finds `163` star
  components, `945` core pixels, and prominence `945`; Canvas finds `121`,
  `385`, and `385`. Both WebGL paths retain four draws. Candidate reports are
  under `reports/orbital-starfield-fidelity-v1/candidate-1/`.
- PASSED — full unit/integration suites `246/246` and `76/76`, cell-visual
  audit, structure gate, and link gate after the cutover.
- PASSED — exact clean implementation revision
  `e7c66f8ea1519a880774fd268af974d34f09ac60` on Chrome 152:
  Worker/WebGL2 report SHA-256 `10769f8b6df871164bb19850aa3f3a02c5d94c02d6d983e4ed98ea6fdf5d3421`,
  fallback/WebGL2 `8d00b498ee7e8eac2fb695d233e612348d6fd5678f93458d0f2fe5549f7dd97b`,
  and fallback/Canvas 2D `c01be000aed350ddf919586e8ae90d794cea672f0614f0ac9fba50980c909d31`.
  All three have empty browser errors, all eight 200% text viewports, reduced
  motion, forced colors, high contrast, touch/keyboard checks, bounded
  resources, and actual Home/World/Evolution/Trophies frames. Worker context
  loss restores a playable Canvas path without changing the field identities.
- PASSED — exact WebGL atmosphere silhouette on WebGL2/Canvas, report SHA-256
  `c298f67a9c0d30e92b56fdb2806f486893a154b342b94b56bd9506336b22368c` /
  `04a8af53a831db933b6256e55801c58256508eda39f305ba0de58d8642304d70`;
  life-boundary WebGL2/Canvas reports
  `b7cf08d784a66d883616c53d19f6207b0b93eede1b08473a8bfd25a9889f5d95` /
  `d70e4c09bd12318be6a0c9ac121f06b90b6eb58d849eeced6d8b62e73db40218`
  have zero repeat noise and steady p95 `1.3/1.9 ms`.
- PASSED — final isolated benchmark `12,616 ticks/s` versus starting `12,083`
  (`+4.41%`), with authority hash `15863d52`, deterministic fixed trace
  `e32ad0ff` at median `10,686 ticks/s`, and every bounded profile valid.
- Inspected ignored exact-revision composition and baseline/final contact sheets
  are SHA-256 `2e1c889cf487495fca346f7d6708e8df99337ab7943e45b7fabb80453c5311e4` and
  `b02b32c6329fd65ab4765d38e4880abed3cebc5a2536341bdc8056cfe2a762b7`.
  The former shows coherent star-led backdrops in all four sphere scenes on all
  three paths; the latter makes deletion of the broad blue ribbon directly
  observable.
- The coherent production/test cutover is commit `58b06e5`; trusted scene
  navigation and restored production-loop evidence is commit `e7c66f8`.

## Evidence not obtained

- FAILED — the first candidate Canvas run included its deliberate analytic
  limb glow in the pure-backdrop oracle and therefore reported p95 `10.87` and
  block spread `9.53`. The corrected measurement excludes the complete
  renderer-owned atmosphere radius before measuring backdrop, while star
  detection retains the established outside-globe mask. The passing rerun is
  the product evidence; the failed run is retained only as oracle-calibration
  evidence.
- FAILED — the first added Evolution/Trophies contact-sheet captures ran after
  the controlled fixture had cancelled the production frame loop, so WebGL
  retained its last World pixels and Canvas showed a cleared frame. The fixture
  now resumes exactly one production loop on restore and navigates with trusted
  scene buttons; inspected Canvas reruns show the Evolution and Trophy globes.
  The stale captures are not scene evidence.
- FAILED (unrelated known broad baseline) — `npm run test:browser:file` reached
  the established `1024×600` Result-action bottom at `600.1875 px`. Sky code
  cannot affect that DOM rectangle, the same `0.1875 px` issue is recorded in
  the predecessor sky and camera baselines, and the selected eight-viewport sky
  matrix passes. The broad run is not counted as campaign evidence; fallback
  variants were not repeated after the shared scenario failed at the same
  pre-existing gate.
- FAILED (evidence tooling only) — the first contact-sheet command created both
  images correctly, then returned nonzero because this host has no `file`
  executable. SHA-256 receipts and direct image inspection supersede that final
  informational subcommand; it is not a browser or product pass.
- No physical-device, thermal, physical screen-reader, or physical
  forced-colors evidence is claimed.
- Exact-revision CI, Pages, deployed-byte, and deployed-browser evidence belongs
  to the final implementation handoff after publication; this package does not
  pre-claim a future commit's result.

## Exact next coherent step

None for the selected implementation. Publish only after the final verifier is
clean, then verify the exact served revision and carry those external receipts
in the implementation handoff without rewriting this historical package.
