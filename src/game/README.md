# src/game/

Frozen content and pure cross-run rules. Simulation and interface consume the
same definitions; this directory owns no DOM or storage I/O.

| Module | Responsibility |
|---|---|
| `balance.js` | Simulation and progression constants with units. |
| `strains.js` | Starting morphologies and closed trait keys. |
| `events-content.js` | Spatial environmental field families. |
| `scoring.js` | Monotone cumulative six-axis SCORE v3, ranks, bounded Echoes. |
| `skills/` | 252-cell affinities, builds, adjacency, compilation, migration. |
| `trophies/` | 96 current criteria, facts-v5 proof, Trophy Sphere. |

Current worlds are autonomous and contain no mid-run choice authority. Evolution
purchases are pure exactly-once meta transactions requiring Echoes and direct
geodesic adjacency. Current Trophy proof is authority-neutral and cannot consume
retired legacy choice evidence.
