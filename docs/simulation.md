# Simulation contract

## Determinism

A production world is determined by immutable Level-0 start facts: seed, world
ordinal, compiled Evolution/start configuration, schedule/profile versions, and
the explicit onboarding modifier. It does **not** have a selected Environment
Level. Worker and fallback consume the same run-protocol-v7 configuration and
execute the same authoritative tick sequence.

RNG streams are isolated by subsystem. Presentation has no authority RNG.
Camera, renderer, quality, frame cadence, visibility, UI state, and speed never
change a tick or SCORE.

## Environment Level

Environment Level is an exact public clock within one active world:

```text
new world: Level 0
Level 1: tick 1200
later levels: every 600 authoritative ticks
next world: Level 0 again
```

The schedule is directly invertible and unlimited in model/content. It accepts
huge canonical decimal values at exact boundaries without a per-level table or
loop. Evolution affects effective finite pressure, never schedule level or
threshold. The first two worlds suppress harmful event candidates with a visible
onboarding modifier; their level clock remains identical to every other world.

## Tick phases

Each authoritative tick performs:

1. increment tick and derive exact schedule state;
2. install each due profile transition once and update bounded exposure evidence,
   including any short causal terminal-collapse fade;
3. advance the bounded telegraphed event director;
4. apply conditions, environment, resource renewal, metabolism, transport,
   worldmaking, growth, death, resource ecology, and liveness;
5. update connectivity, Reach, SCORE, snapshot/History sampling, and visible
   event semantics;
6. evaluate a causal natural terminal condition.

There is no normal `RUN_CEILING_TICKS`/hard-maximum authority. A short terminal
fade follows only a verified ecological stall. CLI and fair-agent budgets return
incomplete/reward-free status rather than a scored extinction.

## Dynamic pressure and events

The Level-0 world baseline fixes topology, terrain, inoculation, and initial
finite resources. Transition-installed profiles can prospectively adjust renewal,
maintenance, transport stress, climate, toxicity, recovery, and bounded event
parameters. They cannot recreate terrain, refill stock, or erase conservation.

The event director holds at most six future/active whole-cell event fields and
eight recent evidence entries. It uses isolated deterministic RNG, a
player-visible minimum 100-tick telegraph despite summary cadence,
capacity/cadence limits, and reclamation after expiry.
High speed never skips event authority.

## Resources, extinction, and results

Every cell begins with finite local stock and bounded renewal. Uptake removes
stock before energy credit; growth checks ecological access before consuming RNG.
Freshwater uses local conservation-accounted catchments. Whole-cell resource
states remain visible rather than being globally recolored by ENTROPY.

Finite Evolution builds eventually lose to escalating pressure. Extinction
records truthful causal evidence: start/final/peak Environment Level, transition
count, time at peak, bounded exposure, pressure summary with current/next
profile hashes, interpolation Q, and effective coefficients, powered ecology,
resources, Reach, SCORE v5, bounded History, replay v7, and final hash. SCORE
is monotone before Result and rewards sustained exposure/quality rather than a
threshold touch.
