# Rendering

## Contract

Rendering projects immutable authority. It may interpolate camera and
presentation values, but never mutates simulation, RNG, SCORE, rewards,
Evolution, or Trophy state.

## Backends

WebGL2 is primary and keeps four world draws: background, whole World cells,
atmosphere, and boundaries. The cell shell has one position path: duplicated
shared corners never receive owner-cell radial displacement. Canvas 2D consumes
the same snapshot semantics, paints an opaque globe substrate before translucent
cell material, and remains playable after WebGL context loss without replacing
world authority.

## Whole-cell visual language

The smallest visible World unit is one complete cell. Terrain, lakes, habitats,
life, resource condition, transformation, Luminous charge, selection, Evolution
ownership, and Trophy state all change whole-cell material. Production rendering
has no sub-cell rivers, paths, ribbons, wires, fake city geometry, or disaster
footprints.

Local resource richness/recovery and whole-cell charge are legible in WebGL2 and
Canvas 2D. Resource-poor cells remain visibly poor; zero charge never receives
the Luminous powered material. A developer-only uniform-material fixture checks
both backends for zero background-colored pixels through the center and limb;
it is evidence tooling, not a player-facing rendering mode.

## Globe scenes

World uses the high-resolution living topology. Evolution and Trophy scenes use
their own semantic cell projections while sharing camera and picking
infrastructure. The camera retains one orthonormal free-orbit frame; a
presentation-only motion policy integrates bounded release inertia and Home/World
idle orbit from animation time. Opening a surface never changes camera direction
or zoom and clears nonessential motion. Reduced motion keeps direct drag and zoom
while disabling inertia and automatic orbit.

World/Home default distance is the inverse projection of a target sphere
diameter using the camera field of view and usable canvas. The target varies
smoothly from about 1.08 of the shorter dimension in portrait through 0.98 near
square to 0.90 in wide layouts. Horizontal composition transitions continuously
from centered portrait to a projected center near two-thirds of usable width in
sufficiently wide layouts. Both renderers and picking consume the same camera
geometry; the atmosphere and four-pass World architecture are unchanged.

## Title evidence

`src/showcase/data.js` is generated from production topology, fields, simulation,
and snapshot code. `npm run showcase:check` compares it with current source;
`showcase:generate` updates it after intentional authority changes.

## Performance and bounds

Typed arrays, reusable buffers, four WebGL draws, bounded History, and cached
static fields keep frame work bounded. High developer speeds execute every tick
while coalescing bounded snapshots and render requests. Camera velocity samples
use one fixed-capacity six-entry buffer. The Result ring changes one bounded
style projection at no more than about 30 Hz and does not add a renderer pass.
