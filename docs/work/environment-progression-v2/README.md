# Environment Progression v2

> **Historical record, superseded by Product Simplification v1 Phase 3.** This package documents the former event-director and migration implementation; it is not current product or persistence authority.

## Purpose

Replace the rejected cross-world Environment frontier with one deterministic
within-world survival clock:

```text
new world (Level 0) → authoritative ticks → rising Environment Level
→ escalating effective pressure → extinction/result → Evolution
→ next world (Level 0)
```

The root [`AGENTS.md`](../../../AGENTS.md) is the canonical contract.

## Implemented ownership

- `src/game/environment-level.js`: version-2 exact tick/level schedule and
  explicit first-two-world onboarding modifier.
- `src/simulation/challenge-profile.js`: direct exact rating-to-bounded-profile
  compiler; current/next profiles only.
- `src/game/environment-exposure.js`: bounded exact pressure-time evidence.
- `src/simulation/{state,simulator,events}.js`: transition-before-consumer
  authority and rolling bounded whole-cell events.
- result, History, meta, transactions, Worker/fallback, interface, and fair
  agent modules carry dynamic start/final/peak/exposure evidence.

Static `highestEnvironmentLevel` and old History `environmentLevel` are read
only through explicit legacy migration paths. They cannot select a start level,
change pressure, award a result, or become a v2 best record.

## Package map

| File | Purpose |
| --- | --- |
| [`inventory.md`](inventory.md) | Implemented dependency and legacy-boundary inventory. |
| [`invariants.md`](invariants.md) | Authority, arithmetic, reset, and boundedness rules. |
| [`architecture.md`](architecture.md) | Actual ownership and update order. |
| [`migration-matrix.md`](migration-matrix.md) | Current payload/version migration rules. |
| [`verification-matrix.md`](verification-matrix.md) | Executed local evidence and remaining release checks. |
| [`decisions.md`](decisions.md) | Dated decisions and calibration choices. |
| [`status.md`](status.md) | Live work status; never treat planned work as evidence. |

## Completion definition

This package closes only after the reviewed revision has coherent production,
Worker/fallback, persistence, UI, agent, audit, browser, CI, and deployment
evidence. Local implementation and focused tests alone are not deployment proof.
