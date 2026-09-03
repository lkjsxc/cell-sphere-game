# Evolution Globe-First Navigation v1

Status: active.

## Starting point

- Branch `main` at `6070eddf91c6d92a116a95642a064dedff2d78a1`, tracking
  `origin/main` with ahead/behind `0/0`; `git ls-remote` confirmed the same
  remote tip.
- GitHub Actions run `33718742369` succeeded for that exact starting revision:
  verify job `100533327760` and Pages job `100536111835` both completed
  successfully. This is predecessor evidence only.
- `docs/work/README.md` named no active package, and no concurrent package owns
  this interaction boundary.
- The starting worktree contains two campaign-owned user inputs: modified
  `AGENTS.md` (62,560 bytes, SHA-256 `7bc78c2a...`) and untracked transfer
  artifact `docs/work/202609031509.md` (47,321 bytes, SHA-256 `7a7c9496...`).
  Both remain byte-preserved. No unrelated dirty path exists.

## Confirmed root cause and baseline

- `index.html`, `panel-surfaces.js`, and `atlas.css` jointly own a persistent
  catalog-shaped navigator in every Evolution cell detail. It contains three
  traversal buttons and five or six generated direct-neighbor buttons.
- `progression-spheres.js` already owns exact-cell selection and purchase
  independently. The navigator's only special consequence is camera focus for
  its caller token; removing it does not require progression, renderer,
  simulation, balance, or persistence changes.
- The focusable canvas already owns Enter/Space centered-cell activation. The
  shared surface coordinator focuses `#memory-node-heading` on detail entry,
  restores its opener on close, and owns Escape. `#live-region` is the existing
  single polite announcement channel.
- Chrome `152.0.7977.64` predecessor fixtures reproduce identical semantics in
  Worker/WebGL2, fallback/WebGL2, and fallback/Canvas 2D. Exact cell 578 is
  selected without changing levels; detail focus enters the heading; each
  detail has nine navigator buttons, including six neighbors, in addition to
  Close and Unlock. Exact purchase changes only cell 578 and its truthful
  frontier; WebGL retains four draws and context loss remains playable.
- At 200% text, the navigator contributes to `4,520` px detail-body scroll at
  `320x568` and `4,120` px panel scroll at `844x390`. All predecessor paths
  otherwise retain one scroll owner, reachable actions, and no horizontal
  overflow.
- Ignored baseline receipts are under
  `reports/evolution-globe-first-navigation-v1/baseline/`: Worker/WebGL2
  `7880063d...` (119,209 bytes), fallback/WebGL2 `c1dd4c61...` (119,466
  bytes), and fallback/Canvas `afa39b51...` (119,559 bytes).

## Selected decisions

- Delete the persistent traversal/direct-neighbor catalog rather than hiding or
  relocating it.
- Add one pure presentation-only navigation-target policy shared by the
  Evolution canvas and designated non-control detail target. It maps
  ArrowLeft/ArrowRight/Home/PageUp/PageDown to exact cells without purchasing.
- Use stable numeric order, the authored root, and the current bounded ready set;
  prefer unowned ready cells while any exist. Ignore repeat, modified chords,
  native controls, editable targets, non-Evolution scenes, and unrelated focus.
- Keep keyboard focus on its current surface, focus the selected cell with the
  existing camera owner, refresh detail atomically, and reuse the one polite
  live region. No durable state, per-frame work, schema, timer, dependency,
  renderer pass, or progression projection is added.
- Preserve the terminal `evolution-cell-progression-v1` package as historical
  evidence. Current docs and a new decision will supersede only its visible
  navigator conclusion.
- No mandate deviation or material contradiction is selected.
- The pure target mapper lives in `policies/evolution-navigation.js`; the app
  controller is the sole shared key consumer because it already coordinates
  scene, selected-cell, camera, detail, and announcements. Existing globe input
  retains Enter/Space centered activation, and the existing surface coordinator
  retains heading entry, Escape, and focus restoration.
- Real CDP `Input.dispatchKeyEvent` events extend the maintained fixture without
  calling the target mapper from test code. `aria-keyshortcuts` plus one shared
  concise description expose the nonvisual contract; the existing polite live
  region announces only resulting cells or the no-ready state.

## Completed coherent phases

- Milestone 0: reconciled branch, exact revision, upstream/remote, dirty inputs,
  recent commits, work authority, root contract, current docs, source/tests,
  starting CI/Pages, and deployed predecessor orientation. Captured the three
  bounded production-browser baselines above.
- Milestone 1: commit `205f476` adds the one bounded pure target policy and
  atomically cuts canvas/detail keys over to it; deletes the old navigator DOM,
  generated neighbors, listeners, ready traversal, source token, and dedicated
  CSS; and replaces old browser assertions with trusted key, focus, DOM-absence,
  geometry, and exact-purchase oracles. Progression, persistence, simulation,
  balance, and renderer owners are unchanged.
