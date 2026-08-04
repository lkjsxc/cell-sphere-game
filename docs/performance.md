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
2772 ticks in 228 ms = 12,157 ticks/s
```

Real Chrome/WebGL2 vertical slice:

- 32× fresh world: 7.65 seconds wall time;
- draw calls: 4;
- title render mean: 0.71 ms;
- title render p95: 0.90 ms;
- no browser errors;
- context-loss fallback accepted Canvas frames.

Canvas 2D completed the same authority with terminal SCORE 10,822. These are
measured on the audit host, not physical-device claims.

## Data layout

The living world uses typed arrays and reusable snapshot/renderer buffers.
Evolution compiles 252 ownership cells only when meta changes; Trophy state uses
96 meaningful nodes. Event graph fields and habitat arrays are bounded by world
cell count. No active offer/card propagation buffers remain.

## Soak coverage

`terminal:soak` checks repeated world termination and replacement for bounded
listeners, timers, requests, snapshots, renderer state, and exactly-once rewards.
Browser replacement evidence checks old life/event/highlight buffers are empty in
the first accepted frame of the new world.
