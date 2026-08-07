# Migration matrix

| Contract / payload | Old semantic | v2 semantic | Migration / compatibility rule | Evidence required |
| --- | --- | --- | --- | --- |
| Browser meta | `highestEnvironmentLevel` is an unlocked static frontier | `bestEnvironmentLevelReached` is an achieved dynamic peak | Preserve old value only as `legacyEnvironmentFrontier`; initialize new best only from trustworthy v2 results, otherwise `"0"`; never use either to start a run. | idempotent field-by-field migration, corrupt-field recovery, imported extreme legacy value starts at 0 |
| Live run state | selected static `environmentLevel`, static profile/hash | current/peak schedule state and bounded profiles | New production constructor ignores old selected/frontier state and creates Level-0 schedule state. | reset/start snapshots and no stale level |
| Immutable identity | static selected level/profile hash participates | immutable seed/config/version/onboarding evidence only | Remove mutable level from equality/hash fields; current profile hash belongs in snapshot/result. | identity unchanged across transitions, stale-message safety |
| Run / Worker / fallback protocol | static-level start configuration | schedule/model versions plus Level-0 start config and live snapshots | Monotonically bump affected protocol version; legacy envelopes read only in explicit legacy paths. | Worker/fallback/all-speed equality |
| Replay | static attempted level | deterministic tick schedule / transitions | Tag old replays as legacy; new replay commits schedule/profile/start config but no unbounded transition log. | legacy replay distinction, new deterministic replay |
| Result transaction | static attempted/completed level reward evidence | final/peak/exposure/time-at-peak evidence | Validate against authoritative result schema before exact once-only award. | forged result rejection, duplicate recovery |
| History | `environmentLevel` means attempted static level | start/final/peak + bounded exposure/transition evidence | Old entries get explicit legacy model/attempted field; do not rename to peak. | schema round trip, byte/count bounds |
| SCORE / Echoes | static profile environment bonus | versioned sustained pressure-time exposure evidence | Bump SCORE result semantics; legacy score records remain readable and never block current bests. | monotone live score, no terminal correction/farm |
| Trophy facts | frontier/attempted-level criteria | actual peak/sustained exposure/quality facts | Preserve legacy IDs/evidence inertly; never award v2 criteria by frontier conversion. | catalog/evaluator migration tests |
| Agent save/observation/actions | select/retry/advance static level and whole-run cap | start Level-0, bounded advance/observe, explicit external budget | Bump schemas; invalid legacy selection actions reject/retire; budget exhausted is incomplete/reward-free. | agent migration and long-world tests |
| UI / accessibility | next/retry/unlocked frontier copy | live ENV LEVEL, evidence, `Next World` | Remove all active static-level controls/text; History labels model semantics. | browser keyboard/pointer/touch/Canvas/fallback checks |

## Transaction recovery rules

1. A new terminal result has one immutable transaction key.
2. Validate run/session/version/result consistency before writes.
3. Apply result, exact SCORE/Echoes, records, History, Trophies, and cursor in one durable logical transaction.
4. On re-delivery, return the original outcome without a second debit/credit/append.
5. On partial/corrupt recovery, recompute only from valid authoritative result evidence; never infer new peaks from legacy frontier.

## Version policy

Current inspected values are: Environment model 1, challenge profile 1, run protocol 5, replay 5, browser meta 11, History 6, WAL transaction 2, SCORE 4, Trophy facts 5, agent save 2, and agent observation 2. Bump only contracts whose semantic payload changes, monotonically: environment model/schedule/profile, result schema, SCORE, run protocol, replay, browser meta, History, agent save, and agent observation. Record old→new values in [`decisions.md`](decisions.md) when chosen.
