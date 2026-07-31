# Decisions

Concise records: context → decision → consequence → evidence. Not a diary.

## D1 — Zero runtime dependencies, no Tailwind/Bootstrap

Context: contest allows Bootstrap/Tailwind only; everything else prohibited.
Decision: use neither; hand-authored CSS tokens + native ES modules.
Consequence: full authorship signal for judges; no dependency risk; more
design work upfront. Evidence: `styles/`, `docs/contest-contract.md`.

## D2 — WebGL2 primary, Canvas 2D fallback, no WebGPU dependency

Context: target is desktop + smartphone Chrome; WebGL2 is universal there.
Decision: WebGL2 with instanced ribbon veins; Canvas 2D playable fallback;
WebGPU only ever as an opt-in experiment after WebGL2 is excellent.
Consequence: reliable contest-environment behavior. Evidence: pending
renderer landing.

## D3 — Icosphere level 4 (2,562 nodes) as the single simulation resolution

Context: need organic branching yet mobile-friendly ticks; scores must be
quality-independent. Decision: fixed 2,562-node graph for all quality modes;
quality changes only rendering. Consequence: deterministic scores; ~3,000
ticks/run must stay cheap. Evidence: pending benchmark.

## D4 — Simulation in a module worker with main-thread fallback

Context: keep main thread free for rendering/input; GitHub Pages cannot
serve cross-origin isolation headers, so no SharedArrayBuffer.
Decision: identical `Simulator` class in worker or main; transferable
snapshot copies. Consequence: one code path, two drivers. Evidence: pending
speed-invariance tests.

## D5 — localStorage-first persistence

Context: saves are compact (settings, progression, trophies, archive
metadata + compact run records). Decision: versioned localStorage documents
with validation; IndexedDB only if archive volume proves to need it.
Consequence: simple, synchronous, corruption-safe. Evidence: pending save
tests.

## D6 — Deterministic LUT-based curves instead of transcendentals in ticks

Context: cross-browser `Math.sin` is not spec-pinned; golden hashes must be
stable. Decision: precompute seasonal/entropy LUTs; tick math uses only
+,−,×,÷,sqrt. Consequence: bit-stable simulation. Evidence: pending golden
tests.
