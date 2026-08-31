# AGENTS.md

## Purpose

This file is the standing repository contract for coding agents working on
`lkjsxc/cell-sphere-game`.

Read it before editing. Read the active checkout before trusting this file about
exact symbols, files, commands, versions, schemas, test counts, branch state, CI
state, or deployment state. Treat the product and authority rules here as binding
until the user explicitly supersedes them.

The user authorizes substantial changes, deletion of obsolete current-only
systems, and breaking internal or persisted formats when that produces a smaller,
coherent product. Backward compatibility is not a default goal. Do not preserve a
weak design merely because code exists for it, and do not use that freedom to
create speculative architecture.

Choose the smallest dependency-closed system that satisfies the product contract
and can be proved through the real browser and production simulation.

This file is not:

- a campaign prompt;
- a completion report;
- a release ledger;
- a transient priority list;
- a snapshot of one commit;
- an inventory of exact schema or test versions;
- a substitute for reading current source.

Use `docs/work/` for the one active cross-layer work package. Do not create a
competing planning directory.

---

## Product north star

`cell-sphere-game` is a calm, deterministic, browser-native, autonomous
incremental ecology played on a living cellular sphere.

The player begins a World and watches life:

1. establish in a favorable local niche;
2. spread autonomously through whole neighboring cells;
3. consume finite local resources;
4. encounter rising chronic Environment pressure;
5. fragment and become extinct;
6. leave realized SCORE, Echoes, Trophies, and History;
7. improve permanent Evolution between Worlds;
8. begin another World at Environment Level 0.

The globe is the primary interface. The interface explains and supports the
sphere; it does not compete with it. The core loop should be understandable while
simply watching, and the player should not need to tend individual World cells.
Meaningful intervention occurs chiefly between Worlds through Evolution.

The World should feel alive when directly manipulated, after a natural release,
while left alone, and through visible ecological cause and consequence.

The product is autonomous and incremental. It does not promise offline progress.
Closing the page does not advance authoritative time or award progress.

Extinction is not a detached failure screen. It is the transition that makes
memory and permanent progression meaningful.

---

## Product vocabulary

Use these terms consistently:

- `World`: one autonomous run.
- `game time`: authoritative fixed-step time measured in ticks or game seconds.
- `wall-clock time`: foreground elapsed player time.
- `animation time`: camera and UI presentation timing.
- `Environment Level`: the unbounded within-World chronic-pressure clock.
- `Evolution`: permanent progression between Worlds.
- `Evolution cell`: one visible and authoritative cell on the Evolution sphere.
- `Evolution archetype`: an authored ability definition that may be carried by
  more than one Evolution cell.
- `Evolution substrate`: the fixed deterministic World-derived planet beneath
  exact-cell progression. It is an immutable input to ability placement and
  presentation, not a live World, simulation, reward, or mutable persistence
  authority.
- `Evolution region`: one connected set of exact Evolution cells carrying the
  same authored archetype. A region is never a hidden purchase or effect owner.
- `Echoes`: permanent progression currency unless explicitly renamed.
- `History`: durable observation of prior moments and completed Worlds.
- `Result`: the terminal summary of one World.
- `SCORE`: realized World performance.
- `REACH`: the current or meaningfully occupied proportion of World cells under
  the current scoring contract.
- `Luminous`: the bioelectric Evolution domain.
- `Home`, `World`, `Evolution`, and `Trophies`: the four primary scenes.
- `WebGL2` and `Canvas 2D`: renderer backends.
- `Worker` and `fallback`: execution paths sharing one simulation authority.

Do not reintroduce retired public terminology because an old test, schema,
prompt, screenshot, or historical document mentions it. Use plain player
language. Do not expose project-internal terms when a standard ecological,
game-design, accessibility, rendering, or software-engineering term is available.

---

## Core product rules

The simulation is authoritative and deterministic. Rendering, camera state,
History playback, UI state, and frame cadence are observational.

Presentation speed changes wall-clock delivery of game time, not authoritative
tick content.

A World begins from explicit immutable inputs. At minimum those include seed,
immutable compiled Evolution state, versioned rule constants, and authoritative
World identity. The same inputs must produce the same authoritative result.

Every World begins at Environment Level 0. Environment Level rises from
that World's authoritative ticks and is not permanent progression. Evolution is
permanent progression. A progression purchase changes future Worlds, never the
active World.

Local resources are finite. Renewal is bounded. Maintenance has persistent cost.
No finite build may become literally immortal. Extinction must remain possible
under unbounded Environment Level. The player may play indefinitely through
repeated finite Worlds and unbounded exact Evolution refinement.

SCORE and Echoes derive from realized authoritative outcomes. A projection
supplied by UI, an agent, an import, or a caller is not reward authority.

The globe remains cellular. Whole cells remain the primary geography, ecology,
transformation, habitat, and Luminous unit. Whole-cell simulation authority does
not require every visual semantic to be a destructive whole-cell fill.

Ordinary World life and frontier state should read primarily through cell
perimeters or inter-cell boundaries, leaving biome and resource material legible.
Stress, critical state, and dead remains may use restrained interior support, but
ordinary life must not return to destructive whole-cell whitening. Luminous
charge, geography, resources, transformations, selection, and History remain
visually distinct.

Evolution uses the same visible cellular scale as the maintained World globe.
Every visible Evolution cell is an actual selectable and purchasable progression
cell. A many-cell territory must not masquerade as one purchase unit.

