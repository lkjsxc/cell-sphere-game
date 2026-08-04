# Performance

## Budgets

- Simulation benchmark gate: at least 3,000 ticks/s on the audit host.
- WebGL2 world draw count: exactly four.
- Canvas 2D remains a complete semantic fallback.
- Event, History, notification, result-key, and visual-checkpoint collections are
  bounded.
- Hidden documents suspend rendering and reduce authority work.
- World replacement retires old transport work and renders one static blank
  before the new world.

## Current candidate evidence

Latest `npm run verify` benchmark:

```text
median of 3 deterministic samples: 3176 ticks in 434 ms = 7,319 ticks/s;
samples 423/462/434 ms; 11 MB heap used
```

Real Chrome/WebGL2 vertical slice:

- public 8× fresh world: 37.98 seconds wall time;
- explicit `?dev=1` 256× fresh world: 1.72 seconds wall time;
- draw calls: 4;
- title render mean: 1.15 ms;
- title render p95: 1.30 ms;
- no browser errors;
- context-loss fallback accepted Canvas frames.

Canvas 2D completed the same authority with terminal SCORE 10,774. These are
measured on the audit host, not physical-device claims.

## Data layout

The living world uses typed arrays and reusable snapshot/renderer buffers.
Immutable freshwater/build access profiles are compiled once. Resource ecology
updates every living cell every tick and refreshes all cells on the same ticks
that environment authority can mutate unoccupied cells; this removes redundant
work without skipping an authoritative mutation. Evolution compiles 252
ownership cells only when meta changes; Trophy state uses
96 meaningful nodes. Event graph fields and habitat arrays are bounded by world
cell count. No active offer/card propagation buffers remain.

## Soak coverage

`terminal:soak` checks repeated world termination and replacement for bounded
listeners, timers, requests, snapshots, renderer state, and exactly-once rewards.
Browser replacement evidence checks old life/event/highlight buffers are empty in
the first accepted frame of the new world. The final 1,000-world soak ended with
zero invalid states, duplicate terminal messages, or liveness repairs; median
lifetime was 3,169 ticks and the maximum remained 3,620.
