# Simulation contract

## Determinism

A world is determined by seed, world ordinal, selected Environment Level, the
exact sparse Evolution level vector, and versioned Evolution/challenge compilers.
World ordinal records history; it is not difficulty. Speed controls how many
fixed ticks are requested and never changes tick content. Worker and fallback
consume the same run-protocol-v5 configuration and command sequence.

RNG streams are subsystem-specific. Presentation has no RNG stream in authority.
Habitat and local-resource rejection happen before growth RNG consumption, so a
locked or depleted destination cannot perturb unrelated random choices.

## State

Authoritative state includes typed arrays for life, biomass, energy, stress,
network structure, event strength, immutable per-cell resource baselines,
available nutrient, reserve, recyclable stock, catchment reserve, quantized
resource/recovery state, habitat-block reasons, whole-cell transformations,
electric charge, and lifetime unique habitat occupancy. Bounded ledgers track
Reach, exact-coverage streaks, connectedness, resource conservation, SCORE merit,
crises, and diagnostics.

State excludes DOM, storage, WebGL, camera, frame cadence, wall-clock time,
History playback, menu state, and notification state. Exact levels, costs,
Echoes, Potential, SCORE, and Environment ratings use `bigint` between worlds
and canonical decimal strings at boundaries. Only bounded finite/fixed-point
compiler output enters typed-array tick authority.

## Tick phases

A fixed tick updates, in deterministic order:

1. environmental/event fields;
2. finite resource renewal;
3. metabolism, uptake, transfer, and maintenance;
4. growth attempts and habitat checks;
5. death and structural transitions;
6. bounded reclamation, cryolake/littoral succession, and whole-cell charge;
7. Reach, exact-coverage, resource, SCORE, and crisis ledgers;
8. terminal detection, snapshots, and bounded History capture.

Commands are applied only at run-protocol-v5 boundaries and are acknowledged or
explicitly rejected. Normal 1×/2×/4×/8× and explicit developer
16×/32×/64×/128×/256× lanes all execute every authoritative tick; only
presentation sampling may be decimated.

## Finite resources and extinction

Every cell begins with generated local stock and bounded renewal. Uptake removes
stock before crediting life energy. Growth has an explicit resource cost and a
pre-RNG richness floor; maintenance continues while cells live. Fresh worlds
therefore spread primarily through the richest ecological niches. Overextension
can strand network regions even when distant stock remains.

Whole-cell resource presentation uses eight hysteretic states from untouched
rich through strained/depleted to recovering/reclaimed. Recyclable stock comes
only from measured dying biomass loss and is transferred conservatively; death
never grants a fixed refill. Freshwater influence
buffers local moisture and draws from finite, conservation-accounted catchment
and founder stock; it improves matched survival without creating energy.

Terminal causes derive from actual authority. Early worlds normally report
`resource-exhaustion` or `maintenance-starvation`; there is no hidden scripted
kill. The hard terminal remains near 360 seconds as a final bound.

## Environment Level compiler

Environment Level is an exact, visible, unlimited value separate from world
ordinal and durable frontier. Worlds 1–2 are protected Level 0 with no harmful
events. World 3 attempts Level 1, whose single mild pressure remains late and
telegraphed. Completing the current frontier unlocks exactly its next level;
retry keeps the level and advances only world ordinal/seed.

Challenge-profile v1 compiles any Environment Level directly in bounded work. It
compares exact public Environment rating with exact Evolution defense for
scarcity, renewal, climate, toxicity, maintenance, and events, then projects each
to finite bounded tick coefficients. Resolution, duration, event count, overlap,
footprint, and telegraph bounds do not grow with level magnitude. The compiler
never loops per previous level, allocates per level, or performs arbitrary-
precision arithmetic in ticks. Wall-clock time and speed never affect pressure.

## Habitat access

Compiled capabilities cover lakes, tundra, snow/ice, shallow-ocean edge, general
shallow ocean, and deep ocean. A biome requirement function returns the missing
capability and the lifecycle records the block. Inspector uses the same reason.

Biome ecology remains distinct after unlock. Deep ocean has low suitability,
high maintenance, low renewal, and high route cost. Unlocks enable possibility;
they do not bypass ecological cost.

## Result projection

Snapshots contain compact local resource richness/state, freshwater support,
transformation, and authoritative whole-cell charge bytes. Charge requires live
production, decays when unsupported, and reaches true zero; owning Luminous
Evolution without charge emits no light. WebGL2 and Canvas map the same local
bytes, never draw wires, and never recolor terrain globally from entropy.

The terminal result is plain immutable evidence: world ordinal, Environment
Level/profile/hash, duration, causes, Reach and exact REACH-100 proof, local
resource use/conservation/quintiles, transformations, charged/powered-cell
measures, unique habitat occupancy, crises, cumulative SCORE-v4 merit, exact
World Potential v3 and SCORE strings, bounded History, replay-v5 data, and final
hash. HUD, Result, History, audits, and fair observation schema 2 use the same
production SCORE authority. Trophy and agent projections consume this evidence;
rendering never contributes.