Evolution must also read at first glance as the same kind of coherent living
planet as World. Its immutable substrate uses contiguous large-scale geography
and climate/biome regions, including meaningful land-water contrast. Ability
placement agrees with that planet: each recurring archetype forms a coherent
connected region, domains form coherent macro-regions fitted to substrate
affordances, and the sole fresh `First Division` root begins on favorable green
land. Region membership never becomes bulk purchase, hidden ownership, or a
location-dependent effect law. Geography remains primary while archetype,
domain, ownership, affordability, selection, and recent-change cues remain
restrained and legible.

Evolution ownership must read immediately as one exact-cell territory boundary,
not as an equally bright honeycomb around every owned or reachable cell. The
steady ownership perimeter is exactly the graph cut whose edges have one owned
endpoint and one unowned endpoint. Owned-owned edges are interior; unowned-
unowned edges, including reachability transitions, are not ownership. Reachable,
affordable, selected, and recently changed cells retain distinct subordinate
local or edge cues with non-color equivalents.

WebGL2 and Canvas 2D communicate the same semantic state even when exact pixels
differ. Accessibility, responsive behavior, reduced motion, forced colors,
keyboard access, and bounded performance are product requirements.

---

## Non-goals

Do not add manual unit control, combat, disaster cards, scripted attacks, crisis
popups, a hidden game director, random mandatory mid-World choices, or repetitive
clicking required to keep life alive.

Do not turn the game into a conventional idle spreadsheet. Do not promise offline
progress or add elapsed-timestamp rewards without a separate explicit authority
and persistence design.

Do not expose internal telemetry merely because it exists. Do not create lore or
a tutorial framework before the core loop requires it. Prefer concise contextual
copy and behavior.

Do not add a framework for ordinary DOM and ES-module problems, an ECS without
measured need, a second simulator, a generic replay engine when bounded History
is sufficient, or a generic Evolution graph editor.

Do not add a renderer pass solely to conceal a defect that an existing pass can
own. Do not add bloom merely to make Luminous visible. Do not increase simulation
resolution to fix a cosmetic silhouette. Do not replace the World-derived
Evolution substrate with an arbitrary ability mosaic, restore many-cell hidden
purchase territories, or change topology, costs, effects, or World rules merely
to fake regionality. It is valid and required for the one immutable ability
layout to consume the fixed substrate when choosing coherent regions and the
green root.

Do not create compatibility layers for retired current-only formats without an
active maintained consumer. Do not maintain two authorities for the same rule.
Do not add settings instead of choosing a good default. Do not use more UI as a
substitute for clarity. Do not generate meaningless filler to reach a catalog,
feature, file, or line count.

Do not perform a broad rewrite without a cutover, deletion, evidence, and recovery
story.

---

## Authority map

### Simulation authority

Production `RunController` and its shared rule modules own authoritative ticks,
RNG, cell state, biomass, energy, resources, reproduction, maintenance,
transport, habitats, transformations, Luminous charge, Environment Level,
extinction, and realized terminal facts.

Worker and fallback use the same controller and rules. Tests and agents do not
substitute a simplified simulation. A convenience projection must not become a
second simulation authority.

### Progression authority

The Evolution topology, immutable substrate-guided cell-to-archetype layout and
root, sparse exact per-cell levels, direct topology adjacency, transactional
purchase path, exact aggregate archetype ranks, cost law, and one progression
compiler own:

- fresh-root and frontier reachability;
- affordability;
- local cell levels;
- aggregate archetype ranks;
- costs and refinements;
- compiled effects;
- habitat capabilities;
- pressure defenses;
- future-World configuration.

Each visible Evolution cell has one stable topology identity and one authored
archetype. Archetypes may recur. Repeated cells are not filler: each purchased
level contributes exactly once to the archetype's explicit aggregate rank and
therefore to the same bounded cost/effect model. Repeated cells of one archetype
form a coherent connected region, and related domains form coherent macro-regions
on the fixed substrate.

The fixed substrate may guide where an archetype occurs and therefore the route
through exact cells. It never changes effect magnitude, cost, reward, or World
simulation according to location.

The active World receives one immutable compiled configuration. Evolution cannot
mutate it. UI, renderer, preview, agent, and audit code consume progression
projections; they do not infer or rewrite compiled effects.

There is no presentation-only owner map that groups several visible cells into
one hidden purchase node. The selected cell is the purchased cell.

### Reward authority

Terminal replay or equivalent trusted reconstruction owns settlement. SCORE uses
realized authoritative facts. Echoes derive from trusted SCORE. Trophies derive
from trusted evidence. Result UI and agent observations are projections. Imports
are untrusted. No caller-controlled summary may mint progression.

Terminal reward transactions are idempotent. Aborted, incomplete, failed, stale,
duplicate, or budget-exhausted Worlds must not be converted into rewarded
extinctions.

### Presentation authority

The app controller and narrow presentation policies own scene selection, camera
motion, responsive framing, trusted interaction, surfaces, focus, speed
selection, continuation, accessible announcements, and rendering cadence.

Presentation never changes simulation rules. Keep each policy narrow. Do not let
the app controller become a second owner of a rule already expressed in a pure
module.

### Rendering authority

Renderers consume immutable snapshots and presentation state. They may
interpolate, shade, animate, frame, highlight, and render approximate History.
They may not mutate simulation, RNG, SCORE, Echoes, Evolution, Trophies, semantic
History, or persistence authority.

