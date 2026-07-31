# Performance

Performance and low-heat behavior are product features. This document records
budgets, evidence, and benchmark history. Claims without measurements are
marked **pending**.

## Budgets

### Rendering

| Mode | FPS target | DPR cap | Notes |
|---|---|---|---|
| Eco | 30 (15–20 idle, 8–12 Turbo) | 1.25 | minimal atmosphere/particles |
| Balanced | 45–60, settle 30 | 1.5 | restrained effects |
| Luminous | 60 | 2.0 | richer single-pass shading |

≤ ~8 primary draw calls/frame; one compact dynamic edge upload per snapshot;
no full geometry rebuilds; no DOM reads interleaved with GL writes; canvas
resizes only on CSS size or quality change.

### Simulation

- Ordinary 1× tick p95 < ~2 ms on a mid-range mobile-class CPU (**pending
  physical device**; desktop throttled evidence below).
- No allocation growth across a full run.
- 3,000-tick benchmark target: comfortably < 10 s of Turbo wall time.
- Connectivity/summaries amortized (every 10–20 ticks).

### Loading

- No external requests after static files load.
- Interactive title < 1.5 s after cache miss on an ordinary connection.
- No blocking init task > 100 ms on a typical desktop.

## Low-heat rules

Cap frame rate instead of rendering redundant frames · reduce DPR before
simulation fidelity · suppress particles/audio density at high speed ·
render on demand in menus · pause when hidden · preallocate hot-path memory ·
no large transparent overdraw · no frequent readbacks.

## Benchmark history

Format: date · commit · machine · environment · 3000-tick ms · ticks/s ·
checksum. Do not compare unlike environments directly.

| Date | Commit | Machine | Env | 3000 ticks | ticks/s | checksum |
|---|---|---|---|---|---|---|
| 2026-07-31 | (Gate B) | 20-core Linux, 32GB | Node v22.22.3 | full run 3,396 ticks / 197 ms | 17,234 | d02cae0d |

## Evidence log

- 2026-07-31: headless benchmark established: one full run (seed 20260731,
  balanced pilot with Signals) = 3,396 ticks in ~200 ms = ~17k ticks/s on a
  20-core Linux desktop (single thread), 7 MB heap. The 3,000-tick budget is
  met with ~5x headroom on desktop. Physical mobile verification: **not
  performed** — desktop numbers are not mobile numbers.
