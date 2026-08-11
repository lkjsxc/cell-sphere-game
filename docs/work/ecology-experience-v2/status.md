# Ecology experience v2 — status

## Starting point

- Starting revision: `9815c6daf35c62aef4e913cc33cb095fea353b2a`
- Branch: `main`
- Relevant dirty file on arrival: `AGENTS.md` (the user-supplied replacement contract; preserve and include with this initiative).
- Relevant Phase 5 dirty files before commit: the authored Evolution catalog/compiler, simulation/result/agent authority, History/renderer/persistence boundaries, audits/browser scenarios, showcase data, tests, and current documentation; no unrelated user changes are present.
- Host: Linux x64, Node `v22.22.3`, 20 CPUs; Chrome/WebGL2 and forced Canvas 2D are available through the trusted file-CDP harness.

## Confirmed root causes

- `ENV LEVEL` was wired to `openEnvironmentHistory()` and exposed History semantics in markup and assistive text; that retired route is now deleted.
- The current snapshot already carries the schedule and pressure-summary fields needed for a dedicated current Environment detail.
- HUD metric slots were content-sized flex items; Result continuation text sat in the scrollable Result body.
- History visual playback could label an unavailable historical selection while the renderer fell through to live dynamic buffers; its v1 codec omitted resource, transformation, charge, and Luminous-development channels. The replacement must keep past-world loading neutral rather than falling through to current authority.
- A Worker can be retired immediately after extinction, so requesting its visual buffer only after Result handling could lose terminal visual History. Fallback delivery is synchronous, so initial current History must establish Live state before its buffer callback arrives. Stale current-world buffer replies also need a selection load token.
- `RunController` accepts the complete unsigned 32-bit seed word while old History/cache validators only accepted player-code-sized 30-bit seeds; terminal full-word worlds therefore needed an exact visual/semantic persistence boundary.
- Per-cell radial displacement of duplicated dual-cell boundary vertices is the likely sphere-crack cause; Canvas independently fills adjacent polygons.
- A terminal Result DTO was an untrusted projection: recomputing SCORE from its caller-controlled merit could mint Echoes. Agent actions also allowed Evolution mutation during an active World, which made settlement replay disagree with that World’s compiled configuration.
- Terminal-collapse skips normal worldmaking, so already charged Luminous cells retained generation-era charge until extinction instead of decaying during the visible collapse.

## Decisions

- Reuse the existing metric surface for Environment detail rather than introduce a competing surface abstraction.
- Keep History available through its explicit History routes; delete the Environment-specific History opening route rather than preserve it as a compatibility path.
- Work in vertical slices: Environment route first, then HUD/Result/menu, then History truth, then rendering continuity.
- Use a three-track HUD grid (two tracks for four terminal metrics on narrow screens) rather than content-driven flex sizing.
- Keep the Result countdown and Next World action in its non-scrolling footer; use one grid footer rather than a second scroll region.
- Replace retired Menu settings with schema 6 instead of migrating them. Retain the existing direct speed preference internally, but remove its duplicate Menu control. Bound semantic History internally with `HISTORY_WORLD_RETENTION = 24` plus the existing byte cap.
- Remove camera-policy and inertial/idle-rotation code instead of leaving dormant settings or handlers.
- Replace the visual codec wholesale with current-only `INHV` v2: three bounded bytes per cell for life, resource, and worldmaking/charge channels plus frame-level Luminous development and atmospheric wear. Transform state is sufficient for the current renderer's effective-biome mapping; no v1 decoder is retained.
- Keep History controls outside the one scrolling timeline body. During visual loading/unavailability, defer visual seeking and explicitly present live or semantic-only state; only a decoded matching frame may atomically set the historical label and renderer snapshot.
- Carry the completed visual bundle in the terminal authority outcome and save it directly before presentation teardown; current History requests retain explicit identity and selection-load guards. The visual codec/cache/archive retain the exact unsigned 32-bit authority seed, while player-entered seed codes remain 30-bit.
- Reconstruct terminal authority from the original replay inputs and immutable compiled Evolution before settlement; persist only that reconstruction. Reject cyclic or over-deep caller DTOs, and reject agent Evolution purchases while a World is active.
- During terminal collapse, skip generation and transformations but run a charge-only decay pass so renderer-visible state remains truthful.