Renderer backend, camera, frame cadence, quality, and reduced-motion state do not
affect authoritative results. When WebGL2 and Canvas consume the same semantic
projection, one pure owner classifies it.

### History authority

Semantic History records authoritative observations and completed-World facts.
Visual History is a bounded approximate rendering aid, not a simulation save.
History playback never changes the live World. Historical labels and matching
visual state switch atomically. If a matching checkpoint is unavailable, show
semantic History honestly rather than current visuals under a historical label.

### Persistence authority

Narrow platform modules own namespace boundaries, validation, versioning, exact
integer normalization, transactional writes, import validation, and current-only
reset. UI modules do not write arbitrary storage documents. Persistence data is
untrusted until validated.

---

## Engineering posture

Prefer deletion over adaptation when an old abstraction encodes the wrong
product. Prefer direct data flow, explicit state machines, one owner per rule,
one owner per surface, one owner per scroll region, and one source of truth per
formatted metric.

Prefer immutable snapshots at authority boundaries and pure functions for
schedules, scoring, progression compilation, codecs, validation, geometry,
presentation projections, and cross-backend renderer semantics.

Prefer typed arrays and reusable buffers in hot paths, bounded ring buffers over
growing arrays, relative visual measurements over exact cross-GPU screenshot
hashes, paired-seed cohorts over anecdotes, production-browser evidence over CSS
or shader inspection alone, and current-only reset over migration code.

Use standard engineering terminology. Avoid invented frameworks and
project-specific jargon that do not improve correctness.

Comments should explain invariants, authority, tradeoffs, non-obvious failure
modes, and recovery conditions. Delete comments that narrate syntax.

Keep modules cohesive. Split a file only at a real responsibility boundary. Do
not split solely for an arbitrary line count. Do not create a universal manager
for unrelated responsibilities. Do not add a shipped dependency without
compelling evidence.

---

## Required working protocol

Start every substantial task by inspecting current branch, `HEAD`, upstream,
ahead/behind state, worktree, recent commits, active work package, root
`AGENTS.md`, `docs/status.md`, relevant source owners and tests, and current CI or
deployment state when external behavior matters.

Preserve unrelated user changes. Do not reset a dirty worktree or overwrite
concurrent work. Reconcile a campaign prompt with current source before treating
exact paths or symbols as current.

Reproduce the user-visible problem before changing it when practical. Record a
baseline before changing performance, balance, pacing, persistence, rendering,
layout, interaction, or accessibility behavior.

Use `docs/work/` for one active cross-layer package. Do not create
`docs/campaigns/` while `docs/work/` remains canonical. Do not create a forest of
status documents.

An active work note should contain only the starting revision and branch,
relevant dirty files, confirmed root causes, selected decisions and deviations,
completed coherent phases, focused verification, evidence not obtained, and the
exact next coherent step.

Use focused tests while iterating. Run fresh broad verification against stable
final content. Delete predecessor paths after the replacement becomes
authoritative. Do not leave dormant alternatives.

Commit coherent vertical slices when repository access permits. Do not claim
completion from source inspection, browser behavior from unit tests,
physical-device behavior without hardware evidence, CI success unless CI ran, or
deployment from a local build, upload, or workflow start.

If execution limits stop work, leave the repository buildable, keep one authority
active, do not ship partial scaffolding, and record the exact next coherent step.

---

## Time domains and speed

Keep game time, wall-clock time, and animation time explicit.

Game time is authoritative and owns ecology, Environment Level, SCORE, History
semantics, and extinction. Wall-clock time determines how quickly foreground
presentation supplies game time. Animation time owns camera inertia, idle delay,
automatic orbit, Result continuation, panel motion, focus timing, and decorative
effects. Animation time is not multiplied by game speed, and hidden-page time
does not produce camera or UI catch-up.

Never say `faster` without naming the time domain.

Normal `1×` is the intended ordinary wall-clock experience and maps to effective
game-time rate `4`. The ordinary ladder is exactly:

- `0.25×` → effective rate `1`;
- `0.5×` → effective rate `2`;
- `0.75×` → effective rate `3`;
- `1×` → effective rate `4`;
- `1.25×` → effective rate `5`;
- `1.5×` → effective rate `6`.

One runtime-speed policy owns options, validation, conversion, diagnostic cadence,
labels, and ordinary-versus-developer availability. Settings store the public
multiplier and default to `1`. A settings schema whose public speed meaning
changes resets under current-only policy.

Developer speed may expose diagnostic values only behind explicit developer
mode. Diagnostic values do not appear or persist in ordinary UI, may coalesce
snapshots or renders, and must execute every authoritative tick.

Worker and fallback consume the same validated multiplier and conversion policy.
The time dial and public durations derive from authoritative ticks and the current
runtime-speed policy. Camera and continuation remain animation-time systems.

Speed must not enter RNG, immutable World rules, World identity, result authority,
SCORE, Echoes, Evolution, or History meaning. All presentation speeds produce the
same canonical authoritative result for the same inputs. Do not skip ticks to
appear responsive; retain bounded work slices and tick debt.

Changing speed semantics requires coherent policy, settings, execution-path, UI,
diagnostic, test, and documentation changes.

---

## Camera interaction and motion

The camera is presentation-only. Keep an orthonormal free-orbit frame or an
equivalently robust representation. Do not regress to clamped yaw/pitch when the
current frame supports repeated pole traversal.

