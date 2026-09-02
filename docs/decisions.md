# Decisions

Concise architecture/product records: context → decision → consequence → evidence.

> **Historical record.** Entries below describe superseded releases and may
> mention retired migration, event, Evolution, SCORE, or persistence behavior.
> They are not current product policy. Follow `AGENTS.md`, current source/tests,
> and `docs/status.md` for current authority.

## D0 — 2026-08-07 Environment Progression v2 supersedes static frontier records

This entry is archived evidence, not current authority.

## D1 — Zero runtime dependencies

Contest rules limit external libraries and authorship matters. Use native
HTML/CSS/ES modules, Node built-ins for tooling, no framework/CDN/runtime
package. Consequence: every deployed byte is repository-authored and static.
Evidence: `package.json`, link gate, contest rules fetch recorded in status.

## D2 — WebGL2 primary, Canvas 2D fallback

Desktop/smartphone Chrome support WebGL2 broadly, while a blank unsupported
page is unacceptable. WebGL2 owns the four-draw authored cellular presentation;
Canvas keeps geography, cellular life, selection, events, History, and Memory
playable without drawing organism routes. Evidence: renderer unit contracts and
dedicated real-Chrome WebGL2 and forced-Canvas scenarios.

## D3 — Stable level-4 topology

2,562 cells/7,680 edges balance morphology and mobile cost; quality must not
change scores. Keep the topology/edge ordering stable for simulation, picking,
History locations, and persisted Imprints. Evidence: topology/manifold tests.

## D4 — Worker authority with identical fallback

The main thread should render/input while GitHub Pages lacks cross-origin
isolation. Use module Worker messages and transferable snapshots, with the same
`RunController` fallback and no SharedArrayBuffer. Evidence: chunk/speed whole-
run determinism and browser Worker path.

## D5 — Storage by bounded concern

Keep separate validated localStorage documents for Settings, progression, and
semantic History; report write failure and continue in session memory. Store
only the newest ten strict, ≤256 KiB visual History bundles (≤2.5 MiB total) in
current-only IndexedDB because checkpoints do not belong in semantic
export/import. Evidence: migration, corruption, quota, transaction, codec,
stale-load, and browser reload tests.

## D6 — Fixed-step deterministic math

Render cadence never enters simulation. Use xoshiro streams, fixed iteration,
`Math.fround` state writes, and LUT environmental curves. A future 8 Hz/fixed-
point rewrite remains a separate rebaseline only if measured benefit warrants
risk; current 10 Hz is deterministic and fast.

## D7 — Ordinary globe input is observational

Pointer coordinates previously changed run authority, conflicting with the
living-atlas thesis and ambient zero-input mode. Delete that authority instead
of renaming/hiding it. Tap selects/inspects, drag orbits, pinch/wheel zooms;
Memory node selection is the explicit progression exception. Consequence:
camera/inspection/History can be proven neutral. Evidence: integration run
with hundreds of observations matches quiet run in hash, score, decisions,
History, extinction, and Imprint.

## D8 — Adaptation offers are queued data

A three-card offer is not a simulation phase. Keep status running, store fixed
FIFO offers, default to exact-uniform seeded Random selection, and allow Manual
delay without expiration. Consequence: no forced surface or deadlock; offer and
resolution ticks remain replayable. Evidence: unit/integration/browser tests.

## D9 — Explicit pause ownership

A single boolean lets panel close accidentally resume manual pause. Use a Set
of manual, hidden, and optional panel reasons. Panel pause defaults off. Evidence:
pause ownership unit test and browser time-continuation checks.

## D10 — Graph-native geography

Independent scalar noise could not produce coherent inspectable regions.
Preserve topology but generate quantile continents, private priority-flood
drainage, connected whole-cell lakes, climate, forests, biomes, regions, and
lake-backed landmarks. Central biome factor arrays bound gameplay effects.
Evidence: world hash, lake property/audit tests, generation timing, and browser
screenshots.