- Structure follow-up commit `242c22f` moves the trusted keyboard matrix into
  one cohesive browser-support module and keeps all touched production/test
  owners within the repository's 400-line hard cap. This is a mechanical test
  boundary; the accepted Canvas rerun is unchanged semantically.
- The final detail has two buttons and 25 descendant nodes at all maintained
  viewports. At 200% text, `320x568` body scroll falls from `4,520` to `2,235`
  px and `844x390` panel scroll falls from `4,120` to `2,383` px, with one
  scroll owner, reachable Close and Unlock, no horizontal overflow, and no
  scene-control overlap.

## Focused verification

- NOT EVIDENCE — the first unconfigured browser attempt exited `77` because no
  Chrome binary was on `PATH`.
- PASS — supplying the maintained cached Chrome binary, libraries, and
  Fontconfig sysroot produced all three predecessor receipts above with empty
  browser-error lists.
- PASS — `node --test tests/unit/presentation/evolution-navigation.test.js
  tests/unit/evolution-progression.test.js tests/integration/skill-globe.test.js`
  passes `18/18`, including numeric/root wrap, ready ordering and preference,
  invalid/empty inputs, finite scanning, and command filtering.
- PASS — final-content focused reports pass Worker/WebGL2 (`3e7ba178...`,
  494,067 bytes), fallback/WebGL2 (`bc12afd9...`, 494,103 bytes), and
  fallback/Canvas (`ed3584f3...`, 494,256 bytes). Each proves zero retired
  controls, exactly two detail buttons, real key boundaries, all ready-set
  fixtures, selection/detail/camera agreement, exact purchases, forced colors,
  reduced motion, eight 200%-text viewports, empty browser errors, and unchanged
  cached layout/geometry. Both WebGL paths retain four draws; context loss is
  playable.
- FAILED / corrected — early fixture iterations respectively required
  `:focus-visible` on a programmatically focused native Close button, measured
  Close only after scrolling Unlock, and sent forced-color Tab from body rather
  than the designated heading. Those invalid oracles were corrected before the
  accepted reports.
- SUPERSEDED — one otherwise passing run used unsorted synthetic persisted
  root-ring levels, so current-only validation reset that fixture. Canonically
  sorted exact levels plus explicit 7-cell and 2,562-cell ownership assertions
  replace it.
- FAILED / corrected — the first forced-Canvas final run allowed the surface
  coordinator's deferred close-focus restoration to race the fixture's canvas
  focus. Waiting for that owner and then focusing the intended surface produces
  the accepted Canvas report; no production path changed for this fixture race.
- PASS — `npm run test:browser:canvas` completes the revised broad shell with
  SCORE `178,012`, exact Evolution selection/purchase, History, Trophies,
  worldmaking/Luminous evidence, continuous Canvas shell, and camera receipt
  `e5c60a27...`.
- FAILED (known unrelated baseline) — `npm run test:browser:file` and
  `npm run test:browser:fallback` each pass the changed Evolution segment, then
  reproduce the previously documented `1024x600` Result-footer bottom at
  `600.1875` CSS px. That `0.1875` px Result-only overrun predates this campaign
  and is recorded in the planetary-sky and orbital-starfield terminal packages;
  neither failed run is campaign evidence, and this bounded Evolution campaign
  does not weaken or redesign that separate gate.
- PASS — `npm run audit:skills` retains progression versions `3/2/3/10/2`,
  topology `2562/7680`, root `2265`, layout/edge digests
  `09da2261/c03988ac`, connected archetype/domain regions, exact sparse levels,
  monotone costs, one compiler, and finite huge-rank effects.
- PASS — `npm run check:links` reports `151` modules and `11` HTML references.
- EXPECTED WORKSPACE FAILURE — `npm run check:structure` now has no changed-file
  hard-cap violation, but rejects the preserved user transfer artifact
  `docs/work/202609031509.md` at 802 lines. A clean tracked checkout must pass;
  the campaign input will not be edited, deleted, or committed as product docs.

## Evidence not obtained

- Physical-device mouse, touch, pen, screen-reader, safe-area, high-refresh, and
  thermal evidence is unavailable in this environment.
- Clean-checkout structure and complete verifier, final exact-revision focused
  receipts, CI/Pages, cache-busted bytes, and deployed-browser evidence remain
  pending.

## Exact next coherent step

Commit the reconciled current documentation and supplied root contract, run
clean-checkout closure gates and a fresh complete verifier, record those local
results, then create and verify the final evidence revision before the
authorized fast-forward publication.