Support mouse, touch, pen through Pointer Events, tap selection, drag rotation,
pinch zoom, wheel zoom, and cancellation. Tap and drag remain distinct. Dragging,
pinching, or residual motion must not select or purchase. Programmatic focus
framing clears old velocity. Camera state never alters simulation authority.

Use monotonic input timing for release-velocity estimation and distinguish event
time from observed animation time when delivery may be delayed.

One narrow controller owns the sequence:

`direct manipulation → bounded release inertia → damping → idle wait → calm automatic orbit`

A deliberate fast flick may carry an energetic but bounded rotation of roughly a
full turn. Do not accelerate calm idle orbit to compensate for weak release.
Slow drags remain precise. Reduced motion suppresses nonessential carried motion.

Required invariants include fixed-capacity recent samples, finite clamped release
velocity, elapsed-time damping, convergence to stillness, a hard lifetime,
bounded automatic speed, immediate cancellation by trusted activity, no hidden
velocity under a surface, a fresh idle delay after cancellation or visibility
return, and clearing on scene change, World replacement, or focus framing.
Evolution and Trophies do not auto-orbit.

Home and World may rotate calmly after inactivity. A new World begins still and
enters orbit only after the established idle delay. Test equivalent elapsed
behavior at multiple frame cadences, long-run orthonormality, and fallback input
delay.

Use one document-level trusted-interaction capture path when several policies
need it. Normalize trusted interaction types, ignore programmatic focus through a
scoped guard, and do not couple camera and continuation state machines.

---

## Responsive globe framing

Define default framing through observable projected geometry, not unexplained
per-device camera constants. Derive distance and offset from field of view,
sphere radius, usable canvas, target projected diameter, stable composition, and
safe areas.

The durable World/Home diameter policy is approximately:

- `1.08` of the shorter usable dimension in narrow phone portrait;
- `0.98` near square and tablet layouts;
- `0.90` in wide layouts.

Interpolate continuously; do not branch on device names. Sufficiently wide Home
and World layouts place the projected center near two-thirds of usable width,
with an approximate `2:1` left:right split. Use a practical center-ratio band of
`0.65–0.68` and left:right band of `1.9–2.1`. Keep phone portrait centered and
transition smoothly.

Controlled outer-limb overflow is acceptable. Primary controls remain
accessible, and the central globe is not obscured. Opening a transient surface
does not change camera direction or default zoom. A same-class resize preserves
intentional zoom; a new World may restore default framing.

Picking remains correct after offset, resize, controlled cropping, and safe-area
application. Measure canvas and usable-canvas rectangles, projected center and
radius, diameter and composition ratios, control rectangles, overlap, overflow,
and safe areas. Do not shrink the globe to repair horizontal placement or add
per-device constants where one continuous policy works.

---

## Automatic continuation

Result continuation has one authority. Its ordinary default duration is exactly
`13_500 ms`. It is animation-time based, one-shot, bound to one Result
generation, paused while hidden, cancelled by trusted interaction, optional via
the existing preference, and independent of game speed.

Visible design may be nonnumeric, but exact remaining time stays available to
assistive technology through one normalized progress projection. Do not create a
CSS clock, second deadline, second owner, second firing path, second state
machine, or game-time countdown.

Keep manual `Next World`, Evolution, History, identity checks, idempotent reward
settlement, hidden pause, and explicit cancelled, disabled, firing, and completed
states. Visible copy should not update every second. Accessible text may update at
second boundaries without becoming an assertive live countdown. At `13_500 ms`,
ceiling-based text may truthfully begin at `14 seconds`.

Reduced motion removes nonessential travelling motion while retaining progress
and state. Forced colors preserve track, trace, and state. A cancelled Result does
not silently restart, and changing speed does not alter the duration.

---

## Autonomous-incremental communication

Behavior is the primary proof that the game is autonomous and incremental. Copy
should make clear that life grows on its own, tending is unnecessary, watching is
valid play, a World is finite, extinction produces memory and progression,
Evolution changes future Worlds, untouched Results continue the loop,
interaction retains control, and closing the page does not advance the World.

Do not solve genre comprehension only with a badge or paste a manual into Home or
Result. Keep copy concise and factual. Do not describe offline behavior as idle
progress.

---

## Simulation, identity, and ecology

The production fixed-step simulation is the only World authority. Use integer
ticks. RNG consumption order is part of determinism. Frame rate, renderer,
camera, layout, animation, scene, quality, visibility, speed, and UI state do not
affect authoritative outcomes.

Worker and fallback agree. Stale messages do not mutate the current World. A new
World has a new presentation generation and trusted identity; seed alone is not
identity. Do not skip ticks under load. Use bounded slices and retain debt.

If a Worker fails before authority begins, fallback may start from the same
immutable inputs. If it fails after authority begins, do not silently create a
second authority from an approximate snapshot. Fail honestly or use an
explicitly proven recovery protocol.

World identity must reject stale, cross-run, and cross-version messages across
app, driver, Worker, fallback, renderer, History, settlement, Result, and
continuation. Validate it at asynchronous boundaries. World replacement clears
presentation state belonging to the prior World.

Life occupies whole cells. Growth is local and requires a viable parent and
neighbor. Resources are local and finite. Renewal is bounded. Maintenance is
continuous. Transport moves real finite energy. Recycling draws from bounded
stock. Habitat access is explicit. Transformations are bounded and costly.
Luminous charge requires real living flux and cost.

