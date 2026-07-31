# Simulation

Deterministic spherical network simulation. Pure data in, pure data out —
no DOM, audio, storage, or rendering dependencies.

## Topology

Geodesic icosphere, subdivision level 4:

- **2,562 nodes**, **5,120 triangles**, **7,680 undirected edges**
- mostly degree-6 nodes; exactly 12 degree-5 vertices (icosahedron corners)
- canonical undirected edge list from triangle adjacency, deduplicated
- static unit-sphere positions/normals in Float32Array; CSR adjacency
  (`nodeEdgeStart`, `nodeEdges`, `nodeNeighbors`) for O(degree) traversal

Generation uses only +, −, ×, ÷, and `Math.sqrt` (IEEE-correct per spec) —
no transcendentals — so topology is bit-identical everywhere.

## State (structure-of-arrays)

Per node (Float32Array unless noted):
`biomass`, `energy`, `nutrient`, `moisture`, `temperature`, `toxicity`,
`stress`, `signal`, `alive` (Uint8Array).

Per edge: endpoints `a`/`b` (Int32Array), `conductance`, `flux`
(Float32Array), `age` (Uint16Array), `active` (Uint8Array).

Preallocated once. Double-buffered only where previous-tick reads are needed
(transport). No allocation in hot loops: no objects, closures, combinators,
or string work per node/edge.

## Tick order (10 ticks / game second; a run ≈ 3,000 ticks)

1. **Environment** (every 5 ticks): entropy curve LUT, seasonal LUT,
   nutrient regeneration `regen·(1−entropy)·(base−current)`, moisture and
   temperature from base + season + events, toxicity accumulation/decay.
2. **Metabolism**: suitability = tolerance(moisture)·tolerance(temp)·(1−toxin);
   uptake = min(nutrient, rate·biomass·suitability·traits); energy += uptake;
   energy −= maintenance·(1+entropy·k); stress ±= (1−suitability)·rate.
3. **Transport**: one Jacobi-style relaxation pass of energy along active
   edges weighted by conductance; record `flux[e]`.
4. **Reinforce/prune**: conductance += k·|flux|·usefulness − decay; clamp;
   prune inactive below threshold after min age.
5. **Growth**: frontier nodes evaluate inactive neighbor edges by nutrient
   gradient, suitability, signal bias, crowding, traits; seeded PRNG draw;
   expansion costs energy; new node starts with thin biomass.
6. **Death**: energy deficit or stress > 1 shrinks biomass; biomass ≤ ε kills
   the node; edges to dead nodes deactivate.
7. **Signals**: exponential decay of `signal[]`.
8. **Summaries** (every 10–20 ticks): coverage, largest connected component
   (BFS), score accumulators, phenotype checks, extinction detection.

Terminal ceiling: after 360 game s a collapse cascade kills low-energy nodes
each tick, guaranteeing extinction.

## Events

Seeded schedule generated at run start: 6–10 events across the run, denser in
instability; family anti-streak shuffle. Each event: family, start/peak/end
tick, center node, angular radius, intensity. Telegraphed 10 s ahead.
Footprint = nodes within angular radius (precomputed at schedule time).

## Determinism rules

- xoshiro128** PRNG; all draws in fixed iteration order.
- Seasonal/entropy curves are precomputed LUTs (computed once per world).
- `Math.fround` at every state-array write in the tick.
- Speed changes only alter how many ticks run per real-time slice.
- Replay log records decisions/signals/speed changes as `[tick, type, …]`.
- Final hash: FNV-1a over quantized state arrays + summary.

## Units

Time in ticks (0.1 game s). Biomass/energy/nutrient are abstract conserved
units. All constants centralized in `src/game/balance.js` with unit comments.
