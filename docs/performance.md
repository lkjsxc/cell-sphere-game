# Performance

## Budgets

- Simulation benchmark gate: at least 3,000 ticks/s on the audit host.
- WebGL2 world draw count: exactly four.
- Canvas 2D remains a semantic fallback with one opaque disk substrate; it adds
  no simulation work or WebGL draw.
- History, notifications, transaction receipts, visual checkpoints, and profile
  caches are bounded.
- Camera release sampling uses at most six entries from the latest 120 ms;
  inertia has a hard lifetime and no growing frame history.
- Result continuation updates its progress style at no more than about 30 Hz,
  exact assistive text only at second/state boundaries, and owns no second timer.
- Hidden documents suspend rendering; replacement renders one blank frame before
  a new World.

## Data layout

The living World uses typed arrays and reusable snapshot/renderer buffers.
Resource ecology updates authoritative cells without skipping ticks. Chronic
pressure retains current/next finite profiles and bounded exposure evidence;
it has no gameplay-event arrays or render buffers.

Evolution and Trophy projections should compile or patch only when their
underlying meta revision changes. Benchmark and scene-entry evidence must be
recorded for the exact revision tested; do not infer browser or device results
from unit tests.

The normal speed ladder changes wall-clock delivery, not tick content. Public
0.25×/0.5×/0.75×/1×/1.25×/1.5× becomes effective game rate 1/2/3/4/5/6 before
Worker or fallback debt accumulation. Each authority slice remains capped at 64
ticks with debt retained; diagnostic presentation cadence is selected from
effective rate. Camera and the 13.5-second Result continuation use animation
time and are not multiplied by speed.

## Commands

```bash
npm run benchmark
npm run terminal:soak
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
```
