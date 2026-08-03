# Visual integrity and reliability ledger

Baseline: `75a843e5e5b929d45e6375ae465f8b9171c7ff31` on 2026-08-03. The public Pages workflow `30760161404` deployed that SHA and cache-busted sampled files matched local bytes. Protective tag: `pre-visual-integrity-pass-20260803`.

Evidence is generated under ignored `reports/baseline-visual-pass/` and `reports/`. Status advances only through **implemented**, **tested**, **measured**, and **deployed**.

| Complaint | Reproduction / cause | Changed files | Automated / visual evidence | Status |
|---|---|---|---|---|
| Result can stall at visually dead reach | Authority trusted incrementally maintained `aliveCount`; collapse onset was not a hard terminal maximum. | `balance.js`, `state.js`, `death.js`, `simulator.js`, snapshot/result/worker/driver, reliability test and soak | 64-seed integration matrix and 100-world calibration pass; one result, final count zero, tick ≤3,620. Run ID/watchdog tracked separately below. | Tested |
| Tiny living population reads `0%` | HUD rounded `coverage * 100`; one of 2,562 cells rounded to zero. | `surfaces.js`, `index.html`, `components.css` | Formatter tests cover zero, one/two/three cells, decimal and integer ranges. | Tested |
| Detached cyan bars / V fragments | Separate center-to-downstream river quads used a high-opacity cyan boundary shader. | Cell geometry, world pass, boundary shader, renderer, tests and rendering docs | Static negative gate passes; real Chrome/WebGL completes at four draws; mobile/desktop run and wave captures contain no detached cyan geometry. | Tested |
| Title organism is arbitrary and weak | Fixed 54-cell FIFO BFS ignores ecology, then clears and reseeds through an LCG. | — | Baseline title matrix plus six existing title captures. | Reproduced |
| Adaptation is a broad wash | Unweighted whole-component BFS is normalized to its maximum distance in the shader. | — | `browser-adaptation-wave-*` and propagation audit. | Reproduced |
| Run dock is bulky / actions equal | Fixed five-column mobile rail and uniform dark pills. | — | `browser-run-mobile.png`. | Reproduced |
| Frequent Adaptation mode is buried | Only Settings exposes Random/Manual. | — | Browser scenario and markup audit. | Reproduced |
| Surfaces do not close naturally | Coordinator handles Escape/focus only; triggers always reopen and there is no outside pointer contract. | — | Coordinator audit. | Reproduced |
| Skill detail covers metadata | Whole surface scrolls while unlock is sticky; stacked purchase toasts cover content. | — | `browser-memory-selected-mobile.png`, `browser-memory-purchased-mobile.png`. | Reproduced |
| Progression identity and globe are weak | Visible feature is `Memory`, includes a List catalog, and safe layout keeps the atlas small. | — | Mobile/desktop Memory captures. | Reproduced |
| No in-run New World transaction | Only terminal `Next World` exists; no authoritative abort protocol. | — | Markup/protocol audit. | Reproduced |
| Pause/Resume is a large text action | Dock uses a text button driven by aggregate pause state. | — | `browser-run-mobile.png`. | Reproduced |
| Long completion horizon is uncalibrated | Current graph totals 818 Echoes; production-model probe completes it in roughly 37 runs. | — | Existing economy tests and balance audit. | Reproduced |

## Baseline commands

- `npm run verify` — pass; 110 unit, 29 integration; benchmark 2,910 ticks / 161 ms, 18,022 ticks/s, hash `98333073`, 11 MB reported heap.
- `npm run test:browser:file` — baseline pass; real headless Chrome/WebGL2; 32× result 8.19 s; five draws before artifact-path removal.
- `npm run test:browser:canvas` — pass; real headless Chrome forced Canvas 2D.
- Public HTTP inspection — sampled `index.html`, `src/main.js`, renderer, CSS, and status bytes matched HEAD.

Public-URL Chrome screenshot navigation was blocked by `ERR_INTERNET_DISCONNECTED`; exact public bytes were verified over HTTP and the same files were exercised in Chrome through the repository's file/CDP harness. No physical-device claim is made.
