# src/simulation/

Deterministic fixed-tick ecology. No DOM, audio, storage, WebGL, camera, or
wall-clock presentation imports.

| Module | Responsibility |
|---|---|
| `state.js` | Typed-array authority, isolated RNG, local ecology, world era. |
| `resource-ecology.js` | Baselines, finite stocks, state, conservation, presentation. |
| `environment.js` | Entropy/season LUTs, renewal, toxins, event effects. |
| `metabolism.js` | Local uptake, conversion, maintenance, stress, freshwater. |
| `transport.js` | Flow, reinforcement, decay, pruning, reconnection. |
| `habitats.js` | Capability requirements and pre-RNG access checks. |
| `lifecycle/` | Pre-RNG access, birth/death/growth, Reach, exact REACH 100. |
| `worldmaking.js` | Build-gated whole-cell transformations and electricity. |
| `events.js` | World-ordinal deterministic graph event fields. |
| `summary.js` | Metrics and semantic milestones. |
| `snapshot.js` / `result.js` | Plain presentation and terminal projections. |
| `replay.js` | Versioned command evidence and authority hash. |
| `protocol/` | Versioned Worker entry with explicit rejection. |

Tick order is environment → local renewal/metabolism → transport → pre-RNG
ecological growth → death → worldmaking/electricity → Reach/SCORE summaries →
terminal detection.

The same `RunController` runs under Worker, fallback, tests, balance tools, and
audits. Speed changes request more fixed ticks but never change tick content.
Worlds 1–2 schedule no harmful event fields; later schedules derive from the
persisted world ordinal. Active mid-run choice commands do not exist.
