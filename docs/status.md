# Status

The unified shell vertical slice is implemented and locally verified on `main`;
Trophy calibration and the canonical rename remain release work.

- **Slice base:** `2c95c2491d94486ab479fcc98acf2bafcfb83206`.
- **Implementation commit:** `0217656` (`Unify scenes and context surfaces`).
- **Branch/upstream:** `main` tracking `origin/main`; this evidence update is
  ready for its coherent commit and push.
- **Repository/Pages:** unchanged `lkjsxc/incremental-network-game` and
  `https://lkjsxc.github.io/incremental-network-game/`.
- **Playable local entry:** `file://…/index.html?demo=1` through the disposable
  Chrome/CDP harness, or `npm run serve` at `http://127.0.0.1:8080`.

## Product and architecture

- World authority is `idle | starting | running | result`; selected presentation
  is independently `home | world | evolution | trophies`. A fixed semantic
  tablist owns the four scenes. Active authority continues off-scene while only
  the selected scene renders; each scene preserves its camera and World restores
  the exact active or terminal globe.
- One physical context shell owns desktop-left/mobile-bottom geometry, z-order,
  focus, scrim, body scroll, and active content for Result, History, Event Log,
  Menu, SCORE, ENTROPY, REACH, Adaptations, Inspector, Skill, Trophy, and New
  World confirmation.
- Canvas pointerdown never dismisses a surface. Primary-pointer, cumulative
  travel, pinch, and tap classification now complete before blank dismissal or
  cell replacement. Globe drag retains Result, History, Event Log, Menu, metric
  surfaces, and metric scroll; Inspector focus is shell-owned.
- The active dock contains only time/pause, speed, Adaptations, and Menu. Menu
  owns world identity/Auto Continue, History, terminal Result, Event Log,
  reward-free confirmed New World, all preferences, scene/data routes, export,
  import, clear History, reset progression, and diagnostics.

## Stable metrics, terminal, and history

- SCORE, ENTROPY, and REACH are real 44px buttons with shared toggle semantics
  and one invariant metric shell. SCORE exposes live/final ranks, remaining
  rank distance, real six-axis contributions and weights, multipliers, and
  semantic milestones. ENTROPY derives phase, recent rate, active event
  contribution, and global limiting context from snapshots. REACH preserves the
  authoritative gain/loss ledger, conditions, real samples, and turning point.
- Extinction stays in World with the exact final renderer/camera/snapshot, HUD,
  current event, Menu, selector, metrics, and globe input. Result opens in the
  context shell and remains reopenable; completed time/speed/Adaptations expose
  disabled terminal semantics.
- History uses the same shell with world selection, scrubber, significant-event
  navigation, Live/final return, approximate visual note/filter, and Event Log
  route. Event Log is bounded to 80 current/archive semantic rows and can focus
  current-world cells or seek History.
- Mobile Adaptations is bounded to 36dvh with internal card scroll and three
  44px choices; the current-event button remains visible. Skill purchases during
  an active world explicitly apply to the next world only.

## Exact local evidence

- Baseline `npm run verify` before editing — PASS: 127 unit and 71 integration
  tests plus all fast gates.
- Final `npm run verify` — PASS all nine gates: 131 unit and 71 integration
  tests, structure, cell-visual audit, showcase, 500-seed lake audit, balance
  smoke, benchmark, and links.
- Final verify benchmark (Node v22.22.3, Linux x64, 20 CPUs): 2,715 ticks in
  180 ms, 15,066 ticks/s, hash `813c4f49`, 0.1093 peak coverage.
- `npm run test:browser:file` — PASS real Chrome/WebGL2: score 595,964; complete
  32× interval 7.92 s; exactly four draws; title render mean 1.02 ms / p95
  1.60 ms; visual IndexedDB available; adjacent Skill Cell
  `reach-horizon-instinct` purchased; no browser errors.
- SCORE, ENTROPY, and REACH each measured exactly
  `left=16, top=144, right=476.796875, bottom=796, width=460.796875,
  height=652` at 1440×900 through repeated authority updates. The reserved
  lower-left lane keeps the current-event control visible beside the shell.
- Responsive trusted-CDP evidence passed 320×568, 390×844, 430×932, 768×1024,
  844×390, and 1440×900: no horizontal overflow, event/dock or event/shell
  overlap, or out-of-bounds controls; selector controls were 44px and current event
  67.09375px. 200% text, long labels, reduced motion, and authored high contrast
  also passed.
- `npm run test:browser:canvas` — PASS real Chrome Canvas 2D fallback: score
  614,507; terminal shell, History, Evolution, Trophies, and atomic replacement.
- Showcase remains 89 frames / 228,754 bytes, data hash `22ac0d97…`; only source
  metadata changed to `8c9286d7…` for the exposed SCORE projection.

`check:structure` has no hard violations. Existing warnings remain for the app
controller, hydrology, renderer/settings tests, and 18 unit-test children.

## Known limitations / next actions

- No Docker, physical-device, screen-reader, browser-zoom, public-URL, CI,
  GPU-time, thermal, or deployment claim is made for this local slice. Authored
  high contrast passed; forced-colors still requires manual visual review.
- The unchanged 2,462-Echo economy and Evolution adjacency authority remain
  exact, but post-migration mastery time is not recalibrated.
- Trophy difficulty redesign and canonical product/repository/storage/Pages
  rename remain deliberately out of this slice.