## Phase 0 baseline

- `npm run test:unit` — passed, 184/184.
- `npm run test:integration` — passed, 71/71.
- `npm run balance:smoke` — passed, but records the rejected long-run baseline (balanced median 282.2 s; report is ignored at `reports/balance-smoke.json`).
- `npm run benchmark` — passed at 3,098 ticks/s (3,000 floor); concurrent baseline load likely affected this lower-than-status value.
- `npm run test:browser:file` — passed. The trusted production scenario confirmed that `ENV LEVEL` opens filtered current-world History; it also recorded current responsive shell rectangles.
- `npm run test:browser:canvas` — passed.

## Completed Phase 1 — dedicated Environment detail

- Added `environment` to the existing metric surface; it projects current and final snapshot/result data without importing mutable simulation state.
- ENV LEVEL now triggers `openMetric('environment')` during startup, live play, and Result; it targets `metric-dialog`, exposes correct accessible copy, toggles its own detail, and restores focus through the shared surface coordinator.
- The detail presents Level 0 guidance, progress, time to the next transition, level start/next time, qualitative Resources/Moisture and renewal/Climate/Toxicity/Maintenance pressure, strongest pressure, and terminal final/peak/time-at-peak context.
- Removed `openEnvironmentHistory()`, its special filtered/anchored History route, and its route-specific test. History retains its normal Environment event category/filter.
- Environment redraws retain the current metric-body scroll position and occur at most once per ten authoritative ticks unless a level or terminal state changes.
- Updated current product/interface/accessibility documentation; marked the superseded product-simplification note historical.

## Verification after Phase 1

- `node --test tests/unit/shell.test.js tests/unit/history-surface.test.js` — passed, 6/6.
- `npm run test:unit` — passed, 185/185.
- `npm run test:integration` — passed, 71/71.
- `npm run test:browser:file` — passed with trusted Environment route, focus return, redraw-cadence, live-update, terminal, and responsive checks.
- `npm run test:browser:canvas` — passed.
- `npm run check:links` — passed.
- `npm run check:structure` — passed after adding the required work-note README; it reports only existing size/count warnings.

## Completed Phase 2 — stable World UI and smaller Menu

- Replaced content-sized HUD flex slots with fixed three-track grid slots. SCORE, REACH, and ENV LEVEL retain their rectangles through all compact-format boundaries; on narrow terminal layouts ENV LEVEL and RESULT form the second row.
- Moved the Result countdown from the scrolling evidence body into the fixed Result footer. Standard layouts give Next World its own row; compact/short layouts use one bounded three-action row so the primary continuation never sits below a scroll boundary.
- Removed Menu shortcuts that duplicate scene navigation/RESULT, default speed, camera reset, camera inertia, idle rotation, panel pause, configurable History retention, and visible diagnostics. The remaining data/reset tools are collapsed.
- Bumped settings to schema 6. Old settings reset as a current-only document; `luminous` was renamed to the general rendering quality name `high`.
- Removed camera-policy and inertial camera behavior. Panels are informational and do not pause authority; destructive New World confirmation retains its dedicated pause lease.
- Replaced all caller-configurable History-retention paths, including agent and WAL paths, with the internal fixed 24-world ceiling and existing byte-bound trimming.
- Kept Menu History visible only while a world is running; Result retains its direct History route. Countdown text is no longer a high-frequency live region, while status transitions announce once.
- Supplied canonical accessible SCORE/Echoes labels alongside compact visible formatting. The metric detail also exposes the exact SCORE value.

## Verification after Phase 2

