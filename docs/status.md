# Current status

## Ecology experience v2

- ENV LEVEL now opens a dedicated current Environment detail in the shared metric surface. It shows current/final level, progress and game-time timing, qualitative chronic-pressure dimensions, the strongest pressure, and terminal peak context. It never opens History.
- History remains independently reachable from its deliberate routes and retains Environment records as ordinary timeline records.
- The detail reads immutable snapshot/result semantics, preserves metric-body scroll position, and throttles live Environment redraws to at most one game-time second unless the level or terminal state changes.
- Gameplay-disaster authority remains removed. Chronic Environment pressure is profile-driven and current-only persistence remains meta 14, settings 5, History 9, agent save 5, result/replay 8, and Worker protocol 8.

## Verification in this worktree

- Baseline: `npm run balance:smoke` passed but records the rejected long-run distribution; `npm run benchmark` passed at 3,098 ticks/s under concurrent baseline load.
- Phase 1: `npm run test:unit` — 185/185 passed.
- Phase 1: `npm run test:integration` — 71/71 passed.
- Phase 1: `npm run test:browser:file` and `npm run test:browser:canvas` — passed. The trusted browser path verifies ENV opens Environment detail, not History; live and terminal detail content; toggle/focus semantics; and 320×568 plus 844×390 usability.
- Phase 1: `npm run check:links` — passed. `npm run check:structure` has existing size/count warnings only after the active work-note README was added.

## Remaining product work

1. Stabilize HUD geometry, Result continuation visibility, and simplify the menu.
2. Rebuild History UX and visual truth, including resource/transformation/charge checkpoints.
3. Remove cell seams in WebGL2 and Canvas 2D.
4. Replace the old Evolution graph, retune ecology, establish direct Luminous value, and remove World Potential through realized-only SCORE.

CI, deployment, and physical-device verification have not been performed.
