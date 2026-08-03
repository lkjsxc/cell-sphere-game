# Balancing

The balance harness (`scripts/balance.mjs`) runs the **production**
simulation modules headlessly — never a copied or simplified model.

## Targets

- New-save balanced-policy median extinction: **270–330 game s**,
  narrow interquartile range ("about five minutes" must be truthful).
- Terminal ceiling ends ordinary runs by ~360 game s.
- Score bands: 20k–80k first runs · 80k–200k learning · 200k–450k strong ·
  450k–750k mastery · 750k+ exceptional.
- Echo income: first campaign resolution reachable in ~4 ordinary runs
  (18–24 min at 1×).
- No dead or dominant adaptation cards across relevant policies.
- Same seed + decisions ⇒ identical hash at any speed (gate).
- No NaN/Infinity/negative biomass/invalid neighbor/impossible score (gate).

## Progression horizon model

These are **modeled 1×-equivalent targets**, not observed wall-clock claims.
Owned skills bypass new gates and are never charged again.

| Milestone | Implemented visible gate | Modeled 1× equivalent |
|---|---:|---:|
| First campaign resolution | 4 completed worlds | 18–24 min target; 18–22 min from run duration before transition overhead |
| Meaningful six-branch spread | six roots require 0 prior worlds and cost 14 Echoes total | first hour target |
| Roughly half (54 skills) | 144 completed worlds | about 11–14 h |
| All six keystones | 164 completed worlds plus adjacency/Echoes | about 13–16 h |
| Cross-branch connectors | 600 completed worlds | about 47–57 h |
| All 108 Skill Cells | capstones require 900 completed worlds | about 70–85 h |
| True completion | skills plus challenge/trophy/discovery breadth | 100–200 h target; breadth is not yet fully implemented |

Gates are shown in every Skill Cell detail as `Worlds observed`; they are not
hidden cooldowns, real-time waits, or speed restrictions. At 32× they compress
legitimately. The unchanged 818-Echo economy keeps roots welcoming while
adjacency, observed-world gates, and later challenge breadth—not duplicated raw
power—create the long horizon.

## Bot policies

random-valid · balanced · expansion · resilience · efficiency ·
greedy-score · no-progression · challenge-specific.
Each is a deterministic heuristic using only player-visible information.

## Smoke vs full

- `npm run balance:smoke` — bounded seed count (CI-safe, seconds).
- `npm run balance` — deep Monte Carlo; writes `reports/balance-*.json` and
  prints a Markdown summary. Reports are git-ignored; durable findings are
  copied into this document.

## Measured outcomes

| Date | Commit | Policy | n | median t | p25–p75 | peak cov | notes |
|---|---|---|---|---|---|---|---|
| 2026-07-31 | (Gate B) | balanced | 4 | 361 s | 329–366 | 0.45 | first calibration; median slightly above 330 target |
| 2026-07-31 | (Gate B) | expansion | 4 | 325 s | 236–361 | 0.40 | wider spread, as expected |
| 2026-07-31 | (Gate B) | resilience | 4 | 361 s | 311–361 | 0.52 | highest coverage |
| 2026-08-02 | (WorldModel) | balanced | 4 | 364.2 s | 360.5–364.2 | 0.50 | graph-native geography smoke |
| 2026-08-02 | (WorldModel) | expansion | 4 | 311.5 s | 304.8–360.9 | 0.56 | within target median; wide range |
| 2026-08-02 | (WorldModel) | resilience | 4 | 360.2 s | 360.2–364.2 | 0.57 | ceiling remains dominant |
| 2026-08-02 | integrated passive world | balanced | 4 | 291.7 s | 273–322.6 | 0.14 | meets target in diagnostic smoke |
| 2026-08-02 | integrated passive world | expansion | 4 | 290.9 s | 272.9–311.5 | 0.09 | low coverage, target duration |
| 2026-08-02 | integrated passive world | resilience | 4 | 292.2 s | 194.9–362 | 0.14 | wide range needs deeper sample |
| 2026-08-03 | reconciled terminal authority | balanced | 4 | 291.7 s | 264.7–313.3 | 0.14 | exact liveness; bounded final fade |
| 2026-08-03 | reconciled terminal authority | expansion | 4 | 268.7 s | 267.7–289.5 | 0.09 | just below median target in n=4 smoke |
| 2026-08-03 | reconciled terminal authority | resilience | 4 | 247.2 s | 83.7–361.5 | 0.14 | wide range remains; not a calibrated claim |

The integrated biome factors moved the diagnostic medians into the 270–330 s
target while reducing coverage. This is n=4 smoke evidence, not a calibrated
claim about the full distribution. A deep Monte Carlo should check that sparse
cellular spread remains visually satisfying across archetypes.