No ordinary path creates energy or resources from nothing. No hidden pity or
run-number multiplier manufactures survival. No direct survival-time bonus
substitutes for ecological improvement. No finite build is immortal. Extinction
has an understandable causal chain.

Resource mechanics identify sources, sinks, rate limits, caps, costs, and
terminal behavior. Tests cover positive loops, nonfinite values, negative stock,
overflow, and reward-free audit-budget exhaustion.

---

## Environment Level

Every World begins at Environment Level 0. Environment Level belongs to
authoritative game time, rises only in the current World, resets for the next,
and is unbounded in representation and schedule. It expresses chronic ecological
pressure, not a permanent difficulty setting, random event deck, disaster system,
cross-World counter, direct reward multiplier, or hidden run-number bonus.

Evolution may help life endure specific pressure. It does not slow or reset the
public clock unless the user explicitly changes that product rule.

Environment profiles compile deterministically from exact Environment Level,
immutable compiled Evolution state, and versioned rules. Player-facing pressure
detail is truthful. Distinct dimensions require authored ecological identity and
mechanically distinct profiles; labels alone are not differentiation.

Prefer bounded normalized public percentages with accessible text. Keep raw
ratings and coefficients internal unless they have direct player meaning.

When changing Environment, distinguish schedule from profile, raw pressure from
effective coefficients, and current from next level; update simulation,
snapshots, UI, audits, balance evidence, and documentation together.

---

## Evolution

Evolution is permanent progression between Worlds. Purchases occur between
Worlds, and the active World uses one immutable compiled Evolution state.

One purchase raises exactly one selected Evolution cell by one exact local level
through the transactional path. The cell is owned when its level is at least one.
A fresh profile exposes only the one authored root cell. An unowned cell becomes
reachable only through direct adjacency to an owned cell on the canonical
Evolution topology. Refining an already owned cell remains a legal permanent
choice when affordable.

Every visible Evolution cell is authoritative. Picking, focus, selection,
purchase, adjacency, persistence, agents, and accessibility all address that
exact cell. Do not group several visible cells into one territory, owner, hidden
node, or purchase action.

Each cell carries one stable authored archetype. Archetypes may recur across the
sphere. A compact archetype catalog owns player-facing name, domain, biological
role, base cost parameters, and production effects. The substrate-guided cell
layout owns where those archetypes occur, how their connected regions meet, and
which exact routes become available; it does not own simulation effects.

Repeated abilities are intentional rather than filler. Repeated cells of one
archetype form one coherent connected region, and each domain forms a coherent
macro-region fitted to the fixed substrate. Exact local levels are summed into
exact aggregate archetype ranks. One cost policy and one production compiler
consume those ranks. Spatial distribution determines progression routes and
which exact cells are owned; it must not create a second effect compiler or a
location-dependent hidden balance rule.

Every archetype and repeated occurrence must have explicit economic meaning. A
purchase must change at least one of:

- local ownership and frontier reachability;
- local cell refinement state;
- aggregate archetype rank;
- a bounded compiled production effect;
- an explicit capability or defense.

No visible cell may be inert decoration presented as progression.

Evolution effects map to real production mechanics, not decorative power. Very
large exact levels must not create `NaN`, infinity, overflow, immortal builds,
unbounded loops, or unbounded compile cost. Bounded compiled effects and finite
Worlds remain mandatory.

The Evolution sphere must read immediately as a World-like living globe without
copying the active or historical World. Use one fixed deterministic World-derived
substrate on the maintained topology, with coherent low-frequency land/water
masses, coastlines, relief, climate, and biome-scale regions owned by maintained
World-generation primitives or one deliberately shared pure owner. That
substrate is both the presentation base and an immutable input to the one ability
layout. Select the sole `First Division` root from favorable green land. Fit
Foundation, Fertility, Freshwater, Scarcity, Cryogenic, Marine, Luminous, and
their archetype regions to truthful fixed-field affordances while keeping every
cell an exact purchase unit. Preserve World's cell scale, lighting, camera,
material hierarchy, and renderer architecture. Region perimeters, restrained
material modulation, local state edges, glyphs or patterns, and text may reveal
abilities, but they must not erase planetary geography or become a dominant
whole-cell patchwork.

Selecting or strengthening one cell may affect that cell's local cue and its
incident progression edges. It may also leave the immutable region perimeter
visible. It must not regenerate the substrate, recolor an entire region as if it
were purchased, or promote the region to a hidden owner. Ordinary cell material
remains legible beneath progression state. Selection, recent change, Imprint,
domain, archetype, and cost/readiness remain distinguishable through non-color
cues as well as color.

The shared Evolution cell/edge projection owns the ownership distinction for
both renderers. Selection and recent-change emphasis may temporarily override
incident edges, but when those transient states clear the exact ownership graph
cut returns unchanged. Do not infer or render ownership from reachability,
affordability, archetype or domain region, selection, fill brightness, or an
entire connected region.

Do not expose thousands of simultaneous DOM controls. Accessibility uses a
bounded native navigator for the selected cell, direct neighbors, stable
previous/next traversal, and a direct reachable-frontier action or equivalent
bounded mechanism. Every cell remains reachable to keyboard and assistive
technology, and topology size does not cause unbounded DOM growth.