- `npm run test` — passed, 185/185 unit and 71/71 integration tests.
- `npm run test:browser:file`, `npm run test:browser:fallback`, and `npm run test:browser:canvas` — passed. Trusted browser coverage exercised Worker and fallback authority; every required viewport; simplified Menu route visibility; compact terminal layouts/footer scroll stability; 200% Result/Menu text; production huge-SCORE formatting with exact accessible value; and settings current-only reset.
- `npm run verify` — passed every fast local gate, including audits, smoke cohort, balance smoke, terminal soak, and a 6,534 ticks/s benchmark (3,000 floor). After the final audit-caller retention repair, the affected checks were rerun below.
- `npm run audit:trophies` and `npm run terminal:soak` — rerun after the retention API cleanup; passed with 24 maximum History worlds and 10,000 rejected duplicate transactions.
- `npm run check:structure`, `npm run check:links`, and `git diff --check` — passed; structure reports only pre-existing size/count warnings.

## Completed Phase 3 — truthful visual History

- Replaced the v1 cell-only codec with reset-only `INHV` v2. Each bounded checkpoint carries life/biomass/stress, resource condition/richness, transformation/charge, Luminous development, and atmospheric wear; static seed geography is guarded by an explicit visual-world version.
- Added deterministic adaptive thinning that always preserves first/final frames and samples event-heavy visual checkpoints instead of failing when major events exceed the reduced v2 frame budget; the live recorder applies the same ceiling in memory. Title playback now uses 30 complete frames within the same 256 KiB bundle bound.
- Removed the unused Worker/fallback `history-preview` route. The explicit Worker protocol is now v10: it carries the terminal bounded visual bundle with the extinction outcome before a retiring Worker can be stopped, and `finishRun()` saves that supplied buffer directly before an immediate replacement can retire presentation. The full bounded bundle remains the only visual preview authority.
- Guarded current buffer replies by their selection load token and established initial Live state before requesting a current bundle, so a synchronous fallback cannot leave Live History on a historical frame. Added Worker/fallback terminal-bundle parity and trusted fallback opening coverage.
- Made the visual codec, device-local cache, and semantic archive preserve the exact unsigned 32-bit authority seed; a full-word seed now has a direct regression test.
- Moved device-local visual History to a new current-only cache namespace and bounded it by both newest-ten records and 2.5 MiB aggregate bytes. v1 records are rejected rather than migrated.
- Rebuilt playback state so only a matching decoded checkpoint can activate `historyPlaybackActive`; a past visual load renders neutral geography, while current loading remains live and semantic event selection never claims a historical globe. Live/close atomically restore authoritative presentation.
- Rebuilt History layout around stable header/playback controls and one scroll-owning timeline body. Loading and semantic-only notes are explicit; range/previous/next defer visual seek until data is renderable; selected events use text, border, contrast, and semantic current state.

## Verification after Phase 3

- Baseline: `node --test tests/integration/history-codec.test.js tests/unit/history-surface.test.js` and `npm run showcase:check` passed against v1 before replacement.
- `npm run test` — passed, 185/185 unit and 76/76 integration tests.
- `npm run showcase:generate` and `npm run showcase:check` — passed with the checked-in 30-frame v2 title bundle.
- `npm run test:browser:file`, `npm run test:browser:fallback`, and `npm run test:browser:canvas` — passed. Trusted Worker/fallback evidence verifies loading defers visual controls without a false checkpoint label, a decoded checkpoint has complete resource/transformation/charge/development arrays, terminal bundles are handed directly to History save, and Live restores authority.
- `npm run check:links`, `npm run check:structure`, and `git diff --check` — passed; structure reports only existing size/count warnings.

## Phase 4 baseline — continuous sphere shell

- Starting revision: `aa5afcb feat: make visual History truthful`; branch: `main`; no unrelated dirty files.
- Confirmed root cause: duplicated dual-cell corners are assigned owner-cell radial relief in `VS_GLOBE`, so adjacent fans no longer share a transformed boundary. Canvas separately alpha-fills cells and skips center-back-facing cells, allowing background hairlines/limb holes.
- Baseline trusted normal-art browser evidence from Phase 3 retained four WebGL draws and measured title render mean 0.86 ms / p95 1.00 ms; forced Canvas rendered the same semantic World path. No controlled uniform-shell pixel fixture existed at this revision.
- Decision: retain the four-draw WebGL composition; flatten the globe's position transform, preserve depth through fragment material, establish a Canvas opaque substrate, and add a developer-only uniform fixture with center/limb pixel evidence before claiming continuity.