## D11 — 108-cell adjacent Memory atlas (superseded by D16)

The first 108-node placement needed 153 nonadjacent prerequisite paths, recreating
the line-and-dot problem. Use a separate level-3 642-cell globe, solve 108 unique
locations so every prerequisite is direct cell adjacency, convert legacy edge
Imprints to bounded cell weight, and retain a grouped semantic list. Consequence:
progression reads as territory without path geometry. Evidence: frozen mapping
hash, adjacency/degree/economy/migration tests, and Chrome selection/purchases.

## D12 — Optional idle rotation, default off (superseded by D22)

This decision was superseded by Ecology experience v2. Idle rotation and camera
inertia were removed rather than exposed as tuning preferences; direct globe
dragging and focus framing remain.

## D13 — Cell material is the life visual (ordinary-life projection superseded by D25)

Warm route fragments and tip sprites made the organism look drawn above the
planet and required explanatory copy. Keep transport internally authoritative,
but remove its visual pass and edge snapshot payload. Express life stages,
crises, selection, History, and Adaptation propagation on the same geography
cells. Consequence: the world remains legible with no graph legend and five
steady draws. This remains the historical rationale against organism routes;
D25 supersedes only the claim that ordinary living/frontier state should alter
whole-cell material. Evidence: historical source-negative tests, snapshot-byte
test, and screenshots.

## D14 — Visual History is approximate and authority-neutral

Semantic events alone could not show temporal change, while raw tick logs would
violate storage bounds. Record strict v2 quantized checkpoints with every
renderer-semantic dynamic channel: life, resources, transformation, charge,
Luminous development, and atmospheric wear. Keep initial/final frames and
sample event-heavy runs deterministically within the byte cap. Switch checkpoint
label, snapshot, and controls atomically; loading/unavailable History stays
semantic-only, and Live restores authority immediately. Carry the terminal
bundle with the extinction outcome so immediate continuation cannot outrun its
save. Keep bundles current-only, device-local, newest-ten, and byte-bounded. Evidence: neutrality,
codec/bounds/stale-load tests and real-Chrome Worker/fallback/Canvas paths.

## D15 — Results continue unless attention says otherwise (projection superseded by D23; duration by D24)

This is historical evidence for the initial continuation cutover; D24 replaces
only its nine-second duration. Ambient play should not stop at an opaque result
card, but progression must never be spent implicitly. Keep the terminal world behind a compact strip and
start one nine-second next-World continuation authority. Hidden time pauses it; the first
trusted interaction—including opening or closing a detail surface—cancels it
permanently for that result. Settings toggles never rearm it. Only explicit
Evolution input spends Echoes. Result awards are idempotent. Evidence: policy tests, 100-world soak,
and a no-input real-Chrome second-result → third-world transition.

## D16 — Every Evolution Globe cell is a Skill Cell

The sparse 108-cell projection left most of the dedicated globe inert. Partition
the level-3 icosphere by its six cardinal Voronoi territories: symmetry yields
six connected 107-cell regions exactly. A deterministic breadth-first layout
orders each territory. Interleave the 108 authored landmarks with 534 low-
amplitude permanent skills and retain stable landmark IDs. The initial slice
also coupled that layout to purchase order and completed-world thresholds;
D19 supersedes only that acquisition authority. Evidence: mapping hash
`d6bdc218`, graph/economy/migration tests, full legal purchase, and WebGL2/Canvas
pointer selection.

## D17 — Trophy proof is deferred and authority-neutral

Achievements must recognize actual play without creating load-time rewards or
simulation inputs. Retain bounded integer proof with completed semantic History,
conservatively derive old proof only at explicit progression transactions, and
store recognized IDs monotonically (introduced in schema 6 and retained in
current schema 8; D20 narrows Legacy ownership). Present 96 exact criteria on a
separate 162-cell sphere; 66 neutral cells remain inert. Evidence: catalog and
proof-boundary audit, schema-5 no-grant migration test, idempotent result test,
and WebGL2/Canvas screenshots.

