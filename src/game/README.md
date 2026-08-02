# src/game/

Data-driven content and rules. Everything tunable is validated data, not
scattered magic numbers. Simulation reads content from here; interface
renders it; the balance harness consumes the same definitions.

| Module | Responsibility |
|---|---|
| `balance.js` | The single table of simulation constants, with units. |
| `strains.js` | Strain archetypes + the `Traits` model and merging rules. |
| `adaptations.js` | ≥24 cards, weighted offer draws, exact-uniform passive selection. |
| `phenotypes.js` | ≥8 synergy recognizers over owned card sets. *(Gate D)* |
| `events-content.js` | 8 event families: Japanese copy, effect parameters. *(Gate D)* |
| `scoring.js` | Network Score formula, ranks, breakdown. *(Gate D)* |
| `echoes.js` | Score → Echo conversion. *(Gate E)* |
| `memory-nodes.js` | Memory Globe node graph. *(Gate E)* |
| `trophies.js` | 32 trophy definitions + evaluation. *(Gate E)* |
| `challenges.js` | Challenge modifiers + multipliers. *(Gate E)* |
| `autoplay.js` | Deterministic policy heuristics. *(Gate E)* |

Invariants:

- Content modules export frozen data; validators run in unit tests.
- Trait keys are a closed set defined in `strains.js`; unknown keys throw.
- Evolution is passive/non-blocking: simulation owns offer timing and fixed options.
- No player-guidance field or Signal trait participates in growth authority.
- Japanese copy lives with its content, keyed by id.
