# Environment Progression v2

## Purpose

Correct the rejected cross-world Environment frontier into a deterministic **within-world** survival clock:

```text
new world (Level 0) → authoritative ticks → rising Environment Level
→ escalating pressure → extinction/result → Evolution → new world (Level 0)
```

This is the active cross-cutting migration package. The canonical repository contract is the user-supplied root [`AGENTS.md`](../../../AGENTS.md), revision 2026-08-07.

## Baseline

- Started from `2454b6d92e42c17fa3322fa9ac1a22ea2bac0197` on `main` tracking `origin/main`.
- The worktree intentionally already contained the updated root `AGENTS.md`; it is not discarded or overwritten.
- `tests/unit/environment-level.test.js` passed while explicitly asserting the rejected frontier, completion advancement, retry/lower-level behavior, and static Level-0/Level-1 assumptions.
- `scripts/audits/environment-level-audit.mjs` passed while auditing separate static level runs.
- `npm run balance:smoke` passed with `balanced` median 321 s and `expansion`/`resilience` at 361.9 s, evidence that the old normal ceiling remains active.
- `npm run benchmark` passed at 7,042 ticks/s (3176 ticks in 451 ms); full measurement is recorded in [`status.md`](status.md).

## Package map

| File | Purpose |
| --- | --- |
| [`inventory.md`](inventory.md) | Current dependency and rejected-semantics inventory. |
| [`invariants.md`](invariants.md) | Required authority, lifecycle, arithmetic, and boundedness rules. |
| [`architecture.md`](architecture.md) | Target ownership, update order, data flow, and recovery design. |
| [`migration-matrix.md`](migration-matrix.md) | Schema/protocol/replay/persistence migration plan. |
| [`verification-matrix.md`](verification-matrix.md) | Focused, integration, browser, agent, audit, and release evidence. |
| [`decisions.md`](decisions.md) | Dated engineering decisions and evidence. |
| [`status.md`](status.md) | Live implementation status and measured evidence. |

## Completion definition

This package closes only when production authority, Worker/fallback, identity, result transaction, persistence, History, UI, agents, audits, tests, and canonical docs agree that every new world begins at Environment Level 0 and the level rises only from authoritative ticks in that world.
