# `src/game/skills/`

Current-only Evolution authority is the maintained level-4 cellular sphere:
2,562 visible cells and 7,680 direct edges. Every visible cell has one stable
progression identity and one immutable authored archetype. `First Division`
occurs on exactly one root cell.

- `catalog.js` contains the 42 reusable player-facing archetypes, text, direct effect, and
  bounded refinement cost.
- `topology.js` owns the cached maintained level-4 topology.
- `substrate.js` owns the cached fixed-seed World-derived substrate.
- `layout.js` consumes that topology, substrate, and catalog to select the
  favorable green root and build/validate one connected exact-capacity region
  per archetype plus one connected macro-region per domain.
- `layout-domain-partition.js` and `layout-archetype-partition.js` own the two
  bounded construction stages; `layout-partition-core.js` owns their shared
  connected-capacity transfers, and `layout-metrics.js` owns fixed-field scores
  and independent graph diagnostics.
- `index.js` owns direct fine adjacency, aggregate ranks, exact cell
  transactions, projections, previews, and the public compiler API.
- `levels.js` keeps the sparse exact per-cell `evolutionLevels` vector.
- `effects.js` compiles direct traits, habitats, ecology, worldmaking, Luminous,
  and bounded pressure defense with a bounded cache.
- `scene.js` projects exact-cell state, fine Imprints, and one shared packed
  dynamic-state/immutable-region edge classification for WebGL2 and Canvas 2D.
  Substrate geography guides layout and presentation, but never costs, effects,
  rewards, or World simulation.

A fresh progression can buy only the `First Division` root cell. Owning a cell
opens only its direct unowned neighbors; owned cells remain refinable. A later
activation of the same selected ready cell purchases exactly one local level
with expected local level, aggregate archetype rank, revision, and bounded
transaction key.

The root is chosen by stable green-land neighbor, growth, nutrient, moisture,
and cell-index ordering. Each repeated archetype is one connected family of
individually purchasable cells. Region and domain membership affects spatial
routes and restrained boundary presentation only; it is not a purchase or
compiler owner.

All cells carrying one archetype contribute to one exact aggregate rank. The
existing cost law prices target aggregate rank `r + 1`, and the one production
compiler consumes the 42 aggregate ranks. Equal aggregate ranks therefore have
equal mechanics regardless of which physical occurrences carry the levels.

For target aggregate rank `n >= 1`, base cost `b`, and authored refinement cost `r`:

```text
cost(n) = b*n² + r*n*(n-1)
```

Exact progression integers remain authoritative; bounded refinements never turn
a huge level into an unbounded simulation value. Incompatible predecessor
levels, receipts, Imprints, and Evolution History reset at the current-only
content boundary instead of being mapped into arbitrary cells.
