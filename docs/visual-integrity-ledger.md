# Visual integrity and reliability ledger

Baseline: `75a843e5e5b929d45e6375ae465f8b9171c7ff31` on 2026-08-03. The public Pages workflow `30760161404` deployed that SHA and cache-busted sampled files matched local bytes. Protective tag: `pre-visual-integrity-pass-20260803`.

Evidence is generated under ignored `reports/baseline-visual-pass/` and `reports/`. Status advances only through **implemented**, **tested**, **measured**, and **deployed**.

| Complaint | Reproduction / cause | Changed files | Automated / visual evidence | Status |
|---|---|---|---|---|
| Result can stall at visually dead reach | Authority trusted incrementally maintained `aliveCount`; collapse onset was not a hard terminal maximum. | `balance.js`, `state.js`, `death.js`, `simulator.js`, snapshot/result/worker/driver, reliability test and soak | 1,000-world production soak: zero invalid/duplicate outcomes, zero liveness repairs, median tick 2,701, maximum 3,620. | Measured |
| Silent Worker failure can leave a run alive forever | No heartbeat/status watchdog, run identity, or stale-message rejection existed. | Run driver, Worker/fallback protocol, app message policy and reliability tests | Heartbeats plus status probes fail closed; old-run snapshots/results are rejected; terminal, abort, and extinction are first-wins. | Tested |
| Tiny living population reads `0%` | HUD rounded `coverage * 100`; one of 2,562 cells rounded to zero. | `surfaces.js`, `index.html`, `components.css` | Formatter tests cover zero, one/two/three cells, decimal and integer ranges. | Tested |
| Detached cyan bars / V fragments | Separate center-to-downstream river quads used a high-opacity cyan boundary shader. | Cell geometry, world pass, boundary shader, renderer, tests and rendering docs | Static negative gate passes; real Chrome/WebGL completes at four draws; mobile/desktop run and wave captures contain no detached cyan geometry. | Tested |
| Title organism is arbitrary and weak | Fixed 54-cell FIFO BFS ignored ecology, then cleared and reseeded through an LCG. | Production generator, showcase player/data, app framing, stale-data gate and lifecycle tests | Seed `20260701`; 89 frames / 228,754 bytes / 22 s; peak 535, loop tick 480; data SHA-256 `58b20fb2…`; six real-Chrome phase captures. | Tested |
| Adaptation is a broad wash | Unweighted whole-component BFS was normalized to its maximum distance in the shader. | Core arrival field, simulator event, propagation queue, WebGL/Canvas materials and tests | 40 production worlds: median 34.0% reached (small components may complete), median/max arrival 678/1,107 ms; compute median 0.042 ms, p95 0.198 ms; real-Chrome checkpoints pass. | Measured |
| Run dock is bulky / actions equal | Fixed five-column mobile rail and uniform dark pills. | Semantic action levels, intrinsic compact dock, responsive geometry helper | Chrome asserts 12 viewports plus 200% text; 320×568 and 844×390 captures remain ≤72 px with 44 px controls. | Tested |
| Frequent Adaptation mode is buried | Only Settings exposed Random/Manual. | Adaptations markup/controller, Settings synchronization, dock mode label | Real Chrome switches `MANUAL` to `AUTO · RANDOM` in-surface through the authoritative command. | Tested |
| Surfaces do not close naturally | Coordinator handled Escape/focus only; triggers always reopened and there was no outside contract. | Stateful coordinator, trigger metadata and browser interactions | Settings is tested through same-trigger, Escape, outside pointer with no leaked globe tap, explicit Close, and replacement by another surface. | Tested |
| Skill detail covers metadata | Whole surface scrolled while Unlock was sticky; stacked purchase toasts covered content. | Grid-row detail markup, body scroller, in-flow footer, responsive CSS | Chrome rectangle assertions pass at 320 portrait through 844 landscape and desktop; final row/footer never intersect. | Tested |
| Progression identity and globe are weak | Visible feature was `Memory`, included a List catalog, and kept the atlas small. | Evolution vocabulary, semantic tree, larger layout policy, no List code | 642-cell globe and 108 skills; desktop distance 3.75; mobile/landscape/tablet captures; source gate rejects visible List/old state copy. | Tested |
| No in-run New World transaction | Only terminal `Next World` existed; no authoritative abort protocol. | Run-ID worker/fallback protocol, abort summary, History and confirmation surface | Cancel owns/releases its pause; accept advances run ID/seed once, records abandoned, and preserves runs/Echoes/best score. | Tested |
| Pause/Resume is a large text action | Dock used a text button driven by aggregate pause state. | Animated 44 px clock dial and `aria-pressed` state | Unit semantics plus compact Chrome geometry/captures at required viewports. | Tested |
| Long completion horizon is uncalibrated | Currency alone totaled 818 Echoes and completed in roughly 37 runs. | Visible observed-world gates layered over adjacency and Echoes | 54 skills at 144 worlds, all keystones 164, connectors 600, all capstones 900; modeled 70–85 h at 1×. | Modeled |

## Baseline commands

- `npm run verify` — pass; 110 unit, 29 integration; benchmark 2,910 ticks / 161 ms, 18,022 ticks/s, hash `98333073`, 11 MB reported heap.
- `npm run test:browser:file` — baseline pass; real headless Chrome/WebGL2; 32× result 8.19 s; five draws before artifact-path removal.
- `npm run test:browser:canvas` — pass; real headless Chrome forced Canvas 2D.
- Public HTTP inspection — sampled `index.html`, `src/main.js`, renderer, CSS, and status bytes matched HEAD.

Public-URL Chrome screenshot navigation was blocked by `ERR_INTERNET_DISCONNECTED`; exact public bytes were verified over HTTP and the same files were exercised in Chrome through the repository's file/CDP harness. No physical-device claim is made.
