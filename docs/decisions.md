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
Consequence: reliable contest-environment behavior. Evidence: `src/rendering/`
(WebGL2 + Canvas 2D); renderer logic unit-tested in Node, GPU path browser-
tested where the sandbox permits (D8).

## D3 — Icosphere level 4 (2,562 nodes) as the single simulation resolution

Context: need organic branching yet mobile-friendly ticks; scores must be
quality-independent. Decision: fixed 2,562-node graph for all quality modes;
quality changes only rendering. Consequence: deterministic scores; a run must
stay cheap. Evidence: `npm run benchmark` → 3,396 ticks / ~190 ms ≈ 17–19k
ticks/s on a 20-core desktop, stable hash d02cae0d.

## D4 — Simulation in a module worker with main-thread fallback

Context: keep main thread free for rendering/input; GitHub Pages cannot
serve cross-origin isolation headers, so no SharedArrayBuffer.
Decision: identical `Simulator` class in worker or main; transferable
snapshot copies. Consequence: one code path, two drivers. Evidence:
`tests/integration/determinism.test.js` (chunk 1/7/32 → identical hashes).

## D5 — localStorage-first persistence

Context: saves are compact (settings, progression, trophies, archive
metadata + compact run records). Decision: versioned localStorage documents
with validation; IndexedDB only if archive volume proves to need it.
Consequence: simple, synchronous, corruption-safe. Evidence: pending save
tests.

## D6 — Deterministic LUT-based curves instead of transcendentals in ticks

Context: cross-browser `Math.sin` is not spec-pinned; golden hashes must be
stable. Decision: precompute seasonal/entropy LUTs; tick math uses only
+,−,×,÷,sqrt. Consequence: bit-stable simulation. Evidence: determinism
tests pass; benchmark hash stable across runs.

## D7 — Canonical name `incremental-network-game` on every asserting surface

Context: the revised mission fixes the canonical identifier as
`incremental-network-game` (section 1: title, metadata, package name, storage
namespaces, share cards). The repo previously displayed "Incremental Network".
Decision: rename all nine name-asserting surfaces and the localStorage key in
one coherent change; keep the tagline and Japanese premise unchanged. The name
is language-neutral, so this is separate from full EN/JA copy localization
(still a tracked gate). Consequence: judge-visible identity matches the
submission contract; no shipped users exist, so the storage-key rename needs
no migration. Evidence: `git grep` shows zero remaining "Incremental Network"
in tracked source/docs; `npm run verify` green after the change.

## D8 — Renderer verified by Node logic + static uniform cross-check; GPU
render not capturable in this container

Context: the WebGL2 renderer must be proven, but this sandbox's seccomp profile
returns EPERM on the `socket` syscall for Chrome's network stack (curl and Node
connect fine), so headless Chrome cannot load the dev server — every flag
combination (`--no-sandbox`, `--single-process`, `--headless=old`, namespace
and feature disables) still fails with `ERR_ACCESS_DENIED`.
Decision: verify the renderer's pure logic in Node (camera/picking math,
instance packing) plus a static cross-check that every GLSL-declared uniform
is actually uploaded (a real typo/omission catcher), and ship
`scripts/browser-test.mjs` that performs the real GPU smoke test where the
environment allows and otherwise exits 77 (skip) with the exact signature —
never a false pass. `test:browser` is therefore intentionally outside the
required `npm run verify` gate set. Consequence: honest evidence — a GPU
render is claimed only when actually observed on real hardware or an
unrestricted CI runner. Evidence: `tests/unit/renderer.test.js` 8/8;
`scripts/browser-test.mjs` reports SKIP/77 here.

## D9 — Defer the 8 Hz / fixed-point numeric overhaul to a dedicated
rebaseline turn

Context: the revised mission specifies 8 authoritative ticks per game-second
(currently 10) and a fixed-point numeric convention (UNIT=4096, Uint16
resources; currently rounded Float32 + `Math.fround`). Both are named
requirements.
Decision: do NOT change them inside this turn. The current simulation is
green, deterministic, and speed-invariant; switching the tick rate rescales
every tick-denominated constant (entropy keyframes, draft milestones, signal
regen, prune age, event windows) and rebaselines the balance median and the
determinism fixtures, while the fixed-point migration touches every hot-path
equation. Doing either partially would risk the verified gates for no
playable gain this turn. Consequence: record the deferral explicitly; land
both in one later turn with full rebaselining (new simulation version,
updated golden checksums, before/after balance + performance reports per the
numeric-change protocol). The game-time targets (270–330 s median, ~360 s
ceiling) are tick-rate independent and already hold. Evidence: this record;
`docs/balancing.md` and `docs/simulation.md` to be updated in that turn.
