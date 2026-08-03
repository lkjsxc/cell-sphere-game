# cell-sphere-game release ledger

Evidence words are scoped: **implemented**, **tested**, **measured**, **observed**, **deployed**, **modeled**, and **target** are not interchangeable.

## Verified start

- **observed** start `440a565b5ae952c4bc389bf91081db462ea2c6dd`, branch `main`, upstream `origin/main`, clean except for the supplied replacement `AGENTS.md`.
- **observed** GitHub repository `lkjsxc/incremental-network-game`, viewer permission `ADMIN`, workflow Pages at `https://lkjsxc.github.io/incremental-network-game/`, and successful workflow `30808633485` for the start commit.
- **implemented / pushed** replacement contract commit `1ab584486a793d9104a6a64c8d262f55a5480bf9`.
- **deployed** protective tag `pre-cell-lakes-unified-shell-20260803` at the verified start.
- **tested** `npm run check:structure` and `npm run verify`: 103 unit and 61 integration tests, balance smoke, benchmark, showcase, links, and structure passed; benchmark `15,547 ticks/s`, hash `637b2473`.
- **observed failure** `npm run test:browser:file`: History scrub raced terminal state at tick 2,592 and did not produce an approximate checkpoint.
- **observed** 18 real-Chrome baseline captures and a state dump under ignored `reports/cell-lakes-shell-baseline-440a565/`.

## Baseline contradictions

- **observed** obsolete sub-cell teal channels crossed cell interiors in the close-up baseline capture.
- **observed** mobile current-event copy exists but has `display:none` in `03-run-mobile-event-hud.png`.
- **observed** SCORE and ENTROPY are `DIV`; only REACH is a `BUTTON`.
- **observed** the active dock exposes Adaptations, History, New World, and Settings.
- **measured** Reach used the mobile sheet rectangle `0,489.53,390,354.47` at ticks 480 and 896; its globe drag changed the surface from open to hidden.
- **observed** terminal composition is a replacement `result-screen` with a bottom result strip and no context surface.
- **observed** automatic continuation advanced run ID `1 → 2`, but `13-auto-next-first-observed-frame.png` retained the previous terminal globe, SCORE `613,052`, ENTROPY `100%`, and last-cell state while the app already reported new run state `starting`.
- **observed** Evolution copy includes `Locked, observe … more worlds`; Trophy evidence includes automatic one-cell geography awards.
- **observed** Home/World/Evolution/Trophies expose different navigation clusters and ordering.

## Requirement-to-evidence map

| Gate | Production requirement | Current state | Required release evidence |
|---|---|---|---|
| A | replacement contract, exact baseline, protective tag | complete | pushed commit/tag plus this ledger |
| B | cell-only visible world and connected whole-cell lakes | target | source visual-grammar gate, lake audit, WebGL2/Canvas captures |
| C | atomic first-wins world replacement and blank new frame | implemented and locally tested from `6811336`; not deployed | state-machine tests, stale rejection, 100-cycle soak, first-frame captures |
| D | untouched-only Auto Next; trusted input cancels permanently | implemented and locally tested from `6811336`; not deployed | timer/unit interaction matrix and trusted CDP scenarios |
| E1 | clickable stable SCORE/ENTROPY/REACH details | implemented and locally observed; not deployed | semantics plus stable-rectangle measurements |
| E2 | shared Result/History/Event Log/Menu context shell | implemented and locally observed; not deployed | desktop/mobile Chrome scenarios and gesture persistence |
| E3 | compact dock/Adaptations, visible mobile event, fixed scene selector | implemented and locally observed; not deployed | responsive matrix, 200% text, long labels |
| F1 | Evolution cost plus one owned adjacent cell only | implemented/tested locally from `ce554ef`; not deployed | schema/audit/migration and run-zero purchase proof complete |
| F2 | harder lake-centric Trophies and queued feedback | implemented/tested in isolated worktree from `25edde7`; not deployed | production/model horizon audit, Legacy migration, fake-clock queue tests; final browser evidence pending |
| G | `cell-sphere-game` package/storage/repository/Pages identity | implemented/tested in isolated worktree; external rename/deploy not executed | parent repository rename/push, successful Actions, and exact canonical Pages bytes |
| H | deterministic Worker/fallback, 32×, bounded performance | baseline fast gates pass | final parity, balance, benchmark, Canvas, lake/event/Trophy audits and soaks |
| I | coherent push and exact public deployment | target | clean tree, successful workflow, cache-busted public inspection |

## Unified shell / stable surface evidence

- **implemented locally** orthogonal `idle | starting | running | result`
  authority and `home | world | evolution | trophies` scene state. One renderer
  draws only the selected scene; active authority advances off-scene and World
  restores its saved camera. One fixed semantic tablist owns scene navigation.
