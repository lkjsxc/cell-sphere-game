# Evolution Cell Progression v1

Status: active.

## Starting point

- Branch `main` at `c3754318ef1399e37cb4ce4e3411885ec3c605bc`, tracking
  `origin/main` with ahead/behind `0/0`.
- Latest exact upstream workflow run `33287978887` succeeded for the starting
  revision. GitHub Pages uses the existing workflow deployment at
  `https://lkjsxc.github.io/cell-sphere-game/`.
- `AGENTS.md` began modified with the user-supplied complete replacement
  contract for exact-cell Evolution and belongs to this campaign.
- Untracked user handoffs `docs/work/202608300500.md`,
  `docs/work/202608300855.md`, and `docs/work/202608301243.md` remain preserved
  and unstaged. The last is the transfer mandate reconciled into this package;
  none is a second work-package authority.
- The predecessor package is terminal. It truthfully proves the prior product
  at its revision and is historical evidence after this campaign supersedes it.

## Confirmed root causes

- Production progression, persistence, transactions, History, agents, and
  accessibility use 42 authored skill IDs on a frequency-2 graph.
- The level-4 sphere is already the maintained 2,562-cell / 7,680-edge visual
  topology, but `territories.js` assigns each fine cell to one coarse owner.
- Scene projection copies one owner state across 56–65 fine cells; picking,
  camera focus, and the 42-item semantic tree resolve back to that owner.
- Coarse Imprints and whole-territory edges reinforce the same authority split.
  A visual-only adjustment cannot make a visible cell the purchased cell.
- Meta validation is field-local, so an atomic current-only schema cutover can
  preserve validated non-Evolution facts while clearing incompatible levels,
  Evolution receipts, Imprints, and Evolution History events.

## Selected decisions and deviations

- Use the existing level-4 topology as visible and progression topology.
- Retain the 42 catalog entries as recurring archetypes. Sparse exact levels are
  keyed by stable numeric fine-cell identity; aggregate archetype ranks alone
  enter the retained cost law and production compiler.
- Direct level-4 adjacency is the only frontier rule. `First Division` occurs
  once and is the only fresh root.
- Replace territory ownership with one immutable deterministic stratified
  cellular weave and one linear projection owner shared by UI, renderers,
  accessibility, and agents.
- Use the existing renderer passes and shared boundary phase. No new draw pass,
  simulator, compiler, graph editor, or balance retune is selected.
- Selective current-only reset is feasible and integration-proven: independently
  valid meta survives while predecessor levels, receipts, coarse Imprints, and
  Evolution History reset atomically to current empty channels.
- No mandate deviation is currently selected.

## Completed coherent phases

- Repository branch, revision, upstream, ahead/behind state, dirty files,
  recent commits, root contract, work authority, predecessor record, current
  status, source owners, tests, CI orientation, and Pages configuration were
  inspected.
- The authority split was reproduced through focused source, unit,
  integration, audit, benchmark, and production-browser paths.
- Milestone 0 is complete with the exact predecessor browser/performance baseline
  below.
- Milestone 1 is complete. The level-4 topology, layout digest, sparse `{cell,
  level}` vector, aggregate ranks, direct frontier, aggregate-priced transaction,
  one compiler input, WAL schema 6, and selective reset are authoritative. The
  coarse purchase graph and skill-ID level authority are removed.
- Milestone 2 is complete. Exact cells own scene state, picking, focus,
  select-first/later-purchase interaction, fine Imprints, History events, shared
  edges, and the bounded native navigator. `territories.js`, owner/anchor maps,
  state copying, the 42-item tree, and coarse Imprint readers/writers are deleted.
  WebGL2 retains four draws and Canvas consumes the same projection.
- Milestone 3 implementation is complete. Fair-agent candidates are bounded at
  224, use the production transaction/compiler, and retain deterministic policy
  behavior. Affected audits, browser fixtures, commands, generated consumers,
  source READMEs, and current root documentation use cell authority. D33
  explicitly supersedes D32 without rewriting D32's historical evidence.