## D18 — Whole-cell lake hydrology

The cell is the smallest visible geography unit. Internal rainfall, outlet,
priority-flood elevation, drainage direction, and accumulation remain private
inside world generation; no user-facing drainage systems or sub-cell water
geometry survive. Public geography exposes separated connected lake components,
full-cell shore/wetland ecology, bounded lake factors, and frozen lake records.
WebGL2 reuses terrain and boundary materials; Canvas uses one full-cell terrain
fill and shared cell edges. A source audit rejects fine-feature regressions and
a 500-seed audit gates distribution, connectivity, ecology, determinism, and
cost. The 200-line/16-child structure thresholds are now maintainability
warnings; hard caps remain 400/24 so cohesive generation and audits stay legible.

## D19 — Evolution purchase authority is the physical frontier

The player-visible sphere, not a hidden clock or authored traversal tree, defines
Evolution access. Precompute the stable ID-to-cell map and all physical level-3
neighbors. A current cell can be bought exactly when it is recognized, unowned,
affordable, and touches any one owned cell. Exactly six canonical roots remain
the initial-save exception. Preserve every recognized
migrated island and let each act as a frontier; never close ownership or alter
currency during migration. Retain the exact 2,462-Echo economy and all effects.
Evidence: graph/schema 4/7, 3,840 directed frontier checks, exhaustive 411,522
single-owner states, run-zero full acquisition, persistence tests, and hashes
`34b4e4a9` (economy) / `8444edfd` (effects).

## D20 — Hard Trophy mastery, Legacy isolation, and global feedback

Current Trophies represent diverse long-term mastery, not contact. Keep 96
current cells but allow rich whitelisted combinators over facts-v3 and persisted
cumulative aggregates. Record whole-cell lake proof at first birth and existing
summary cadence; include it in the final hash without affecting RNG or authority.
Schema 8 maps `reach-river-touch` ownership to a separate explicit Legacy list;
new lake mastery uses `reach-lake-network`, and v1 bit 2 is never lake proof.
At exactly-once recognition, append semantic History and a persisted unique FIFO.
The global queue outlives world presentation generations; run-owned captions do
not. Central UI-only durations are 2.7 s toast, 3.75 s Adaptation, and 4.2 s
Trophy, with hover/focus holds and static reduced motion. Evidence: production
24/240-world audit hash `40aa0e55`, migration/result/queue fake-clock tests, and
real-browser sequential feedback scenario.

## D21 — Public speed is relative to one normal game-rate baseline (ladder superseded by D24)

This is historical evidence for the relative-speed cutover; D24 replaces only
its three-step public and developer option catalogs. The old player ladder made
the intended ordinary pace look like a special 4× mode. Store a public relative
multiplier, expose 0.5×/1×/2×, and convert once to
effective game rate 2/4/8 before Worker or fallback clock accumulation. Developer
mode extends the relative ladder from 0.25× through 64×. Game time owns tick
meaning; camera and Result behavior use animation time. Current-only settings
reset and a single protocol revision replace old semantics. Evidence: conversion,
settings, protocol, all-speed/mixed-speed determinism, and eight-second Worker and
fallback pacing measurements.

## D22 — Default camera-motion architecture and projected World framing (release policy current in D37)

A watchable autonomous ecology should remain tactile after release and quietly alive without input, without returning camera-tuning preferences to the Menu. This decision established the orthonormal free-orbit frame, fixed recent sample storage, elapsed-time damping, lifecycle cancellation, separate calm Home/World orbit, and projected framing. Its clamped velocity and hard lifetime were first recalibrated by D26 and then deleted by D27. Retain the 4.5-second idle delay and derive World/Home distance from field of view and a smooth 1.08/0.98/0.90 projected-diameter target.

## D23 — Result cycle is one accessible projection of continuation authority (duration superseded by D24)

