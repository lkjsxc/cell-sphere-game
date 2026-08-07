# Implemented dependency inventory

| Area | Production authority | v2 responsibility |
| --- | --- | --- |
| Schedule/onboarding | `src/game/environment-level.js` | Exact direct tick↔level/progress API; worlds 1–2 event protection only. |
| Pressure compiler | `src/simulation/challenge-profile.js` | Exact public rating minus Evolution defense to finite current/next coefficients. |
| Exposure/SCORE | `src/game/environment-exposure.js`, `src/game/scoring.js` | Exact pressure-time evidence and monotone SCORE v5. |
| Simulation | `state.js`, `simulator.js`, `environment.js`, `metabolism.js`, `transport.js` | Level-0 creation, transition-first tick order, prospective pressure only. |
| Events | `src/simulation/events.js`, `summary.js` | Bounded deterministic rolling director, telegraphs, reclamation. |
| Identity/protocol | `src/core/world-session.js`, `run-protocol.js`, Worker/fallback drivers | Immutable start identity; live level only in snapshots/results. |
| Results/transactions | `result.js`, `policies/run-result.js`, `run-transaction-store.js` | Dynamic result validation and exactly-once commit. |
| Persistence/History | `storage.js`, `history.js` | Meta 12/History 8 dynamic records, interpolation evidence, and inert legacy migration. |
| UI | `surfaces.js`, `run-session.js`, `run-result.js`, `index.html` | Live HUD/progress, blank Level-0 frame, `Next World`. |
| Agents | `src/agent/{environment,observation,schema,policies}.js` | Fair dynamic observations; bounded Level-0 run control; selection/retry rejection. |
| Verification | environment/event/terminal/number/trophy audits, balance, benchmark, browser scripts | Production-module checks rather than copied models. |

## Deliberately retained legacy boundary

Only explicit storage/History/agent migration readers recognize old static
values: `highestEnvironmentLevel` becomes inert `legacyEnvironmentFrontier`,
and old History `environmentLevel` becomes `attemptedEnvironmentLevel`. The
legacy run-count mapping is private migration support for old documents. None
is imported by world creation, profile compilation, score, reward, UI action,
or agent action authority.

## Risks still requiring release evidence

- Worker/fallback, normal/developer speed, pause/resume, and replacement
  equality under the final source revision.
- Browser pointer/touch/keyboard/Canvas visual evidence and stale-level absence.
- Long-world event/history/heap bounds, full campaign/holdout distributions,
  benchmark comparison, CI, Pages, and cache-busted deployed bytes.
