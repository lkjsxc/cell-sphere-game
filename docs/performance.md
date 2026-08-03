# Performance

The product target remains mobile-first and low-heat, but thermal claims require
a physical device. Node throughput is simulation evidence only.

## Current measured evidence (2026-08-03)

Environment: Node v22.22.3, Linux x64, 20 logical CPUs.

- deterministic production benchmark seed 20260731: 2,715 ticks in 185 ms,
  14,712 ticks/s, 9 MB reported heap, hash `813c4f49`;
- 500-seed whole-cell lake audit (with a duplicate deterministic generation):
  2,843.6 ms total, mean first-generation 2.776 ms, p95 3.732 ms, maximum
  24.097 ms, aggregate hash `0e7f6f17`, zero integrity/determinism failures;
- balance smoke medians: balanced 284.6 s, expansion 267.4 s, resilience
  353.2 s (n=4 each; diagnostic sample);
- real headless Chrome/WebGL2: mixed manual/Random production run at 32×
  reached result in 8.54 s with no browser errors, four purchases, and an
  unattended second-result → third-world transition;
- cellular renderer: four steady-state draws; instrumented JavaScript command
  submission on the title scene mean 0.07 ms, p95 0.20 ms (not GPU frame time);
- 100-world unattended transition soak: 271,785 ticks in 12.678 s, zero
  invalid/duplicate awards, 92 unresolved Manual offers carried safely through
  extinction, 24 retained worlds / 252,005 serialized bytes, 8 retained
  Imprints, and forced-GC heap 4.82 → 6.44 MiB;
- earlier simulation-only 100-run soak: 267,523 ticks in 6.928 s, zero invalid,
  max 5 offers and max 80 semantic History events;
- 32 retained 49-event timelines serialized to 304,208 bytes (297.1 KiB);
- a detailed visual History run encoded 101 frames / 259,594 bytes; decode was
  3.248 ms and 10,000 nearest-frame seeks took 1.357 ms;
- 100,000 Evolution Globe nearest-cell picks took 341.46 ms (3.415 µs/pick).

## Runtime discipline

- Simulation stays fixed at 2,562 cells for all quality modes.
- Eco/Balanced/Luminous cap DPR at about 1.1/1.5/2.0; Auto uses memory/save-data
  hints. Quality never changes authority.
- Worker snapshots remain around 10 Hz at all speeds. Rendering falls near
  15 fps at 16×/32× and near 6 fps while context surfaces are open.
- Inspector requests are one compact record at no more than about 3 Hz.
- World lakes/shores/forests/terrain and the 642-cell Evolution Globe are immutable per scene.
- History is event-driven, ≤80 entries/run, and ≤700 KB serialized.
- Notices are capped at three simultaneous DOM nodes.

## Missing evidence

Actual GPU frame time, dense-run/Evolution p95 presentation time, browser heap
trend, Canvas fallback browser timing, and physical smartphone temperature/
battery behavior remain unmeasured.