This is historical evidence for the ring projection; D24 replaces only the
nine-second duration. D15's identity-checked nine-second authority remains.
Replace its changing visible integer with a nonnumeric World-cycle ring driven only by normalized
remaining time. Update the bounded trace near 30 Hz; update exact non-live
assistive text only at second or state boundaries. Reduced motion removes the
travelling marker, forced colors retains track/trace, and cancelled/disabled
states remain textual. No CSS clock, second deadline, or second firing path is
introduced. Evidence: pure projection/cadence tests, hidden/cancel/disabled/
one-shot integration, and trusted compact/200%-text browser scenarios.

## D24 — The autonomous World presentation contract uses six speeds, 13.5 seconds, and two-thirds wide framing

Keep `1×` as the intended ordinary pace and the relative-to-effective baseline
of four. Expose exactly `0.25×/0.5×/0.75×/1×/1.25×/1.5×`, mapping to effective
game rates `1/2/3/4/5/6`; developer mode adds `2×/4×/8×/16×/32×/64×`. Reset
mismatched settings at schema 8 rather than semantically migrating old public
values, and retain generic Worker protocol 12 because its numeric message and
shared validation meaning did not change. Extend the existing one-shot Result
authority to exactly 13.5 animation-time seconds without adding a clock or
firing path. Preserve the `1.08/0.98/0.90` globe-diameter policy while moving
sufficiently wide Home/World projected centers toward two-thirds of usable
width and keeping portrait centered through one continuous layout policy.
Evidence: exact policy/settings/deadline/continuity tests; all-speed and mixed-
speed authority equality; eight-second Worker/fallback pacing; trusted Worker,
fallback, and Canvas browser paths; eight viewport geometry; 200% text;
reduced motion; forced colors; and unchanged four-draw WebGL2 rendering.

## D25 — Ordinary World life is one shared edge-primary projection

Keep whole cells as simulation, geography, resource, transformation, habitat,
and Luminous units, while moving ordinary living/frontier presentation from
cell interiors to canonical inter-cell boundaries. One pure renderer-semantic
owner classifies every `edgeA` / `edgeB` pair with critical-over-stress-over-
living-over-remains precedence and internal/exposed/residual relation. WebGL2
feeds its one-byte result into the existing boundary draw; Canvas consumes the
same result through fixed typed path batches. Exposed active frontier is stronger
than an internal living edge. Severe states and remains may keep restrained
subordinate interior support, but ordinary life does not recolor the cell.
Selection, History, coast/lake geography, and authoritative whole-cell Luminous
charge remain independent. No snapshot, protocol, History codec, persistence,
simulation, or fifth-draw change is introduced. Evidence: exhaustive pair and
reversal tests, source-negative audit, calibrated Chrome 152 WebGL2/Canvas
interior/edge/resource/overlap measurements, four-draw and context-loss paths.

## D26 — Deliberate flicks use one progressive bounded release response (historical; superseded by D37)

D22 remains the camera architecture decision, but its conservative release
calibration is historical. Keep immediate direct drag, the six-sample/120 ms
recent estimator, the orthonormal free-orbit frame, analytic animation-time
damping, and the separate calm Home/World idle orbit. Map finite raw release
speed through one quadratic response: zero through `0.30 rad/s`, saturation at
an `8.00 rad/s` output by a `2.20 rad/s` input, a `600 ms` damping half-life,
`0.025 rad/s` stop speed, and a `5,000 ms` hard lifetime. A deliberate strong
flick therefore approaches one additional bounded turn, medium input carries
less, and slow inspection stops. Integrate each inertia step as one simultaneous
body-frame angular delta so equivalent elapsed traces agree across 30, 60, 120,
and 144 Hz. Cumulative incremental camera-basis travel, not wrapped final
orientation, is the release-distance oracle. Trusted activity and every existing
hold/reset boundary still clear velocity; reduced motion disables release and
orbit. No simulation, renderer-backend, input-scale, idle-speed, persistence, or
player-setting authority is added. D27 later replaced this response curve and
hard-lifetime policy; D30 briefly restored them on top of D27's retained input
geometry before D37 superseded that release policy.

