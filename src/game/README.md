# src/game/

Data-driven content and pure game rules. Simulation and interface consume the
same frozen definitions; this directory never owns DOM or persistence state.

| Module | Responsibility |
|---|---|
| `balance.js` | Authoritative simulation and scoring constants, with units. |
| `strains.js` | Starting morphologies and the closed run-trait model. |
| `adaptations.js` | ≥24 cards, weighted offers, exact-uniform passive selection. |
| `events-content.js` | Eight spatial crisis families and content parameters. |
| `scoring.js` | Network Score, rank, breakdown, and Echo income. |
| `memory.js` | 108-node atlas graph, queries, transactions, compilation, and validation. |
| `memory-node.js` | Shared immutable node/effect schema for atlas content. |
| `memory-{branch}.js` | Eighteen authored nodes for each of six progression branches. |
| `memory-atlas.js` | Frozen level-3 cell embedding, reverse map, validator, and deterministic solver. |
| `memory-scene.js` | Direct per-cell atlas status and morphology-fossil projection. |

Invariants:

- Content modules export frozen data; validators run in unit tests.
- Trait keys are a closed set defined in `strains.js`; unknown keys throw.
- Evolution is passive and non-blocking; simulation owns offer timing/options.
- No player-guidance field participates in growth authority.
- Six Memory branches contain exactly 18 nodes; IDs and locations are stable.
- Scalar traits, conditional effects, and unlocks compile separately.
- Purchases return a new meta document and spend exactly the declared cost.
- Every prerequisite is represented by one shared boundary between atlas cells.
