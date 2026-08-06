# Decisions

Concise architecture/product records: context → decision → consequence → evidence.

## D0 — 2026-08-06 endless progression supersedes older records

Current authority is `cell-sphere-game` with a frequency-5, 252-cell Evolution
Globe. Its canonical sparse levels are exact: Level 0 is locked, Level 1 preserves
authored identity, and Level 2+ is unlimited. Level 0 → 1 requires Echoes and one
directly adjacent Level-1+ cell, except that six roots bootstrap a fresh vector;
repeat levels require ownership and Echoes only. Buying every Level-1 identity
costs 17,820 Echoes and yields Potential v3 value 1,200,000, a breadth milestone
rather than completion. SCORE authority is v4. Exact progression uses `bigint`
internally and canonical decimal strings at boundaries.

Environment Levels are unlimited: Worlds 1–2 use protected Level 0 and World 3
attempts Level 1; a direct versioned compiler reduces exact public challenge and
Evolution defense to bounded runtime coefficients. Current boundaries are meta
schema 11, History schema 6, agent save/observation schema 2, and replay/run
protocol 5. Active Adaptations are retired and archival records are inert.
Luminous authority is whole-cell charge with decay and no wires. Player speeds
are 1×/2×/4×/8×; explicit developer mode adds 16× through 256× while executing
every tick. Any conflicting claim below is an archival decision record, not
current authority; preserve it as history and follow `status.md`, source, and tests.

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
only the newest ten strict, ≤256 KiB visual History bundles in IndexedDB because
cell checkpoints do not belong in semantic export/import. Evidence: migration,
corruption, quota, transaction, codec, stale-load, and browser reload tests.

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

## D12 — Optional idle rotation, default off

Ambient motion supports display use but can fight inspection/accessibility.
Use the orthonormal camera frame, 55/90-second revolution options, a four-
second idle delay, immediate interruption, fixed selection framing, and an
effective reduced-motion veto. Evidence: camera policy unit and Chrome checks.

## D13 — Cell material is the life visual

Warm route fragments and tip sprites made the organism look drawn above the
planet and required explanatory copy. Keep transport internally authoritative,
but remove its visual pass and edge snapshot payload. Express life stages,
crises, selection, History, and Adaptation propagation on the same geography
cells. Consequence: the world remains legible with no graph legend and five
steady draws. Evidence: source-negative tests, snapshot-byte test, screenshots.

## D14 — Visual History is approximate and authority-neutral

Semantic events alone could not show temporal change, while raw tick logs would
violate storage bounds. Record strict quantized cell checkpoints, preserve major
frames while thinning, associate events with bounded primary cells, and restore
Live immediately. Keep bundles device-local and newest-ten. Evidence: neutrality,
codec/fuzz/bounds/stale-load tests and real-Chrome scrub/reload.

## D15 — Results continue unless attention says otherwise

Ambient play should not stop at an opaque result card, but progression must
never be spent implicitly. Keep the terminal world behind a compact strip and
start a nine-second next-world countdown. Hidden time pauses it; the first
trusted interaction—including opening or closing a detail surface—cancels it
permanently for that result. Settings toggles never rearm it. Only explicit
Memory input spends Echoes. Result awards are idempotent. Evidence: policy tests, 100-world soak,
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
