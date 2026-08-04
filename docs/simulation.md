# Simulation contract

## Determinism

A world is determined by seed, world ordinal, strain/challenge, and compiled
Evolution configuration. Speed controls how many fixed ticks are requested; it
does not alter tick content. Worker and fallback transports consume the same
configuration and command sequence.

RNG streams are subsystem-specific. Presentation has no RNG stream in authority.
Habitat rejection happens before growth RNG consumption, so unlocking a habitat
changes only intended future choices.

## State

Authoritative state includes typed arrays for life, biomass, energy, stress,
network structure, event strength, per-cell resource reserve, depletion,
habitat-block reasons, and lifetime unique habitat occupancy. Bounded ledgers
track Reach, connectedness, resource transfer, crises, and diagnostics.

State excludes DOM, storage, WebGL, camera, frame cadence, wall-clock time,
History playback, menu state, and notification state.

## Tick phases

A fixed tick updates, in deterministic order:

1. environmental/event fields;
2. finite resource renewal;
3. metabolism, uptake, transfer, and maintenance;
4. growth attempts and habitat checks;
5. death and structural transitions;
6. Reach/resource/crisis ledgers;
7. terminal detection and bounded history capture.

Commands are applied only at protocol boundaries and are acknowledged or
explicitly rejected.

## Finite resources and extinction

Every cell begins with generated local stock and bounded renewal. Uptake removes
stock before crediting life energy. Growth has an explicit resource cost;
maintenance continues while cells live. Overextension can therefore strand
network regions even when distant stock remains.

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

The terminal result is plain immutable evidence: duration, causes, Reach,
resource use, unique habitat occupancy, crises, six SCORE inputs, World
Potential, History, replay data, and final hash. Pure SCORE and Trophy fact
builders consume this result outside simulation. Rendering never contributes.
