# src/simulation/

Deterministic run-state evolution. **No DOM, audio, storage, or WebGL
imports.** The same `RunController` is authoritative in a Worker, fallback,
and `node:test`.

| Module | Responsibility |
|---|---|
| `state.js` | Typed-array authority, isolated streams, seeded inoculation. |
| `environment.js` | Entropy/season LUTs, renewal, toxins, event effects. |
| `metabolism.js` | Uptake, conversion, maintenance, stress. |
| `transport.js` | Flow, reinforcement, decay, pruning, reconnection. |
| `growth.js` | Seeded frontier expansion from habitat and resources. |
| `death.js` | Death, reclamation, sacrifice, terminal cascade. |
| `connectivity.js` | Largest-component BFS. |
| `events.js` | Seeded event schedule and footprints. |
| `summary.js` | Metrics, semantic milestones, events, passive offers. |
| `snapshot.js` | Compact transferable renderer observations. |
| `result.js` | Plain result including offers, history, and inoculation. |
| `replay.js` | Versioned decisions, bounded history, authority hash. |
| `simulator.js` | Non-blocking `RunController` and pure cell inspection. |
| `worker-entry.js` | Fixed-step Worker protocol. |

## Tick order (10 Hz)

`environment (every 5) → metabolism → transport → growth → death →
connectivity (every 20) → summary (every 10) → one passive decision →
extinction check`

## Authority invariants

- Status is only `idle`, `running`, or `extinct`; adaptation offers never pause.
- `adaptationOffers` is a fixed-option FIFO capped at eight records. Random
  mode is default and resolves exactly one pending offer per tick; manual mode
  keeps unresolved offers while simulation continues.
- World, event, growth, content, decision, and inoculation RNG streams are
  isolated. Random adaptation choice is exactly uniform among three options.
- Inoculation is a dedicated seeded weighted choice among suitable resource
  candidates, preferring land metadata when a world provides it.
- Snapshots expose only adaptation mode and pending count. Cell inspection,
  snapshots, results, and history queries never mutate authority or RNG.
- Replay schema 2 records offer, selection, and mode IDs/ticks/card indices;
  final hashes fold replay and owned decisions.