## Completed Phase 4 — continuous sphere shell

- Removed every owner-cell radial relief term from the WebGL globe position path. The duplicated dual corners now pass through the exact same unit-shell position, while fragment material preserves terrain/life depth and the normal world remains four draws.
- Canvas now paints a dark opaque disk substrate before its translucent cell materials. It retains whole-cell terrain, overlays, and boundaries, but background-colored anti-aliasing gaps and center-facing limb omissions cannot expose the page field.
- Added a developer-only uniform continuity fixture shared by both renderers. It disables normal material/boundary/atmosphere variation, renders two camera directions, reads the actual WebGL/Canvas pixels, and rejects every background-like pixel through the center and limb masks (including connected-component evidence). The normal page has no fixture route.
- Inspected normal-art WebGL and Canvas screenshots at center and limb after the change; both retain legible cell material and no visible background holes.

## Verification after Phase 4

- `node --test tests/unit/renderer.test.js` — passed, 17/17; it protects shared copied corners, the flat vertex position path, Canvas substrate, uniforms, and the four-draw contract.
- `npm run test` — passed, 186/186 unit and 76/76 integration tests.
- Trusted `npm run test:browser:file`, `npm run test:browser:fallback`, and `npm run test:browser:canvas` — passed. The two-direction 1440×900 fixture measured zero background-like pixels and zero background components in both center and limb masks: WebGL samples 88,700 center / 67,856 limb pixels; Canvas samples 141,744 center / 108,400 limb pixels. Normal Worker/fallback/Canvas screenshots and the four normal WebGL draws remained valid.
- `npm run audit:cell-visuals` — passed with no violations. `npm run benchmark` — passed at 5,993 ticks/s against the 3,000 floor; renderer browser timing remained around 0.85–1.20 ms mean/p95 in the final Worker path.
- `npm run showcase:check`, `npm run check:links`, `npm run check:structure`, and `git diff --check` — passed; structure reports only existing size/count warnings.

## Phase 5 baseline — authored Evolution, ecology, Luminous, realized SCORE

- Starting revision: `c905899 fix: restore continuous cell sphere shell`; branch: `main`; no unrelated dirty files.
- Confirmed root causes: the f5/252 six-root graph contains procedural resonance filler; World Potential is still an authoritative SCORE multiplier and a visible predictive UI concept; first charge requires deep recipe ownership; fresh smoke cohorts last 282.2–367.4 seconds with peak Environment Levels 3–5, contrary to the intended fragile opening.
- Baseline: `npm run balance:smoke` passed with the retained 12-run report above. `npm run audit:luminous` passed only because its old breadth fixture owns all 252 cells; at tick 300 it charged 2,249 cells, which does not prove first-purchase value. The next audit must use explicit authored fixtures and separate development/holdout seeds.
- Decision: replace the old graph/current-only schema atomically with an authored frequency-2 42-cell sphere unless a durable 92-cell catalog is justified; delete World Potential authority and UI rather than hide it; retain exact transactions, physical adjacency, bounded cache, whole-cell charge, and production `RunController` cohorts.

## Completed Phase 5 — authored Evolution, direct ecology, Luminous, realized SCORE

