# Balance model

> Current production model, 2026-08-04. Measurements use production modules and
> deterministic seed cohorts. Modeled completion estimates are labeled.

## Targets

| Checkpoint | Target |
|---|---:|
| Fresh SCORE | roughly 8,000–15,000 |
| World Potential after 12–18 minutes at 1× | roughly 80,000–130,000 |
| Strong full-progression SCORE | roughly 850,000–1,100,000 |
| Ordinary world duration | approximately 270–330 game seconds |
| Bounded terminal | near 360 game seconds |
| First campaign resolution | approximately 18–24 minutes at 1× |

SCORE model v3 is:

```text
quality = weighted cumulative authoritative merit
score = round(quality × World Potential × Challenge)
```

The six monotone merit axes are Survival, Exploration, Presence, Coherence,
Stewardship, and Worldmaking. HUD, Result, audits, and agent play call the same
function. No terminal correction, camera, quality, frame rate, speed, or menu
state can change SCORE. Component caps keep full progression near 1.10 million.
Echoes use the production bounded reward curve over current-model SCORE.

## Current measured distributions

### Fresh local ecology

`audit:resources -- --count=500` produced:

| Metric | p25 | median | p75 | p90 |
|---|---:|---:|---:|---:|
| SCORE | 6,699 | 8,782 | 10,036 | 10,732 |
| Duration (seconds) | 291.4 | 312.0 | 359.5 | 361.9 |
| Peak whole-world Reach | 8.7% | 13.3% | 17.1% | 20.5% |
| Peak land occupancy | 17.7% | 27.5% | 34.5% | 40.7% |
| Resource stock remaining | 59.0% | 66.3% | 76.6% | 88.1% |

The 500 worlds had zero conservation error at six-decimal reporting precision.
Living-cell time was confined almost entirely to the top two initial-resource
quintiles, with 73.5% in the richest quintile. Median births occurred at 0.719
local richness. The median world left 72.5% of land unoccupied: new saves follow ecological
niches rather than painting ordinary land.

### Monotone SCORE trace

A 500-world tick trace recorded zero decreases and zero Result mismatches. Median
live SCORE shares were 8.4% at 15 seconds, 47.6% at one-quarter duration, 78.7%
at half duration, 92.5% at three-quarter duration, and 100% before the terminal
Result. The largest median tick jump was 112 SCORE.

### Finite freshwater advantage

A 300-world matched-start cohort produced 294 same-biome pairs. Median duration
ratio was 1.175, median resource-exhaustion delay was 5.5 seconds, and near
starts won 93.9% rather than 100%. Median near duration was 340.3 seconds versus
284.1 seconds far from freshwater.
Finite catchment/founder stock is included in resource conservation; local
moisture buffering does not create energy.

### First Skill and progression

World Potential version 2 uses bounded monotone Evolution Power anchors:

- fresh: 16,000;
- first root: 19,000 (+3,000);
- power 4: 80,000;
- power 6: 105,000;
- full power 384: 1,200,000.

A paired 60-seed production check measured median SCORE 8,892 fresh and 10,676
with one root. The first purchase therefore remains in the requested normal
10,000–20,000 next-world range. The deep campaign audit's ten potential-policy
cohorts reached median 105,000 potential after three worlds / 15.565 minutes.
Their first four-world resolution was 20.197 minutes (18.252–22.500 range), with
median world-3 SCORE 28,951 and best five-world SCORE 91,108.

### Full builds, transformations, and REACH 100

The compiler exposes sixteen mechanically distinct recipes. A 24-seed full-build
cohort produced median 106 transformed cells, 17 reclaimed cells, 24 bounded
cryolakes, 5 maritime forests, and 105 ever-powered cells. Fresh controls
produced no transformations or powered cells. Full SCORE is bounded at about
1.099 million.

The deep production progression checkpoints measured median SCORE 518,404 at 63
Skills / 580,000 potential, 776,768 at 126 / 848,000, and 1,099,200 at full
252 / 1,200,000. Full median duration was 347.2 seconds and median peak Reach
98.6%; exact coverage remains rare because it must persist for the full interval.

A deterministic 300-seed full-build cohort achieved exact all-2,562-cell living
coverage for the required 25 consecutive ticks in 8 seeds (2.67%). Every
achieved world later became extinct by the normal terminal bound. One hundred fresh controls
had zero achievements and median peak coverage 13.4%. `REACH 100%` is therefore
possible, rare, exact, late-build-only, and not immortality.

## Evolution economy and builds

The frequency-5 Evolution Globe has 252 cells, 750 direct boundaries, and six
42-cell environmental affinities: Fertility, Freshwater, Scarcity, Cryogenic,
Marine, and Luminous. Total cost remains 17,820 Echoes (8–800; median 41). Skill
eligibility is enough Echoes plus one directly adjacent owned cell.

Build recipes combine affinities and tags into visible mechanics and tradeoffs,
including lake gardens, circular metabolism, wasteland reclamation, cold
dormancy, cryolakes, brine harvesting, pelagic colonies, littoral succession,
bioelectric wetlands, hydrothermal power, and an illuminated biosphere. Full
mastery remains a long-horizon modeled pursuit, not a short campaign promise.

## Habitat and event bounds

Capability checks run before growth RNG for lake, tundra, snow/ice, shallow-
ocean edge, shallow ocean, and deep ocean. Ordinary marine/cold builds retain
costs; only the full World Gardener synergy can attempt exact coverage.

Worlds 1–2 suppress harmful events. World 3 schedules one mild event no earlier
than tick 2400. Worlds 4–5 schedule one or two, worlds 6–10 two to four, and later
eras three to six, based only on persisted ordinal and deterministic RNG.

## Gates

- `audit:resources`, `audit:freshwater`, `audit:score-trace`;
- `audit:skills`, `audit:transformations`, `audit:reach100`;
- `audit:habitats`, `audit:events`, `audit:trophies`, `audit:campaign`;
- `agent:smoke`, `agent:campaign`, `balance`, and `terminal:soak`.

Machine-readable outputs are written under ignored `reports/`.
