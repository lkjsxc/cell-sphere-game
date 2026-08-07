# Target architecture

## Ownership

Create a focused production Environment Progression boundary (directory layout may adapt to existing conventions):

```text
src/game/environment-progression/
  schedule.js  # canonical tick ↔ level/progress/threshold source
  profile.js   # direct exact level → finite dynamic pressure compiler
  exposure.js  # bounded cumulative authoritative evidence
  schema.js    # canonical external validation/hash input
  README.md
```

No UI/test/audit copies schedule formulas. Existing `src/game/environment-level.js` becomes a narrow compatibility reader only during migration and is deleted or reduced once all production imports move.

## Schedule and profile contract

- The schedule accepts canonical non-negative tick/level input and returns current level, level start, next threshold, and fixed-point progress.
- It evaluates directly with integer/fixed-point math and exact threshold-neighborhood tests; it does not enumerate past levels.
- The profile compiler accepts a huge canonical level plus immutable Evolution/start defense and returns finite bounded runtime dimensions, event parameters, exact public ratings, and a deterministic canonical hash.
- Runtime state retains only current and next profiles. Arbitrary precision remains outside per-cell/per-edge loops.
- Selected coefficients interpolate by schedule progress only; immutable world-generation fields never interpolate.

**Selected schedule for the first production v2 slice.** `tickForLevel(0) = 0`; for `L ≥ 1`, `tickForLevel(L) = 1200 + (L − 1) × 600` at the canonical 10 ticks/second. Thus the calm Level-0 opening lasts 120 seconds and Levels 1/2/3/4 begin at 120/180/240/300 seconds. The inverse uses one exact subtract/divide operation. These constants are versioned source data and will be calibrated through production training/holdout cohorts; they are not copied into tests or prose formulas.

## Dynamic authority data flow

```text
immutable Level-0 start configuration
 + authoritative tick + schedule version
 + compiled Evolution/onboarding modifier
       ↓
schedule state → transition detection → current/next profile installation
       ↓                          ↘ rolling bounded event director
finite effective pressure → ecology consumers → exposure/summary/SCORE/result
```

The event director derives candidates from immutable world identity and cadence/transition indices, not wall clock or `Math.random()`. It holds fixed-capacity active, telegraphed, and recent evidence queues. A presentation layer may coalesce notices but cannot skip authority.

## Session and protocol

`WORLD_IDENTITY_FIELDS` retain seed, run/session identifiers, presentation generation, schedule/profile/model versions, immutable start-config hash, onboarding modifier, and result transaction key. Snapshot/result fields carry mutable current/peak level and current profile hash. World replacement is first-wins: retire old authority/presentation, show a static Level-0 blank frame, reserve identity, then start one Level-0 authority.

## Result and transaction boundary

The authoritative result validates schedule/profile/exposure consistency before the transaction layer atomically applies SCORE/Echoes, best-achieved records, bounded History, Trophies, and seed cursor. Duplicate/stale/reordered result delivery returns the existing transaction outcome.

## Recovery and rollback

- Migration is field-by-field and idempotent; legacy static frontier/history values remain tagged and inert.
- A malformed new progression field degrades to safe Level-0/new-model defaults, not an inferred unlocked start.
- Storage unavailability retains playable session-only authority.
- Rollback remains possible by retaining versioned readers for old result/history/replay payloads; it must never reactivate static selection for new worlds.

## Risks to measure

1. threshold inversion at huge values and schema digit limits;
2. static profile consumers accidentally rewriting Level-0 start resources;
3. event determinism across Worker/fallback and high-speed stepping;
4. SCORE/Echo balance and instant-death farming;
5. long-world memory / old ceiling remnants;
6. stale identity comparisons and exactly-once transaction recovery;
7. HUD blank-frame flashes and accessibility announcement backlog.
