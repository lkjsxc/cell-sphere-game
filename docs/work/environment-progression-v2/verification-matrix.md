# Verification matrix

Status legend: `baseline` = observed old behavior; `planned` = required before completion; `pass` only after a command/test actually passes.

| Area | Required evidence | Baseline / status |
| --- | --- | --- |
| Rejected semantics | Existing frontier unit tests demonstrate wrong model; replace them with negative/absence coverage. | baseline: observed |
| Schedule | Tick 0, exact thresholds/neighbors, monotonicity, direct inversion, huge canonical levels, hash/canonicalization, no build/seed/meta influence. | planned |
| Dynamic pressure | Level-0 immutable baseline, transition idempotency, current/next bounded profile cache, finite coefficients, relevant Evolution mitigation, no retroactive resource rewrite. | planned |
| Events | bounded active/future/recent queues, minimum telegraph, reclamation, deterministic candidate/footprint, onboarding separation, high-speed no skip. | planned |
| Terminal | fresh distribution near 270–330 s, no normal ceiling, every tested finite build dies, truthful causes, no instant-death reward farm. | baseline: smoke exposes ~362 s cap; planned v2 |
| SCORE/result | exposure arithmetic, monotone live score, peak/final/time-at-peak, forged evidence rejection, exact once-only reward. | planned |
| Identity/protocol | live level absent from identity, stale/reordered rejects, Worker/fallback/all speed/pause equality, atomic replacement/reset. | planned |
| Persistence | inert legacy frontier, legacy History distinction, import/export, storage unavailable, crash/duplicate recovery, bounded History. | planned |
| UI/accessibility | live HUD/progress, blank Level-0 frame, Next World reset, no static wording, keyboard/pointer/touch, reduced motion/high contrast/200% text/viewport coverage. | planned |
| Renderer | WebGL2 and Canvas HUD/result semantics; no stale level; Luminous charged-cell evidence remains authoritative. | planned |
| Agents | no static selection, bounded stepping, incomplete-budget no reward, fair observations, policies, production cohorts. | planned |
| Performance | before/after same-host throughput, schedule/profile huge benchmarks, long transition memory/event/cache/History soak, draw-count remains four. | baseline: 7,042 ticks/s; planned v2 |
| Release | unit/integration/browser/audits/balance/agents/links/structure/verify; commit/push/CI/Pages/cache-busted check if accessible. | planned |

## Required execution groups

1. focused unit and integration tests after each vertical slice;
2. `npm run test:unit`, `npm run test:integration`, `npm run balance:smoke`, `npm run benchmark`, `npm run check:links`, `npm run check:structure`, `npm run verify`;
3. browser file/Canvas/fallback tests and all listed relevant audits;
4. fair-agent smoke/campaign/long plus fixed training and untouched holdout cohorts;
5. long environment transition soak with deterministic hash, memory/event/cache/History bounds and replacement reset;
6. CI/Pages/deployed byte/browser verification when credentials and infrastructure are available.

Full command output and cohort distributions belong in `status.md` and canonical release documentation, not asserted here before they occur.
