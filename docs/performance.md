# Performance

## Budgets

- Simulation benchmark gate: at least 3,000 ticks/s on the audit host.
- WebGL2 world draw count: exactly four.
- Canvas 2D remains a semantic fallback with one opaque disk substrate; it adds
  no simulation work or WebGL draw.
- History, notifications, transaction receipts, visual checkpoints, and profile
  caches are bounded.
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

## Commands

```bash
npm run benchmark
npm run terminal:soak
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
```