- Replaced the procedural 252-cell/six-root resonance authority with the authored frequency-2 `EVOLUTION_CATALOG`: 42 durable cells, exactly one `First Division` root, real geodesic physical adjacency, named domains, authored text/effects/costs, exact level vectors, monotone quadratic refinement costs, and a bounded direct-effect compiler cache. Deleted atlas, recipe/build, potential, conditional, and filler authority rather than retaining compatibility paths.
- The compiled run configuration now installs direct traits, habitat capabilities, ecology, worldmaking, Luminous configuration, and affinity pressure defense once at `RunController` creation. Fresh Worlds have only the root frontier and cannot enter gated lake, cold, ocean, or deep habitats; capability audit fixtures follow actual physical lineages and show each path can occupy its enabled habitat.
- Retuned finite ecology so fresh development has a development-cohort median of 131.7 s and reaches Environment Level 1, while Foundation, Scarcity, Luminous, and mature fixtures causally improve distributional outcomes. Freshwater retains finite reserves and delayed local exhaustion but may spend faster through wider reach; its paired audit asserts that truthful tradeoff instead of a false every-seed lifetime guarantee.
- Made `Bioelectric Spark` the first Luminous purchase. It creates authoritative whole-cell charge from living flux, carries a bounded upkeep cost, decays whenever generation stops (including terminal collapse), clears on extinction, and is preserved in History. The Luminous audit records real first-purchase powered cells on suitable seeds and stronger mature charge without false fresh emission.
- Replaced World Potential and predictive result/Evolution UI with realized-only SCORE v6 and exact Echoes. SCORE components are monotone realized survival, exploration, presence, coherence, stewardship, and worldmaking, with bounded sustained Environment credit; settlement reconstructs terminal `RunController` authority from replay inputs before any Echoes transaction.
- Locked agent Evolution while a World is active, made canonical result comparison reject cyclic/over-depth DTOs without throwing, and added regression coverage for forged merit, active-World mutation, hostile DTOs, and collapse charge decay.
- Advanced current-only boundaries: meta 15, semantic History 10, agent save 6, result/replay 9, Worker protocol 11, and visual History `INHV` v3. Old documents and codecs reset/reject rather than migrate. Renderer and visual History use `luminousDevelopment`, not a presentation-only electricity field.
- Updated agents, trophies, audits, title showcase, browser scenarios, and documentation to the compact model. Specialist agents now use visible physical neighbor routes and save for a reachable target rather than diverting their planned domain; the smoke tournament reaches the first Luminous cell on both development seeds.

## Verification after Phase 5

- `npm test` — passed: 178 unit and 71 integration tests; focused authority, hostile-DTO, agent-settlement, and terminal-collapse tests also passed.
- `npm run balance:smoke` — passed. Fresh median 131.7 s; Foundation 156.1 s; Scarcity 206.3 s; Luminous 144.5 s with eight powered Worlds; mature 209.8 s.
- `npm run audit:habitats` — passed at 60 Worlds/configuration; fresh occupancy stays zero in every gated habitat, and physical-lineage packages reach lake, tundra, snow/ice, shallow edge/full ocean, and deep ocean.
- `npm run audit:luminous` — passed. It observes zero fresh false light, first-purchase real charge, stronger mature charge, live decay, extinction clearing, deterministic authority, and WebGL/Canvas semantic hierarchy; focused authority coverage verifies terminal-collapse decay.
- `npm run audit:freshwater -- --count=24`, `npm run audit:trophies`, `node scripts/agent-tournament.mjs --smoke`, and `npm run showcase:generate`/`npm run showcase:check` — passed after Phase-5 calibration repairs.
- Trusted `npm run test:browser:file`, `npm run test:browser:fallback`, and `npm run test:browser:canvas` — passed. Worker/fallback/Canvas evidence covers actual authored Evolution keyboard/pointer two-step activation, huge exact costs without overflow, real transformed/Luminous World snapshots, four normal WebGL draws, paired powered day/night luminance, and the continuous-shell pixel fixture.
- Final `npm run verify` — passed every local gate, including deterministic/authority audits, all smoke cohorts, terminal soak, showcase check, unit/integration suites, a 9,774 ticks/s benchmark against the 3,000 floor, and link/structure checks.
- An independent post-fix reviewer found no remaining blocker in active-World Evolution locking, hostile terminal DTO rejection, replay-backed settlement, or terminal-collapse charge decay.

## Evidence not yet obtained

- Physical-device, CI, and deployment evidence have not been obtained.

## Next coherent phase

- None for ecology-experience-v2: inspect the final diff, commit the coherent Phase 5 replacement, and begin future work from the current-only authority.
