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

| Milestone | Implemented authority | Modeled 1× equivalent |
|---|---|---:|
| First campaign resolution | 4 completed worlds | 18–24 min target; 18–22 min from run duration before transition overhead |
| Fresh Evolution choice | exactly six roots, 14 Echoes total | roots cost 2–3 Echoes and remain canonical bootstrap choices |
| Trophy campaign marker | `Fifty Worlds` recognizes 50 completed worlds | about 4 h at the 270–330 s run target; modeled, not measured wall time |
| Roughly half (324 skills) | physical frontier plus the applicable portion of 2,462 Echoes | not recalibrated after authority migration |
| All 642 Skill Cells | traverse physical frontier and spend exactly 2,462 Echoes | long-horizon target; no current measured completion time |
| True completion | skills plus challenge/discovery breadth | 100–200 h target; challenge breadth is not yet fully implemented |

Evolution has no run-count, elapsed-time, or layout-parent purchase gate. The
2,462-Echo economy is intentionally unchanged: costs and all effects retain their
stable IDs and exact values, while any one physically adjacent owned cell supplies
the frontier. This removes the previous clock floor, so the former 13–14 hour
completion estimate is retired rather than presented as recalibrated evidence.
A deep Echo-income campaign audit is still required before claiming a replacement
mastery duration.

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
  with continent, climate, drainage, freshwater, forest, and biome fields. The
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
- **2026-08-04 — Evolution physical-frontier authority.** Replaced layout-parent
  and completed-world authority with enough Echoes plus any one actual adjacent
  owned level-3 cell. Exactly six canonical roots remain bootstrap choices;
  recognized disconnected migration islands remain owned and each opens a
  frontier. Graph/schema versions are 4/7. The 2,462-Echo economy is preserved
  exactly (`34b4e4a9`), as are all authored/current effects (`8444edfd`): 1,920
  physical boundaries yield 3,840 directed frontier states. Exhaustive audit
  covers all 411,522 single-owner target states and legally buys all 642 cells
  at run zero with zero balance remaining. No simulation golden changes. The
  generated title payload remains 89 frames with data hash `22ac0d97…`; only its
  source metadata is `9277d6a0…`.
- **2026-08-03 — Acknowledged Adaptation protocol.** Added command/run/offer
  identity and explicit rejection without changing simulation equations, RNG,
  decision order, or the `c55ddab5` benchmark golden. The production title
  showcase source metadata was regenerated; its 89 frames and data hash
  `58b20fb2…` are unchanged.
- **2026-08-03 — Terrain-aware event fields and major basins.** Spatial events
  use quantized weighted graph arrival and exact per-cell renderer state;
  land-bound families recorded zero ocean violations across 1,386 audited
  events. Median generation was 0.192 ms/field and every audited field was
  non-radial. This historical generation pass still exposed drainage systems
  that were removed by the whole-cell lake decision below.
- **2026-08-03 — Whole-cell lake vertical slice and golden rebaseline.** Rainfall,
  outlets, filled elevation, drainage direction, and accumulation became private
  generation details. Public geography now has connected separated 3–18-cell
  lakes, typed depth/shore/influence fields, frozen lake records, `BIOME.LAKE`,
  and lake/shore/wetland factors. The WorldModel golden changed from `94553146`
  to `586696d6`; this is an intentional environment and inoculation change, not
  a blind snapshot update. The 500-seed audit hash is `0e7f6f17`: 6–8 lakes per
  world (median 7), median area 10 cells, 100% in the 3–18-cell band, median
  lake coverage 5.399% of land, median influence coverage 24.512% of all cells,
  five lake types, three salinity classes, and zero integrity/determinism errors.
  Production benchmark: 2,715 ticks, hash `813c4f49`, 14,712 ticks/s on Node
  v22.22.3/Linux x64. Smoke medians were 284.6/267.4/353.2 seconds for
  balanced/expansion/resilience (n=4 diagnostic samples). The title showcase
  remains 89 frames and was regenerated only after unit/integration tests passed;
  source hash `3f3e9227…`, data hash `22ac0d97…`. The generator now enters
  its terminal segment at the last ≥75%-peak production tick (`2732`), keeping
  the 22-second title story legibly pressure → fragmentation → extinction
  without synthesizing state.
- **2026-08-03 — Atomic world-session presentation metadata.** Added the
  immutable world-session envelope and typed blank renderer frame without
  changing simulation equations, seeded decisions, or showcase bytes. The
  generated 89-frame payload remains byte-identical with data hash
  `22ac0d97…`; only its production-source hash changed from `3f3e9227…` to
  `e15a13fd…`. The benchmark golden remains `813c4f49`.
