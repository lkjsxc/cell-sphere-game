# AGENTS.md — current contract for coding agents
> Revision: 2026-08-03. Replace the previous root contract; do not merge stale
> rules back into this file. Applies repository-wide unless a narrower
> `AGENTS.md` overrides one local implementation detail.
## 1. Authority
Follow, in order: platform/system/developer instructions; the user's current
explicit task and corrections; this file; actual source/tests/schemas/deployment;
focused docs; status reports and old commits as historical evidence only.
A current user decision overrides stale repository prose and tests. Replace
tests that protect rejected behavior. `docs/status.md` is a commit snapshot, not
a constitution. Update this file whenever a task changes durable policy.
At the start of substantial work, inspect Git state/remotes/HEAD, actual GitHub and Pages identity, relevant source/tests, current deployment, and intentional uncommitted work. Reproduce reported behavior before assuming its cause. Never
reset or discard unrelated work merely to obtain a clean tree.
## 2. Canonical identity
The target identity is:
- product/package: `cell-sphere-game`;
- repository: `lkjsxc/cell-sphere-game`;
- Pages: `https://lkjsxc.github.io/cell-sphere-game/`;
- tagline: `Every extinction becomes memory.`
`incremental-network-game` is transitional legacy, allowed only in isolated
migration code, fixtures, or clearly historical evidence. Completing the
repository/package/UI/storage/Pages rename is authorized and expected. Never
preserve the old name because an older contract required it.
## 3. Product north star
This is a mobile-first passive-observation roguelite on a living spherical
cellular ecology. The player watches autonomous growth, inspects without hidden
steering, delegates or chooses Adaptations, understands change through metrics,
Event Log, and History, then converts extinction into persistent Evolution and
Trophy progression.
Default targets unless a newer task changes them:
- comprehension in roughly ten seconds;
- ordinary world roughly 270–330 game seconds;
- bounded terminal near 360 game seconds;
- first four-world resolution roughly 18–24 minutes at 1x;
- 32x executes every authoritative tick and normally finishes in roughly 8–12 seconds in the established browser environment;
- full Evolution/Trophy mastery is deliberately long-term, not capped near four
  hours.
Optimize for the strongest final product, not the smallest diff or preservation
of an intermediate architecture.
## 4. Cell-only visual grammar
A world cell is the smallest visible world-surface unit.
- Terrain, lakes, forests, organism state, crises, propagation, History highlights, Evolution, and Trophies are expressed through whole-cell material/state changes and adjacency.
- Do not draw sub-cell rivers, channels, paths, ribbons, center-to-center lines, inset waterways, within-cell geographic glyphs, or other world detail finer than one cell.
- Visible freshwater is represented primarily by connected whole-cell lakes,
  lake shores, and optional whole-cell wetlands.
- Internal drainage/flow fields may exist for generation and ecology, but must
  not appear as visible rivers or user-facing river systems.
- Remove obsolete fine river geometry rather than lowering its opacity.
- Anti-aliasing, lighting, atmosphere, selection outlines, and ordinary UI
  typography are not world-surface geography and may use pixel-level rendering.
Add source and browser gates that prevent finer-than-cell world geometry from
returning.
## 5. Current UX direction
- On wide layouts the globe has a stable right-biased anchor. Opening a surface
  never moves or resizes it.
- SCORE, ENTROPY, and REACH are visibly interactive metric controls with detail
  surfaces. Use `SCORE`, never `NETWORK SCORE`.
- Metric surfaces use a stable-height body; conditional content must not make
  them jump vertically.
- Result and History use the same large left-side detail-surface language as
  cell inspection. The globe and appropriate surrounding HUD remain visible.
  Each has a persistent control that can reopen it.
- Globe rotation must not close an open detail surface. Distinguish drag from
  blank-space tap.
- Event History is named and unified as `Event Log`. The compact current-event
  control remains visible at bottom-left on mobile and opens Event Log.
- The active-run dock shows time, speed, Adaptations, and `Menu`. It does not
  permanently show History or New World.
- Both time-dial hands visibly advance independently while world time is
  running, and both accelerate monotonically with the selected world speed.
  Reduced motion uses a slower speed-aware sweep instead of freezing the dial;
  pause and terminal states freeze it.
- `Menu` contains preferences and a confirmed New World action. `Settings`
  remains the inner preferences concept, not the active-run button label.
- Adaptations use a compact mobile surface and preserve 44px targets.
- Home, World/Result, Evolution, and Trophies use one stable radio/tab-like scene
  selector with the same order and position wherever it is shown.
- Temporary captions/toasts use the current extended duration policy, approximately 1.5x the original durations, through shared constants rather than scattered timers.
## 6. Result continuation and world replacement
Automatic next-world behavior is inactivity-only:
- each result begins eligible for one automatic continuation;
- any genuine pointer, touch, wheel, keyboard, focus, navigation, panel, metric, globe, or control interaction permanently cancels auto-next for that result;
- mouse movement alone and hidden-document lifecycle events are not interaction;
- hidden documents pause timing without preserving stale presentation;
- manual Next World remains available;
- a result generation may start at most one new world.
World replacement is an atomic transaction. Before the next authority starts:
- invalidate the old run/presentation generation;
- stop/terminate old authority;
- cancel old commands, requests, timers, captions, and continuation;
- clear snapshots, visual History, highlights, selection, offers, event state, Reach state, and all renderer dynamic buffers;
- install new fields and a blank snapshot tagged with the new world identity;
- visibly clear the old organism before accepting the first new snapshot;
- reject every stale old-run callback.
A previous world's cells or effects may never appear in the new world, including
for a single retained frame in WebGL2 or Canvas 2D.
## 7. Evolution and Trophies
- All 642 Evolution cells remain meaningful and eventually unlockable.
- Purchase eligibility is enough Echoes plus any one directly adjacent unlocked
  cell. Do not reintroduce `Worlds observed`, run-count gates, or all-parent
  requirements.
