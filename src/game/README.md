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
| `skills/` | 642-cell content, globe graph, transactions, compilation, projection, and validation. |
| `trophies/` | 96 authored criteria, bounded proof, deferred evaluation, and Trophy Sphere projection. |

Invariants:

- Content modules export frozen data; validators run in unit tests.
- Trait keys are a closed set defined in `strains.js`; unknown keys throw.
- Evolution is passive and non-blocking; simulation owns offer timing/options.
- No player-guidance field participates in growth authority.
- Six Evolution branches contain exactly 107 cells; all 642 IDs and locations are stable.
- Every cell compiles a concrete scalar/conditional effect; milestone identities
  remain separate metadata and never advertise an unavailable control.
- Purchases return a new meta document and spend exactly the declared cost.
- Purchase authority is enough Echoes plus any one physically adjacent owned
  atlas cell; six canonical roots alone bootstrap a save with no owned cells.
