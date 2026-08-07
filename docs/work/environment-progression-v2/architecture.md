# Implemented architecture

## Canonical boundaries

`src/game/environment-level.js` is the sole public schedule source. It maps
canonical exact ticks to Level 0/current level, threshold, next threshold, and
fixed-point progress, and directly inverts a level to its tick. Schedule v2 is:
Level 0 at tick 0, Level 1 at tick 1200, then one rung per 600 ticks.

`src/simulation/challenge-profile.js` compiles the current exact level and
Evolution defense to finite runtime dimensions. It retains exact ratings for
comparison/hash boundaries and only finite coefficients in hot loops. State
retains current and next profiles, never a historical-level table. An
asymptotic bounded attrition dimension continues worsening after ordinary ramps
saturate, so a finite defense is eventually exceeded.

`src/game/environment-exposure.js` accumulates exact bounded result evidence:
total ticks, pressure-time, quality-pressure-time, time at final peak, and peak
finite pressure. SCORE v5 consumes this authority; it does not award a
threshold-touch correction at Result.

## Authoritative tick order

`RunController.step()` performs:

```text
increment tick
→ derive/install schedule transition and current/next profiles
→ advance rolling event director
→ apply conditionals
→ environment → metabolism → transport → worldmaking → growth
→ death → liveness → connectivity/summary/SCORE/History
→ natural terminal evaluation
```

The same controller is used by Worker and fallback. Frame cadence, speed, UI,
renderer, and tab visibility do not alter this order or skip ticks.

## State, events, and reset

`createRunState()` ignores old selected-level/profile input and creates a
Level-0 topology/resource baseline. It initializes current/peak level,
transition count, start tick, and exposure to zero. The visible onboarding
modifier suppresses harmful events only for worlds one and two; it never
changes the public clock.

`events.js` owns a deterministic isolated-RNG rolling director with at most six
active/future geometry records and eight recent summaries. Each generated
whole-cell event has a minimum telegraph and expired geometry is reclaimed.
No full-run schedule is precomputed or exposed.

Atomic replacement retires old authority, installs a typed Level-0 blank
snapshot, reserves immutable identity, then starts the replacement world.
Mutable level/profile state is absent from `WORLD_IDENTITY_FIELDS`.

## Result, protocol, and migration

Run protocol/replay v6, meta 12, History 7, transaction WAL 3, agent schemas
3, Environment model/schedule/profile 2, exposure 2, SCORE 5, and Trophy facts
6 carry the v2 semantic boundary. Result validation requires start Level 0,
derived transition count, valid exposure, and matching profile/schedule data
before the exactly-once transaction commits records, Echoes, History, and
Trophies.

Legacy readers preserve static frontier/attempt evidence explicitly and inertly;
new authority never consumes it.
