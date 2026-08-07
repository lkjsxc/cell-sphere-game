# Migration matrix

| Contract / payload | v2 representation | Migration rule |
| --- | --- | --- |
| Meta schema 12 | `bestEnvironmentLevelReached`, best exposure/longest world, inert `legacyEnvironmentFrontier` | Never copy old static frontier into a dynamic best; all new worlds start 0. |
| History schema 7 | dynamic start/final/peak/transitions/exposure/profile evidence | Old static `environmentLevel` remains `attemptedEnvironmentLevel` under legacy model evidence. |
| Run protocol / replay 6 | immutable start config plus live schedule snapshot/result state | Mutable current level/profile hash is absent from identity; reject version/stale mismatch. |
| Profile/exposure | Environment model/schedule/profile/exposure 2 | Exact strings at boundaries; validate/rederive schedule from tick; finite hot-loop projection only. |
| Result/WAL 3 | start 0, final/peak/exposure, SCORE 5, transaction key | Validate consistency, then atomically/idempotently apply result/reward/records/History/Trophies. |
| Trophy facts 6 | actual dynamic peak and exposure facts | No new criteria from static frontier conversion. |
| Agent save/observation 3 | dynamic last result/clock/pressure/exposure | Old static attempt is legacy-only; select/retry actions reject; budget exhaustion is reward-free. |
| UI/browser export | live ENV LEVEL and dynamic Result fields | No static selection/retry/frontier control or implied next start level. |

## Version transition

| Boundary | Old | Current |
| --- | ---: | ---: |
| Environment model / schedule / profile | 1 | 2 |
| Exposure | — | 2 |
| SCORE | 4 | 5 |
| Run protocol / replay | 5 | 6 |
| Browser meta / History | 11 / 6 | 12 / 7 |
| Transaction WAL | 2 | 3 |
| Agent save / observation | 2 | 3 |
| Trophy facts | 5 | 6 |

## Recovery rules

1. Validate fields independently and degrade malformed dynamic fields to safe
   Level-0/new-model defaults.
2. Preserve old frontier/attempt fields only with explicit legacy labels.
3. A result transaction key is first-wins; duplicate delivery returns the saved
   outcome and never double credits/debits/appends.
4. Storage failure leaves a playable temporary session; it cannot invent a
   record, reward, or dynamic peak.
