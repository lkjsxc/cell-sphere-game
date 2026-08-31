# Evolution Ownership Boundary v1

Status: terminal.

## Starting state

- Branch `main` at `b6752bba09bd68471079f24bf1ddc45d03dd4b0b`, tracking
  `origin/main` with ahead/behind `0/0`.
- `docs/work/README.md` named no active package. The surface-gesture and
  Evolution ability-region packages are terminal revision-scoped evidence.
- Root `AGENTS.md` was already modified with the complete user-supplied durable
  ownership-boundary replacement (`b849defa7891da233528554190c4cdb6f47e8c926ec6077cd1c850bd8c97afdd`)
  and is campaign-owned input.
- Six user transfer artifacts were untracked and remain outside campaign edits:
  `202608300500.md`, `202608300855.md`, `202608301243.md`,
  `202608302226.md`, `202608311044.md`, and `202608312102.md`.

## Confirmed root cause and baseline

- `writeEvolutionCellEdges` gives `FRONTIER` to every edge incident to an
  unowned reachable cell as well as to the exact owned/unowned graph cut.
  WebGL2 and Canvas faithfully render that overloaded class as the strongest
  steady progression edge.
- Production-topology fixtures reproduce the contradiction:

  | Fixture | Owned | Candidate set | Owned/owned | Owned/unowned | Reachable/reachable | Reachable/locked | Locked/locked | Current frontier | False frontier |
  | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
  | Fresh | 0 | 1 | 0 | 0 | 0 | 6 | 7,674 | 6 | 6 |
  | Root only | 1 | 7 | 0 | 6 | 6 | 18 | 7,650 | 30 | 24 |
  | Root plus ring | 7 | 19 | 12 | 18 | 12 | 30 | 7,608 | 60 | 42 |

- Chrome 152 local Worker/WebGL2, fallback/WebGL2, and fallback/Canvas baseline
  scenarios all passed the existing exact-cell, responsive, forced-color,
  reduced-motion, context, and detail-shell gesture checks. The exact deployed
  orientation revision also passed Worker/WebGL2. With detail open on cell 578,
  the proxy drag travelled `0.420832` radians, wheel/pinch changed distance
  `5.5 -> 5.94 -> 1.7`, selection, levels, and overlay remained unchanged, and
  only the subsequent native action purchased the cell. The interaction report
  is therefore not reproduced in the maintained path; discoverability or an
  unmeasured surface remains deferred.
- Baseline WebGL one-edge contrast was quiet `0.013098`, overloaded frontier
  `0.327536`, selected `0.565165`; Canvas was `0.039751`, `0.434724`, and
  `0.626630`. Repeat pixel noise was zero and the predecessor margin was
  `0.006`, but this oracle did not measure whole-territory truth.
- Same-host baseline p95 entry/snapshot/update/steady timings were
  Worker/WebGL2 `18.0/0.7/2.0/1.6 ms`, fallback/WebGL2
  `21.7/0.6/1.8/1.6 ms`, and fallback/Canvas `5.3/0.4/1.8/1.8 ms`.
- Browser bootstrap was first skipped because `BROWSER_PATH` is not the harness
  variable, then failed before app load because cached Chrome libraries were not
  on `LD_LIBRARY_PATH`. `BROWSER_CHROME_BIN` plus the cached library directory
  produced the passing runs. The predecessor-named ignored Worker baseline
  receipt already existed and the old harness rewrote it; this naming collision
  is not treated as preserved historical evidence and will be removed by the
  campaign-specific report identity.

## Selected decision

After selected and recent incident overrides, one shared packed edge byte will
classify exactly: owned/unowned ownership perimeter, unowned reachable/locked
perimeter, or quiet dynamic edge. Ownership is the strongest steady continuous
cue; reachability is structurally distinct and subordinate. Immutable region
relation remains packed above the dynamic state. Both existing renderer paths
cut over atomically; no topology, progression, persistence, economy, reward,
simulation, pass-count, or byte-width change is permitted.

## Completed coherent phases

- Milestone 0: reconciled Git/upstream/worktree/current CI, installed and read
  the supplied durable contract, activated this sole package, reproduced exact
  graph counts and browser hierarchy, and passed the blocking local/deployed
  detail-shell gesture preflight.
- Milestone 1: replaced the low-bit edge states with `QUIET`,
  `REACHABLE_PERIMETER`, `OWNERSHIP_PERIMETER`, `RECENT`, and `SELECTED`;
  implemented the exact endpoint truth table; cut WebGL2 and Canvas 2D over
  atomically; and deleted old aliases, shader branches, Canvas mappings, and
  presence-only tests. Exhaustive endpoint and production-topology tests prove
  zero false or missed ownership edges and unchanged packed region relation.
