# Ecology experience v2 — status

## Starting point

- Starting revision: `9815c6daf35c62aef4e913cc33cb095fea353b2a`
- Branch: `main`
- Relevant dirty file on arrival: `AGENTS.md` (the user-supplied replacement contract; preserve and include with this initiative).
- Current Phase 3 dirty files: the History codec/recorder/preview, History surface/playback, visual-cache namespace, Worker route, title showcase, browser/unit/integration tests, and current documentation; no unrelated user changes are present.
- Host: Linux x64, Node `v22.22.3`, 20 CPUs; Chrome/WebGL2 and forced Canvas 2D are available through the trusted file-CDP harness.

## Confirmed root causes

- `ENV LEVEL` was wired to `openEnvironmentHistory()` and exposed History semantics in markup and assistive text; that retired route is now deleted.
- The current snapshot already carries the schedule and pressure-summary fields needed for a dedicated current Environment detail.
- HUD metric slots were content-sized flex items; Result continuation text sat in the scrollable Result body.
- History visual playback could label an unavailable historical selection while the renderer fell through to live dynamic buffers; its v1 codec omitted resource, transformation, charge, and Luminous-development channels. The replacement must keep past-world loading neutral rather than falling through to current authority.
- A Worker can be retired immediately after extinction, so requesting its visual buffer only after Result handling could lose terminal visual History. Fallback delivery is synchronous, so initial current History must establish Live state before its buffer callback arrives. Stale current-world buffer replies also need a selection load token.
- `RunController` accepts the complete unsigned 32-bit seed word while old History/cache validators only accepted player-code-sized 30-bit seeds; terminal full-word worlds therefore needed an exact visual/semantic persistence boundary.
- Per-cell radial displacement of duplicated dual-cell boundary vertices is the likely sphere-crack cause; Canvas independently fills adjacent polygons.

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

## Evidence not yet obtained

- Uniform-shell seam, Luminous luminance, deep cohort, physical-device, CI, and deployment evidence.

## Next coherent phase

Implement Phase 4: restore a continuous sphere shell in WebGL2 and Canvas 2D, with a controlled uniform-material center/limb browser fixture.
