# Environment Progression v2 invariants

> **Historical record, superseded by Product Simplification v1 Phase 3.** It includes retired event and migration invariants and is not a current contract.

## Lifecycle

```text
create world → current/peak/start level = 0 → ticks advance schedule
→ transition installs dynamic pressure → ecological extinction → result
→ next world repeats from level 0
```

A prior peak, best record, legacy frontier, run ordinal, preference, seed, score, Evolution, renderer, UI state, speed, or tab visibility cannot choose a nonzero start.

## Public schedule

For the active schedule version:

```text
levelAtTick(0) = 0
levelAtTick(t + 1) >= levelAtTick(t)
tickForLevel(L + 1) > tickForLevel(L)
levelAtTick(tickForLevel(L)) = L
```

Evaluation is O(1) or O(log magnitude), exact at thresholds, canonical at arbitrary-length external level boundaries, and has no authored/content/gameplay maximum. A level duration is operationally nonzero. The public clock depends only on authoritative tick and explicit schedule configuration.

## State and identity

Live authority owns exactly named concepts equivalent to:

- `currentEnvironmentLevel`, `peakEnvironmentLevel`;
- `environmentLevelStartTick`, `nextEnvironmentLevelTick`, `environmentLevelProgressQ`;
- schedule/model/profile versions and canonical hashes;
- bounded current/next profiles, transition count, exposure, and recent transition evidence.

Mutable current level/profile hash is absent from immutable world identity. Identity commits only immutable start facts and versions. JSON/storage/History/agent/hash boundaries use canonical base-10 exact strings; no raw `bigint`, `Number()` conversion of arbitrary persisted exact values, locale formatting, `NaN`, or `Infinity`.

## Causal authority

One tick performs, in order:

1. increment authoritative tick;
2. derive schedule state;
3. process each due transition exactly once;
4. compile/install bounded dynamic pressure/event state;
5. run event authority;
6. environment, conditionals, metabolism, transport, worldmaking, growth, death, liveness;
7. summary/SCORE/History/snapshot;
8. natural terminal evaluation.

Worker and fallback invoke the same authority. Speed and presentation may decimate rendering/announcements but never ticks or transitions.

## Pressure and events

World topology, seed, inoculation, and Level-0 resource baseline are immutable after construction. Later levels only prospectively affect finite dynamic coefficients and conservation-accounted mechanics. Evolution changes effective pressure/survivability, never the public clock. Every finite defense is eventually exceeded.

Profiles are transition-compiled, deterministic, finite, hashable, and bounded in cache size. The director has bounded active/future/recent events, whole-cell footprints, minimum telegraph lead, deterministic isolated derivation, reclamation, and no historical-level-sized arrays. Onboarding is a separately visible/versioned modifier that leaves the clock unchanged.

## Results, economics, and persistence

Results record `startEnvironmentLevel: "0"`, final/peak level, bounded transition/exposure/time-at-peak/pressure evidence, and schema versions. SCORE is monotone live and rewards sustained authoritative exposure/quality rather than threshold-touch death. Result, Echoes, records, History, Trophy recognition, and seed cursor commit exactly once.

A legacy static frontier and legacy attempted-level History remain readable/inert and are never reinterpreted as new-model achievement evidence.

## Terminal and boundedness

There is no normal rewarded fixed run timeout. Technical watchdog/budget exhaustion produces error or `incomplete-budget`, never a scored completion. Fixed world resolution, profile cache, active/future events, evidence, History, traces, snapshots, render resources, and listeners stay bounded throughout long worlds.
