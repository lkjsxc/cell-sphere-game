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

Evolution territory ownership and static level-4 geometry are built once per
immutable topology lifetime. Selection and upgrade emphasis rebuild only bounded
snapshot/edge bytes; unchanged animation frames perform zero edge-buffer
updates. Trophy and Evolution semantic snapshots remain bounded. Benchmark and
scene-entry evidence must be recorded for the exact revision tested; do not
infer browser or device results from unit tests.

Same-host Chrome 152 predecessor → territorial measurements are: WebGL warm
entry p95 `4.1 → 19.9 ms`, accepted update p95 `0.2 → 1.3 ms`, and steady frame
p95 `0.1 → 1.2 ms`; Canvas warm entry p95 `2.0 → 6.1 ms`, accepted update p95
`0.3 → 2.1 ms`, and steady frame p95 `0.2 → 1.9 ms`. WebGL remains four draws.
Its static/dynamic bytes are `28,836/5,112 → 1,838,196/325,152`; the compact
edge classification is `120 → 7,680` bytes. Canvas static/dynamic bytes are
`2,092/2,040 → 133,132/130,560`. The percentage increases were investigated:
absolute steady costs remain below 2.1 ms p95, the projection/geometry is cached,
and the measured player gain is complete 2,562-cell meaning plus exact connected
42-territory contact and visible edge hierarchy. Node construction is about
`2.55 ms` cold and never runs per frame.

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
npm run test:browser:evolution-territories
npm run test:browser:evolution-territories:fallback
npm run test:browser:evolution-territories:canvas
npm run terminal:soak
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
```