## Score projection

The live HUD and terminal result both call `src/game/scoring.js`, a pure
projection of authoritative run metrics. It currently normalizes survival,
peak/sustained coverage, connectivity, energy efficiency, and crisis resolve;
quality, language, render cadence, and game speed are excluded. The six-part
interim display is tested for bounds and monotonicity. Its score bands need a
production-distribution calibration before contest claims.

## Tuning decisions

Record accepted tuning changes here with rationale and measured delta.
Golden fixture updates require an entry here — never blind snapshot resets.

- **2026-08-01 — UI score projection.** Added a deterministic live/terminal
  score and Echo projection; no simulation equation or golden checksum
  changed. Evidence: `tests/unit/scoring.test.js`; a balance recalibration is
  still required before changing thresholds or score bands.
- **2026-08-02 — Evolution Globe economy foundation.** The 108-node graph costs
  818 Echoes in total: 48 micro nodes, 24 conditional morphology/ecology
  nodes, 18 mechanic/information/automation unlocks, and six each of
  keystones, cross-branch connectors, and capstones. Six roots cost 2–3
  Echoes. The guaranteed 2-Echo base income exposes four branch roots; the
  target first-run score band (20k–80k) yields 5–9 Echoes and exposes all six.
  This is static economy evidence, not a claim that the four-hour completion
  target is calibrated. No simulation equation or golden checksum changed.
- **2026-08-02 — Graph-native WorldModel.** Replaced independent scalar noise
  with continent, climate, drainage, river, forest, and biome fields. The
  initial default-world golden was `eccc4bba`; after central biome factor
  arrays joined the hash, the current golden is `749bda35`. The integrated
  production benchmark hash is `98333073` (2,910 ticks, 18,089 ticks/s on
  Node v22.22.3/Linux x64). The
  four-seed smoke above is evidence of the resulting environment shift, not a
  claim that balanced/resilience timing now meets target.
- **2026-08-02 — World-first cellular presentation.** Deleted organism route,
  tip, orbit, and prerequisite-path rendering and reduced steady-state WebGL2 from
  seven draws to five. Presentation snapshots fell from 102,426 to 25,620
  bytes. Simulation equations and the default benchmark hash did not change.
- **2026-08-03 — Reconciled terminal authority.** Every tick now recounts living
  cells and biomass, repairs deterministic production drift, and fails strict
  test divergence. Spent tissue enters a bounded fade below 0.2 total biomass;
  the ordinary ceiling begins the same fade, and tick 3,620 is an enforced hard
  maximum. A 100-world calibration measured median 273.5 s, p95 361.9 s, zero
  invalid/duplicate terminals. The benchmark fixture now ends at 2,853 ticks,
  hash `c55ddab5`; throughput measured 15,160 ticks/s versus the 18,022 ticks/s
  turn baseline (15.9% lower, still 5× the gate) because 2,562 cells are
  reconciled every tick. This safety cost is retained deliberately.
- **2026-08-02 — Completed advanced Skill Cells.** Every milestone, keystone,
  connector, and capstone now includes a concrete bounded scalar bonus; UI copy
  states only that shipped effect. New-save/default-run balance and golden hash
  are unchanged because bonuses apply only after purchase. Full-atlas campaign
  pacing still needs deep calibration.
- **2026-08-03 — Acknowledged Adaptation protocol.** Added command/run/offer
  identity and explicit rejection without changing simulation equations, RNG,
  decision order, or the `c55ddab5` benchmark golden. The production title
  showcase source metadata was regenerated; its 89 frames and data hash
  `58b20fb2…` are unchanged.
- **2026-08-03 — Terrain-aware event fields and major basins.** Spatial events
  now use quantized weighted graph arrival and exact per-cell renderer state;
  land-bound families recorded zero ocean violations across 1,386 audited
  events. Median generation was 0.192 ms/field and every audited field was
  non-radial. Fourteen bounded outlets produce explicit principal stems: 1,000
  worlds measured 4–5 major systems, median longest trunk 28 cells, 99.7% with
  a trunk of at least 20 cells, maximum 61, and zero cycle, mouth, continuity,
  accumulation, or isolation defects. The WorldModel golden is now `94553146`;
  the production benchmark is 2,640 ticks, hash `637b2473`, 15,090 ticks/s.
  Production title evidence was regenerated at 89 frames with data hash
  `fd6b5289…` because world/event authority changed.
  Smoke medians were 291.2/260.8/253.8 s for balanced/expansion/resilience;
  these are measured diagnostics, not a claim that every policy meets target.
