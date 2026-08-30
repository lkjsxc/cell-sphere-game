# Evolution World Substrate v1

Status: active.

## Starting point

- Branch `main` at `76f44168a44cfbcddb7deeaf671694895d3344ea`, tracking
  `origin/main` with ahead/behind `0/0`.
- The latest exact upstream workflow run `33299646005` succeeded for the
  starting revision. GitHub Pages uses the existing workflow deployment at
  `https://lkjsxc.github.io/cell-sphere-game/`.
- `AGENTS.md` began modified with the user-supplied complete replacement
  contract for this presentation cutover and belongs to this campaign.
- Untracked user handoffs `docs/work/202608300500.md`,
  `docs/work/202608300855.md`, `docs/work/202608301243.md`, and
  `docs/work/202608302226.md` remain preserved and unstaged. The last is the
  transfer mandate reconciled into this package; none is a second work-package
  authority.
- `docs/work/evolution-cell-progression-v1/README.md` is terminal current
  evidence for exact-cell progression. This package does not reopen it.

## Confirmed root causes

- `createEvolutionFields` builds high-frequency scalar noise, forces all 2,562
  cells to land biome `9`, and supplies no lakes or coastlines.
- The intentionally diverse exact-cell archetype layout has no adjacent equal
  archetypes and only sparse same-domain adjacency, so broad domain/status
  fills read as a checkerboard rather than planetary geography.
- WebGL's `uMemory` material path conflates Evolution and Trophy, while Canvas
  replaces biome material for Evolution and applies broad whole-cell fills.
- Trophy currently calls the Evolution placeholder field builder, so its exact
  existing field output must move to a Trophy-specific owner before the
  Evolution entry point can use maintained World fields.

## Selected decisions and deviations

- Keep `createEvolutionFields(topology)` as a fixed-seed call to the maintained
  `createFields` owner with seed `0xe701c311`; no copied geography generator.
- Retain existing Trophy fields and atlas material through a Trophy-specific
  field owner, and replace `uMemory` with one World/Evolution/Trophy scene
  discriminator shared by the existing globe and boundary draws.
- Keep exact-cell domain and state meaning as restrained local material marks,
  shared state edges, and existing text. World material is the Evolution base.
- No mandate deviation is selected.

## Completed coherent phases

- Repository branch, revision, upstream, ahead/behind state, dirty files,
  recent commits, root contract, work authority, terminal predecessor, current
  status, relevant source/test owners, current CI, and Pages configuration were
  inspected.
- The starting contradiction was reproduced in source, semantic diagnostics,
  focused tests, and Chrome 152 production-browser paths.
- Baseline fields are 100% land, one biome, zero lakes, and zero coast/lake
  edges. The selected fixed World seed is 54.02% land with connected 1,384-cell
  land and 1,178-cell water components, 13 biomes, seven lakes, 206 coast edges,
  286 lake edges, 97.32% land/water adjacency, and 81.61% biome adjacency.
- `createEvolutionFields` is now a thin fixed-seed call to maintained World
  `createFields`. Progression initialization retains its one topology-lifetime
  field object across entry, selection, purchase, animation, and renderer
  replacement.
- The previous field builder moved only to the Trophy-specific owner required to
  keep the controlled Trophy output exact. A single World/Evolution/Trophy scene
  discriminator replaced `uMemory`; Trophy retains its prior atlas material,
  while Evolution keeps World geography and adds only cell-centered glyphs,
  insets, Imprints, and shared exact-cell edges.
- Canvas now starts Evolution from the same biome/water fields and uses the same
  substrate/status projection. The old Evolution biome override and broad
  whole-cell progression fill path are deleted. WebGL and Canvas were cut over
  together; no new pass, texture, dependency, protocol, setting, persistence
  field, or progression authority was added.
- D34 and current product, rendering, accessibility, testing, performance, and
  source-owner documentation now separate D33 progression authority from the
  fixed presentation substrate.

## Focused verification

- PASS — 48/48 selected field, exact-cell presentation, renderer, Trophy, and
  skill-globe tests after the cutover. A later two-file source-owner rerun passed
  28/28 after adding negative checks for the deleted placeholder and `uMemory`.
- PASS — `npm run showcase:check`; digest
  `608dec0905e713b0e1343de5259ac4c96b34f296836ce80394bf3f935d5f9fd7`,
  30 frames, 230,904 bytes. The generated frame payload is byte-identical to the
  predecessor after normalizing the source receipt; only `sourceHash` changed
  because the broad generated-source inventory includes presentation modules.
- PASS — baseline Chrome 152 Worker/WebGL2, fallback/WebGL2, and
  fallback/Canvas 2D focused receipts. All retain 2,562 cells, 7,680 edges,
  layout digest `db40b2ed`, bounded navigation, reduced-motion stability,
  forced-colors support, the eight 200%-text viewports, and zero steady edge
  updates. WebGL2 retains four draws.
- PASS — final Chrome 152 Worker/WebGL2, fallback/WebGL2, and fallback/Canvas
  focused receipts have SHA-256 `b6b1e62f0873e23bdc29ecb9f54714674d68c01fb57d4ac609f2028684f70427`,
  `3fb9dc0263b86bb029b7d028e81352c335bf44b0682bb891f06849e2bde31aa7`,
  and `65e047834197566045f20da00fd2e0702918b0dca6cd2b3f26fb416a4cabf566`.
  Each observes digest `57eda917`, stable field identity, the full semantic
  geography gates, exact one-cell purchase and incident-edge locality, bounded
  navigation, all eight 200%-text viewports, forced colors, stable reduced
  motion, and zero unchanged-frame edge updates. Both WebGL paths retain four
  draws and survive real context loss into Canvas with the same field object and
  digest.
