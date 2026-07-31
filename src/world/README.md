# src/world/

World generation: static topology and environmental fields. Pure functions
of the seed — identical output on worker, main thread, and Node.

| Module | Responsibility |
|---|---|
| `icosphere.js` | Geodesic icosphere graph (level 4: 2,562 nodes / 5,120 tris / 7,680 edges), canonical edge list, CSR adjacency. |
| `fields.js` | Static per-node fields (nutrient, moisture, temperature, altitude, toxin/event vulnerability) via seeded radial-blob noise; resource-source picking. |

Invariants:

- Generation math uses only +,−,×,÷ and `Math.sqrt` (IEEE-correct per spec).
  No transcendentals, so topology and fields are bit-identical everywhere.
- Topology is immutable (`Object.freeze`) and shared conceptually by
  simulation and rendering; each side generates it independently from the
  level constant — it is never transmitted over the worker channel.
- Fields are normalized to [0,1] and stored fround-quantized.
- The opening world is generous by construction (see `baseNutrient`);
  scarcity arrives through the simulation's entropy curve, not the fields.