- **implemented locally** one physical context shell owns desktop-left/mobile-
  bottom geometry, focus, scrim, and replacement for Result, History, Event Log,
  Menu, all three metrics, Adaptations, Inspector, and progression details.
  Canvas pointerdown never dismisses it; cumulative tap/drag classification owns
  blank dismissal and cell replacement.
- **implemented locally** the active dock contains only time/pause, speed,
  Adaptations, and Menu. The current-event button remains 44px or taller across
  portrait/landscape viewports and opens an 80-row-bounded semantic Event Log.
  Menu owns preferences, scene/data routes, and the existing reward-free
  confirmed New World transaction.
- **implemented locally** terminal World retains the final snapshot, renderer,
  camera, HUD metrics, event, Menu, selector, and globe input while Result opens
  in the shared shell. Result can close/reopen, cell inspection can replace it,
  and drag does not dismiss it. Completed time, speed, and Adaptations expose
  disabled terminal semantics.
- **tested locally** unit projections cover actual Score axes/weights/ranks,
  snapshot-derived Entropy rate/context, authoritative Reach ledger values, and
  current/archive Event Log bounds. The trusted-CDP scenario samples metric
  geometry through updates, scene keyboard semantics, drag/scroll persistence,
  Menu confirmation, compact Adaptations, Result, History, Event Log, 200% text,
  reduced motion, high contrast, long labels, and atomic replacement.
- **measured locally** in real headless Chrome/WebGL2 at 1440×900, SCORE,
  ENTROPY, and REACH each retained the exact shell rectangle
  `left=16, top=144, right=476.796875, bottom=884, width=460.796875,
  height=740` through multiple authority updates. The 320×568, 390×844,
  430×932, 768×1024, 844×390, and 1440×900 matrix retained 44px selector
  controls, a 67.09375px current-event control, bounded dock/event rectangles,
  no overlap, and no horizontal overflow.
- **not deployed**: no push, CI, Pages, public URL, Docker, physical-mobile, or
  assistive-technology claim belongs to this isolated shell slice.

## Canonical identity / namespace evidence

- **implemented locally** one platform-neutral identity module owns the exact
  product/tagline/version, target repository/Pages URLs, canonical storage and
  IndexedDB names, export identity/filename, and `__CELL_SPHERE_*` diagnostics.
- **implemented locally** schema-8 progression now persists bounded result
  transaction keys as well as scores, Echoes, run/seed cursors, all 642 Skill
  ownership, Imprints, current/Legacy Trophies, queue, and cumulative proof.
  Settings and semantic History migrate in the same staged, verified namespace
  transaction; canonical values win coexistence and legacy sources remain intact.
- **implemented locally** malformed-canonical fallback is allowed only when a
  source/target receipt proves the legacy normalization equals the last verified
  canonical checkpoint. Partial writes are repeatable; import is all-or-rollback;
  storage-unavailable play remains explicit and session-safe.
- **implemented locally** visual History adoption is asynchronous and startup-
  nonblocking. At most ten valid decoded records merge by ID into the canonical
  IndexedDB, canonical duplicates win, and the receipt is written only after
  target verification. `INHV` v1 remains intentionally supported to avoid loss.
- **tested locally** the identity audit rejects transitional active copy/config
  and ambiguous browser globals. Unit/integration and real-browser migration
  results belong in `docs/status.md` after final execution.
- **not executed externally**: repository rename, remote change, push, Actions,
  Pages deployment, and public canonical URL verification remain parent actions.

## Trophy mastery / presentation timing evidence

- **implemented locally** exactly 96 current cells remain in six 16-cell
  families. One onboarding completion is automatic; 24 fresh production
  Automatic worlds each earned exactly one Trophy. Rich whitelisted conditions
  combine high-percentile world outcomes, sustained morphology/ecology,
  Manual/Automatic practice, adjacent Evolution ownership, cumulative diversity,
  and whole-cell lake mastery.
- **implemented locally** bounded facts v3 records lake cells/shores/distinct and
  complete basins, five type/three salinity masks, lake-wetland-forest-highland
  combinations, sustained large-lake regions/loops, and lake-adjacent
  drought/freeze survival. First-birth markers and the existing one-second
  summary cadence add no per-tick unbounded scan; proof intentionally joins the
  deterministic final hash and consumes no RNG.
- **implemented locally** progression schema 8 maps old
  `reach-river-touch` ownership to a separate Legacy list and introduces current
  `reach-lake-network`. Facts-v1 bit 2 is masked. Every other old current ID is
  grandfathered; validation/import is idempotent and grants nothing on load.
