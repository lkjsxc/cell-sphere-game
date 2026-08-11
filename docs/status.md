# Current status

## Ecology experience v2

- ENV LEVEL now opens a dedicated current Environment detail in the shared metric surface. It shows current/final level, progress and game-time timing, qualitative chronic-pressure dimensions, the strongest pressure, and terminal peak context. It never opens History.
- History remains independently reachable from its deliberate routes and retains Environment records as ordinary timeline records. Its stable controls sit above one timeline scroll owner; selected events are distinct.
- Visual History now uses current-only `INHV` v2 checkpoints carrying life, resource condition/richness, transformation, authoritative charge, Luminous development, and atmospheric wear. Loading or unavailable visual data is explicitly semantic-only; it cannot label live buffers as a historical checkpoint.
- The Environment detail reads immutable snapshot/result semantics, preserves metric-body scroll position, and throttles live redraws to at most one game-time second unless the level or terminal state changes.
- World metrics use fixed grid tracks, tabular values, and compact overflow handling; the terminal Result uses a footer outside its scroll body for its stable continuation status and primary Next World action.
- The Menu now contains only live-world History/New World, auto continuation, quality, motion, contrast, and collapsed local data/reset actions. Retired preference documents reset under settings schema 6; History retention is bounded internally at 24 worlds plus the byte cap.
- Gameplay-disaster authority remains removed. Chronic Environment pressure is profile-driven and current-only persistence remains meta 14, settings 6, semantic History 9, agent save 5, result/replay 8, and Worker protocol 10. Device-local visual History is a reset-only v2 codec/cache-v3 concern.

## Verification in this worktree

- Baseline: `npm run balance:smoke` passed but records the rejected long-run distribution; `npm run benchmark` passed at 3,098 ticks/s under concurrent baseline load.
- Phase 1: `npm run test:unit` — 185/185 passed.
- Phase 1: `npm run test:integration` — 71/71 passed.
- Phase 1: `npm run test:browser:file` and `npm run test:browser:canvas` — passed. The trusted browser path verifies ENV opens Environment detail, not History; live and terminal detail content; toggle/focus semantics; and 320×568 plus 844×390 usability.
- Phase 1: `npm run check:links` — passed. `npm run check:structure` has existing size/count warnings only after the active work-note README was added.
- Phase 2: `npm run test` — 185 unit and 71 integration tests passed.
- Phase 2: `npm run test:browser:file`, `npm run test:browser:fallback`, and `npm run test:browser:canvas` — passed. The trusted scenario covers all metric formatting thresholds (including a production-formatted huge SCORE and exact accessible value), terminal footer/countdown geometry at 200% text, all required 320×568 through 1440×900 viewports, collapsed simplified Menu, and Worker fallback/Canvas paths.
- Phase 2: `npm run verify` passed every fast local gate; after the final fixed-retention audit-caller repair, `npm run audit:trophies` and `npm run terminal:soak` were rerun successfully.
- Phase 3: `npm run test` (185 unit, 76 integration), `npm run showcase:check`, and trusted `npm run test:browser:file`, `npm run test:browser:fallback`, and `npm run test:browser:canvas` passed. Worker/fallback History evidence includes loading-state control deferral, direct terminal-bundle persistence before retirement, synchronous-fallback Live opening, and complete v2 checkpoint projection.

## Remaining product work

1. Remove cell seams in WebGL2 and Canvas 2D.
2. Replace the old Evolution graph, retune ecology, establish direct Luminous value, and remove World Potential through realized-only SCORE.

CI, deployment, and physical-device verification have not been performed.
