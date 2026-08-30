# Performance

## Budgets

- Simulation benchmark gate: at least 3,000 ticks/s on the audit host.
- WebGL2 world draw count: exactly four.
- The WebGL2 atmosphere owns one module-scoped refinement-5 unit sphere:
  10,242 vertices, 61,440 `Uint16` indices, and 245,784 static buffer bytes.
  It is constructed once and uploaded only during renderer initialization or
  context restoration, never per frame or accepted snapshot.
- Canvas 2D remains a semantic fallback with one opaque disk substrate; it adds
  no simulation work or WebGL draw.
- History, notifications, transaction receipts, visual checkpoints, and profile
  caches are bounded.
- Camera release sampling uses at most six entries from the latest 120 ms.
  Gesture and motion state remain constant-size; the progressive mapping and
  five-second bound add no path history, timer set, or per-frame allocation.
- Result continuation updates its progress style at no more than about 30 Hz,
  exact assistive text only at second/state boundaries, and owns no second timer.
- Hidden documents suspend rendering; replacement renders one blank frame before
  a new World.

## Data layout

The living World uses typed arrays and reusable snapshot/renderer buffers.
Resource ecology updates authoritative cells without skipping ticks. Chronic
pressure retains current/next finite profiles and bounded exposure evidence;
it has no gameplay-event arrays or render buffers.

Evolution topology, immutable archetype layout, deterministic substrate, and
static level-4 geometry are built once per module/topology lifetime. An accepted
progression or selection change rebuilds one `O(cells + edges + archetypes)`
projection; unchanged animation frames perform zero edge-buffer updates. The
canonical projection uses 10,248 typed status bytes plus bounded exact arrays;
agent observations expose at most 224 compact candidates rather than 2,562
heavyweight objects. Benchmark and scene-entry evidence must be recorded for the
exact revision tested; do not infer browser or device results from unit tests.

The exact same-host Chrome 152 territory baseline p95 entry/snapshot/update/
steady measurements were Worker/WebGL2 `21.3/0.4/1.5/1.5 ms`, fallback/WebGL2
`23.2/0.7/2.3/1.8 ms`, and fallback/Canvas `6.8/0.5/2.4/2.2 ms`. Final
cell-authority receipts measure `15.8/0.8/1.9/1.4 ms`, `14.3/0.5/1.3/1.1 ms`,
and `8.2/0.5/2.6/1.7 ms` respectively. Percentage regressions in the sub-
millisecond projection samples and Canvas entry/update were investigated:
absolute steady work stays at or below `1.7 ms` p95, the expensive immutable layout/geometry is stable,
unchanged frames upload no edge bytes, and the measured product change replaces
2,562 presentation subdivisions with 2,562 truthful purchase cells and bounded
navigation. WebGL remains four draws with the same `1,838,196` static and
`325,152` dynamic bytes. The production agent smoke is also bounded and improves
from `19,790.6 ms` on the exact predecessor to `18,275.3 ms` on the final
same-host working tree (`−7.7%`). Repeated final cohorts and the canonical work
package own the stable comparison used for closure.

The atmosphere silhouette cutover's same-host Chrome 152 median-of-three
synchronized costs are baseline to fixed shell: steady p50 `0.800 -> 0.900 ms`,
steady p95 `1.000 -> 1.000 ms`, rotating p50 `0.900 -> 1.200 ms`, and rotating
p95 `1.500 -> 1.300 ms`. Cohort ranges overlap, neither p95 regresses, and no
p95 investigation threshold is reached. It retains four draws and zero static
uploads during frames.

The normal speed ladder changes wall-clock delivery, not tick content. Public
0.25×/0.5×/0.75×/1×/1.25×/1.5× becomes effective game rate 1/2/3/4/5/6 before
Worker or fallback debt accumulation. Each authority slice remains capped at 64
ticks with debt retained; diagnostic presentation cadence is selected from
effective rate. Camera and the 13.5-second Result continuation use animation
time and are not multiplied by speed.

## Commands

```bash
npm run benchmark
npm run test:browser:atmosphere
npm run test:browser:atmosphere:canvas
npm run test:browser:evolution-cells
npm run test:browser:evolution-cells:fallback
npm run test:browser:evolution-cells:canvas
npm run terminal:soak
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
```
