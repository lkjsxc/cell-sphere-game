# `src/game/skills/`

Pure frozen content and progression authority for the frequency-5, 252-cell
Evolution sphere. The sphere remains 750-boundary geography with twelve
pentagons, 240 hexagons, and six connected 42-cell affinities.

## Sources of truth

- `index.js`: public catalog, adjacency, cell state, preview, transaction,
  compiler, scene, and compatibility surface.
- `levels.js`: Evolution level vector v1, exact affinity/depth summaries, and
  bounded decimal-magnitude projection.
- `cost.js`: Evolution cost v1.
- `effects.js`: Evolution effect compiler v2 and its bounded 512-entry cache.
- `builds.js`: sixteen authored Build recipes and Build mastery v1.
- `potential.js`: World Potential v3 plus the narrowly named legacy v2 Number
  projection.
- `atlas.js`: six connected 42-cell territories covering all 252 cells.
- `node.js`: level-one landmarks, conditions, unlocks, and Resonance content.
- `affinities.js`: Fertility, Freshwater, Scarcity, Cryogenic, Marine, and
  Luminous metadata.
- branch modules retain stable Reach, Flow, Reserve, Ecology, Perception, and
  Continuity IDs while presenting environmental affinities.
- `legacy-v4-manifest.js`: explicit 642-entry migration evidence.
- `scene.js`: semantic whole-cell renderer projection.

## Canonical levels and transactions

`meta.evolutionLevels` is a frozen sparse vector in `MEMORY_NODE_IDS` order.
Each entry is `{ id, level }`, where `level` is a canonical positive decimal
string. Unknowns, malformed/zero values, and duplicates normalize
order-independently. `meta.memoryNodes` is read only when no level vector is
present and maps each recognized ID to level `"1"`; compatibility APIs such as
`compileMemory` and `purchaseMemory` still use level authority.

A level-0 cell needs a directly adjacent owned cell. One of the six roots can
bootstrap only at zero breadth. An owned cell always remains reachable for its
next upgrade. Purchases validate optional expected level, expected revision,
and transaction key; debit exact decimal Echoes; increment one level and one
revision; and retain at most 32 transaction receipts.

For target level `n >= 1`, node base cost `b`, and node Evolution Power `e`:

```text
cost(n) = b*n^2 + e*n*(n-1)
```

The formula is direct bigint arithmetic and level 1 is exactly the authored
base cost.

## Compilation and formulas

Compilation scans the fixed 252-cell catalog once and is independent of decimal
level magnitude. Its cache key contains the complete canonical vector and all
relevant versions; diagnostics and reset functions are exported for audits.
Level 1 preserves authored effects, conditions, unlocks, Resonance, habitats,
Build activation/effects, breadth power 384, and World Potential `"1200000"`.
Unlock flags never duplicate.

Later-level direct ecology refinement uses:

```text
r(L) = 1 - exp(-ln(L) / 6)
```

`ln(L)` is reconstructed from decimal digit count and at most six leading
digits, never by converting the complete level to Number. Thus `r(1)=0`, later
levels remain meaningful, and direct coefficients approach finite authored
limits. Exact affinity depth, Evolution defense, Build rank, and mastery values
remain unbounded canonical decimals outside tick loops.

World Potential v3 uses the retained level-one breadth anchor and exact weighted
excess depth:

```text
D = sum(node.evolutionPower * (level - 1))
P = breadthAnchor + 1000D + 8D^2 + floor(D^4 / 1,000,000)
```

It preserves exact anchors `"16000"` for empty, `"19000"` for every first root,
and `"1200000"` for all 252 cells at level 1.

Build activation still uses distinct level-one breadth. For every affinity or
tag ingredient requiring `c` cells, support is the `c`-th-highest level among
distinct matching cells. Recipe rank is the minimum ingredient support. Rank 1
is exact authored behavior; higher exact ranks apply only bounded mechanical
refinement, so one deeply levelled cell cannot replace multi-cell or
multi-affinity breadth.
