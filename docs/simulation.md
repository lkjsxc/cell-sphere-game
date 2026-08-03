# Simulation

Deterministic 10 Hz typed-array network authority. No DOM, rendering, storage,
or audio imports.

## Static inputs

A stable level-4 geodesic graph supplies 2,562 cells and 7,680 edges. The
immutable WorldModel adds land/ocean, elevation, connected whole-cell lakes,
lake depth/shore/freshwater influence, frozen lake records, climate, nutrients,
forest density, biome, region, hazards, features, landmarks, and central biome
factors. Rainfall and priority-flood drainage analysis remain private generation
details.

A dedicated inoculation RNG performs weighted sampling among ecologically
valid resource candidates above a plausibility floor; it does not always pick
the numerical optimum. The selected cell is recorded in replay, History,
inspector state, and result.

## Tick order

1. Rebuild the tiny effective trait block from compiled conditional skills.
2. Environment every 5 ticks: entropy/season LUTs, moisture/temperature,
   toxins, biome-scaled renewal, and per-cell graph-arrival event effects.
3. Metabolism: biome-scaled uptake/upkeep, energy, stress, tissue maturity.
4. Transport: terrain-cost-scaled flux, reinforcement, decay, pruning/rejoin.
5. Growth: seeded frontier trials using habitat, climate, resources, crowding.
6. Death/reclamation, then an exact liveness reconciliation over all 2,562 cells.
7. Zero living cells finalize immediately; spent tissue or the 360 s ceiling enters
   a bounded terminal collapse of at most 20 ticks.
8. Connectivity every 20 ticks.
9. Summary every 10 ticks: score metrics, geography/morphology milestones,
   crisis lifecycle, Adaptation offers, History batches.
10. Resolve at most one automatic FIFO Adaptation at the authoritative tick.

## Adaptations

Canonical status is `idle`, `running`, `terminal-collapse`, or `extinct`.
Offers never pause. Terminal state is monotonic and every run finalizes by tick
3,620; natural zero-liveness finalizes in the same authoritative tick.
Each record contains stable ID/index, offer tick/reason, three unique fixed
options, resolution tick/card/mode. Queue cap is eight; ordinary runs create at
most five. Manual commands validate offer and card IDs and apply once at the
current tick. Switching to Random resolves pending FIFO offers at no more than
one per tick. Random selection is exact-uniform through rejection sampling on
a dedicated xoshiro stream. Each accepted choice records a deterministic living
origin cell. The authority computes a versioned presentation-only `Uint16Array` arrival field
at that exact tick. Deterministic weighted shortest-path costs read biomass,
energy, stress, living degree, terrain, category, and a card/origin hash; dead
cells block traversal and a category-specific 28–40% cap keeps large components
local. The field never enters replay, result hash, card application, or RNG.

## Spatial events

Every scheduled family owns a deterministic weighted graph field with quantized
arrival time, influence, and predecessor. Drought, bloom, and blight traverse
land only; freshwater influence, lakes, shores, forest, moisture, altitude,
ridges, ocean inertia, and a stable directional wind alter family-specific travel. Authority applies each
cell relative to its own arrival. Snapshots transfer the exact current family
and strength bytes consumed by WebGL2 and Canvas; neither renderer reconstructs
a center/radius cap. Ended fields release their retained traversal arrays.

## Reach authority

`birthCell` and `killCell` are the only production writes to living state. Each
transition records one fixed cause into a 15-second ring of typed buckets and
full-run totals; eight recent representative cells per cause are retained.
Rolling gain minus loss exactly reconciles current living cells against the
window boundary, and full-run gain minus loss reconciles final liveness.
Snapshots carry top direct causes plus bounded supporting/limiting condition
scores. Results preserve complete cause totals and the strongest one-second
turning point. Inspection and highlighting are observational only.

## Observation

`inspectCell(node)` returns one compact dynamic record (life, biomass, energy,
nutrient, moisture, temperature, toxicity, stress, and internal transport
summary) and performs no writes. Presentation snapshots expose only biomass,
stress, alive, and explicit life-state cell arrays—never transport edges.
Snapshot/history/result serialization likewise consumes no RNG.
Observational-neutrality integration tests compare hash, score, cause,
Adaptations, History, replay, and Imprint after hundreds of queries.

## Replay and History

Replay schema 2 records strain, inoculation, mode changes, fixed offers, and
selections with authoritative ticks/card indices. The terminal hash folds
dynamic arrays, replay, inoculation, mode, version, and owned cards. History is
capped at 80 semantic events with deterministic final-slot reservation and
coalescing. Major events carry up to eight deterministic primary cells.
Cell-only approximate checkpoints are thinned below 256 KiB/run, use strict
`INHV` v1 decoding, and are retained for the newest ten worlds in IndexedDB.
Main-thread persistence converts stable event types/arguments into localized
presentation keys.
