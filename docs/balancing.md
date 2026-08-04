# Balance model

> Current production model, 2026-08-04. Measurements come from production
> modules; modeled completion estimates are labeled separately.

## Targets

| Checkpoint | Current target |
|---|---:|
| Fresh SCORE | roughly 8,000–15,000 |
| Typical progressing save after 12–18 minutes at 1× | roughly 80,000–130,000 |
| Strong full progression | roughly 850,000–1,100,000 |
| Exceptional upper range | modestly above 1,000,000, below runaway territory |
| Ordinary world duration | approximately 270–330 game seconds |
| Bounded terminal | near 360 game seconds |
| First campaign resolution | approximately 18–24 minutes at 1× |

SCORE is:

```text
Run Quality × World Potential × Challenge
```

Run Quality is the weighted product of six visible axes: Survival, Peak Reach,
Sustained Reach, Unity, Resource Efficiency, and Stability. The formula consumes
only terminal authority. Camera, rendering quality, frame rate, menus, and speed
cannot change it.

Echo rewards use a bounded square-root curve over current-model SCORE. A fresh
median world awards 14 Echoes. The first six roots cost 8–12 Echoes, allowing a
clear first purchase without allowing the first world to buy several branches.

## Measured distributions

`npm run audit:campaign` uses production `RunController`, production Skill
compilation, production SCORE, and deterministic seeds.

### Fresh 200-seed cohort

| Metric | p25 | median | p75 |
|---|---:|---:|---:|
| SCORE | 10,527 | 10,762 | 11,028 |
| Duration (seconds) | 266.3 | 273.1 | 283.6 |
| Echoes | 14 | 14 | 14 |

All 200 worlds ended through finite-resource ecology: 126 resource exhaustion and
74 maintenance starvation. Worlds 1–2 scheduled zero harmful events.

### Three-world progressing cohort

The potential-priority policy owns seven Skills after world 3. Median World
Potential is 166,500, world-3 SCORE is 104,048, and three-world elapsed time is
13.09 minutes at 1×. The first mild pressure is scheduled at a median 13.23
campaign minutes, in world 3. The five-world first cycle resolves at a measured
median 20.73 minutes.

### Progression checkpoints

| Ownership | World Potential | median SCORE | median duration | median peak Reach |
|---|---:|---:|---:|---:|
| Fresh | 16,000 | 10,732 | 266.9 s | 24.5% |
| 63 Skills | 379,900 | 267,653 | 232.2 s | 41.3% |
| 126 Skills | 606,400 | 451,443 | 262.4 s | 49.2% |
| 252 Skills | 1,196,800 | 959,558 | 330.3 s | 69.2% |

At full Evolution, median lifetime visited-cell marine share is 37.6%, median
peak Reach is 69.2%, and the hard terminal occurs in 20% of the audited mature
era cohort. It is a bound, not the dominant ending. Deep ocean remains costly and
low-suitability rather than becoming free map fill.

## Evolution economy

The frequency-5 Evolution Globe has 252 cells and 750 direct boundaries. Six
connected 42-cell territories contain:

- 6 roots;
- 30 major landmarks;
- 12 conditional rules;
- 12 capability unlocks;
- 6 keystones;
- 6 capstones;
- 180 individually named Resonance cells.

Total cost is 17,820 Echoes. Costs range from 8 to 800, with median 41. Fresh and
full World Potential are 16,000 and 1,196,800. The full compiled gameplay effect
vector is finite and smoothly bounded; additional late cells still change the
visible before/after value and add at least 400 World Potential.

A simple model at 50 Echoes per five-minute world estimates 29.7 1× hours for all
Skills. This is a model, not a measured completion claim. At 32× it represents
about 56 minutes of wall time if the player continuously starts worlds.

## Finite resources

Every world cell has an authoritative finite reserve and bounded renewal.
Metabolism consumes local reserve before energy is credited. Maintenance and
resource exhaustion are independent terminal mechanisms. Early extinction is
therefore ecological, not a scripted death timer.

The first two worlds suppress harmful events. World 3 schedules exactly one mild
event no earlier than tick 2400. Worlds 4–5 schedule one or two fields; worlds
6–10 schedule two to four; later eras schedule three to six. Scheduling uses the
persisted world ordinal and deterministic RNG, never wall-clock waiting.

## Habitat bounds

Growth checks capability access before RNG consumption:

1. lake;
2. tundra;
3. snow/ice;
4. shallow-ocean edge;
5. general shallow ocean;
6. deep ocean.

Snow normally requires traversal through tundra, and deep ocean requires a
shallow-ocean route. Full-Evolution habitat audit medians remain below 60% marine
visited share and below 85% peak whole-world Reach. Inspector reports the exact
missing capability for blocked cells.

## Trophy pacing

The 96 current Trophies are divided evenly among Reach, Form, Endurance,
Habitat, Evolution, and Mastery. A 24-seed fresh cohort earns one onboarding
Trophy per world. The 240-world production-authority model leaves current
criteria unearned, preserving long-horizon goals. Retired IDs stay legacy-only.

## Gates

- `balance:smoke`: fast fresh-world guard.
- `balance`: larger fresh policy cohort.
- `audit:campaign`: deep 200-seed campaign/SCORE/Echo checkpoints.
- `audit:skills`: topology, cost, effects, and lossless migration.
- `audit:events`: era onboarding and graph-field geometry.
- `audit:habitats`: capability locks, occupancy, and marine bounds.
- `audit:trophies`: catalog uniqueness, pacing, and exactly-once rewards.

Machine-readable outputs are written under ignored `reports/`.