Do not mutate Evolution during a World. Do not create a second compiler for
agents, previews, fixtures, or migration. When changing topology, substrate,
root, layout, catalog, level state, or transaction semantics, update together:

- stable cell identity;
- substrate and layout policy identity;
- root selection;
- archetype and domain regions;
- adjacency and reachability;
- local levels and aggregate ranks;
- costs and refinements;
- compiled effects;
- selection, picking, and focus;
- renderer-semantic arrays and edges;
- bounded accessibility navigation;
- persistence and transaction receipts;
- Imprints and History events when their identity changes;
- agents and audits;
- balance and performance evidence;
- documentation.

Use current-only reset when a coherent new topology, root, layout, catalog, or
level model cannot truthfully map old state. Do not retain obsolete territory or
scattered-layout readers, writers, aliases, or current documentation after
cutover.

---

## Luminous

Luminous is authoritative whole-cell bioelectric ecology, not a particle layer.
Charge derives from real World state and requires an owned enabling path, viable
living cells, sufficient flux or generation condition, setup or upkeep cost,
bounded retention, and deterministic update.

Zero authoritative charge produces no powered emission. Powered cells remain
distinct from ordinary life and do not conceal terrain, resources, stress,
selection, or History. Do not add bloom merely for visibility.

Test disabled, first-owned, mature, and zero-charge builds on day and night sides,
WebGL2 and Canvas, extinction, and Worker/fallback parity.

---

## Balance

Balance is a production-data problem. Do not tune from one seed, screenshot,
anecdotal World, mean, or development set alone.

Separate game-time survival, wall-clock pacing, animation timing, observability,
and progression cadence. Before changing ecology constants, determine whether a
complaint is slow presentation, sparse meaningful change, weak legibility,
unclear extinction cause, weak first purchases, poor reward cadence, seed
variance, or true authoritative imbalance.

Use production `RunController` and the production progression compiler. Use
paired seeds, development and holdout sets, fresh and early-Foundation fixtures,
specialist, Luminous, and mature fixtures. Report distributions for survival,
normal-speed wall-clock implications, peak and sustained REACH, habitat
occupancy, Environment Level, extinction cause, SCORE, Echoes, first-purchase
cadence, powered-cell evidence, and seed variance.

Use autonomous multi-World campaigns for loop-level progression. The agent does
not mutate Evolution during an active World. Prefer the smallest causal rule
change. Protect finite resources, inevitable extinction, multiple viable builds,
no universal optimal path, no positive resource loop, no hidden pity, and no
direct survival-time cheat.

Label targets as targets and measurements as measurements.

---

## SCORE, Echoes, and Result

SCORE is realized World performance. Live SCORE is a projection of the trusted
settlement model. Echoes derive from trusted SCORE. Neither depends on speed,
camera, renderer, frame rate, quality, UI state, or imported summaries.

Settlement is idempotent. Do not grant rewards for abort, failure, audit budget
exhaustion, stale result, duplicate transaction, or untrusted import.

When scoring changes, version the model and update terminal replay, projections,
Result, tests, agents, balance reports, and documentation.

Result explains the completed World with final SCORE, Echoes, Environment
context, extinction cause, meaningful milestones, manual Next World, Evolution,
History, and automatic-continuation state. It is not a telemetry dump or reward
authority.

Keep continuation and primary actions outside the scrolling evidence body. Use
one scroll owner. At small viewports and `200%` text, actions remain reachable,
no horizontal page scroll appears, nested scrolling is avoided, and focus order
stays logical.

---

## HUD, Menu, surfaces, and focus

The ordinary World HUD remains compact. Primary concepts are SCORE, REACH,
Environment Level, and Result when available. Keep metric tracks stable. A metric
surface answers what is happening, why, what changed, and what the player can do;
it does not expose raw coefficients without player meaning.

World speed belongs to its direct in-World control and is not duplicated in Menu.

Keep Menu small. Use it for persistent preferences and destructive lifecycle
actions that do not belong on the World rail. Do not add tuning controls for
camera inertia, orbit speed, idle delay, sphere position, continuation duration,
simulation internals, or visual boundary styling. Choose good defaults.

Use one coordinator for transient surfaces. A surface owns open state, focus
entry and restoration, Escape, backdrop behavior, scroll ownership, camera hold,
and trusted-interaction implications. Do not let several modules open or close
the same surface.

Native controls remain interactive. Direct globe manipulation may remain
available on exposed canvas. Opening a surface does not rotate or zoom the globe,
alter simulation, retain stale velocity, or fire a hidden purchase. Closing
restores focus predictably.

---

## History

History is observation, not control. Semantic History is authoritative. Visual
History is approximate and bounded. Keep channels versioned and explicit. A
checkpoint is not a simulation save.

Loading History does not change reward state, Evolution, RNG, the live World, or
authority unless explicit current product policy says otherwise. Historical time
and visual state match. If a visual checkpoint is absent or incompatible, retain
semantic History and disclose the limitation.

Keep visual storage bounded. Validate imports. Do not execute imported data or
trust imported result projections.

---

## Rendering and visual verification

Rendering projects immutable state. WebGL2 is primary; Canvas 2D is a semantic
fallback. Both preserve whole-cell geography, local resource condition, ordinary
life, stress and critical state, dead remains, transformations, Luminous charge,
selection, History, Evolution, and Trophy state. Semantic parity does not require
pixel identity.