- The dependency-closed implementation is commit
  `3c4766979d7405b265b3bf0434eba6d09781c798` (`feat: make every Evolution
  cell authoritative`). It is a normal descendant of the starting revision and
  contains the complete production, test, generated-output, and current-document
  cutover; the three timestamped handoffs remain outside the commit.

## Focused verification

- PASS — focused predecessor tests: `24/24` across progression, territory
  projection, persistence/WAL, and fair-agent ownership.
- PASS — `npm run audit:skills`: 42 frequency-2 nodes / 120 edges, 2,562
  presentation cells / 7,680 edges, 42 connected territories of 56–65 cells,
  digest `3fb3be93`, bounded exact compilation, and valid huge-level handling.
- PASS — `npm run benchmark`: `12,146 ticks/s`; fixed-trace median
  `10,095 ticks/s`; deterministic hashes `15863d52` and `e32ad0ff`.
- PASS — Chrome `152.0.7977.64` Worker/WebGL2 predecessor receipt
  `reports/evolution-cellular-territories-v1-baseline-worker-webgl2.json`
  (`14,442` bytes; SHA-256
  `8593a8eb317c807dbfbb5a3f0379f8f47e3c60b34530d5f480a5f308e6acc223`).
  Entry/snapshot/update/steady p95 is `21.3/0.4/1.5/1.5 ms`.
- PASS — fallback/WebGL2 predecessor receipt
  `reports/evolution-cellular-territories-v1-baseline-fallback-webgl2.json`
  (`14,428` bytes; SHA-256
  `321af49b0e72b92e52d66bf630f18e6f065f33e8696eda7a06b69945f4ca716c`).
  Entry/snapshot/update/steady p95 is `23.2/0.7/2.3/1.8 ms`.
- PASS — fallback/Canvas 2D predecessor receipt
  `reports/evolution-cellular-territories-v1-baseline-fallback-canvas2d.json`
  (`14,455` bytes; SHA-256
  `362fac6867bbb1cf129402f3296fad1ba05b8d9a4f1da3171a71505fb5bd0441`).
  Entry/snapshot/update/steady p95 is `6.8/0.5/2.4/2.2 ms`.
- All three browser receipts observe 2,562 cells, 7,680 edges, 42 owners/tree
  items, one selected 65-cell territory, shared digest `3fb3be93`, eight
  responsive viewports at 200% text, forced colors, stable reduced motion,
  cached projection/geometry, zero steady edge updates, and no browser errors.
  Both WebGL2 paths retain four draws.
- PASS — rebuilt unit/integration suite: `226/226` unit and `74/74` integration.
  Coverage includes layout determinism, direct adjacency, exact one-cell
  transactions, stale local/aggregate/revision rejection, aggregate-equivalent
  compilation, current-only reset, fine Imprints/History, fair agents,
  Worker/fallback parity, all public speeds, and deterministic Worlds.
- PASS — `npm run audit:skills`: level-4 `2,562/7,680`, root cell `0`, five
  Foundation root neighbors, layout digest/repeat digest `db40b2ed`, non-root
  occurrences `62–63`, largest same-archetype component `1`, one-hop diversity
  `100%`, valid exact/huge-level compilation, 10,248 typed projection bytes,
  `5.869 ms` measured layout construction, and `1.554 ms` measured full
  projection construction in the exact final gate.
- PASS — progression-number, Environment smoke, habitat, Trophy, campaign smoke,
  transformation, and benchmark audits. The exact final fresh benchmark is
  `11,396 ticks/s`, fixed-trace median `10,881 ticks/s`, and retains
  deterministic hashes `15863d52` / `e32ad0ff`.
