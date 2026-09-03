# Rendering

## Contract

Rendering projects immutable authority. It may interpolate camera and
presentation values, but never mutates simulation, RNG, SCORE, rewards,
Evolution, or Trophy state.

## Backends

WebGL2 is primary and keeps four World draws: background, whole World cells,
boundaries, and atmosphere. The cell shell has one position path: duplicated
shared corners never receive owner-cell radial displacement. The atmosphere draw
uses one fixed renderer-owned unit icosphere; gameplay topology, cell count,
snapshots, seeds, and simulation resolution cannot alter its geometry or quality.
One renderer scene discriminator selects World, Evolution, or Trophy material;
it does not add a draw or another overlapping material-mode authority.
Canvas 2D consumes the same snapshot semantics, paints an analytic projected
halo and opaque globe substrate before translucent cell material, and remains
playable after WebGL context loss without replacing world authority.

## Planetary sky

One presentation policy supplies both backends with a stable generated
`256×128` RGB near-black orbital field, a fixed three-stratum star catalog, one
active-or-inactive shooting-star projection, one Home/World cloud identity, and
two finite eligible-time rotation angles. The field uses low-amplitude,
non-directional tonal variation rather than a ribbon, nebula, or cloud-bank
structure. The WebGL background draw samples it and adds constant-cost faint,
bright, and anchor star strata plus the active streak before the globe, so later
globe draws occlude it naturally. Canvas rasters the exact field bytes once per
identity and draws the same catalog and event in its existing background phase.
Eco, Balanced, and High use `224/356/500` catalog entries from one maximum
`500`-star catalog. Neither backend owns a clock, slot calculation, random
source, timer, or render loop.

Cloud opacity is one deterministic `64×64×6` byte field generated from smooth
three-dimensional direction, independent of cell count. WebGL uploads its six
faces as one `R8` cube texture at renderer/seed lifecycle boundaries and samples
transformed world normals in the existing globe draw. Canvas caches each cell's
unit direction and samples the exact bytes through two fixed 2,048-bucket angle
caches inside its existing visible-cell material loop. The two direct rotations
use non-cardinal axes separated by `78.40°`, periods of 52 and 109 eligible
foreground minutes, and no incrementally accumulated matrix. Geography and resource material are applied first; clouds
then contribute at most `0.18` of the local material before life stress, remains,
Luminous, selection, History, Evolution, Trophy, and boundary meanings. Home and
World use clouds; Evolution and Trophy do not. The field does not participate in
picking, simulation, History meaning, or persistence.

## Cellular visual language

The smallest authoritative World unit is one complete cell. Terrain, lakes,
habitats, resources, transformations, and Luminous charge remain whole-cell
material. Ordinary living and frontier state are edge-primary: one pure shared
projection classifies each canonical `topo.edgeA` / `topo.edgeB` pair as quiet
internal life, exposed active frontier, stressed, critical, residual remains, or
none. An exposed frontier is more salient than an internal living edge. Stress,
critical state, and remains retain restrained subordinate interior support at
normal far zoom; ordinary life and frontier do not recolor the cell interior.

Selection, History emphasis, static coast/lake edges, and whole-cell Luminous
charge remain independent signals. The existing WebGL boundary draw combines
static geography with one dynamic categorical byte per edge; Canvas batches the
same shared classes into a fixed finite set of paths. Both update their reusable
edge buffers only when an accepted snapshot changes. Live Worker, live fallback,
current/past visual History, and the title showcase therefore use the same
renderer-semantic owner without changing simulation or History authority.

Production rendering has no sub-cell rivers, paths, ribbons, organism routes,
wires, fake city geometry, or disaster footprints.

Local resource richness/recovery and whole-cell charge are legible in WebGL2 and
Canvas 2D. Resource-poor cells remain visibly poor; zero charge never receives
the Luminous powered material. Developer-only production-renderer fixtures check
uniform shell continuity and matched life interiors/edge bands at center, limb,
near, and far positions. They are evidence tooling, not player-facing modes.

## Globe scenes

