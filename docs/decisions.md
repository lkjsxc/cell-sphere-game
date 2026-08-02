# Decisions

Concise architecture/product records: context → decision → consequence → evidence.

## D1 — Zero runtime dependencies

Contest rules limit external libraries and authorship matters. Use native
HTML/CSS/ES modules, Node built-ins for tooling, no framework/CDN/runtime
package. Consequence: every deployed byte is repository-authored and static.
Evidence: `package.json`, link gate, contest rules fetch recorded in status.

## D2 — WebGL2 primary, Canvas 2D fallback

Desktop/smartphone Chrome support WebGL2 broadly, while a blank unsupported
page is unacceptable. WebGL2 owns the seven-draw authored presentation; Canvas
keeps geography, rivers, selection, events, and routes playable. Evidence:
renderer unit contracts and real-Chrome WebGL2 scenario.

## D3 — Stable level-4 topology

2,562 cells/7,680 edges balance morphology and mobile cost; quality must not
change scores. Keep the topology/edge ordering stable for simulation, picking,
History locations, and persisted Imprints. Evidence: topology/manifold tests.

## D4 — Worker authority with identical fallback

The main thread should render/input while GitHub Pages lacks cross-origin
isolation. Use module Worker messages and transferable snapshots, with the same
`RunController` fallback and no SharedArrayBuffer. Evidence: chunk/speed whole-
run determinism and browser Worker path.

## D5 — LocalStorage by concern

Current bounded data does not justify IndexedDB. Keep separate validated
Settings, progression, and History documents; report write failure and continue
in session memory. History has explicit count/byte pruning. Evidence: migration,
corruption, quota, and transaction tests.

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

Independent scalar noise could not produce truthful rivers or inspectable
regions. Preserve topology but generate quantile continents, priority-flood
drainage, flow hierarchy, climate, forests, biomes, regions, and landmarks.
Central biome factor arrays bound gameplay effects. Evidence: world hash,
property tests, generation timing, browser screenshots.

## D11 — 108-node Memory atlas on stable world cells

The six-node proof transaction was too sparse; a new 108-vertex manifold would
risk existing Imprint IDs and renderer complexity. Place 108 unique progression
nodes on stable level-4 cells, keep a separate prerequisite DAG, draw BFS paths,
and retain a grouped semantic list. Consequence: dense globe interaction with
no topology migration. Evidence: graph/economy/migration/scene tests and Chrome.

## D12 — Optional idle rotation, default off

Ambient motion supports display use but can fight inspection/accessibility.
Use the orthonormal camera frame, 130/180-second revolution options, a three-
second idle delay, immediate interruption, fixed selection framing, and an
effective reduced-motion veto. Evidence: camera policy unit and Chrome checks.
