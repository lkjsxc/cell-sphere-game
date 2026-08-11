# cell-sphere-game

**Every extinction becomes memory.**

A deterministic, browser-native incremental ecology on a living cellular sphere.

**Play:** https://lkjsxc.github.io/cell-sphere-game/

## The loop

```text
start a new world at Environment Level 0
→ life establishes in a rich local niche
→ finite reachable resources thin as it expands
→ Environment Level rises from authoritative world time
→ extinction records realized SCORE, Echoes, and Trophies
→ raise one Evolution cell by one level
→ begin the next world at Environment Level 0
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

## Deterministic contracts

- Worker and fallback use the same `RunController`, Environment schedule,
  chronic-pressure profiles, and result authority.
- Camera, scene, renderer, frame cadence, speed, and visibility never alter
  authoritative ticks or SCORE.
- Normal speeds are 1×, 2×, 4×, and 8×. `?dev=1` enables session-only higher
  diagnostic speeds without skipping ticks.
- WebGL2 uses four world draw calls; Canvas 2D communicates the same cell
  states as a semantic fallback.
- Current-only persistence intentionally starts fresh for old or mismatched
  documents. Meta schema is 14, semantic History schema is 9, result/replay
  schema is 8, agent-save schema is 5, and visual History is a reset-only v2
  device-local cache.

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

Current ecology-experience status is recorded in
[`docs/work/ecology-experience-v2/status.md`](docs/work/ecology-experience-v2/status.md).
