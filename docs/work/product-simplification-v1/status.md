# Product simplification v1 — status

## Scope and fixed decisions

This work applies the 2026-08-10 product correction in coherent vertical slices.
The first completed slice removes the public Entropy path, makes `ENV LEVEL`
an accessible route to current-world History, simplifies scene controls, and
restrains Result. The second completed slice makes History the sole temporal
surface. Gameplay disasters, World Potential, the old Evolution graph, and
legacy schemas remain explicit next slices, not retained design decisions.

- Starting revision: `a30f2661deeed591c069a6bb3d3cfcd8e2d8d7bf`
- Branch/upstream: `main` / `origin/main`
- Initial worktree: user-supplied replacement `AGENTS.md` only (plus ignored
  runtime subagent artifacts).
- The user-supplied `AGENTS.md` is the active repository contract.
- Completed Phase 1 commit: `2e2f63a980a4080674485ebd39feca6ee3ea424a`.

## Baseline evidence (2026-08-10, same host)

- Focused shell/history/session tests: 16/16 passed.
- `npm run balance:smoke`: passed. Balanced median 282.2s; expansion 367.4s;
  resilience 309.3s. This confirms the rejected long-world baseline remains.
- `npm run benchmark`: passed at 6,516 ticks/s; 4 WebGL draws; fresh benchmark
  run 245.9s; compiler cache 1,000 misses / 512 retained entries.
- `npm run test:browser:file`: passed. WebGL2 Worker route, 4 draws, title
  render mean/p95 1.19/1.40ms, terminal score 12,429, and 8x run 37.69s.
- A disposable CDP same-host warm-entry probe measured the actual current
  rebuild cost over eight entries: Evolution synchronous median/p95
  61.8/65.0ms and next-frame median/p95 132.8/134.3ms; it recreated 252
  semantic tree items each entry. Trophies synchronous median/p95 23.0/25.3ms
  and next-frame median/p95 94.7/96.7ms; it rebuilt all six grid rows (96
  semantic cells) each entry. The probe also observed four renderer draws.
- Dependency inventory confirmed: events/crises directly mutate authority;
  World Potential is a SCORE multiplier; the old Evolution sphere is
  frequency-5 / 252 cells with 180 generated fillers; `panel-surfaces.js`
  creates every Evolution preview; `trophy-surface.js` recreates its grid.

## Phase 1 — World shell simplification

Implemented in the current worktree:

- HUD order is SCORE, REACH, ENV LEVEL, RESULT; Result remains terminal-only
  and last.
- Entropy has no public control or metric detail route.
- ENV LEVEL is a 44px native button. It opens current-world History with the
  Environment filter selected, anchors the latest transition at or before the
  current tick, and shows clear Level 0 context before the first transition.
- Result is restrained rather than gold/recommended/animated. Its footer is
  `Next World`, `Evolution`, `History`; Evolution is navigation only and does
  not reapply a result.
- Evolution/Trophy scene rails contain Menu and terminal-only Next World; Focus
  and scene-History controls plus their Home-key shortcuts are removed.
- Hour and minute hands use the same 1.5px width.

## Verification after Phase 1

- `node --test tests/unit/shell.test.js tests/unit/history-surface.test.js tests/unit/clock.test.js tests/unit/state-machine.test.js tests/integration/world-session.test.js tests/integration/history-codec.test.js` — 36/36 passed.
- `npm run test:unit` — 199/199 passed.
- `npm run test:integration` — 78/78 passed.
- `npm run test:browser:file` — passed (WebGL2 Worker).
- `npm run test:browser:canvas` — passed (Canvas 2D).
- `npm run test:browser:fallback` — passed (WebGL2 with fallback simulation). The first post-review attempt exposed a timing-sensitive Trophy queue assertion; holding the existing queue immediately when Result appears made the presentation check deterministic, and the retry passed.
- Independent correctness and accessibility reviews found no functional blocker, then identified/fixed Result→Evolution focus restoration, production transition-anchor coverage, terminal footer responsive coverage, and one stale accessibility sentence.
- The browser suite now verifies a real terminal Environment transition anchor, Result→Evolution focus on the Evolution scene tab, unchanged result transaction state through navigation, and all three Result footer actions at supported terminal viewports.
- `npm run check:links` — passed (146 modules, 11 HTML refs).
- `npm run check:structure` — passed with existing maintainability warnings. The first run correctly exposed runtime `.pi-subagents/` artifacts and the new work-note directory; `.pi-subagents/` is now ignored and the required minimal work-note README is present.

## Phase 2 — one bounded History surface

Implemented:

- Deleted `inspection/event-log-surface.js`, its current-event HUD card, History
  cross-link/footer, Menu action, controller model/routes, and every related
  shell style.
- History now owns one always-visible, bounded Timeline section instead of a
  collapsed Event Log preview. It remains the only temporal surface and patches
  a current-world Timeline immediately when a live History batch arrives.
- Semantic authority records are retained for History while the next slice
  deletes disaster authority; no event card or event-specific route remains.
- In short landscape World layouts, the context shell begins below the HUD so
  a metric control is never obscured; Evolution detail keeps its prior compact
  geometry.

## Verification after Phase 2

- `node --test tests/unit/shell.test.js tests/unit/state-machine.test.js tests/integration/world-session.test.js` — 16/16 passed.
- `npm run test:unit` — 199/199 passed.
- `npm run test:integration` — 78/78 passed.
- `npm run test:browser:file` — passed (WebGL2 Worker; responsive History,
  live Timeline patching, and terminal shell evidence included).
- `npm run test:browser:canvas` — passed.
- `npm run test:browser:fallback` — passed (WebGL2 fallback simulation).
- Independent review found and the browser suite now covers an open History
  Timeline failing to patch a live batch; stale Event Log documentation and
  test commentary were removed.

## Next coherent slice

Delete the entire gameplay-disaster authority chain together: director/content/state,
environment application, summary publication, snapshot/render buffers,
crisis-dependent skills/trophies, transaction fields, and a targeted no-disaster
audit. Do not remove ordinary DOM input events. The clean SCORE/schema and
Evolution rebuild follow only after that authority boundary is coherent.
