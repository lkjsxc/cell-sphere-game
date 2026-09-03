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

## Completed coherent phases

- Milestone 0: reconciled branch, exact revision, upstream/remote, dirty inputs,
  recent commits, work authority, root contract, current docs, source/tests,
  starting CI/Pages, and deployed predecessor orientation. Captured the three
  bounded production-browser baselines above.

## Focused verification

- NOT EVIDENCE — the first unconfigured browser attempt exited `77` because no
  Chrome binary was on `PATH`.
- PASS — supplying the maintained cached Chrome binary, libraries, and
  Fontconfig sysroot produced all three predecessor receipts above with empty
  browser-error lists.

## Evidence not obtained

- Physical-device mouse, touch, pen, screen-reader, safe-area, high-refresh, and
  thermal evidence is unavailable in this environment.
- Final local, exact-revision CI/Pages, cache-busted bytes, and deployed-browser
  evidence are pending implementation.

## Exact next coherent step

Implement and unit-test the one navigation-target policy, route it through the
canvas and detail heading, then atomically delete the predecessor DOM, source,
styles, and fixture assertions.