- Milestone 2: replaced the one-edge salience oracle with a campaign-specific
  territory oracle. It samples two edges from each dynamic/region category at
  far/close and center/limb framing, suppresses one category at a time, repeats
  patches to measure noise, checks selected/recent differences, and pairs the
  edge result with same-cell inset/glyph and native-text evidence. Worker/WebGL2,
  fallback/WebGL2, and fallback/Canvas 2D pass with empty browser errors.
- Milestone 3: the same three production-browser paths pass exact native state
  text, bounded keyboard navigation, forced colors, reduced motion, context
  fallback, the eight maintained 200%-text viewports, 44 CSS px controls,
  bounded scroll/DOM, four WebGL draws, stable layout/geometry identities, and
  zero unchanged-frame edge updates.
- Milestone 4 closure: current documentation and D36 supersede the live
  overloaded-edge claims, the title-showcase source identity is current with
  byte-identical lifecycle data, the clean exact revision passes the full
  repository gate, and the published implementation has exact CI, Pages,
  deployed-byte, and deployed-browser evidence.

## Implementation and measured evidence

- Precedence is selected, recent, owned XOR, then both-unowned reachable XOR,
  then quiet. Affordability does not affect edge bytes. Clearing selected or
  recent restores byte-identical steady arrays.
- WebGL ownership is continuous at alpha `0.80`; reachable is thinner in signal
  at alpha `0.43` and segmented by a static `0..1` along-edge coordinate. Canvas
  ownership is a continuous `2.05` px stroke; reachable is a `1.05` px
  `[2, 2.8]` dash. Region strokes were restrained but remain visible.
- A first WebGL attempt derived segmentation from world coordinates. It was
  rejected because pattern identity varied with edge orientation. The selected
  bounded static coordinate keeps one semantic byte, one existing boundary
  draw, and four total draws. It increases static WebGL geometry by `122,880`
  bytes (`1,838,196 -> 1,961,076`, `+6.68%`) while dynamic bytes remain
  `325,152`; compact/expanded edge storage remains `7,680/30,720` bytes.
- A wider patch-average oracle understated thin edges, and a raw limb dash test
  could not distinguish authored segmentation from projected raster gaps. Those
  attempts were rejected. The final oracle uses 3x3 line patches and requires
  exact edge-pattern separation at center; at the limb it also accepts the
  measured same-cell owned/reachable shape cue backed by native state text.
- Repeat noise was `0`; the calibrated comparison margin is `0.006`. WebGL
  far-center ownership/reachable/region minima-or-maxima are
  `0.342137/0.137963/0.158892`; close-center
  `0.356036/0.143678/0.160577`; far-limb
  `0.064239/0.020997/0.021360`; close-limb
  `0.031536/0.007843/0.010620`. Canvas equivalents are
  `0.497370/0.268592/0.292142`, `0.498384/0.289551/0.272231`,
  `0.527520/0.263291/0.292536`, and
  `0.512367/0.273321/0.292536`. Interior dynamic signal is zero in every case;
  selected is strongest locally and every recent difference exceeds the margin.
- Final local p95 entry/snapshot/update/steady results are Worker/WebGL2
  `15.5/0.5/1.5/1.6 ms`, fallback/WebGL2 `14.3/0.6/1.3/1.1 ms`, and
  fallback/Canvas `5.3/0.7/2.1/1.7 ms`. A first exact fallback/WebGL2 run
  measured a `3.7 ms` steady p95; it did not reproduce in the immediate serial
  repeat or the pre-commit run (`1.6` and `1.1 ms`) and is retained as a host
  outlier rather than a pass-sized-away result. Every run kept cached identities
  stable and produced zero steady edge updates.
- Detail-shell evidence remains selection `578`, direction travel `0.420832`
  radians, distance `5.5 -> 5.94 -> 1.7`, retained overlay and levels through
  drag/wheel/pinch/tap, and one subsequent native purchase. Context loss retains
  substrate digest `57eda917` and layout digest `09da2261` before Canvas takes
  over.
- Current ignored receipts are
  `reports/evolution-ownership-boundary-v1-final-worker-webgl2.json`,
  `reports/evolution-ownership-boundary-v1-final-fallback-webgl2.json`, and
  `reports/evolution-ownership-boundary-v1-final-fallback-canvas2d.json`.
  They name source and harness revision
  `7bee78c86b7db909f5865b60ecc3967b5f96cab1`; their dirty flag is explained
  only by the six preserved untracked transfer files. SHA-256 is respectively
  `0bfe57479b19c8ae4b1dcaad4a332f78eae9a55fabb8dc835a5c9a92d133a060`,
  `5c5ca9277df69c454bf8a739379c6fa60f9194c96398d2cb65059131a8c0a549`,
  and `5074919edec311a47d659e4ba380600f92aa93bd648c1f90c06ecd074ddbecc0`.
- The first clean `npm run verify` at `909cc2d` passed 25 of 26 gates: 233 unit
  and 76 integration tests plus every audit, structure, link, balance, terminal,
  and benchmark gate passed. `showcase:check` alone failed because its broad
  source identity includes `src/game/skills/scene.js`; generated lifecycle bytes
  and data hash `608dec09…` were unchanged. This is a failed full run, not a pass.
  The checked-in generated source identity was refreshed for the next revision.
