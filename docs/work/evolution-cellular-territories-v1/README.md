# Evolution Cellular Territories v1

## Starting point

- Branch `main` at `8c1ee90ecebea2964f53d839755aa4c14378ed14`, tracking
  `origin/main` with ahead/behind `0/0`.
- The tracked checkout began with the user-supplied compatible `AGENTS.md`
  territory-contract update. Untracked user handoffs
  `docs/work/202608300500.md` and `docs/work/202608300855.md` remain preserved
  and will not be staged.
- The prior Environment Pressure Differentiation v1 package is terminal. The
  work index reported no active package, so no overlapping active authority
  required reconciliation.
- Baseline production Evolution renders a separate frequency-2 topology with
  42 cells, while World uses the level-4 topology with 2,562 cells and 7,680
  edges. The authored catalog, authoritative adjacency, scene cell arrays,
  picking reverse map, and rendered topology are currently coupled.
- Remote `origin/main` and the latest successful `verify` workflow both point
  to the starting revision. Workflow run `33279774218` succeeded. Fresh final
  publication evidence is still required.

## Relevant dirty files

- `AGENTS.md`: user-supplied durable contract addition for dense Evolution
  territories; compatible with the active contract and intended for this work.
- `docs/work/202608300500.md`: preserved untracked prior handoff; unrelated to
  this implementation.
- `docs/work/202608300855.md`: preserved untracked current transfer artifact;
  reconciled here rather than added to the repository.

## Confirmed root causes

- Evolution's 42 authored progression nodes and its visible topology are the
  same current object, so a coherent small progression graph necessarily
  appears as a sparse 42-cell globe.
- `progression-spheres.js` owns a separate frequency-2 renderer topology and
  maps picked rendered cells back through `MEMORY_CELL_REVERSE`.
- `scene.js` writes one authored state into one coarse rendered cell, while
  both renderers suppress dynamic edge semantics for Evolution.
- Durable Evolution levels are ID based. Only Imprints intentionally retain a
  bounded frequency-2/42-cell record, so dense presentation does not require a
  meta schema change or progression reset.

## Selected decisions and deviations

- Preserve the frequency-2 graph as the sole progression and Imprint authority.
- Use the existing level-4 World topology family for Evolution presentation and
  one pure catalog-order-stable spherical Voronoi projection for ownership,
  compact membership, semantic anchors, and edge classification.
- Reuse the existing WebGL2 boundary draw and Canvas boundary phase. No new
  draw pass or persisted fine-cell map is permitted.
- The selected construction needs no algorithmic correction. On the exact
  production topologies it produces 42 connected territories of 56–65 cells
  and exact 120-edge contact equivalence. Thirty-six exact geometric ties are
  resolved explicitly by stable authored catalog order.

## Completed coherent phases

- Repository safety, chronology, root contract, status, prior terminal package,
  current CI orientation, relevant owners, and focused tests were inspected.
- The current sparse topology and its coupling through scene projection,
  picking, renderers, interaction, and persistence were reproduced in source
  and focused production tests.
- A read-only prototype proved complete coverage, uniqueness, nonempty
  connected territories, exact contact equivalence, and bounded construction
  on the actual topologies before production cutover.
- Milestone 1 is complete. The isolated predecessor checkout remains available
  only for paired ignored evidence; production was not partially routed before
  the graph proof passed.
- Milestone 2 is complete. `territories.js` is the one immutable ownership,
  CSR membership, centroid/anchor, contact, and edge-class owner. Evolution now
  uses `topo4`; coarse renderer/picking maps are deleted; all fine cells resolve
  to a skill; both renderers consume the shared edge bytes through existing
  phases; and Imprints expand only in the read-only scene snapshot.
- Focused Milestone 3 browser proof is complete for Worker/WebGL2,
  fallback/WebGL2, and fallback/Canvas. The full production scenarios also pass
  Worker/WebGL2, fallback/WebGL2, and Worker/Canvas with pointer, touch,
  keyboard, gesture cancellation, active-World lockout, persistence, terminal
  settlement, History, and renderer continuity.
- A short-landscape specificity defect found at 200% text was corrected by
  retaining one scrollable Evolution detail surface. Close is reachable at the
  top and the complete action at the bottom. Canvas's old coarse-cell selection
  outline was removed from fine cells; selection now belongs to the shared
  territory perimeter while bounded inner status glyphs remain.
- The coherent production cutover is commit
  `d750e0007a7ab343925be3a2c4e85cb2aa9613f3`. Because the checked-in title
  showcase hashes all `src/game` JavaScript, commit
  `17b632e5ba564eea7b89f2e46258bcb8d7378a31` refreshes only that generated
  source receipt; its simulation payload hash remains unchanged.

## Focused verification

- PASS — starting focused progression and globe tests: `9/9`.
- PASS — `npm run audit:skills`; graph valid, 42 authored nodes, 120
  authoritative boundaries, content version `8`, and exact bounded compilation.
- PASS — selected pure projection prototype: 2,562/2,562 cells assigned; all
  component counts `1`; sizes `56–65`; expected/actual contacts `120/120`;
  missing/extra contacts `0/0`; visible shared boundaries `9–13` fine edges per
  authoritative pair; owner-map SHA-256
  `e76c677b6ce4b8c786d1a650bf5bc9894dc8d20f1df68ae37c22755fc891143d`;
  one cold construction measured `2.027 ms` in Node v24.18.1.
- PASS — starting `npm run benchmark`: `11,833 ticks/s`, fixed-trace median
  `10,614 ticks/s`, hashes `15863d52` and `e32ad0ff`, valid.
- PASS — focused final tests: `35/35`; progression, territory properties,
  compact Imprints, renderer buffer reuse, and deterministic repeat construction.
