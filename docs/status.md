# Status

Whole-cell lake vertical slice implemented and verified on `main`; the larger
atomic-world and unified-shell release remains in progress.

- **Slice base:** `e712035e18c295dca39c0db3f36e3eff5c41a40e`.
- **Branch/upstream:** `main` tracking `origin/main`; this slice is ready for its
  coherent implementation commit and push.
- **Repository/Pages identity:** unchanged by this slice.

## Product and world changes

- Ordinary level-4 worlds expose 6–8 deterministic, spatially separated lakes.
  Every ID is one connected 3–18-cell component; lake cells never overlap ocean
  and remain `landMask=1`.
- Public fields are `lakeId`, typed `lakeDepth`, typed `lakeShore`,
  `freshwaterInfluence`, and frozen `lakes` records. Each record includes frozen
  cell/shore/wetland lists, area/class, min/mean/max depth and class, surface
  elevation, catchment, outlet cell/status, type, and salinity.
- `BIOME.LAKE` has bounded growth/upkeep/uptake/renewal/route factors. Whole-cell
  lake shores and wetlands affect climate, resources, event travel, Adaptation
  arrival, Reach conditions, landmarks, inoculation, and inspection.
- Rainfall, priority-flood elevation, outlet selection, drainage direction, and
  accumulation remain private to `src/world/hydrology.js`. Public drainage
  systems and obsolete water/feature/landmark enum members were removed.
- Active geography uses Verdant Lakeworld, Lake Archipelago, Fractured Lakes,
  Great Lake, and Lake Shore vocabulary. Inspector rows expose Lake, Lake shore,
  Wetland, and complete lake-record facts.

## Rendering and compatibility

- WebGL2 removed all directional waterway geometry, attributes, varyings, and
  local channel equations. Lake depth/shore reuse terrain material, lake relief
  is flat, and only shared cell boundaries emphasize lake edges. Four draws are
  preserved.
- Canvas removed curved/interior water rendering and static inset geography.
  Lakes, shores, wetlands, and forest blend are one full-cell fill; existing
  shared boundary strokes handle ocean/lake edges.
- Simulation emits `geo-lake`; History maps `geo.lake.reached`. The old semantic
  key remains readable as archived drainage evidence but contributes no lake
  Trophy proof. Version-1 fact bit 2 and unversioned schema-6 accumulated bit 2
  are cleared during validation; already-earned stable Trophy IDs remain owned.
- `audit:cell-visuals` rejects obsolete identifiers and known fine-feature
  patterns in production world/rendering source. `audit:lakes` replaces the old
  audit; the temporary compatibility alias invokes the lake audit.
- Structure heuristics now warn above 200 lines/16 children and fail above
  400/24. The cohesive 222-line hydrology module intentionally emits one warning.

## Measured lake distribution

`npm run audit:lakes -- --count=500` on Node v22.22.3/Linux x64:

- aggregate deterministic hash `0e7f6f17`; 500 duplicate generations matched;
- 6–8 lakes/world, median 7, mean 6.6;
- area 3–18 cells, median 10, mean 10.388; 100% in the requested band;
- shore median 22 cells; wetland median 8 cells;
- median lake coverage 5.399% of land; median ecological-influence coverage
  24.512% of all cells; median moisture lift 0.21553;
- types: 625 marsh, 1,139 rift, 776 glacial, 729 rain-fed, 31 salt-basin;
  salinity: 2,992 fresh, 217 brackish, 91 saline;
- zero disconnected IDs, ID mismatches, ocean overlaps, touching IDs, shore or
  wetland defects, influence bound defects, deterministic mismatches, or public
  private-field leaks;
- 2,881.24 ms total including duplicate generation; first-generation mean
  2.833 ms, median 2.576 ms, p95 3.994 ms, max 19.905 ms.

## Golden, balance, and performance

- WorldModel golden: `586696d6`.
- Production benchmark: 2,715 ticks in 185 ms, 14,712 ticks/s, hash `813c4f49`,
  peak coverage 0.1093, 9 MB reported heap.
- Balance smoke medians (n=4 diagnostic): balanced 284.6 s, expansion 267.4 s,
  resilience 353.2 s; every command passed and the 3,620-tick ceiling remains.
- Title showcase was regenerated after focused and full tests established the
  lake behavior. It remains 89 frames/22.25 s/228,754 bytes; production source
  hash `3f3e9227…`, data hash `22ac0d97…`, terminal-segment source tick 2,732.

## Exact verification

- `npm run verify` — PASS all nine fast gates: structure, cell-visual audit,
  showcase, 117 unit, 63 integration, 500-seed lake audit, balance smoke,
  benchmark, and links. Verify benchmark: 2,715 ticks in 184 ms, 14,793
  ticks/s, hash `813c4f49`.
- `npm run check:structure` — PASS; 224 files/29 directories; one intentional
  222-line hydrology warning, no hard-cap failure.
- `npm run test:unit` — PASS, 117/117.
- `npm run test:integration` — PASS, 63/63.
- `npm run audit:cell-visuals` — PASS, 24 files scanned, four draws/full-cell
  lakes true, zero violations.
- `npm run audit:lakes -- --count=500` — PASS with distribution above.
- `npm run audit:events` — PASS, 200 worlds/1,386 fields, zero ocean violations,
  every field irregular/non-radial; median 0.1933 ms/field.
- `npm run balance:smoke` — PASS.
- `npm run benchmark` — PASS with result above.
- `npm run showcase:check` — PASS, data hash `22ac0d97…`.
- `npm run check:links` — PASS, 118 modules/10 HTML references.

## Known limitations / next actions

- No browser/WebGL2/Canvas screenshot run or physical-mobile evidence was
  collected for this isolated source slice; source/unit contracts cover both
  rendering paths, not pixel appearance or GPU timing.
- The n=4 resilience smoke median is above the 270–330 s ordinary target while
  remaining below the hard ceiling; a deep balance run should determine whether
  this is sample noise before tuning.
- Stable internal legacy Trophy/Skill IDs and the old History key remain only
  for persistence compatibility; active labels and new proof are lake-centric.
- This slice has not yet been observed in CI or on Pages. Public deployment,
  Docker evidence, and the repository rename remain release-level work.