## D27 — Visible-sphere input and faithful release transfer (foundation restored by D37)

Ordinary direct manipulation uses the object the player can see as its scale.
At the first one-pointer down, snapshot half the projected sphere diameter in
CSS pixels; keep that finite radius stable for the gesture and divide both CSS
delta axes by it. Apply each angular delta immediately and give that exact delta
to the six-sample/120 ms estimator.

At a valid drag release above `0.30 rad/s`, transfer the finite measured velocity
components directly. Delete nonlinear amplification, output saturation, turn
limits, and the fixed lifetime. Retain the `600 ms` damping half-life,
`0.025 rad/s` stillness threshold, analytic body-frame integration, bounded
frame step, lifecycle cancellation, reduced-motion suppression, 4.5-second idle
delay, and `0.022 rad/s` Home/World orbit. Motion state remains constant-size at
every finite speed and duration. Evidence: exact transfer through `32 rad/s`,
natural-rest references, 30/60/120/144 Hz agreement, queued-handler equivalence,
trusted mouse/touch and all-viewport normalized gestures, zoom/resize scale
checks, Worker/fallback and WebGL2/Canvas paths, and paused-authority fingerprints.

## D28 — Atmosphere silhouette quality is renderer-owned

Keep the atmosphere in the existing fourth WebGL2 World draw, but bind it to one
fixed argument-free refinement-5 unit icosphere rather than the level-4 gameplay
topology. Its 10,242 vertices and 61,440 `Uint16` indices are constructed once,
uploaded at renderer initialization/restoration, and disposed through the normal
World-pass lifecycle. Gameplay topology, cell count, snapshots, seeds, simulation
resolution, camera, and quality settings cannot change the geometry. Canvas 2D
retains its analytic projected halo and the same atmosphere meaning. No shader,
simulation, protocol, History, progression, reward, persistence, camera, picking,
or draw-count authority changes. Evidence: deterministic geometry bounds,
source-negative audit, calibrated Chrome contour cohorts, topology probes,
four-draw lifecycle, Canvas state response, and same-host frame measurements.

## D29 — Faithful low-speed release has a perceptible threshold (restored by D37)

Supersede only D27's `0.30 rad/s` release threshold with `0.08 rad/s`. The larger value belonged to D26's deleted progressive response and left a broad dead zone after measured-vector transfer became direct. Keep the six-sample/120 ms estimator, exact vector transfer, `600 ms` damping half-life, `0.025 rad/s` rest threshold, natural termination, cancellation boundaries, and reduced-motion suppression unchanged. A deliberate release near `0.260 rad/s` must therefore carry without amplification, while a genuine precision trace near `0.050 rad/s` must remain still after release. This is presentation-only and adds no setting, simulation input, allocation, or second motion owner.

## D30 — Progressive bounded release is restored over visible-sphere input (superseded by D37)

Retain D27's projected-radius-normalized immediate manipulation, strict input
timestamps, exact applied-delta sampling, simultaneous body-frame integration,
and bounded foreground animation debt. Supersede D27/D29 release transfer with
one quadratic response owned by `camera-motion.js`: zero through `0.30 rad/s`,
saturation at `8 rad/s` by `2.20 rad/s` input, `600 ms` damping half-life,
`0.025 rad/s` rest threshold, and `5,000 ms` hard lifetime. The response applies
only after a valid drag release. Strong input therefore travels about one bounded
turn, medium input carries proportionally less, and slow inspection does not
drift. The separate 4.5-second idle wait and `0.022 rad/s` Home/World orbit remain
unchanged. Cumulative incremental travel is the distance oracle. Evidence covers
30/60/120/144 Hz, delayed observation, trusted mouse/touch, every cancellation
boundary, reduced motion, Worker/fallback, WebGL2/Canvas, and paused authority.

## D31 — Chronic Environment dimensions have authored mechanics and one live projection

