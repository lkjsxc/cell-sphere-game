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
| `hydrology.js` | Private priority-flood drainage projected into connected whole-cell lakes. |
| `ecology.js` | Lake influence, climate, soils, forests, biomes, and hazards. |
| `features.js` | Ecologically viable starts, regions, and lake-backed landmarks. |
| `fields.js` | `createFields(rng, topo)` compatibility entry point. |

## Invariants

- Generation uses the passed xoshiro RNG only; subsystem streams are derived
  up front so adding detail to one subsystem cannot perturb another.
- Terrain occupies 38–58% of a normal world and remains seamless on the
  sphere. Float fields are explicit, bounded, and `Math.fround`-quantized.
- Rainfall, priority-flood elevation, outlets, drainage direction, and flow
  accumulation remain private generation details in `hydrology.js`.
- Ordinary worlds expose 6–8 spatially separated lakes. Every lake ID is one
  connected 3–18-cell component; every lake cell remains `landMask=1`, uses
  `BIOME.LAKE`, and has whole-cell shore and wetland ecology.
- Public lake records are frozen and include cells, shore/wetland cells, area,
  depth statistics/class, surface, catchment, outlet status, type, and salinity.
- Forests and biomes follow moisture, temperature, elevation, lake influence,
  and water. Central growth/upkeep/uptake/renewal/route factors make geography
  matter without exposing internal drainage systems.
- `baseNutrient`, `baseMoisture`, `baseTemp`, `freshwaterInfluence`,
  `toxVuln`, `eventVuln`, and frozen `sources` remain available to simulation
  and rendering callers.
