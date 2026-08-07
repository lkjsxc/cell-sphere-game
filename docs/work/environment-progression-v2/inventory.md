# Current-state inventory

## Repository and instruction state

| Item | Observed state |
| --- | --- |
| Start commit | `2454b6d92e42c17fa3322fa9ac1a22ea2bac0197` |
| Branch/upstream/default | `main` / `origin/main` / `origin/main` |
| Intentional pre-existing work | root `AGENTS.md` modified to the supplied 2026-08-07 contract |
| Nested repository instructions | none tracked below the repository root |
| Product baseline | static selected/unlocked Environment frontier, not a live world clock |

## Reproduced rejected behavior

The production unit suite at `tests/unit/environment-level.test.js` currently names and passes these rejected behaviors:

1. a frontier protects worlds one and two and then recommends Level 1;
2. completion advances exactly one frontier and retry/lower selection does not skip;
3. legacy finite campaigns receive a frontier;
4. a static Level 0 has no harmful events and a static Level 1 has mild pressure.

The environment audit enumerates separate requested levels, including huge decimal levels. The smoke balance cohort reaches the old approximately 362-second ceiling for two policies. These are baseline facts, not v2 acceptance evidence.

## Initial dependency inventory

| Layer | Verified primary paths | Required v2 responsibility |
| --- | --- | --- |
| Frontier/domain | `src/game/environment-level.js`, `tests/unit/environment-level.test.js` | Replace frontier/attempt APIs with one versioned tick schedule, achieved-record helpers, profile/exposure validation, and huge-value canonical boundaries. |
| Static run pressure | `src/simulation/challenge-profile.js`, `state.js`, `environment.js`, `events.js`, `metabolism.js`, `transport.js`, `summary.js`, `result.js`, `snapshot.js` | Split immutable Level-0 world start from dynamic transition-installed pressure; remove a one-run static profile/event schedule. |
| Simulation authority | `src/simulation/simulator.js` and simulation unit tests | Install one documented per-tick schedule/transition order and remove normal rewarded ceiling authority. |
| Session/protocol | `src/core/world-session.js`, `src/core/run-protocol.js`, `src/interface/policies/run-session.js`, `run-result.js`, `src/interface/run-driver.js` | Remove mutable level from immutable identity; initialize/reset every run at Level 0; version Worker/fallback/replay envelopes. |
| Persistence/history | `src/platform/storage.js`, `history.js`, `run-transaction-store.js`, `src/history/*` | Archive `highestEnvironmentLevel` only as inert `legacyEnvironmentFrontier`; persist actual best achieved/new result evidence exactly once. |
| SCORE/Trophies | `src/game/scoring.js`, `src/game/trophies/*`, simulation result/summary | Version score exposure credit, validate results, and convert frontier criteria to dynamic evidence. |
| Interface/rendering | `index.html`, `src/interface/*`, `src/rendering/blank-snapshot.js` | Live HUD/progress; Result `Next World`; reset blank frame; no selected/retry/frontier language. |
| Fair agents | `src/agent/environment.js`, `observation.js`, `schema.js`, `policies.js`, CLI scripts | Remove static selection/retry; add bounded stepping plus externally budgeted incomplete terminal behavior. |
| Evidence/docs | `scripts/audits/environment-level-audit.mjs`, balance/agent/browser scripts, `README.md`, `docs/*.md`, module READMEs | Audit within-world escalation, bounded long worlds, and update all current prose. |

## Verified symbol and version inventory

| Contract | Current value / static coupling | v2 action |
| --- | --- | --- |
| Environment model | `ENVIRONMENT_LEVEL_VERSION = 1`; frontier APIs in `src/game/environment-level.js` | Replace active semantics with schedule version 2; retain only explicit legacy-frontier reader during migration. |
| Profile | `CHALLENGE_PROFILE_VERSION = 1`; static `initialResourceScale`, one `events` plan | Bump and make it a transition compiler; Level-0 resources remain immutable. |
| Simulation terminal | `RUN_CEILING_TICKS = 3600`, `RUN_HARD_MAX_TICKS = 3620`, `hard-maximum` | Delete normal completion authority; retain only causal stall/collapse and reward-free external budgets. |
| Identity | `WORLD_IDENTITY_FIELDS` includes `environmentLevel` and `challengeProfileHash` | Replace with schedule/model/start-config commitment; live profile is snapshot/result evidence. |
| Wire contracts | run protocol 5, replay 5 | Monotonically bump after live schedule payload is added. |
| Persistence | browser meta 11, History 6, WAL 2 | Migrate frontier/history explicitly and idempotently. |
| Progression results | SCORE 4, Trophy facts 5 | Bump score result semantics and audit fact consumers. |
| Agents | save 2, observation 2 | Bump save/observation and remove static actions. |

## Verified static update graph

```text
meta.runs/highestEnvironmentLevel
  → resolveEnvironmentAttempt (browser/agent)
  → compileChallengeProfile(selected level, Evolution)
  → createRunState (static resource scale, entropy LUT, all events)
  → RunController tick loops
  → static profile in snapshot/result/SCORE
  → frontierAfterEnvironmentCompletion result transaction
```

Static ceiling is enforced by `terminalCollapseReason()` in `src/simulation/state.js`; its terminal fade force-finalizes by 3620 ticks. Snapshot/result/replay preserve static `environmentLevel` and profile hash. Worker/fallback run-driver comparisons use the same mutable fields in identity.

## Initial dependency direction

```text
exact progression primitives
  → schedule/profile/exposure domain
    → simulation authority/event director/result
      → session/protocol/Worker/fallback
        → transaction/storage/History/Trophies
          → UI/rendering/agents/audits/docs
```

Detailed symbol and version inventories are added after source inspection before each affected implementation slice.

## Rejected active concepts

No production path may retain active behavior for selected, recommended, attempted, retried, unlocked, next, or frontier Environment Levels; `resolveEnvironmentAttempt`, `frontierAfterEnvironmentCompletion`, and `highestEnvironmentLevel` as an unlock state are migration-only legacy evidence at most.
