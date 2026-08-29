# Simulation contract

## Determinism

A production world is determined by immutable Level-0 start facts: seed, world
ordinal, compiled Evolution/start configuration, and schedule/profile versions.
Worker and fallback execute the same run-protocol-v12 configuration and the same
authoritative ticks. Its speed field is a public relative multiplier converted
to effective game rate before clock accumulation. Camera, renderer, UI, frame
cadence, visibility, and speed never change a tick or SCORE.

## Environment Level

Environment Level is an exact unlimited public clock inside one world:

```text
new world: Level 0
Level 1: tick 1200
later levels: every 600 authoritative ticks
next world: Level 0 again
```

The direct schedule uses no level table. Evolution changes an ecology's response
to pressure, never the public clock. Environment schedule/model version 2 and
schedule hash `763e6328` remain independent of profile version 5.

## Tick phases

Each authoritative tick:

1. increments time and derives schedule state;
2. installs due chronic-pressure profiles and updates bounded exposure evidence;
3. applies environment, finite-resource renewal, metabolism, transport,
   worldmaking, growth, death, and liveness;
4. updates connectivity, REACH, SCORE, snapshots, and semantic History;
5. evaluates causal terminal conditions.

There is no normal hard world timeout. External CLI and fair-agent budgets return
incomplete, reward-free status.

## Chronic pressure

Profile v5 compiles five exact, directly calculated rating curves in constant
work for any exact Level. Their raw sum remains `5000 × Level`, while their
authored slopes change which pressure leads over time. Evolution defense is
applied per dimension before the one bounded normalization step.

Each dimension owns a production effect: scarcity scales energy recovered from
finite nutrient consumption; renewal scales bounded local renewal; climate owns
the seasonal/drying/heat envelope; toxicity owns toxic load; maintenance owns
maintenance demand, transport loss, and recovery. The selected resource-yield
scale is bounded to `[0.85, 1]` and is multiplied exactly once during
nutrient-to-energy conversion. It cannot change consumed stock or create energy.

State caches current and next profiles. One interpolation owner uses the same
`environmentLevelProgressQ` basis for effective coefficients and the five live
normalized pressures, then derives aggregate pressure and severity from those
interpolated dimensions. Snapshots, terminal Result, fair observations, and the
DOM consume that projection; none recomputes profile formulas. Profiles remain
deterministic, hashable, bounded, and finite even for huge exact levels. They do
not create disasters, telegraphs, event footprints, terrain, or resources.

## Resources, extinction, and results

Every cell begins with finite local stock and bounded renewal. Uptake removes
stock before energy credit; ecological access is checked before growth consumes
RNG. Resource condition remains a whole-cell visual state.

Extinction records truthful causal evidence: start/final/peak Environment Level,
transition count, bounded exposure, pressure summary, powered ecology, resources,
REACH, SCORE, History, replay v9, and final hash. SCORE is monotone during a
live world; Result schema 10 captures terminal-tick effective pressure and does
not add an unexplained correction.
