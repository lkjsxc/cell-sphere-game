# src/game/

Frozen content and pure cross-run rules. Simulation and interface consume the
same definitions; this directory owns no DOM or storage I/O.

| Module | Responsibility |
|---|---|
| `balance.js` | Simulation and progression constants with units. |
| `strains.js` | Starting morphologies and closed trait keys. |
| `events-content.js` | Spatial environmental field families. |
| `scoring.js` | Six-axis SCORE v2, ranks, and bounded Echo rewards. |
| `skills/` | 252-cell Evolution content, adjacency, compilation, migration. |
| `trophies/` | 96 current criteria, facts-v4 proof, Trophy Sphere. |

Current worlds are autonomous and contain no mid-run choice authority. Evolution
purchases are pure exactly-once meta transactions requiring Echoes and direct
geodesic adjacency. Current Trophy proof is authority-neutral and cannot consume
retired legacy choice evidence.
