# `src/game/skills/`

Current-only Evolution authority: one authored `First Division` root on a
frequency-2, 42-cell physical sphere.

- `catalog.js` contains every player-facing ability, text, direct effect, and
  bounded refinement cost.
- `index.js` owns physical adjacency, exact transactions, previews, and the
  public compiler API.
- `levels.js` keeps the sparse exact `evolutionLevels` vector.
- `effects.js` compiles direct traits, habitats, ecology, worldmaking, Luminous,
  and bounded pressure defense with a bounded cache.
- `scene.js` is the read-only whole-cell renderer projection.

A fresh progression can buy only `First Division`. A Level-1-or-higher
physically adjacent cell opens a frontier cell. A second activation of a
selected ready cell purchases exactly one level with expected level, expected
revision, and a bounded transaction key.

For target level `n >= 1`, base cost `b`, and authored refinement cost `r`:

```text
cost(n) = b*n² + r*n*(n-1)
```

Exact progression integers remain authoritative; bounded refinements never turn
a huge level into an unbounded simulation value. The current meta schema is 15;
mismatched Evolution documents reset rather than migrate.