Keep the Environment Level-0 start and unbounded schedule unchanged, but replace
the shared dimension rating with five direct exact curves whose sum preserves
the prior scalar rating. Profile v5 owns all curve, defense, normalization, and
coefficient compilation. Scarcity reduces energy recovered from finite nutrient
through one bounded resource-yield scale; renewal, climate, toxicity, and
maintenance retain their dedicated production consumers. The selected scarcity
effect cap is `0.15`, frozen only after development and untouched-holdout gates.

One current/next projection interpolates effective dimension pressure on the
same authoritative progress basis as coefficients. Snapshots, terminal Results,
History, the fair agent, and the DOM consume that projection; none recomputes
ratings. Ordinary UI exposes whole percentages and ecological labels, while raw
ratings and coefficients remain internal. Legacy detail without matching profile
identity is omitted rather than reinterpreted. Consequence: every public row is
mechanically distinct and truthful without changing schedule, SCORE, Evolution,
renderer, speed, or World authority. Evidence: exact and huge-Level profile
tests, five controlled production consumers, Worker/fallback parity, paired
balance cohorts, conservation/terminal/agent audits, fixed-work benchmark, and
focused WebGL2/Canvas browser scenarios.

## D32 — Authored Evolution graph and cellular presentation are separate authorities

Keep the existing frequency-2 graph as the sole authority for 42 skill IDs, roots, adjacency, costs, exact levels, purchases, and compiled effects. Project those sites deterministically onto the shared level-4 topology by stable spherical Voronoi ownership. All 2,562 fine cells have one owner; every territory is connected; the visible contact graph equals all 120 authored edges with no extra contact. One pure immutable owner supplies compact membership, semantic centroids/anchors, picking, scene projection, and edge classes.

Fine cell boundaries remain visible. Territory, selected, and recently upgraded perimeters reuse the existing WebGL boundary draw and Canvas boundary phase, so WebGL remains four draws. The semantic tree remains 42 items. ID-based meta and the compact frequency-2 Imprint record do not change or reset, and no fine map is persisted. Consequence: Evolution gains World-density physical character without new skills, filler, economy changes, renderer authority, or active-World effects.

## D33 — Every visible Evolution cell is progression authority

Supersede D32 for current product behavior. The maintained level-4 topology is both Evolution's visible and progression topology: all 2,562 cells have stable identities, and its 7,680 direct edges are the sole frontier rule. Retain the 42 authored definitions as reusable archetypes. A deterministic stratified cellular weave assigns one archetype to every cell, with one `First Division` root and no large same-archetype region.
Persist sparse exact local levels by cell. Sum them into exact aggregate archetype ranks; price the next occurrence through the existing target-level law at aggregate rank plus one; compile the same 42 ranks through the one production compiler. Repeated cells add spatial choice without multiplying cheap first levels or making location a hidden simulation rule.
Picking, focus, transactions, fine Imprints, History, renderers, accessibility, and agents consume exact cells. One bounded native navigator replaces the 42-item tree. WebGL2 retains four draws and Canvas consumes the same edge semantics. Incompatible skill-ID levels, receipts, coarse Imprints, and Evolution History reset under current-only validation; no arbitrary migration maps old skills into new cells. D32 remains historical evidence for its terminal revision, but its graph/territory authority is deleted from current production.

## D34 — Evolution presentation rests on one fixed World-derived planet

Retain D33 as the sole progression authority, but stop treating its deliberately high-frequency archetype weave as geography. `createEvolutionFields` calls the maintained World `createFields` owner with fixed seed `0xe701c311` and constructs one immutable presentation-only substrate for the level-4 topology. Land/water, biomes, forest, relief, lakes, shores, and lighting establish the primary planetary hierarchy; purchases, profiles, Worlds, renderers, and animation never regenerate it.
One World/Evolution/Trophy renderer scene discriminator preserves current World and Trophy material while Evolution adds only restrained cell-centered domain/kind glyphs, local state insets, fine Imprints, and the existing exact quiet/owned/frontier/recent/selected edges. Canvas begins from the same biome and water fields, and WebGL remains four draws. The predecessor all-land Evolution fields, broad Canvas biome override, `uMemory` material branch, and dominant whole-cell progression mosaic are superseded. Trophy keeps its prior fixed fields and atlas material byte-for-byte; progression topology, cell identity, layout, costs, compiler, transactions, persistence, agents, and World simulation remain unchanged.