- PASS — focused Chrome 152 Worker/WebGL2 cell receipt
  `reports/evolution-cell-progression-v1-final-worker-webgl2.json`, SHA-256
  `762d1c417cc895ef09221c479677d207c76b0b253061d2a17448e4a371ca3950`
  (`13,498` bytes). Entry/snapshot/update/steady p95 is
  `15.5/0.5/1.6/1.6 ms`.
  It proves one changed `{cell:642, level:"1"}` entry, exact new frontier
  `[162,643,1050]`, only truthful local status/incident-edge changes, bounded
  nine-button navigation, edge salience `0.01796 < 0.29417 < 0.35504`, four
  draws, zero steady edge updates, forced colors, reduced motion, and all eight
  maintained viewports at 200% text.
- PASS — focused fallback/WebGL2 and fallback/Canvas 2D receipts, SHA-256
  `1f2ad60e2b9e2e51139b8164727dc1cae4b4f42301b082d12652525d51aacf54`
  (`13,558` bytes) and
  `4347b02b2a2bdedd256a8acd5466e80400db7931976338588282e03cffd6c872`
  (`12,831` bytes). Their p95 timings are `16.6/1.1/2.4/1.3 ms` and
  `6.2/0.6/1.8/2.4 ms`.
  Both repeat the exact cell/frontier/navigation/viewport semantics; WebGL2
  retains four draws and both backends pass calibrated edge ordering.
- PASS — exact same-host predecessor/final focused comparison. Worker/WebGL2
  entry improves `21.3 → 15.5 ms`; accepted update/steady changes
  `1.5/1.5 → 1.6/1.6 ms`. Fallback/WebGL2 entry improves `23.2 → 16.6 ms`,
  update/steady changes `2.3/1.8 → 2.4/1.3 ms`; fallback/Canvas entry improves
  `6.8 → 6.2 ms`, update/steady changes `2.4/2.2 → 1.8/2.4 ms`. Snapshot
  p95 changes by at most `0.4 ms`. Percentage changes above 10% occur only in
  these sub-millisecond snapshots; absolute frame work remains bounded, static
  topology/layout is reused, and every path reports zero unchanged-frame edge
  updates.
- PASS — `npm run check:links` and `npm run check:structure` in the clean
  detached exact-revision worktree. The structure gate therefore measures only
  revision content; the three user-supplied timestamped handoffs remain
  byte-preserved, untracked, and unstaged in the main checkout, without special
  repository exceptions.
- PASS — the production-backed Worker/WebGL2 shell path, fallback/WebGL2 shell
  path, and Worker/Canvas 2D shell path. All settle the same SCORE `178012`,
  exercise exact mouse/touch cell purchases and active-World rejection, and
  preserve deterministic results; both WebGL paths report four draws and the
  Worker/WebGL path also passes context loss. The required viewport, forced-color,
  reduced-motion, pointer, focus, and surface scenarios pass in the focused
  fixture rather than being duplicated here. Exact local camera receipts are
  `9961d1ca239a64b25c8382e15f8a65eb87307d9b0978006b2ebea72091128b6c`
  (Worker/WebGL2),
  `82f25212b92c05d739cd57f1a9845e51ee450e92c336eea8c471039669dccbdc`
  (fallback/WebGL2), and
  `e16ee35aad2e9c978624afe73d1d6a24a4fe4e5fabf9073bd69660b6256aeeec`
  (Worker/Canvas 2D).
- PASS — `npm run agent:smoke`: `10/10` focused fair-agent tests plus twelve
  deterministic five-World production campaigns across two training seeds. The
  candidate projection remains capped at `224`; its seven domain hop counts are
  computed once from player-visible topology/layout. The Luminous policy legally
  purchases root cell `0`, bridge cell `642`, and Luminous cell `1050`, and the
  tournament reports `specialistValid: true`, bounded traces, no task failures,
  and matching deterministic reruns.
- PASS — exact same-host `agent:smoke` comparison: predecessor revision
  `c3754318` completes in `19,790.6 ms`; the final working tree completes in
  `18,275.3 ms` (`−7.7%`). Both exit `0` with the same command and host.
- PASS — corrected `npm run audit:luminous`: schema 4 uses the legal fine-cell
  path `[0,642,1050]` for first-owned Luminous and a bounded union of legal
  paths for the mature fixture. Fresh charge remains disabled, first-owned
  charge is observed, mature charge is stronger, extinction clears charge, and
  deterministic/renderer invariants all pass.