- Clean revision `7bee78c86b7db909f5865b60ecc3967b5f96cab1` passes all 26
  `npm run verify` gates: 233 unit tests, 76 integration tests, structure, links,
  showcase identity, every authority/audit cohort, balance smoke, terminal soak,
  and benchmark. Benchmark measured `10,877 ticks/s` against the `3,000`
  minimum with unchanged hash `15863d52`.
- Focused iteration also passed 29 edge/renderer unit tests, six skill-globe
  integration tests, `check:links` (`144` modules, `11` HTML references), README
  mirror equality, and `git diff --check`. Active-workspace `check:structure`
  remains failed only by the six preserved untracked transfer artifacts; the
  clean exact-revision structure gate passes.

## Evidence unavailable in this environment

- Physical-device, real screen-reader, high-refresh, thermal, and hardware
  safe-area evidence are unavailable in this environment.

## Publication and terminal closure

- Coherent commits are `909cc2d` (`fix: render exact Evolution ownership
  perimeter`), `7bee78c` (`docs: record Evolution boundary verification`), and
  `c0b5065` (`docs: record Evolution boundary local closure`). The published
  implementation/evidence revision is
  `c0b5065c10ba889e5e469b19a371965c80b275ed`; remote `main` resolved to that
  exact SHA with local/remote ahead-behind `0/0`.
- Actions run `33401206077` succeeds for that SHA. Verify job `99517652057`
  passes every step in `10m00s`; dependent Pages job `99520888521` succeeds in
  `25s`. The only annotations are non-failing GitHub Node-action deprecation
  notices.
- Pages deployment `6182954491` and status `17572585810` report `success` at
  `https://lkjsxc.github.io/cell-sphere-game/` for exact SHA `c0b5065`.
- Cache-busted deployed bytes exactly match all six changed browser-runtime
  owners. SHA-256/bytes are: `scene.js` `f5c6ff4f…`/`5,418`,
  `cell-geometry.js` `5779f026…`/`4,751`, `fallback2d.js`
  `2ae09953…`/`23,088`, `shaders-boundary.js` `71bdfefc…`/`4,943`,
  `world-pass.js` `2a338f45…`/`11,883`, and generated `data.js`
  `afb0753c…`/`308,454`.
- Cache-busted deployed Chrome 152 passes Worker/WebGL2, fallback/WebGL2, and
  fallback/Canvas 2D. Ignored receipts are
  `reports/evolution-ownership-boundary-v1-deployed-worker-webgl2.json`
  (`795000b0…`),
  `reports/evolution-ownership-boundary-v1-deployed-fallback-webgl2.json`
  (`b859964c…`), and
  `reports/evolution-ownership-boundary-v1-deployed-fallback-canvas2d.json`
  (`26d86b46…`). Each names source and harness `c0b5065`, has empty browser
  errors, and repeats the exact semantic, transient, gesture, accessibility,
  responsive, forced-color, reduced-motion, packing, and context-loss passes.
- Deployed WebGL ownership/reachable/region values remain
  `0.342137/0.137963/0.158892`, `0.356036/0.143678/0.160577`,
  `0.064239/0.020997/0.021360`, and
  `0.031536/0.007843/0.010620` across far/close center/limb. Canvas remains
  `0.497370/0.268592/0.292142`, `0.498384/0.289551/0.272231`,
  `0.527520/0.263291/0.292536`, and
  `0.512367/0.273321/0.292536`. Repeat noise is zero, margin is `0.006`, owned
  and reachable interiors have zero dynamic signal, selected is strongest, and
  recent is distinct.
- The exposed canvas drag/wheel/pinch/touch-cancel path was exercised with the
  open detail and retained selection/levels/overlay. The shared-shell path also
  measured camera motion and zoom. Neither path purchased; only the subsequent
  native Unlock action changed one exact cell.
- No Evolution topology, root, substrate, layout, level, adjacency, rank, cost,
  effect, transaction, persistence, Imprint, History, reward, SCORE, Echoes,
  World simulation, RNG, or active-World identity changed. The only added
  renderer storage is the bounded static WebGL along-edge coordinate; compact
  dynamic storage, Canvas allocation, and draw count remain fixed.
- The stopping rule is met: the exact ownership graph cut is the sole steady
  ownership boundary, false unowned honeycomb edges are gone, reachability is
  separately actionable, both renderers and all maintained execution paths pass,
  and no severe selected-scope regression remains. Historical terminal packages
  retain their revision-scoped predecessor terminology and were not rewritten.
- Final terminal documentation changes no runtime behavior. Its exact remote,
  CI, Pages, deployed-byte, and deployed-browser postconditions are carried by
  the implementation handoff because a commit cannot contain evidence of its
  own future publication.

## Exact next coherent step

None.