- **modeled/measured by production authority** the deterministic campaign earns
  2 / 6 / 9 / 20 / 63 total current Trophies after 1+purchase / 4 / 12 / 48 /
  240 worlds. The 24-world fresh cohort is `1:24`; audit hash `40aa0e55`, 52.110 s,
  63/96 at twenty-hour-equivalent, zero impossible/duplicate/trivial-majority
  criteria. This is modeled 1×-equivalent progression, not observed player time.
- **implemented/tested locally** award commit adds ownership, one semantic
  History/Event Log entry, and one persisted unique FIFO ID exactly once. A
  global 4.2 s actionable reveal shows name/reason/family/progress, holds for
  hover/focus, uses a static reduced-motion state, updates the Trophy tab badge,
  routes click to exact detail, and survives world replacement without old world
  cell highlights. Result lists exact new names.
- **implemented/tested locally** centralized UI timing is toast 2.7 s,
  Adaptation caption 3.75 s, Trophy 4.2 s. Important copy queues rather than
  replacing; generation tokens retire stale run captions. Simulation events,
  Auto Next, camera, preview reload, and Worker watchdog timing are unchanged.
- **not deployed** and no physical-device/screen-reader claim. Final WebGL2 and
  Canvas browser commands are recorded in status only after execution.

## Evolution physical-frontier evidence

- **implemented locally** graph 4 precomputes stable ID-to-cell addresses and all
  1,920 physical level-3 boundaries. A recognized unowned Skill Cell is
  purchasable exactly with enough Echoes and any one adjacent owned cell.
- **implemented locally** exactly six canonical roots remain bootstrap choices
  under the initial-save rule. Every non-root uses ordinary physical adjacency;
  no run count or authored layout parent participates.
- **implemented locally** progression schema 8 preserves every recognized owned
  ID, including disconnected graph-1/graph-3 migration islands. Unknown IDs
  remain quarantined; migration never refunds, charges, closes, or auto-purchases.
- **tested** 3,840 directed adjacent frontiers and 3,810 canonical root-bootstrap
  states accept at run zero; 403,872 nonadjacent non-root states reject. All 642
  cells acquire legally for exactly 2,462 Echoes with zero remainder. The audit
  checks all 411,522 possible single-owner/target states, economy hash `34b4e4a9`, effect
  hash `8444edfd`, six roots, and zero obsolete authority fields/copy.
- **not deployed**: no push, CI, Pages, public URL, Docker, physical-mobile, or
  assistive-technology claim belongs to this isolated migration slice.

## Atomic world-session / untouched Auto Next evidence

- **implemented** one `requestWorldReplacement(reason, expectedIdentity)` entry
  for title Grow, manual/automatic Next, confirmed abandonment, Evolution/Trophy
  restart, and recoverable pre-authority failure. The guarded transaction is
  first-wins and moves through requested/awaiting-authority, replacing,
  preparing, and starting before returning idle on matching `started`.
- **implemented** immutable
  `{worldSessionId, runId, seed, presentationGeneration, resultTransactionKey}`
  envelopes. Identity is reserved and published before synchronous fallback or
  Worker startup; Worker, driver, app, History, Inspector, commands, and delayed
  callbacks reject retired tuples.
- **implemented** ordered presentation retirement and typed zero-life `starting`
  snapshots. WebGL2 zeroes and uploads life/event/Adaptation buffers; Canvas 2D
  clears its full framebuffer. Both bind the new session and reject old snapshots.
- **tested** 100 production-coordinator replacements in 7.4 ms: 100 accepted and
  100 same-cycle races rejected, with 100 unique seeds, run IDs, presentation
  generations, result keys, authorities, and static blank frames. The separate
  100-world authority/result soak passed in 15.6 s with exactly 100 rewards,
  duplicate rejection, 24-world/8-Imprint bounds, and heap under its 160 MiB gate.
- **observed locally** real Chrome/WebGL2 intercepted the first automatic
  replacement frame as `starting`, zero life/events/highlights/Adaptation, with
  zero CPU mirrors for all uploaded dynamic buffers; Canvas 2D observed the same
  contract after a Trophy restart and a full-canvas reset. The final WebGL2
  pass completed at 32× in 8.90 s with four draws and no browser errors; Canvas completed its run.
- **tested** untouched Auto Next fires once; trusted pointer/touch/wheel/keyboard/
  control/focus interaction classes cancel permanently; hidden time pauses;
  movement, visibility, and untrusted/programmatic events do not cancel; setting
  toggles do not rearm; and each new result increments continuation generation.
- **not deployed**: these are isolated-worktree local results. No push, CI, Pages,
  public URL, Docker, physical-mobile, GPU-time, or thermal claim is made.
