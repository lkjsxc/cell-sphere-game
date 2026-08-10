# Ecology experience v2 — status

## Starting point

- Starting revision: `9815c6daf35c62aef4e913cc33cb095fea353b2a`
- Branch: `main`
- Relevant dirty file on arrival: `AGENTS.md` (the user-supplied replacement contract; preserve and include with this initiative).
- Host: Linux x64, Node `v22.22.3`, 20 CPUs; Chrome/WebGL2 and forced Canvas 2D are available through the trusted file-CDP harness.

## Confirmed root causes

- `ENV LEVEL` was wired to `openEnvironmentHistory()` and exposed History semantics in markup and assistive text; that retired route is now deleted.
- The current snapshot already carries the schedule and pressure-summary fields needed for a dedicated current Environment detail.
- HUD metric slots are content-sized flex items; Result continuation text sits in the scrollable Result body.
- History visual playback can label an unavailable historical selection while the renderer falls through to live dynamic buffers; its v1 codec omits resource, transformation, and charge channels.
- Per-cell radial displacement of duplicated dual-cell boundary vertices is the likely sphere-crack cause; Canvas independently fills adjacent polygons.

## Decisions

- Reuse the existing metric surface for Environment detail rather than introduce a competing surface abstraction.
- Keep History available through its explicit History routes; delete the Environment-specific History opening route rather than preserve it as a compatibility path.
- Work in vertical slices: Environment route first, then HUD/Result/menu, then History truth, then rendering continuity.

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

## Evidence not yet obtained

- Metric threshold rectangle matrix, compact Result evidence, and simplified-menu evidence.
- Historical visual-truth, uniform-shell seam, Luminous luminance, deep cohort, physical-device, CI, and deployment evidence.

## Next coherent phase

Implement Phase 2: replace content-sized HUD metrics with stable grid tracks, make Result continuation and primary action permanently visible on compact screens, and delete redundant menu controls/settings with a current-only settings reset.
