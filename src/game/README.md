# `src/game/`

Frozen content and pure cross-run rules. Simulation, interface, audits, and fair
agents import these production definitions; this directory owns no DOM or storage I/O.

| Module | Source-of-truth responsibility |
|---|---|
| `balance.js` | Finite tick/simulation constants with units. |
| `environment-level.js` | Exact unlimited Environment Level/frontier/attempt rules, version 1. |
| `scoring.js` | Monotone exact SCORE model/formula v4, Echoes, and procedural ranks. |
| `skills/` | Frequency-5 252-cell sparse levels, costs, effects, Potential v3, Builds/mastery, transactions, and migration. |
| `events-content.js` | Bounded whole-cell environmental pressure families. |
| `trophies/` | 96 read-only current criteria and authority-neutral proof. |

Evolution Level 0 is locked, Level 1 is authored identity, and Level 2+ is
unlimited. Level 0 → 1 needs Echoes and direct Level-1+ adjacency except for six
fresh-vector roots; repeat levels need ownership and Echoes only. Level-one
breadth costs 17,820 and yields Potential 1,200,000, but is not completion.

Exact progression uses shared `bigint` operations and canonical decimal strings at
boundaries. The challenge-profile compiler in `src/simulation/` reduces unlimited
Environment rating minus Evolution defense to bounded finite run coefficients.
Worlds remain autonomous; active Adaptations are retired, and Trophies never feed
simulation, Potential, SCORE, pressure, or purchase eligibility.

Focused gates: `audit:evolution-levels`, `audit:environment-levels`,
`audit:progression-numbers`, `audit:luminous`, `agent:long`, and
`balance:holdout`.
