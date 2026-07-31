# src/simulation/

Deterministic run-state evolution. **No DOM, audio, storage, or WebGL
imports.** Runs identically in a Web Worker, on the main thread, and under
`node:test` — this is what makes golden tests and the balance harness honest.

| Module | Responsibility |
|---|---|
| `state.js` | Preallocated typed-array run state; stream separation; inoculation. |
| `environment.js` | Entropy/season LUTs, nutrient regeneration, toxin accumulation, event footprint application. |
| `metabolism.js` | Uptake, conversion, maintenance, stress (with adaptation interactions). |
| `transport.js` | One relaxation pass of energy flow; reinforcement, decay, pruning, reconnection. |
| `growth.js` | Frontier expansion: suitability × gradient × signal × crowding, seeded draws. |
| `death.js` | Shrink, death, edge deactivation, detritus reclamation, local sacrifice, terminal cascade. |
| `connectivity.js` | Largest-component BFS (amortized). |
| `events.js` | Seeded event schedule + footprint precompute; no-immediate-repeat family bag. |
| `summary.js` | Coverage/efficiency metrics, crisis accounting, event telegraphs, draft trigger. |
| `snapshot.js` | Compact renderer snapshots with transferable buffers. |
| `result.js` | Plain run-result projection + extinction-cause attribution. |
| `replay.js` | Compact decision log + final FNV-1a state hash. |
| `simulator.js` | `RunController`: the single orchestrator used by worker and fallback. |
| `worker-entry.js` | Worker message protocol + 50ms fixed-step timer. |

## Tick order (10 Hz)

`environment (every 5) → metabolism → transport → growth → death →
signal decay/charge regen → connectivity (every 20) → summary (every 10)
→ extinction check`

## Determinism rules

- All randomness through `simRng`/`contentRng` (xoshiro128**), fixed
  iteration order. `Math.random` never appears here.
- `Math.fround` at every state-array write.
- Speed only changes ticks-per-slice; `advance(n)` is the same code path at
  every speed, in every driver.
- Drafts pause the loop (`status: 'draft'`) until `decide`/`reroll`.
