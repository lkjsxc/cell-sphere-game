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
- **2026-08-02 — Memory atlas economy foundation.** The 108-node graph costs
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
  tip, orbit, and Memory-path rendering and reduced steady-state WebGL2 from
  seven draws to five. Presentation snapshots fell from 102,426 to 25,620
  bytes. Simulation equations and the default benchmark hash did not change.
- **2026-08-02 — Completed advanced Memory cells.** Every milestone, keystone,
  connector, and capstone now includes a concrete bounded scalar bonus; UI copy
  states only that shipped effect. New-save/default-run balance and golden hash
  are unchanged because bonuses apply only after purchase. Full-atlas campaign
  pacing still needs deep calibration.