## D35 — Evolution abilities form substrate-guided connected exact-cell regions

Retain D33's 2,562 individually purchasable cells, direct frontier, aggregate ranks, cost law, and one compiler; supersede only its scattered weave and D34's layout/geography separation. The fixed substrate now guides a deterministic green root and a bounded exact-capacity partition with one connected region per archetype/domain, a six-archetype tier-1 root ring, and increasing tier 1–5 median distance. Geography changes routes only, never purchases, ranks, costs, effects, rewards, or World rules. One immutable relation class per edge shares the existing WebGL/Canvas boundary phase with stronger dynamic state and no new draw. Layout/content, Imprint, and Evolution History identities advance and reset incompatible Evolution channels without migration. D33/D34 remain historical evidence; their exact-cell and fixed-substrate boundaries survive this narrower supersession.

## D36 — Evolution ownership is the exact owned/unowned graph cut

Retain D33's exact-cell authority and D35's connected substrate-guided layout; supersede only D34's overloaded `quiet/owned/frontier/recent/selected` presentation clause. After selected/recent incident overrides, the packed byte classifies ownership exactly when one endpoint is owned, reachability exactly when both endpoints are unowned and only one is reachable, or quiet otherwise; affordability stays local/textual. WebGL2 uses continuous ownership and subordinate segmented reachability in its existing boundary draw, while Canvas uses the same classes with continuous/dashed strokes. Immutable relation stays packed above dynamic state, the projection remains one byte per edge, WebGL remains four draws, and topology, layout, progression, persistence, reward, and World simulation do not change.

## D37 — Faithful release transfer and natural damping are current

Retain D27's projected-radius manipulation, strict timestamp validation, exact applied-delta sampling, simultaneous body-frame integration, and bounded foreground animation debt. Supersede D30's release policy with a `0.08 rad/s` precision threshold and direct component-for-component transfer of every finite qualifying measured velocity vector. Delete the response curve, input knee, output saturation, mapped-speed duplicate, turn ceiling, and fixed lifetime. The retained `600 ms` half-life and `0.025 rad/s` stillness threshold own natural rest.

A nonmodal surface may cancel motion already in progress and continues to hold automatic idle orbit. Its presence does not veto a newly completed valid drag: inertia advances normally through either the exposed canvas or the shared detail-shell gesture route, then returns to surface-held rest. Reduced motion, hidden-page entry, trusted new interaction, scene or World replacement, and programmatic focus framing still clear velocity immediately. This is one presentation-only camera path; simulation, renderer semantics, progression, reward, persistence, balance, and public settings do not change.

## D38 — Planetary sky uses one eligible-time presentation authority

Home and World consume one deterministic celestial projection: a fixed stable star catalog, a seamless 128×64 World-seeded cloud byte field with a 50-minute eligible-time wrap, and exactly one shooting-star event in each 300-second slot. Eligible time advances only in visible Full-motion Home or World frames, integrates at most 100 ms per frame, and is independent of game speed. Reduced motion retains static stars and clouds while suppressing travel. Fresh Motion is Full regardless of OS preference; stored explicit choices remain authoritative.

WebGL2 samples clouds in its existing globe draw and adds stars/streaks to its existing background draw, preserving four draws and natural occlusion. Canvas consumes the exact field bytes and event in its existing bounded phases. Renderers own no clock, schedule, RNG, timer, or second loop. The projection is decorative: simulation, RNG, ecology, identity, SCORE, rewards, progression, Trophies, History meaning, picking, and persistence do not consume it. The automatic-camera preference and path redesign remain a separate deferred decision.