- PASS — corrected `npm run balance:smoke`: schema 4 compiles five distinct
  legal cell-path fixtures and passes all seven invariants. Median game-time
  lifetimes are `132.1/157.7/203.5/148.4/244.4 s` for fresh/Foundation/
  Scarcity/Luminous/mature without changing the production cost law, effects,
  or ecology coefficients.
- PASS — `npm run showcase:generate && npm run showcase:check`: the current
  30-frame generated title-showcase payload is `230,904` bytes with SHA-256
  `608dec0905e713b0e1343de5259ac4c96b34f296836ce80394bf3f935d5f9fd7`.
- PASS — fresh clean detached-worktree `npm run verify` at
  `3c4766979d7405b265b3bf0434eba6d09781c798`: all 26 gates pass, including
  unit `226/226`, integration `74/74`, every production audit, structure,
  links, generated showcase, and the benchmark/hashes above. The retained log
  is `/tmp/csg-final-verify.log`.

## Evidence not obtained

- The first unconfigured browser command exited `77` because no Chrome binary
  was on `PATH`; it is not evidence.
- The first explicitly configured Chrome launch failed because its cached
  runtime libraries were not on `LD_LIBRARY_PATH`; it is not evidence.
- One fallback attempt timed out at the default 10-second CDP bound. The
  independent 60-second-bounded rerun above supersedes it.
- The first focused final browser attempt hit the default 10-second evaluate
  ceiling during the combined timing/visual probe; the 60-second rerun passed
  and supersedes it.
- Seven broad Worker-browser attempts crashed or timed out before assertions
  because the cached Chrome runtime had its shared libraries but no usable font
  directory. The final diagnostic captured Chrome 152's exact
  `SkFontMgr_FontConfigInterface.cpp:163` fatal and `SIGABRT`; these are host
  failures, not product passes. A test-only Fontconfig file pointing at an
  existing environment font directory eliminated the abort. The clean
  exact-revision broad and focused browser runs then passed without a source
  diagnostic patch.
- One broad-browser run then exposed a stale fixture assumption that every first
  World yields at least two simultaneous Trophies. The authoritative run yielded
  one. The fixture now verifies the actual nonempty bounded queue and persistence
  across replacement for either one or several awards; the failed run is not a
  pass.
- One first `agent:smoke` run failed `specialistValid`: the candidate policy
  lacked route evidence and the tournament still read the retired domain
  property `cells`. The bounded observation now exposes public shortest-hop
  counts, and the policy follows them; a direct campaign trace proved ownership
  of one Luminous cell. The tournament now reads current `ownedCells`. The failed
  report is not a pass; the passing rerun above supersedes it.
- The first complete `npm run verify` attempt passed 23 of 26 gates but failed
  `audit:luminous`, `balance:smoke`, and `showcase:check`. The two audits still
  supplied retired skill-ID level vectors, which current-only validation
  correctly reset to fresh; the generated showcase was stale after its source
  identity changed. The fixtures now use legal fine-cell paths and pass, and the
  showcase has been regenerated, but that failed complete run is not a complete
  verification pass.
- The first WebGL focused run after correcting overlapping edge-code ranges
  measured frontier `0.29417` above selected `0.28538` and failed the controlled
  salience gate. Increasing the exact selected-cell perimeter to an opaque white
  trace produced `0.01796 < 0.29417 < 0.35504` in both WebGL execution paths;
  the failed run is not a pass.
- One later exact-revision `npm run verify` traversed all 26 gates but its final
  output stream was lost during context compaction. It is not classified as a
  pass; the retained-log clean rerun above supersedes it.
- Physical-device mouse, touch, pen, screen-reader, high-refresh, thermal, and
  safe-area hardware evidence is unavailable in this environment.

## Exact next coherent step

Commit this exact local evidence record, then publish normally and prove the
exact remote/CI/Pages/deployed-byte/deployed-browser revision if the branch
remains safely fast-forwardable.
