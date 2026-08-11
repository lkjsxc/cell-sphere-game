# Current status

## Ecology experience v2

- ENV LEVEL now opens a dedicated current Environment detail in the shared metric surface. It shows current/final level, progress and game-time timing, qualitative chronic-pressure dimensions, the strongest pressure, and terminal peak context. It never opens History.
- History remains independently reachable from its deliberate routes and retains Environment records as ordinary timeline records. Its stable controls sit above one timeline scroll owner; selected events are distinct.
- Visual History now uses current-only `INHV` v3 checkpoints carrying life, resource condition/richness, transformation, authoritative charge, Luminous development, and atmospheric wear. Loading or unavailable visual data is explicitly semantic-only; it cannot label live buffers as a historical checkpoint.
- The World sphere now uses one continuous WebGL position shell and an opaque Canvas substrate. Normal WebGL remains four draws; a developer-only two-camera uniform fixture measures zero background-like center/limb pixels in both backends.
- The Environment detail reads immutable snapshot/result semantics, preserves metric-body scroll position, and throttles live redraws to at most one game-time second unless the level or terminal state changes.
- World metrics use fixed grid tracks, tabular values, and compact overflow handling; the terminal Result uses a footer outside its scroll body for its stable continuation status and primary Next World action.
- The Menu now contains only live-world History/New World, auto continuation, quality, motion, contrast, and collapsed local data/reset actions. Retired preference documents reset under settings schema 6; History retention is bounded internally at 24 worlds plus the byte cap.
- Evolution is an authored frequency-2 sphere of 42 physical Skill Cells with exactly one `First Division` root. Physical adjacency, exact level transactions, and a bounded compiler cache are authoritative; direct effects grant traits, habitat access, ecology, worldmaking, Luminous behavior, and pressure defense without recipes or abstract builds.
- SCORE v6 and Echoes derive only from realized World outcomes. Terminal settlement reproduces terminal authority before minting Echoes and rejects forged or cyclic DTOs; fresh ecology is resource-limited and habitat-gated, while Luminous charge is whole-cell authority that decays through generation-free collapse and clears at extinction.
- Gameplay-disaster authority remains removed. Chronic Environment pressure is profile-driven and persistence is current-only: meta 15, settings 6, semantic History 10, agent save 6, result/replay 9, Worker protocol 11, and reset-only `INHV` v3 visual History.

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
- Phase 4: `npm run test` (186 unit, 76 integration), `npm run audit:cell-visuals`, `npm run benchmark` (5,993 ticks/s), and trusted Worker/fallback/Canvas browser paths passed. The uniform shell fixture records zero center/limb background-like pixels in two camera directions; normal WebGL stayed at four draws.
- Phase 5: `npm test` (178 unit, 71 integration), `npm run balance:smoke`, full habitat/Luminous audits, Worker/fallback/Canvas browser paths, and a final `npm run verify` all passed. Agent Evolution is locked during an active World so replay-backed settlement uses that World’s compiled configuration.

CI, deployment, and physical-device verification have not been performed.
