# Simulation contract

## Determinism

A production world is determined by immutable Level-0 start facts: seed, world
ordinal, compiled Evolution/start configuration, and schedule/profile versions.
Worker and fallback execute the same run-protocol-v8 configuration and the same
authoritative ticks. Camera, renderer, UI, frame cadence, visibility, and speed
never change a tick or SCORE.

## Environment Level

Environment Level is an exact unlimited public clock inside one world:

```text
new world: Level 0
Level 1: tick 1200
later levels: every 600 authoritative ticks
next world: Level 0 again
```

The direct schedule uses no level table. Evolution changes an ecology's response
to pressure, never the public clock.

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

Level transitions adjust finite renewal, maintenance, transport, climate,
toxicity, recovery, and attrition coefficients. They do not create disasters,
telegraphs, event footprints, terrain, or resources. Profiles are deterministic,
hashable, bounded, and finite even for huge exact levels.

## Resources, extinction, and results

Every cell begins with finite local stock and bounded renewal. Uptake removes
stock before energy credit; ecological access is checked before growth consumes
RNG. Resource condition remains a whole-cell visual state.

Extinction records truthful causal evidence: start/final/peak Environment Level,
transition count, bounded exposure, pressure summary, powered ecology, resources,
REACH, SCORE, History, replay v8, and final hash. SCORE is monotone during a
live world; Result does not add an unexplained correction.
