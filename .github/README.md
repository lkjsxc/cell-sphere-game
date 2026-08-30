# cell-sphere-game

**Every extinction becomes memory.**

A calm, deterministic, browser-native autonomous incremental ecology on a living
cellular sphere. Life grows on its own; no tending is required.

**Play:** https://lkjsxc.github.io/cell-sphere-game/

## The loop

```text
start a new world at Environment Level 0
→ life establishes in a rich local niche
→ finite reachable resources thin as it expands
→ Environment Level rises from authoritative world time
→ extinction records realized SCORE, Echoes, and Trophies
→ raise one Evolution skill by one level
→ begin the next world at Environment Level 0, manually or through the untouched Result cycle
```

Environment Level is an unlimited within-world clock: Level 1 begins at tick
1200, then each later level is 600 ticks apart. Its five authored pressures are
Resource yield, Renewal, Climate, Toxicity, and Maintenance & transport.
Resource yield changes energy recovered from consumed finite nutrient; the
other pressures retain their bounded ecological consumers. Current Chronic
Pressure shows their live effective values as whole percentages. It does not
schedule disasters, crises, telegraphs, or event footprints.

Finite local resources are authoritative. Worlds end through causal ecological
failure; external agent or audit budgets are incomplete and reward-free.
History is the sole durable temporal surface. Its approximate device-local
checkpoints preserve the renderer's life, resource, transformation, and
Luminous state; loading or unavailable visual History remains honestly
semantic-only. Bounded notifications remain presentation-only.

The globe is the primary interface. A drag turns it immediately, with one
projected globe radius of pointer travel corresponding to one radian on every
supported layout and zoom. A valid release carries the measured angular velocity
through one progressive bounded response: a deliberate fast flick carries about
one additional turn, medium input carries less, and slow inspection stops on
release. Elapsed-time damping and a hard lifetime always bring inertia to rest.
Home or World begins a
separate calm idle orbit only after inactivity. Reduced motion removes inertia
and automatic orbit. Responsive framing derives the globe's distance from its
projected size instead of device distance constants. Portrait layouts stay
centered; sufficiently wide Home and World layouts place the projected center
near two-thirds of usable width while retaining the same globe-size targets.
Ordinary life reads through shared cell
boundaries: exposed growth fronts are clearer than quiet internal living edges,
while terrain and finite local resources remain visible inside occupied cells.
Stress, critical state, remains, selection, History, coastlines, and whole-cell
Luminous charge keep distinct visual and textual meanings.

Evolution keeps 42 authored skills and their exact physical adjacency, costs,
levels, and effects. Its globe projects those skills as 42 connected territories
over the same 2,562-cell topology family as World. Every visible fine cell
selects its owning skill; quiet internal cell boundaries preserve cellular
density while stronger territory perimeters reveal the truthful purchase
frontier. The accessible tree remains exactly 42 skill items.

Result keeps native Next World, Evolution, and History actions beside one
authority-driven World-cycle ring. Its visible copy has no changing seconds;
exact remaining time stays available to assistive technology. Any trusted
interaction cancels the 13.5-second automatic continuation for that Result.

## Deterministic contracts

- Worker and fallback use the same `RunController`, Environment schedule,
  chronic-pressure profiles, and result authority.
- Camera, scene, renderer, frame cadence, speed, and visibility never alter
  authoritative ticks or SCORE.
- Normal player speeds are 0.25×, 0.5×, 0.75×, 1×, 1.25×, and 1.5×. They
  deliver effective game-time rates of 1, 2, 3, 4, 5, and 6 game seconds per
  wall-clock second; 1× is the intended ordinary experience. `?dev=1` adds
  diagnostic multipliers through 64× without skipping authoritative ticks.
- Game time owns ecology, Environment Level, SCORE, and History meaning.
  Wall-clock time delivers game time. Animation time owns camera and Result
  presentation, so changing speed cannot accelerate either one.
- WebGL2 uses four World draw calls; Canvas 2D consumes the same deterministic
  life-edge classification as a semantic fallback.
- Current-only persistence intentionally starts fresh for old or mismatched
  documents. Visual History is a reset-only device-local cache.
- Closing the page does not advance a World and no offline progress is promised.

## Run locally

```bash
npm run serve
# open http://localhost:8080/
```

No runtime package installation is required.

## Verification

```bash
npm run test:unit
npm run test:integration
npm run balance:smoke
npm run benchmark
npm run check:links
npm run check:structure
npm run audit:no-disaster
npm run audit:environment-levels
npm run audit:luminous
npm run audit:trophies
npm run test:browser:environment-pressure
npm run test:browser:environment-pressure:fallback
npm run test:browser:environment-pressure:canvas
npm run test:browser:evolution-territories
npm run test:browser:evolution-territories:fallback
npm run test:browser:evolution-territories:canvas
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
```

Current implementation status is recorded in
[`docs/work/evolution-cellular-territories-v1/README.md`](docs/work/evolution-cellular-territories-v1/README.md).
