# Status

The complete Evolution physical-frontier purchase migration is implemented and
locally verified on `main`; the larger unified-shell release continues.

- **Slice base:** `ce554ef30584943e1f351b602c94b25de19b0f52`.
- **Branch/upstream:** `main` tracking `origin/main`; this slice is ready for its
  coherent implementation commit and push.
- **Repository/Pages:** still `lkjsxc/incremental-network-game` and
  `https://lkjsxc.github.io/incremental-network-game/` by explicit slice scope.
- **Playable local entry:** `file://…/index.html?demo=1` through the disposable
  Chrome/CDP harness, or `npm run serve` at `http://127.0.0.1:8080`.

## Evolution authority

- Graph version 4 precomputes one stable ID-to-cell table and physical neighbors
  from the actual 642-cell level-3 topology and atlas permutation.
- A recognized current Skill Cell is purchasable exactly when it is unowned, the
  balance covers its declared cost, and any one physically adjacent cell is
  owned. `hasOwnedAdjacentCell` is the single adjacency predicate shared by
  state projection and the purchase transaction. Run count and authored layout
  order do not participate.
- Exactly six canonical territory roots remain bootstrap choices under the
  initial-save rule. Every non-root purchase requires ordinary physical
  adjacency, including when migrated ownership already exists.
- The state projection carries the actual adjacent owned ID. Detail and semantic
  tree copy names that cell when present and otherwise explains `Adjacent
  unlocked cell`; completed-world and prerequisite copy was removed.
- Purchases remain immutable, repeat-safe, nonnegative, and persistence-before-
  commit. Storage failure leaves the candidate and currency uncommitted.

## Migration and economy

- Progression schema 7 stamps graph 4 and ignores obsolete experience-shaped
  input. Every recognized owned ID is preserved, including disconnected islands
  from older graphs; each island supplies its own physical frontier.
- Unknown IDs retain quarantine behavior. Migration performs no closure,
  refund, charge, automatic purchase, or balance adjustment. Old semantic JSON
  exports continue to import under the existing product identity.
- All 642 stable IDs and authored effects are unchanged. Minor cost generation
  now uses explicit stable cell-position bands rather than a clock proxy.
- Economy is intentionally preserved at **2,462 Echoes**. Economy hash is
  `34b4e4a9`; effect hash is `8444edfd`. Cost distribution is
  `1:102, 2:112, 3:116, 4:120, 5:126, 6:24, 7:12, 8:6, 9:6, 14:6, 18:6, 26:6`.
- The previous completion-hour estimate is retired. Echo-income campaign timing
  has not been recalibrated after removal of the clock floor.

## Exhaustive graph evidence

- 642 mapped/unique cells; atlas mapping hash `d6bdc218`.
- 1,920 undirected physical boundaries and 3,840 directed frontier states;
  twelve degree-5 cells, 630 degree-6 cells.
- Exactly six roots, six branches × 107 cells, all 642 physically reachable.
- All 411,522 possible distinct single-owner/target states audited:
  3,840 adjacent states and 3,810 canonical root-bootstrap states accepted at
  run zero; 403,872 nonadjacent non-root states rejected.
- A legal run-zero transaction sequence acquires all 642 cells for exactly
  2,462 Echoes and leaves zero balance. All 642 effects are concrete; full
  compilation yields 18 scalar keys, 24 conditionals, and 36 unlock records.
- Title showcase data remains byte-identical: 89 frames, 228,754 decoded bytes,
  data hash `22ac0d97…`; source metadata is `9277d6a0…`.

## Exact verification

- Baseline `npm run verify` before editing — PASS: 125 unit and 68 integration
  tests plus all fast gates.
- Final `npm run verify` — PASS all nine gates: 127 unit and 71 integration tests,
  structure, cell-visual audit, showcase, 500-seed lakes, balance smoke,
  benchmark, and links.
- `npm run audit:skills` — PASS in the focused run: all topology, 411,522
  single-owner states, roots, migrations, vocabulary, exact economy/effects,
  and full acquisition valid with no errors.
- `node --test tests/unit/settings.test.js tests/integration/skill-globe.test.js tests/integration/trophy-persistence.test.js tests/integration/determinism.test.js`
  — PASS, 50 tests, 0 failures.
- `npm run showcase:generate` then final `showcase:check` through verify — PASS;
  payload hash `22ac0d97…` unchanged.
- Benchmark through final verify (Node v22.22.3, Linux x64, 20 CPUs): 2,715
  ticks in 181 ms, 14,960 ticks/s, hash `813c4f49`, 0.1093 peak coverage.

`check:structure` passes. Existing maintainability warnings remain for the
browser scenario, app controller, hydrology, renderer/settings tests, and 17
unit-test children; no hard cap fails.

## Known limitations / next actions

- Real Chrome/WebGL2 passed the complete scenario at 32× in 8.89 s with score
  616,807 and an adjacent Skill purchase. This slice adds no separate Canvas,
  physical-device, screen-reader, Docker, public URL, CI, GPU-time, thermal, or
  deployment claim.
- The unchanged 2,462-Echo economy is exact but its post-migration mastery time
  is not calibrated. Run a deep campaign/Echo-income audit before publishing a
  replacement completion-hour claim.
- The broader shell/metric/Event Log work, Trophy redesign, and canonical
  repository/package/storage/Pages rename remain separate tasks.
