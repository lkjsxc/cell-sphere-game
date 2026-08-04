# Simulation contract

## Determinism

A world is determined by seed, world ordinal, strain/challenge, and compiled
Evolution configuration. Speed controls how many fixed ticks are requested; it
does not alter tick content. Worker and fallback transports consume the same
configuration and command sequence.

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
History playback, menu state, and notification state.

## Tick phases

A fixed tick updates, in deterministic order:

1. environmental/event fields;
2. finite resource renewal;
3. metabolism, uptake, transfer, and maintenance;
4. growth attempts and habitat checks;
5. death and structural transitions;
6. bounded reclamation, cryolake/littoral succession, and electricity;
7. Reach, exact-coverage, resource, SCORE, and crisis ledgers;
8. terminal detection, snapshots, and bounded History capture.

Commands are applied only at protocol boundaries and are acknowledged or
explicitly rejected.

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

## World eras

The persisted world ordinal selects deterministic event policy:

- worlds 1–2: no harmful events;
- world 3: one mild field beginning at tick 2400–2520;
- worlds 4–5: one or two;
- worlds 6–10: two to four;
- later worlds: three to six.

Challenge may modify deterministic count/intensity, but wall-clock waiting and
speed do not.

## Habitat access

Compiled capabilities cover lakes, tundra, snow/ice, shallow-ocean edge, general
shallow ocean, and deep ocean. A biome requirement function returns the missing
capability and the lifecycle records the block. Inspector uses the same reason.

Biome ecology remains distinct after unlock. Deep ocean has low suitability,
high maintenance, low renewal, and high route cost. Unlocks enable possibility;
they do not bypass ecological cost.

## Result projection

Snapshots contain compact local resource richness/state, freshwater support,
transformation, and electricity bytes. WebGL2 and Canvas map those values per
whole cell; global entropy never recolors the terrain.

The terminal result is plain immutable evidence: duration, causes, Reach and
exact REACH-100 proof, local resource use/conservation/quintiles, transformations,
power, unique habitat occupancy, crises, cumulative SCORE-v3 merit, World
Potential, History, replay data, and final hash. The live HUD and Result use the
same SCORE authority. Trophy and agent projections consume this evidence;
rendering never contributes.
