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
→ raise one Evolution cell by one level
→ begin the next world at Environment Level 0, manually or through the untouched Result cycle
```

Environment Level is an unlimited within-world clock: Level 1 begins at tick
1200, then each later level is 600 ticks apart. It applies finite chronic
pressure to renewal, maintenance, transport, climate, toxicity, and recovery.
It does not schedule disasters, crises, telegraphs, or event footprints.

Finite local resources are authoritative. Worlds end through causal ecological
failure; external agent or audit budgets are incomplete and reward-free.
History is the sole durable temporal surface. Its approximate device-local
checkpoints preserve the renderer's life, resource, transformation, and
Luminous state; loading or unavailable visual History remains honestly
semantic-only. Bounded notifications remain presentation-only.

The globe is the primary interface. A drag turns it immediately, release inertia
decays within a bounded interval, and Home or World begins a calm idle orbit only
after inactivity. Reduced motion removes inertia and automatic orbit. Responsive
framing derives the globe's distance from its projected size instead of device
distance constants.

Result keeps native Next World, Evolution, and History actions beside one
authority-driven World-cycle ring. Its visible copy has no changing seconds;
exact remaining time stays available to assistive technology. Any trusted
interaction cancels automatic continuation for that Result.

## Deterministic contracts

- Worker and fallback use the same `RunController`, Environment schedule,
  chronic-pressure profiles, and result authority.
- Camera, scene, renderer, frame cadence, speed, and visibility never alter
  authoritative ticks or SCORE.
- Normal player speeds are 0.5×, 1×, and 2×. They deliver effective game-time
  rates of 2, 4, and 8 game seconds per wall-clock second; 1× is the intended
  ordinary experience. `?dev=1` adds relative diagnostic multipliers from
  0.25× through 64× without skipping authoritative ticks.
- Game time owns ecology, Environment Level, SCORE, and History meaning.
  Wall-clock time delivers game time. Animation time owns camera and Result
  presentation, so changing speed cannot accelerate either one.
- WebGL2 uses four world draw calls; Canvas 2D communicates the same cell
  states as a semantic fallback.
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
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
```

Current implementation status is recorded in
[`docs/work/autonomous-world-feel-v1/README.md`](docs/work/autonomous-world-feel-v1/README.md).
