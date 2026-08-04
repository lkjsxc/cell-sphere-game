# Rendering

## Contract

Rendering is a projection of immutable authority. It may interpolate camera and
presentation values, but it never mutates simulation, RNG, SCORE, rewards,
Evolution, or Trophy state.

## Backends

WebGL2 is primary and keeps four world draws:

1. whole world cells;
2. life/network material;
3. whole-cell event material;
4. atmosphere.

Canvas 2D consumes the same snapshot semantics and remains playable. Context loss
replaces the retired canvas and activates Canvas 2D without replacing world
authority.

## Whole-cell visual language

The smallest visible world unit is a complete cell. Terrain, lakes, habitats,
life, environmental events, selected state, Skill ownership, and Trophy state
change complete cell material. Production rendering has no sub-cell rivers,
paths, ribbons, stripes, arrows, dots, or glyph overlays.

Event fields are weighted graph arrivals rendered per affected cell. Cold and
marine biomes have distinct full-cell materials. A locked habitat is explained in
Inspector rather than decorated with a fake simulation state.

## Globe scenes

- World uses the high-resolution living topology.
- Evolution uses exactly 252 frequency-5 cells and 750 boundaries.
- Trophy Sphere uses 162 cells, of which exactly 96 are meaningful.

Each scene shares camera and picking infrastructure while keeping semantic state
separate. Opening a detail never changes camera direction. Selecting another
primary scene changes projection, not any running world authority.

## Title evidence

`src/showcase/data.js` is generated from production topology, fields, simulation,
and snapshot code. `npm run showcase:check` compares the deterministic artifact
with current source; `showcase:generate` updates it after intentional authority
changes.

## Performance and bounds

Typed arrays, reusable buffers, four WebGL draws, bounded event/history queues,
and cached static fields keep frame work bounded. Hidden documents stop drawing.
The benchmark minimum is 3,000 simulation ticks/s; current release-candidate
verification measured 12,157 ticks/s. Real Chrome measured title rendering mean
0.71 ms and p95 0.90 ms on the audit host.