World and Evolution use the level-4 2,562-cell topology, while Trophy retains
its own fields, atlas material, and semantic projection. Every Evolution cell is
an exact progression cell carrying one immutable archetype. Evolution constructs
one fixed-seed substrate through the maintained World `createFields` owner and
reuses its land/water, biome, forest, relief, lake, shore, and lighting hierarchy
in both backends. The one immutable layout consumes those fields to place each
archetype as a connected exact-cell region and each domain as a connected
macro-region. A shared edge byte packs quiet, reachable-perimeter,
ownership-perimeter, recent, or selected state in its low bits and immutable
internal/archetype/domain relation in its high bits. Ownership is exactly the
owned/unowned graph cut. The separate reachable perimeter is only the unowned
reachable/locked cut, so owned interiors and reachable interiors stay quiet.
Dynamic state dominates restrained region structure in the existing WebGL
boundary draw and Canvas boundary phase. Ownership is continuous; reachability
is thinner and segmented in WebGL or dashed in Canvas, while domain edges also
use a distinct dash in Canvas.
Cell-centered glyphs and insets preserve domain and state meaning without
replacing geography with a whole-cell mosaic. Canvas clips boundary segments at
the projected limb rather than dropping a crossing edge.
Direct canonical cell adjacency—not rendered contact inference—owns reachability
and purchases. Camera and picking infrastructure remain shared and picking
returns the selected fine cell directly.
The camera retains one orthonormal free-orbit frame; a
single input path snapshots the projected sphere radius in CSS pixels and uses
the same isotropic angular deltas for immediate manipulation and recent release
sampling. At release, the presentation-only motion policy leaves precision
traces below `0.08 rad/s` still and transfers every finite qualifying measured
vector directly. A `600 ms` damping half-life and `0.025 rad/s` rest threshold
own natural termination without remapping, output saturation, or a fixed
lifetime. Direct manipulation remains immediate. The separate
Home/World idle orbit remains calm and
begins only after a fresh delay. Opening a surface never changes camera direction
or zoom and may clear motion already in progress. A fresh valid canvas or shared-
shell drag can carry after release while the nonmodal detail remains stable;
the surface still holds automatic idle orbit. Reduced motion keeps direct drag
and zoom while disabling release inertia and automatic orbit.

World/Home default distance is the inverse projection of a target sphere
diameter using the camera field of view and usable canvas. The target varies
smoothly from about 1.08 of the shorter dimension in portrait through 0.98 near
square to 0.90 in wide layouts. Horizontal composition transitions continuously
from centered portrait to a projected center near two-thirds of usable width in
sufficiently wide layouts. Both renderers and picking consume the same camera
geometry. Atmosphere geometry does not participate in picking, and the four-pass
World architecture is unchanged.

## Title evidence

`src/showcase/data.js` is generated from production topology, fields, simulation,
and snapshot code. `npm run showcase:check` compares it with current source;
`showcase:generate` updates it after intentional authority changes.

## Performance and bounds

Typed arrays, reusable buffers, four WebGL draws, bounded History, and cached
static fields keep frame work bounded. The fixed atmosphere is constructed once
per module and uploads 245,784 static bytes only at WebGL initialization or
restoration: 10,242 vertices and 61,440 `Uint16` indices. Life classification
uses one 7,680-byte canonical buffer; WebGL expands it once per accepted semantic
snapshot into the existing four vertices per boundary edge, while Canvas reuses
eight fixed typed style batches. Animation time alone never rebuilds either
projection. Evolution topology, connected archetype/domain layout, fixed World-derived substrate,
and static geometry are immutable for one topology lifetime; accepted
progression changes rebuild only the bounded progression projection, while
unchanged animation frames do not rebuild fields, layout, geometry, or the
7,680-byte edge classification. High developer speeds execute every tick
while coalescing bounded snapshots and render requests. Camera velocity samples
use one fixed-capacity six-entry buffer; release state is constant-size, and one
analytic inertia step rotates the reusable camera-basis arrays in place regardless
of release class or frame cadence. The Result ring
changes one bounded style projection at no more than about 30 Hz and does not
add a renderer pass.
