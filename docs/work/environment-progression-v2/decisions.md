# Decisions

> **Historical record, superseded by Product Simplification v1 Phase 3.** Decisions about onboarding events and migration paths below are no longer current.

## 2026-08-07 — D1: Environment is a within-world public clock

Every production world begins at Level 0. Schedule v2 derives Level 1 at tick
1200 and later rungs each 600 ticks. Evolution influences effective pressure,
not the displayed clock. Static selection, retry, unlock, run-count start, and
frontier authority are rejected.

## 2026-08-07 — D2: Exact boundary, finite runtime

Canonical decimal progression arithmetic lives at schedule/compiler/persistence
boundaries. Current/next compiled profiles and interpolated finite coefficients
are the only live pressure state. Profile v3 retains an asymptotic attrition
dimension after ordinary ramps saturate, so no finite Evolution is immortal.

## 2026-08-07 — D3: Onboarding is explicit and separate

On worlds one and two, onboarding v2 disables harmful event candidates without
changing level, thresholds, pressure compiler, seed, resources, or scores.
World three uses the same clock with standard telegraphed events.

## 2026-08-07 — D4: Natural terminal, bounded director

The old normal approximately-360-second terminal is removed. Natural ecology
failure ends rewarded worlds; external agent budgets return `incomplete-budget`
without a result. A fixed-capacity rolling event director replaces a static
whole-run event list.

## 2026-08-07 — D5: Legacy is evidence, never authority

Migration preserves old `highestEnvironmentLevel` as inert
`legacyEnvironmentFrontier` and old History level as static attempted evidence.
Neither is a v2 best record or reward/Trophy input.

## 2026-08-07 — D6: Semantic boundary versions

The implementation keeps Environment model/schedule and exposure at 2, bumps
profile/event-director to 3, SCORE to 5, result/protocol/replay to 7,
meta/History to 13/8, WAL to 4, and agent save/observation schemas
to 3, and Trophy facts to 6. These versions travel with validation rather than
compatibility aliases in live authority.

## 2026-08-07 — D7: Early SCORE anchor calibration

SCORE v5 applies a bounded multiplier that tapers from 1.16 at fresh 16,000
Potential to 1.0 at 100,000 Potential. It is fixed by permanent starting
Potential, not current pressure, timing, or result state; breadth-complete
1,200,000 Potential remains unchanged. This restored the fresh/first-root
anchors while preserving sustained dynamic Environment credit as the only live
pressure reward.

## Pending release evidence

Local tests, audits, browser checks, long-agent cohorts, benchmark, and soak
are recorded in `status.md`. CI, Pages, and deployed-byte checks remain pending
until the reviewed commit exists remotely.
