# Status

Atomic world-session replacement and untouched-only Auto Next are implemented
and locally verified on `main`; the larger unified-shell release continues.

- **Slice base:** `68113369217e4e510ecd1768f8428675a2ca4000`.
- **Branch/upstream:** `main` tracking `origin/main`; this slice is ready for its
  coherent implementation commit and push.
- **Repository/Pages:** still `lkjsxc/incremental-network-game` and
  `https://lkjsxc.github.io/incremental-network-game/`; the canonical rename and
  exact public deployment inspection remain release-level work.
- **Playable local entry:** `file://…/index.html?demo=1` through the disposable
  Chrome/CDP harness, or `npm run serve` at `http://127.0.0.1:8080`.

## Product behavior

- All title Grow, manual/automatic Next, confirmed New World, Evolution/Trophy
  restart, and recoverable pre-authority failure paths enter one first-wins
  `requestWorldReplacement(reason, expectedIdentity)` transaction.
- Replacement progresses through requested/awaiting-authority, replacing,
  preparing, and starting. A racing request is rejected synchronously; it cannot
  consume another seed, create another authority, or apply another result.
- Each result starts one nine-second Auto Next only when enabled and untouched.
  The first trusted pointer/touch/wheel/keyboard/control/focus/surface/metric/
  cell/globe/scene interaction permanently cancels it and leaves the quiet
  `Auto next cancelled for this result` status. Hidden time pauses; mouse
  movement, visibility lifecycle, and untrusted/programmatic events do not
  cancel. Settings toggles do not rearm; a new result gets a fresh generation.
- New World still records reward-free abandonment. If extinction wins the
  authority race, the completion transaction remains exactly once.

## Identity and teardown contract

The immutable tuple is:

```text
{ worldSessionId, runId, seed, presentationGeneration, resultTransactionKey }
```

The driver reserves it, then the app publishes it before Worker creation or
synchronous fallback startup. Worker, driver, app message routing, commands,
Inspector, History, and delayed callbacks require the matching session/run/
generation tuple. Driver retirement terminates authority, invalidates queued
commands, and clears config/snapshot/identity.

Before authority startup, replacement retires the old identity and clears
continuation, pause/world timers, delayed focus, History/Inspector requests,
active surfaces and models, manual Adaptation pending state, captions/effects,
selection, History projection/highlights/Event Log, Reach/HUD/result models,
snapshots, fields, and renderer dynamic state. It then generates new fields,
installs one typed `starting` snapshot with zero life/stress/life-state/events/
HUD/Reach, binds the renderer, clears the full framebuffer, renders the static
zero-life world synchronously, and only then starts authority. `started` is
accepted only for the published tuple.

WebGL2 zeros and uploads life/event/Adaptation buffers; Canvas 2D performs a
full clear. Both reject mismatched snapshots. WebGL context-loss teardown keeps
and removes the exact listener; renderer and pass disposal are idempotent. Four
draws and whole-cell lake rendering remain unchanged. The app RAF callback now
schedules its successor in `finally`, with observable frame/schedule/error
counters.

## Measured evidence

- **100-cycle production coordinator soak:** PASS in 7.4 ms in the focused run;
  100 accepted replacements, 100 same-cycle races rejected, 100 unique seeds,
  run IDs, presentation generations, transaction keys, authorities, and typed
  blank frames.
- **100-world authority/result soak:** PASS in 15.6 s in the focused integration
  run; exactly 100 result rewards, duplicate result rejection, hidden-time
  pause/resume, 24 retained worlds, at most eight Imprints, serialized History
  below 700 KB, and heap growth below the 160 MiB gate.
- **Real Chrome/WebGL2:** final PASS; 32× completion in 8.90 s, score 616,731,
  four draws, title submission mean 1.17 ms / p95 1.50 ms. The intercepted first
  automatic replacement frame was typed `starting` with zero life, biomass,
  events, highlights, and Adaptation; CPU mirrors of all three uploaded WebGL
  dynamic buffers were zero. RAF errors were zero and registries were bounded.
- **Real Chrome/Canvas 2D:** PASS; score 614,507. Trophy restart intercepted the
  first new static frame with the same zero-state contract after full-canvas
  clear; History, Evolution, and Trophy spheres remained functional.
- **Benchmark (Node v22.22.3, Linux x64, 20 CPUs):** 2,715 ticks in 193 ms,
  14,090 ticks/s, hash `813c4f49`, peak coverage 0.1093, 8 MB reported heap.
- **Showcase:** payload remains byte-identical: 89 frames, 228,754 bytes, data
  hash `22ac0d97…`; only source metadata changed to `e15a13fd…`.

## Exact verification

- Baseline `npm run verify` before editing — PASS.
- Final `npm run verify` — PASS all nine gates; 125 unit and 68 integration
  tests, structure, cell-visual audit, showcase, 500-seed lakes, balance smoke,
  benchmark, and links.
- `npm run test:browser:file` — final PASS, real Chrome/WebGL2. One immediately
  preceding rerun missed the short reduced-motion emphasis window; the diagnostic
  rerun passed without product/assertion changes.
- `npm run test:browser:canvas` — PASS, forced real-Chrome Canvas 2D fallback.
- `npm run benchmark` — PASS with the result above.
- `npm run showcase:check` — PASS, data hash `22ac0d97…`.
- Focused `npm run test:unit` and `npm run test:integration` — PASS during
  implementation.

`check:structure` passes with no hard-cap failure. It reports maintainability
warnings for the cohesive browser scenario (233 lines), app composition root
(224), existing hydrology (222), renderer/settings test files (229/238), and 17
unit-test children. These files remain below the 400-line/24-child hard limits;
this slice keeps the end-to-end browser flow and concentrated policy matrices
intact rather than hiding them behind arbitrary indirection.

## Known limitations / next actions

- The 100-cycle replacement soak uses the production coordinator with a
  deterministic headless presentation harness; it is not 100 full real-Chrome
  worlds. Real Chrome covers one untouched automatic replacement plus shorter
  manual/Trophy replacement paths in each renderer. The separate 100-world soak
  uses real production simulation and result transactions.
- First-frame browser evidence intercepts the production renderer scene and its
  uploaded CPU buffer mirrors; it does not use GPU readback or claim GPU timing.
- No Docker, physical-device, screen-reader, thermal, public URL, CI, Pages, or
  deployment evidence was collected. No unrelated shell, Evolution, Trophy,
  repository rename, or persistence-namespace redesign was attempted.
- Highest-impact next work remains the unrelated unified shell/metric/Event Log
  slice, followed by Evolution/Trophy policy redesign and the canonical
  repository/package/Pages rename.
