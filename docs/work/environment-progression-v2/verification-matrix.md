# Verification matrix

`pass` means an actual command completed successfully on the local uncommitted
worktree. CI, Pages, and deployment remain separate evidence.

| Area | Required evidence | Status |
| --- | --- | --- |
| Schedule/compiler | thresholds, inversion, huge exact values, finite profile | pass: unit suite and environment audit |
| Reset/transition | Level-0 construction, one transition, current/next profile, prior peak reset, terminal-fade boundaries | pass: focused progression unit tests at 1200/1800 |
| Events | deterministic rolling candidates, player-visible telegraph, bounded/reclaim, onboarding, zero-net defense | pass: event unit tests and 210-world audit |
| Unit/integration | production authority/migration/transaction coverage | pass: verify ran all suites; current unit 194/194; integration 78/78 |
| SCORE/result | monotone exposure, no terminal correction/farm, exact once-only result | pass: score trace, transactions, campaign audit |
| Identity/protocol | immutable identity, stale handling, Worker/fallback/speed/replacement | pass: real production Worker-thread/fallback terminal parity plus browser Worker/fallback paths |
| Persistence | inert legacy frontier, legacy History, import/export, recovery | pass: unit/integration, transaction/migration audits |
| Browser/accessibility | file/Canvas/fallback shell and input evidence | pass: all three browser commands |
| Renderer/Luminous | WebGL/Canvas charge and four-draw evidence | pass: browser commands and luminous audit |
| Agents | fair observations, no static actions, training/holdout cohorts | pass: smoke/campaign/long/holdout |
| Balance/terminal | fresh/breadth anchors, REACH rarity, finite deaths, no cap | pass: strict balance, campaign, reach, terminal soak |
| Performance/bounds | benchmark, events/history/cache/soak | pass: benchmark and verify audits |
| Release | commit/push, CI, Pages, cache-busted deployed bytes | pass: `cd533e3` pushed; Actions 31158862198 and Pages deployment 5791190693 succeeded; deployed bytes inspected |

## Key measured results

- `npm run verify`: exit 0, all 26 local gates (unit 194/194; integration 78/78).
- Browser: WebGL2 Worker and fallback plus Canvas paths pass; dynamic reference
  run SCORE 12,429, exactly four draws, and charged-cell evidence in both
  renderers.
- Strict production balance: six 30-run policy cohorts; balanced median 296.7 s.
- Full campaign audit: fresh median 10,504 SCORE/284.7 s; root 11,368; breadth
  1,099,367; first resolution 20.12 min.
- REACH audit: 19/300 breadth successes, zero fresh; tested breadth worlds
  naturally finished by 4,019 ticks inside a reward-free 10,000-tick budget.
- Long agent: 8 policies × 12 worlds. Holdout: four untouched seeds, 22
  policies, six worlds each, no failures.
- Follow-up authority hardening: real Worker/fallback parity reaches the same
  transition/event history, exposure, and terminal hash; History 8 and agent
  observation 4 preserve public interpolation evidence.

## Deployment limitation

The Pages deployment API confirms SHA `35d5b8ec161cade16932e50102b2b1653f59ae08`
and cache-busted bytes expose the v2 schedule/UI/source. A remote Chrome
interaction attempt was blocked by that browser's `ERR_INTERNET_DISCONNECTED`;
there is no claim of a deployed interactive browser session beyond the local
browser acceptance evidence.