Within World, ordinary life is edge-primary. One deterministic projection from
the two cells adjacent to each topology edge owns life-edge classification for
both renderers. Exposed frontier is more salient than an internal living edge.
Stress and critical state differ through more than hue. Dead remains read as
residual, not living or powered. Ordinary living interiors preserve biome and
resource information. Luminous remains independent. Selection and History retain
independent cues.

Evolution uses one shared immutable World-derived substrate, one shared
substrate-guided connected ability layout, and one shared cell/edge progression
projection. Both renderers consume the same land/water, biome, relief, root,
archetype/domain region, and exact-cell state inputs. Exact per-cell state, not a
region owner, drives purchases and dynamic progression cues. Region boundaries
are immutable restrained structure; selected and recently strengthened cells are
local. Locked, reachable, owned, and affordable state must not erase macro
geography or imply that a group of cells is one purchase. At normal far framing,
continents and coherent ability/domain regions must both read; at near framing,
exact cells, archetype boundaries, and state cues remain legible.

The steady owned/unowned perimeter is the exclusive-or of endpoint ownership.
Edges internal to owned territory and edges among unowned cells never receive
that class. A reachable/locked boundary, when drawn, is a separate lower-priority
semantic and must not resemble the ownership perimeter. The renderer may use
restrained cell-centered readiness cues, but must not reconstruct a bright
per-cell frontier network.

Verify this hierarchy with semantic layout/field invariants and relative
production-browser measurements, not screenshots alone: the root is visibly on
green favorable land, every archetype and domain satisfies its connectedness
contract, substrate-fit directions hold, land and water remain coherent, region
perimeters survive both backends, substrate contrast remains primary, the exact
ownership cut matches source semantics, its steady signal exceeds owned-interior,
reachable, and immutable-region cues by a noise-calibrated margin, and selection
and recent change remain locally distinguishable.

Geography and progression may share the existing boundary pass, but neither
replaces the other. Do not add a pass when the existing pass can own the
replacement. Do not leave old and new visual authorities active together.

Create or cache static geometry, substrate, layout, and immutable region edges
once. Do not rebuild them per frame. Avoid per-cell or per-edge object churn in
hot render paths. Dynamic edge presentation uses reusable typed buffers, remains
`O(edgeCount)` per accepted semantic snapshot, and does not rebuild only because
animation time advances. Keep draw calls measured and bounded. Keep Canvas
playable after WebGL context loss. Update picking coherently with renderer
geometry.

Use controlled fixtures and real browser evidence. Prefer relative measurements:
substrate versus region contrast, archetype perimeter versus internal cell edge,
progression state ordering, root material, center and limb continuity, day/night
visibility, close/far behavior, selection, backend ordering, draw count, buffer
size and cadence, and frame cost.

Screenshots supplement measurements; they do not replace geometry, contrast,
state, performance, browser, or fallback evidence. Calibrate pixel thresholds
against repeat noise with a meaningful margin.

---

## Accessibility and responsive behavior

Accessibility is part of the product contract. Use native controls when suitable,
accessible names, visible focus, keyboard access to every meaningful action,
non-hover affordances, non-color cues, sufficient touch targets, reduced-motion
support, forced colors, high contrast, and `200%` text.

Do not create high-frequency live-region updates or move focus whenever a metric
changes. Do not trap focus outside a real modal surface. Canvas-only meaning that
matters to player understanding has a truthful textual or structural equivalent.
Test keyboard-only interaction, focus restoration, and reduced motion in a real
browser.

Evolution's semantic path stays bounded independently of cell count. The current
cell, its exact status and archetype, its domain and region context, its direct
neighbors, and deterministic traversal/frontier actions must be operable without
rendering every Evolution cell as a DOM control. The green starting location must
also be identified through text or structure rather than color alone.

Required viewport evidence normally includes:

- `320×568`;
- `360×640`;
- `390×844`;
- `430×932`;
- `768×1024`;
- `844×390`;
- `1024×600`;
- `1440×900`.

Measure page overflow, canvas and usable-canvas bounds, globe center/radius/
diameter, stable controls, overlap, touch targets, Result actions, scroll owners,
safe areas, and focus visibility. Do not infer responsive success from CSS or a
screenshot; use browser rectangles. Preserve portrait, landscape, small
landscape, safe-area insets, keyboard behavior, and virtual-keyboard behavior
where evidence is available.

---

## Persistence, import, and security

Persistence is current-only unless a maintained consumer requires migration.
Version every durable document and validate every load. Reset mismatched
current-only documents. Do not accumulate migration layers by default.

Use exact integer strings for unbounded progression quantities and normalize
before arithmetic. Bound arrays, queues, History, Trophies, receipts, caches, and
sparse Evolution state. Use transactional revision checks, reject stale expected
revisions and stale aggregate ranks, and use bounded transaction keys for
idempotence.

A root or cell-to-archetype layout change changes the meaning of numeric
Evolution cells. Include substrate/layout identity in current validation and
reset incompatible Evolution levels, receipts, Imprints, and layout-bound History
rather than silently reinterpreting them. Preserve independently valid unrelated
facts through their existing owners.

Do not persist presentation-only camera motion, developer mode, diagnostic speed,
or untrusted reward projections.

Treat imported data as hostile. Validate type, version, size, count, exact integer
syntax, enums, IDs, checksums where used, namespace, and nesting. Reject or reset
invalid data. Do not execute imported strings or interpolate imported HTML. Do
not trust imported SCORE, Echoes, Trophies, or terminal summaries. Recompute
trusted facts through authority where supported.

