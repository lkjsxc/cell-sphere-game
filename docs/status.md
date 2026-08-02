# Status

Truthful handoff after Gate 1: cellular ordinary-world life presentation.

- **Starting commit:** `62c26f9737a9b5f1564c7546053730f681331f38`.
- **Gate 1 commit:** repository HEAD with subject
  `refactor(render): make the organism a cellular world state`.
- **Branch:** isolated `gate1-cellular-world`; not pushed.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/> remains
  the earlier release and does not contain this isolated worktree commit.

## Gate 1 implemented

- Ordinary-world WebGL now has exactly five steady-state draws: still
  background, dual-cell terrain/life, quiet boundary/coast, terrain-bound river,
  and atmosphere.
- Organism route ribbons, active-edge transport lines, frontier point sprites,
  the decorative background orbit, and orange World Knot accents were removed.
  The production network pass and shaders were deleted.
- Living, topological-frontier, stressed, critical, and dead-remnant semantics
  are compact whole-cell materials. Frontier is a broad static inset as well as
  a color change. Selection and event effects resolve through cell material.
- Presentation snapshots no longer expose or transfer nutrient, edge activity,
  conductance, or flux. Authoritative simulation arrays, adjacent-edge
  transport, replay hashing, determinism, and balance remain unchanged.
- Title attraction and the current 108-node Memory scene use cellular alive
  paths and no longer construct display edge arrays. Memory nodes remain visible
  and selectable pending the later atlas gate.
- Canvas fallback projects existing dual-cell polygons for terrain, cellular
  life, cell-local events, quiet boundaries/coasts, selection, and geographic
  rivers. It no longer reads active edges or draws organism lines/markers.
- `assets/mark.svg` is now a contiguous filled-cell mark.

## Evidence

- Snapshot transferable typed-array payload at level 4: **102,426 → 25,620
  bytes** (−76,806 bytes, −74.99%). New payload is biomass, stress, alive, and
  one-byte semantic state per cell.
- Real headless Chrome/WebGL2 at 390×844 and 1440×900 completed the observational
  loop, result, Memory selection/purchase, and persistence with no browser
  errors. Draw count is **5**.
- Same Chrome title submission harness before Gate 1: mean **0.11 ms**, p95
  **0.30 ms**. Final Gate 1 sample: mean **0.04 ms**, p95 **0.10 ms**. These are JS
  render-call submission timings, not GPU frame time, and are single runs.
- Node v22.22.3/Linux x64 benchmark after Gate 1: 2,910 ticks in 162 ms =
  17,953 ticks/s; deterministic hash `98333073`; 10 MB reported heap.
- `npm run verify`: structure, 107/107 unit, 11/11 integration, balance smoke,
  benchmark, and 77-module/9-HTML link checks pass.
- `npm run test:browser:file`: pass in real headless Chrome/WebGL2; 32× run
  reached result in 8.01 s; 5 draws; title mean 0.04 ms, p95 0.10 ms.

## Honest limitations / next actions

- Authority has no per-cell death timestamp. Dead detritus therefore has a
  distinct remnant material, but this gate does not claim a time-bounded
  “recently dead” state.
- Canvas fallback behavior is source/unit-covered but still lacks a dedicated
  forced-Canvas Chrome screenshot and timing sample.
- Memory remains a cellular projection of the existing graph; branch-specific
  atlas shape/material is reserved for the later atlas gate.
- Actual GPU time, physical-phone touch/thermal evidence, forced colors,
  screen-reader review, 200% zoom, campaign resolution, and trophies remain
  incomplete.
