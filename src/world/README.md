# src/world/

Pure, deterministic construction of the spherical graph and its static living
geography. Worker, renderer, simulation, and Node independently obtain the
same model from the same seed; no generated buffers cross a worker boundary.

| Module | Responsibility |
|---|---|
| `icosphere.js` | Canonical geodesic graph, edges, and CSR adjacency. |
| `dual-mesh.js` | Renderable dual cells sharing simulation cell IDs. |
| `constants.js` | Stable enums and centralized bounded biome simulation factors. |
| `noise.js` | Isolated RNG streams and seamless broad spherical fields. |
| `terrain.js` | Quantile sea level, coherent continents, ridges, depth, coasts. |
| `hydrology.js` | Priority-flood drainage, accumulation, rivers, mouths, lakes. |
| `ecology.js` | Correlated rainfall climate, soils, forests, biomes, hazards. |
| `features.js` | Ecologically viable starts, regions, and real landmarks. |
| `fields.js` | `createFields(rng, topo)` compatibility entry point. |

## Invariants

- Generation uses the passed xoshiro RNG only; subsystem streams are derived
  up front so adding detail to one subsystem cannot perturb another.
- Terrain occupies 38–58% of a normal world and remains seamless on the
  sphere. Float fields are explicit, bounded, and `Math.fround`-quantized.
- Every land cell drains through a neighboring cell to ocean without cycles.
  Rivers are thresholds over accumulated drainage, never decorative edges.
- Forests and biomes follow moisture, temperature, elevation, and water.
  Central growth/upkeep/uptake/renewal/route factors make geography matter.
  Feature flags and landmarks reference the same authoritative cell graph.
- `baseNutrient`, `baseMoisture`, `baseTemp`, `toxVuln`, `eventVuln`, and
  frozen `sources` remain available to existing simulation/rendering callers.