- PASS — final skill audit: 2,562/2,562 covered; 42 connected territories;
  sizes `56–65`; expected/actual contacts `120/120`; 36 stable ties; digest
  `3fb3be93`; stable-content verify measured construction `2.578 ms`; authored graph/content/compiler
  versions remain `42`, `120`, `54b3576d`, and `2/2/3/8`.
- PASS — five isolated predecessor/final fixtures (fresh, partial, scarcity
  specialist, Luminous, full breadth) have identical IDs, roots, adjacency,
  available IDs/costs, exact transactions/receipts, level vectors, compiled
  configurations, and run configurations; both aggregate SHA-256 values are
  `975c32a7e742a5f0f7726a2706bf64788d1e6e4aee2faaacdfd5841f2218969c`.
- PASS — rich validated meta is byte-identical before/final at schema 15 with
  SHA-256 `b50278bebb4a6fa32a0f00c29931e66f4ef3d9e751b1e877ecc4a54f9ab139a7`;
  coarse Imprint topology remains frequency 2 / 42 cells / 120 edges and no
  2,562-entry owner map is serialized.
- PASS — `npm run agent:smoke`; all 8 tests and 12 production-authority training
  campaigns are valid with deterministic reruns and active-World purchase
  rejection.
- PASS — focused Chrome 152 receipts under ignored `reports/` for
  Worker/WebGL2, fallback/WebGL2, and fallback/Canvas: 2,562 cells, 7,680 edges,
  42 owners/tree items, whole selected territory, internal < territory <
  selected salience, all eight viewports at 200% text, forced colors, stable
  reduced motion, reusable projection/geometry, and zero steady edge updates.
  Exact clean-revision receipt SHA-256 values are
  `7adfbda4cbaed26a22bc1e2df9a4ca54afe5d63efa087717eba6aebd1443f71f`,
  `61d7d004db4ab67f07494d0f5988045f2ee42e7b4ce64c71adb1cbe44a82d512`,
  and `b5aaf04586218c0d12078bf3d9773435ebac532c96148802a412cdfc5b8a8d21`.
- PASS — WebGL remains four draws. Final p95 update/steady costs are `1.3/1.2
  ms` for Worker/WebGL2 and `2.1/1.9 ms` for fallback/Canvas; warm entry p95 is
  `19.9/6.1 ms`. Predecessor values were `0.2/0.1/4.1 ms` WebGL and
  `0.3/0.2/2.0 ms` Canvas. Absolute final frame work remains bounded; the player
  gain is complete fine-cell meaning and exact visible contact, not density alone.
- PASS — full production browser scenarios for Worker/WebGL2, fallback/WebGL2,
  and Worker/Canvas, including active-World Evolution lockout, exact purchases,
  pointer/touch/keyboard, drag/pinch/wheel/cancel, storage reload/reset,
  four-draw WebGL, context continuity, paused-World snapshot fingerprints, and
  zero browser-console errors. Worker and fallback both settle SCORE `178012`.
- PASS — fresh clean-worktree `npm run verify` at
  `17b632e5ba564eea7b89f2e46258bcb8d7378a31`: every one of 26 gates passes,
  including unit `222/222`, integration `73/73`, structure, links, showcase,
  audits, and a `12,161 ticks/s` benchmark. Simulation hashes remain
  `15863d52` and `e32ad0ff`; the regenerated showcase payload remains
  `608dec0905e713b0e1343de5259ac4c96b34f296836ce80394bf3f935d5f9fd7`.

## Evidence not obtained

- CI, Pages, deployed bytes, and deployed-browser behavior cannot exist until
  the verified local revision is pushed. They remain pending, not passed.
- Physical-device mouse, touch, pen, screen-reader, high-refresh, thermal, and
  safe-area hardware evidence are unavailable in this environment. CDP touch,
  Pointer Events, keyboard, forced-colors, reduced-motion, and responsive
  emulation are browser evidence, not physical-device evidence.

## Failed or superseded attempts

- One unconfigured browser baseline exited 77 because Chrome was unavailable to
  that invocation; it is not evidence. Configured Chrome 152 receipts supersede it.
- The first broad predecessor run's rapid-button check used three separate CDP
  round trips; transport latency exceeded the 350 ms product guard and made it
  non-rapid. The oracle now dispatches the three accessible clicks in one page
  task while the trusted explicit-button path remains independently covered.
- Early focused final runs exposed and then corrected a fixture temporal-dead-
  zone error, detail state lost during entry timing, the short-landscape text
  overflow, and Canvas per-cell selection outlines. None is reported as a pass.
- Synchronous Canvas timing periodically forced deferred compositor flushes and
  produced a misleading `~51 ms` p95. One accepted render per animation frame
  now measures the real path; the obsolete synchronous number is not evidence.
- Two broad runs failed only the predecessor fixed-footer oracle after the
  product moved short landscape to one scroll owner; the final oracle proves
  both scroll endpoints with the repository's 1 px geometry tolerance.
- The first clean `npm run verify` at `d750e00` passed every other gate but
  failed `showcase:check` because the new `src/game/skills/territories.js`
  changed the generator's declared source hash. It is not a full pass. The
  generated payload did not change; commit `17b632e` refreshes the receipt and
  the complete stable-content rerun passes.
- One focused Worker/WebGL2 report carried a manually mistyped full revision in
  its metadata. It is superseded and not evidence; the exact `17b632e5...`
  report above replaced it.

## Exact next coherent step

Commit this local evidence record, recheck the tracked upstream relationship,
perform the authorized normal push, and verify exact CI, Pages, cache-busted
bytes, and deployed browser behavior before marking this package terminal.
