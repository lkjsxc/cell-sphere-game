# `src/game/skills/`

Current-only Evolution authority is a 42-skill graph with one authored
`First Division` root. Its adjacency is the frequency-2 geodesic graph; the
level-4 globe is a presentation projection, never progression authority.

- `catalog.js` contains every player-facing ability, text, direct effect, and
  bounded refinement cost.
- `index.js` owns authored adjacency, exact transactions, previews, and the
  public compiler API.
- `levels.js` keeps the sparse exact `evolutionLevels` vector.
- `effects.js` compiles direct traits, habitats, ecology, worldmaking, Luminous,
  and bounded pressure defense with a bounded cache.
- `territories.js` deterministically assigns all 2,562 level-4 presentation
  cells to 42 connected skill territories, with exact graph-contact equality,
  compact membership, semantic anchors, and shared edge classes.
- `scene.js` copies each authored state and compact coarse Imprint meaning over
  its fine territory without creating progression or persistence authority.

A fresh progression can buy only `First Division`. A Level-1-or-higher
adjacent skill opens a frontier skill. Activating any fine cell selects its
owning skill; a later activation of that same selected ready territory purchases
exactly one level with expected level, expected revision, and a bounded
transaction key.

For target level `n >= 1`, base cost `b`, and authored refinement cost `r`:

```text
cost(n) = b*n² + r*n*(n-1)
```

Exact progression integers remain authoritative; bounded refinements never turn
a huge level into an unbounded simulation value. The current meta schema is 15;
mismatched Evolution documents reset rather than migrate.
