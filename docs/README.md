# docs/

Project documentation. Every document describes the **actual implementation**;
claims without evidence are not allowed. Update docs in the same commit as the
behavior they describe.

| Document | Purpose |
|---|---|
| `vision.md` | Product thesis, target experience, non-negotiable timings, winning criteria. |
| `contest-contract.md` | Verified official contest facts, URLs, and the pre-submission checklist. |
| `game-design.md` | Run loop, decisions, adaptation categories, events, score, progression, trophies. |
| `architecture.md` | Module boundaries, state ownership, worker protocol, persistence, recovery. |
| `simulation.md` | Topology, typed arrays, tick order, units, determinism constraints. |
| `rendering.md` | Draw passes, buffers, shaders, quality modes, picking, Canvas fallback. |
| `performance.md` | Budgets, benchmark history, profiling evidence, device results. |
| `balancing.md` | Targets, bot policies, measured outcomes, tuning decisions. |
| `accessibility.md` | Implemented behaviors, manual test matrix, known limitations. |
| `testing.md` | Test layers, commands, golden scenarios, browser matrix, latest evidence. |
| `decisions.md` | Concise architecture/product decision records (context, decision, consequence). |
| `status.md` | Current truthful state: playable systems, gates, metrics, next actions. |
| `submission.md` | Final checklist, branch/tag plan, hosted-URL checks, form facts. |

Reading order for a new contributor: `vision.md` → `status.md` →
`architecture.md` → the domain doc for the area being changed.