Keep Content Security Policy and static-host constraints in mind. Do not add
remote runtime dependencies casually.

---

## Performance and boundedness

Measure before optimizing and preserve determinism. Do not skip authoritative
ticks. Use same-host comparisons and record revision, hardware/browser when
available, command, fixture, duration, result, authority hash, and profile hash.

Investigate a same-host regression around `10%` or greater unless a measured
product gain justifies it.

Keep tick debt, work per slice, camera samples, continuation state, History,
reports, caches, agent traces, notifications, Trophy queues, DOM size, and
renderer-semantic buffers bounded.

Avoid per-frame static-geometry rebuild, per-cell or per-edge object churn,
unbounded DOM growth, unbounded listeners, duplicate render loops, duplicate
timers, synchronous hot-path storage, and repeated normalization inside per-cell
loops.

Evolution state projection should be linear in cells plus edges plus archetypes.
Build normalized levels, aggregate ranks, frontier, costs, and renderer arrays
once per accepted progression revision rather than invoking a full normalizer for
each cell. Substrate, root, connected layout, memberships, and region-edge
structure are immutable for a topology/content lifetime. Construct them with
bounded deterministic work and never partition the graph during a frame.

High diagnostic speed may reduce presentation frequency, never authoritative tick
count.

---

## Testing and evidence

Test at the layer that owns the property.

Use pure and unit tests for schedules, validation, exact arithmetic, green-root
selection, substrate-guided layout connectedness and capacity, domain fit, tier
distance, progression compilation, scoring, camera math, layout geometry,
continuation, accessibility projections, renderer-semantic projections, exact
endpoint ownership/reachability edge truth tables, codecs, and bounds.

Use integration tests for Worker/fallback agreement, stale identity rejection,
settlement idempotence, settings reset, History switching, multi-World
continuation, progression transactions, persistence cutover, and authority
hashes.

Use browser tests for the real entry point, DOM, focus, keyboard, pointer, touch,
pinch, wheel, cancellation, rectangles, rendering, controlled visual fixtures,
context loss, WebGL2, Canvas, Worker, fallback, reduced motion, forced colors,
`200%` text, green-root framing, coherent region readability, exact Evolution
ownership-perimeter hierarchy, and safe areas where available.

Use production authority, cohorts, holdout seeds, and multi-World campaigns for
balance and agent evidence. Never reward budget exhaustion.

Use focused checks while editing; do not run the full suite after every small
change. Run one fresh complete verification against stable final content.
Classify evidence as passed, failed, skipped, unavailable, not run, stale, or
superseded. A skipped, unavailable, or stale check is not a pass.

Browser evidence uses the production entry point and trusted input. Exercise
relevant lifecycle paths across Home, first World, Result, automatic and manual
next World, Evolution, History, Trophies, New World, and reset. Record browser,
renderer, and execution identities. A synthetic event is not physical-device
evidence, a headless browser is not a physical device, and a local browser pass
is not deployed-browser proof.

---

## Documentation

Current documentation describes current behavior and changes in the same campaign
as production behavior.

Keep `README.md` player-facing, `docs/status.md` concise and factual,
architecture/game-design/rendering/accessibility/testing documents current,
balance targets distinct from measurements, and decisions explicit. Mark
superseded decisions. Do not rewrite historical evidence as though it measured a
new policy. Git history and terminal work packages are the archive.

Do not preserve rejected architecture as current documentation, add a status file
for every step, or duplicate the same current contract across packages. Search
for stale terminology and values, run link checks, and keep transient campaign
priorities out of this file.

Do not place self-referential final commit identities inside the same commit whose
identity they claim.

---

## Source, Git, and external actions

Use ES modules and the established JavaScript style unless a coherent local
cleanup is required. Use clear names and standard terminology. Keep public copy
concise and comments factual. Avoid broad renaming or formatting-only churn in
unrelated files. Preserve encoding and line endings.

Do not add generated artifacts to source control unless repository policy
requires them. Put large evidence in ignored reports and return paths and digests
instead of pasting logs.

Inspect Git status before editing. Preserve unrelated changes. Do not reset or
clean a dirty worktree destructively. Review the final diff, run
`git diff --check`, account for every changed and untracked file, and use coherent
commits.

Do not force-push, rewrite published history, or amend another contributor's
commit without explicit reason and authorization.

When normal push is in scope, verify intended branch and upstream, push normally,
verify the remote ref, verify CI and deployment, and verify deployed bytes when
production behavior matters. If credentials are unavailable, state that.

A local commit is not a push. A push is not CI success. CI success is not
deployment success. Deployment success is not deployed-interaction proof.

---

## Completion standard

A task is complete only when:

- the selected product behavior exists in production code;
- one authority owns each selected rule;
- predecessor paths are deleted or explicitly superseded;
- focused tests pass;
- real browser evidence covers relevant behavior;
- Worker and fallback remain coherent;
- WebGL2 and Canvas remain semantically coherent when affected;
- accessibility and responsive viewports are verified;
- performance is measured when affected;
- balance is measured when affected;
- documentation is current;
- the final diff is reviewed;
- `git diff --check` passes;
- worktree and commit state are reported;
- external actions are verified when in scope;
- unavailable evidence is named honestly;
- deferred concerns are preserved without speculative hooks.

Do not continue into adjacent polish after the selected stopping rule is met.