- PASS — repeated far/close and center/limb probes have zero observed repeat
  noise. WebGL substrate/domain separations are
  `0.19097/0.03216`, `0.19094/0.03212`, `0.11835/0.03153`, and
  `0.07921/0.02459`; Canvas values are `0.21378/0.04534`,
  `0.21378/0.04534`, `0.17631/0.04567`, and `0.17306/0.04688`.
  Geography exceeds those normal same-biome cross-domain variations by the
  calibrated `0.004` margin in every case. A separate same-cell domain-only
  probe records WebGL cues `0.04819/0.04819/0.03980/0.03980` and Canvas
  `0.04808` in all four views, so the hierarchy does not pass by deleting domain
  meaning.
- PASS — quiet/frontier/selected edge salience is
  `0.07636 < 0.39319 < 0.63852` in WebGL and
  `0.01694 < 0.51947 < 0.77629` in Canvas.
- PASS — fixed-camera 1440×900 matched World, Evolution, and Trophy captures
  cover two orientations at distance `3.75` plus close Evolution at `3.10`.
  Representative Evolution far-view hashes are
  `6658763867cddc231ac16a3332e4c0fb5b41c52772c1cfb930220f12bcc9546e`
  (WebGL, 412,156 bytes) and
  `5262bd457f7d45a53b0114366c79ce18301b5ffe722766760d8f071139548a2e`
  (Canvas, 521,950 bytes). Trophy hashes are exactly equal before and after:
  `b98ca89587f026a000ccbf69e66af5be2fd17a9b55dd18be910335c91ea004ed`
  WebGL and
  `dba741f68c1b2a90a77d58496f5f5e72d8258a0649191eca5847ce6c722be49b`
  Canvas.
- PASS — repeated final timing cohorts bound p95 entry/snapshot/update/steady at
  Worker/WebGL2 `14.5–19.9/0.5–1.8/1.1–1.9/1.0–1.5 ms`,
  fallback/WebGL2 `14.4–15.9/0.5–0.6/1.4–1.5/1.1–1.2 ms`, and
  fallback/Canvas `5.5–11.2/0.5–0.6/1.6–2.7/1.5–1.6 ms`. Entry remains under
  30 ms; relative sub-millisecond variation was investigated through repetition.
  WebGL allocation remains `1,838,196` static and `325,152` dynamic bytes;
  Canvas remains `133,132` and `130,560` bytes.
- PASS — `audit:skills` retains topology `2,562/7,680`, layout digest
  `db40b2ed`, 42 archetypes, direct reachability, monotone exact costs, equal-rank
  compiler identity, finite huge levels, and a bounded 10,248-byte projection.
  `audit:trophies` retains 96 unique conditions, level-2 mapping hash `93870583`,
  idempotent rewards, deterministic hash `c036eeac`, and a valid 240-World
  production campaign. `audit:cell-visuals` reports four draws, full-cell lakes,
  shared life edges, fixed atmosphere geometry, and zero violations.
- PASS — 36/36 focused determinism, all-speed invariance, progression,
  current-only persistence/import, WAL recovery, forged-reward rejection, and
  Trophy persistence tests. No schema, identity, cost, compiler, SCORE, Echo,
  Worker, fallback, or active-World authority changed.
- PASS — broad Chrome 152 Worker/WebGL2, fallback/WebGL2, and Worker/Canvas
  production shells exercise World authority, all public speeds, developer
  speed, real pointer/touch/keyboard camera and selection paths, History,
  Evolution, Trophies, persistence, atomic World replacement, context fallback,
  continuous center/limb coverage, and responsive shells. Both WebGL runs retain
  four draws and the same authoritative SCORE `178012`; Canvas reports the same
  unified scene flow.
- The first browser attempt without the cached library path failed before CDP
  because `libatk-1.0.so.0` was unavailable; it is not a pass. The cached
  dependency bundle resolved the environment and supersedes that attempt.
- The first extended baseline capture derived orientation from Evolution coasts;
  the all-land predecessor has none and the run failed before capture. Fixed
  deterministic camera directions now make revisions comparable; all three
  baseline reruns passed as records. One early final hierarchy probe omitted the
  camera distance and two later combined probes exceeded the original 10-second
  CDP bound; none is counted as a pass. Correct distance propagation, narrower
  reads, and the existing focused 60-second bound produced the passing receipts.
- The first isolated domain-only probe targeted a capstone ring with a fixed
  center patch and therefore missed that ring at close framing. A temporary
  stronger locked mark passed but visibly competed with geography and was
  reverted. The final same-cell specialization-glyph probe isolates the actual
  retained restrained cue at every framing without changing the selected
  product weight; the failed probes are not passes.
- The first broad Worker/WebGL attempt used the cached Chrome libraries without
  the maintained test-only Fontconfig file. Chrome aborted in font discovery and
  the next CDP viewport command timed out; it did not reach product assertions
  and is not a pass. The configured 60-second-bounded Worker, fallback, and
  Canvas reruns above supersede it.

## Evidence not obtained

- Complete verification, remote, CI, Pages, cache-busted deployed-byte, and
  deployed-browser evidence are not yet run.
- Physical-device mouse, touch, pen, real screen-reader, high-refresh, thermal,
  and hardware safe-area evidence is unavailable in this environment.

## Exact next coherent step

Run the focused source/audit gates and one fresh complete verification against
stable final content, review and commit the exact dependency boundary, then
perform the authorized fast-forward publication and verify its exact CI, Pages,
cache-busted bytes, and deployed browser paths before terminal closure.