- Existing valid ownership migrates exactly and remains owned.
- Trophy criteria should represent real discovery/mastery, not trivial contact.
  Calibrate difficulty against production distributions and make full
  completion a long pursuit.
- Trophy recognition is deterministic, idempotent, visible at acquisition, and
  queued so simultaneous awards are readable.
## 8. Architecture and determinism
Default dependency direction:
`interface → rendering → simulation → world → core`
`game` supplies frozen content/pure progression. `platform` owns adapters.
Simulation imports no DOM, WebGL, CSS, storage, UI, or presentation clock.
Rendering never mutates authority. Interface uses explicit commands.
Use isolated deterministic RNG streams; never `Math.random()` in authority or seeded content. Worker and fallback use the same production simulation.
Reject stale run/session/request messages. Accepted commands are acknowledged;
rejections are explicit. Rewards, purchases, Trophies, extinction, abandonment,
continuation, and migration are idempotent exactly-once transactions.
Camera, menus, metrics, Event Log, History, quality, and visual effects do not
alter simulation or score.
## 9. Interaction contract
One natural gesture should dismiss/replace an old surface and execute the newly
targeted action exactly once. Do not globally swallow clicks or synthesize a
replacement click.
Dragging the globe while a detail surface is open rotates the globe and keeps
that surface open. A blank-space tap may dismiss according to the surface's
documented policy. Same-trigger activation toggles; Escape and Close work; focus
restoration never steals focus from a new target.
Test visible controls with real pointer/touch/keyboard input, not only
`HTMLElement.click()`. No dead control, decorative button, fake metric,
placeholder Trophy, or silent transaction failure is acceptable.
## 10. Persistence
Validate every loaded field. Migrate old schemas and product namespaces
idempotently. Verify canonical writes before ignoring legacy sources. Never
duplicate or lose Echoes, Skills, Trophies, Imprints, History, scores, run
counts, seed cursors, or rewards.
Imports may accept old exports; new exports use the canonical identity.
Corruption degrades field-by-field. Storage-unavailable sessions remain playable
and honestly report temporary persistence.
## 11. Development and structure
Work autonomously through:
`inspect → understand → decide → implement → test → measure → integrate →
document → commit → verify → report`
Do not stop at a plan, mockup, migration scaffold, narrow slice, or “foundation” commit. Prefer complete vertical slices. Delete dead code and obsolete tests in
the same turn. After two materially similar failures, change approach.
The old 200-line/16-child limits are maintainability heuristics, not product
laws. Prefer focused modules, but change the structure checker and docs when an
arbitrary threshold blocks a better architecture. Git history is the archive;
do not create `old/new/legacy/temp/v2` graveyards.
Production remains browser-native HTML/CSS/ES modules. Prefer JS/TS and Node for tooling. Avoid new shipped dependencies and verify contest constraints before
adding one. No per-cell DOM, per-frame geometry rebuild, normal-path canvas
readback, frame-loop shader compilation, or unbounded state.
## 12. Verification
Use focused tests during implementation and full relevant gates before release:
```bash
npm run test:unit
npm run test:integration
npm run balance:smoke
npm run benchmark
npm run check:links
npm run check:structure
npm run verify
npm run test:browser:file
npm run test:browser:canvas
npm run balance
npm run audit:events
npm run audit:lakes
npm run audit:skills
npm run audit:trophies
npm run terminal:soak
```
Replace obsolete `audit:rivers` with a lake/water audit; a temporary alias may
exist only during migration and must not preserve river presentation.
Do not weaken determinism, idempotency, migration, or integrity assertions.
Browser interaction defects require real pointer/keyboard input. Test fresh and
migrated saves, Worker/fallback, speed invariance, repeated auto-next cycles,
WebGL2, Canvas 2D, responsive viewports, and bounded memory. A skipped test is
not a pass. Physical-device claims require a physical device.
## 13. Git, deployment, and documentation
Make coherent commits; preserve history; never force-push unless explicitly ordered with understood consequences. Verify branch/upstream after push,
Actions and Pages for the exact reviewed commit, cache-busted public bytes, and
the public app where possible. Repository rename is authorized; update remotes,
workflows, Pages paths, docs, links, and migration transactionally.
Documentation follows implementation and does not freeze rejected behavior.
Update README, focused docs, this file, and `docs/status.md`. Use evidence terms
precisely: implemented, tested, measured, observed, deployed, modeled, target.
## 14. Completion and handoff
A task is complete only when requested behavior works in the real product;
conflicting behavior/dead code are removed; authority, Worker/fallback,
rendering, UI, persistence, and History agree; fresh/migrated states work;
relevant gates pass; responsive/accessibility paths are checked; performance
and memory remain bounded; docs are truthful; requested commits are pushed; and
the exact build is deployed when in scope.
Report starting/final commits, repository identity, root causes, product and
architecture changes, migrations, exact test/audit/browser results, hashes and
performance, responsive/accessibility evidence, push/CI/Pages revision, modeled
versus measured progression, limitations, and highest-impact next actions.
