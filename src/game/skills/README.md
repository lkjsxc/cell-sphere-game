# `src/game/skills/`

Pure current Evolution content and progression authority. It has no DOM,
storage, or simulation-clock dependency.

> Transitional implementation note: the current frequency-5, 252-cell catalog
> remains in production pending the separately scoped authored compact-sphere
> replacement. It is not a compatibility format and is not a claim that the
> target compact graph has already shipped.

## Sources of truth

- `index.js`: catalog, physical adjacency, cell state, previews, transactions,
  compiler, and renderer projections.
- `levels.js`: the exact sparse `evolutionLevels` vector and bounded
  decimal-magnitude refinement.
- `cost.js`: one-level exact cost authority.
- `effects.js`: compiled finite ecology effects and its bounded cache.
- `builds.js`: current Build recipes and mastery.
- `potential.js`: the still-current World Potential implementation; its removal
  is a later realized-SCORE slice.
- `atlas.js`, `node.js`, and `affinities.js`: current cell mapping and authored
  content metadata.
- `scene.js`: semantic whole-cell Evolution renderer projection.

## Canonical levels and transactions

`meta.evolutionLevels` is the only persisted Evolution ownership authority. Each
entry is `{ id, level }`, where `level` is a canonical positive decimal string.
Unknown, malformed, zero, and duplicate vector entries normalize to a stable
sparse vector. A mismatched meta schema starts fresh; older binary ownership
fields and Evolution IDs are not imported or mapped.

A level-0 cell needs an adjacent owned cell, except for the current graph's
bootstrap root behavior. An owned cell remains available for its next level.
Every purchase supplies expected level, expected revision, and a bounded
transaction key, debits exact decimal Echoes, increments exactly one level, and
retains at most 32 receipts.

For target level `n >= 1`, node base cost `b`, and node Evolution Power `e`:

```text
cost(n) = b*n^2 + e*n*(n-1)
```

The formula uses direct `bigint` arithmetic. Repeated levels use a bounded
refinement curve; arbitrary-size decimal levels are never converted wholesale
to JavaScript `Number` values.

## Compilation and persistence

Compilation scans the fixed current catalog once and is independent of decimal
level magnitude. Its cache key contains the canonical vector and relevant
versions; entry count and serialized key/payload weight are bounded. The current
meta schema is 14 and History records current Evolution transactions with exact
levels, cost, balance, Environment evidence, and compiler versions.

Focused checks are `audit:evolution-levels`, `audit:progression-numbers`,
transaction coverage, and pointer/touch/keyboard browser acceptance.
