# Performance

The product target remains mobile-first and low-heat, but thermal claims require
a physical device. Node throughput is simulation evidence only.

## Current measured evidence (2026-08-02)

Environment: Node v22.22.3, Linux x64, 20 logical CPUs.

- deterministic production benchmark seed 20260731: 2,910 ticks in 161 ms,
  18,089 ticks/s, 9 MB reported heap, hash `98333073`;
- current WorldModel, 100 worlds: mean 2.979 ms, median 2.690 ms,
  p95 4.077 ms, maximum 12.435 ms; hash `749bda35`;
- balance smoke medians: balanced 291.7 s, expansion 290.9 s, resilience
  292.2 s (n=4 each; diagnostic sample);
- real headless Chrome/WebGL2 390×844: mixed manual/Random production run at
  32× reached result in 7.97 s with no browser errors and four purchases;
- Balanced renderer: seven steady-state draws; instrumented JavaScript command
  submission on the title scene mean 0.09 ms, p95 0.20 ms (not GPU frame time);
- 100-run production soak: 267,523 ticks in 6.928 s, 0 invalid, max 5 offers,
  max 80 History events / 5,894 bytes; a separate forced-GC sample moved heap
  4.57 → 5.80 MB after 100 runs (Node evidence);
- 32 retained 49-event timelines serialized to 304,208 bytes (297.1 KiB);
- 100,000 Memory nearest-node picks took 341.46 ms (3.415 µs/pick).

## Runtime discipline

- Simulation stays fixed at 2,562 cells for all quality modes.
- Eco/Balanced/Luminous cap DPR at about 1.1/1.5/2.0; Auto uses memory/save-data
  hints. Quality never changes authority.
- Worker snapshots remain around 10 Hz at all speeds. Rendering falls near
  15 fps at 16×/32× and near 6 fps behind full-screen panels.
- Inspector requests are one compact record at no more than about 3 Hz.
- World rivers/forests/terrain and Memory placement are immutable per world.
- History is event-driven, ≤80 entries/run, and ≤700 KB serialized.
- Notices are capped at three simultaneous DOM nodes.

## Missing evidence

Actual GPU frame time, dense-run/Memory p95 presentation time, browser heap
trend, Canvas fallback browser timing, and physical smartphone temperature/
battery behavior remain unmeasured.
