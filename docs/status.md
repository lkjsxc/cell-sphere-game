# Status

Truthful handoff state after the passive living-world vertical slice.

- **Starting commit:** `834e4f24169b0005cec790afd705ea1a0317aebc`
  (`docs(status): record GitHub README landing fix`).
- **Latest functional commit:** `9c8d552` — complete passive living-world loop.
- **Branch:** `main`, tracking `origin/main`; final push/deployment evidence is
  recorded below only after verification.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/>.
- **Contest page:** re-fetched 2026-08-02; deadline shown as 2026-09-13;
  ZEN University Web Page application form still requires final recheck.

## Implemented and player-visible

- Ordinary title/run/result globe taps only select a cell; camera/selection/
  History are excluded from authority. Direct pointer-based run influence was
  deleted from simulation arrays, growth, replay, result, snapshots, Worker
  protocol, shader/fallback overlays, HUD, Memory effects, and player copy.
- Autonomous inoculation uses a dedicated seeded weighted stream over suitable
  non-lake land candidates and is preserved in replay, History, result, and
  inspector.
- WorldModel: bounded continents/oceans/coasts, shallow/deep water, ridges,
  priority-flood drainage, connected tributaries/trunks/mouths, occasional
  lakes, correlated climate, 13 biomes, coherent forest density, regions,
  feature flags, six landmark types, and central biome gameplay factors.
- WebGL2 renders explicit biome cells/forest material/shallow relief, quiet
  boundaries/coasts, connected cool river ribbons, atmosphere, and distinct
  warm living routes in seven steady-state draws. Canvas fallback renders
  explicit biomes, rivers, selection, events, and routes.
- Cell inspector works on title/run/result with geography and 3 Hz compact
  authoritative living details; landmark navigation and History location focus
  provide semantic alternatives.
- Adaptation offers are bounded FIFO records while status remains running.
  Random automatic is the new/migrated default and exact-uniform on a dedicated
  stream; Manual queues fixed offers, explicit open/close, and apply-once choice.
- One-overlay architecture, independent manual/hidden/panel pause reasons, and
  a full Settings route from title/run/result/Memory. Idle rotation defaults
  off, suspends on manipulation/selection/panels, and is vetoed by reduced motion.
- History is available during runs and from result: semantic current/past
  timelines, category filters, located events, 24/32-run retention, Memory
  purchases, corruption/quota fallback, and a 700 KB hard cap.
- Memory Globe contains exactly 108 nodes (18 each across Reach, Flow, Reserve,
  Ecology, Perception, Continuity), stable cells, prerequisite paths, selected
  node details before Unlock, visible owned/reachable/locked states, accessible
  grouped list, migration of all six proof IDs, and atomic Echo transactions.
  Scalar and conditional effects compile once per run; old Imprints remain.

## Measured/tested evidence

- `npm run verify`: structure, **107/107 unit**, **11/11 integration**,
  balance smoke, benchmark, and 78-module/9-HTML link checks pass.
- Determinism: chunk 1/7/32/50 paths agree; default zero-input Random completes;
  hundreds of inspection/snapshot queries match a quiet run in hash, score,
  cause, choices, History, and Imprint.
- Random choice sample: 300,000 draws = 99,657 / 100,092 / 100,251
  (33.219% / 33.364% / 33.417%, chi-square 1.8911 at 2 df).
- Balance smoke n=4/policy: balanced median 291.7 s, expansion 290.9 s,
  resilience 292.2 s. This diagnostic sample meets the duration target but
  coverage is lower and resilience spread remains wide.
- Node v22.22.3/Linux x64 benchmark: 2,910 ticks in 161 ms = 18,089 ticks/s,
  hash `98333073`, 9 MB reported heap.
- World generation, 100 worlds: mean 2.979 ms, median 2.690 ms, p95 4.077 ms,
  maximum 12.435 ms; world hash `749bda35`.
- 100-run soak: 267,523 ticks/6.928 s, zero invalid, max five offers/80 History
  entries/5,894 event bytes. Forced-GC separate sample: 4.57 → 5.80 MB heap.
- 32 retained 49-event timelines: 304,208 bytes. Memory picking: 3.415 µs/pick
  over 100,000 Node calls.
- Real headless Chrome/WebGL2 at 390×844 and 1440×900: title rotation default,
  drag, river inspector, Settings, queued Manual offer/time continuation,
  Random switch, History/time continuation/location, result, 108-node Memory
  selection-before-purchase, persistence/reload, and no browser errors pass.
  Mixed run reached result at 32× in 7.95 s; JS draw submission mean 0.11 ms,
  p95 0.20 ms (not GPU frame time).
- Docker `node:22` verify passes all gates. Same-origin Chrome harness exits 77
  because container seccomp blocks Chrome networking; CDP/file evidence is real
  Chrome but bypasses same-origin HTTP.

## Generated visual evidence (git-ignored)

`reports/browser-title-mobile.png`, `browser-run-mobile.png`,
`browser-inspector-mobile.png`, `browser-settings-mobile.png`,
`browser-adaptations-mobile.png`, `browser-history-mobile.png`,
`browser-result-mobile.png`, `browser-result-history-mobile.png`,
`browser-memory-selected-mobile.png`, `browser-memory-purchased-mobile.png`,
`browser-title-desktop.png`, `browser-run-desktop.png`, and
`browser-memory-desktop.png` were manually inspected.

## Incomplete / not claimed

- Several advanced Memory information/mechanic/automation unlock keys are
  validated, persisted, and displayed but do not yet have distinct downstream
  tools; the scalar and 24 conditional effects are active. Broad atlas count,
  graph, migration, and purchases are complete, but every advanced unlock is
  not yet a completed feature.
- Only three geography archetype generator variants are shipped; lakes are
  valid but do not occur in every seed. The first screenshot makes terrain,
  coast, forest, cold/dry contrast, and river accents readable, but visual
  branch identity in Memory still relies more on path/location/list labels than
  distinct node shape.
- Campaign resolution UI, challenges, trophies, additional selectable strains,
  audio, share cards, PWA/offline cache, and complete Japanese localization are
  not implemented.
- Actual GPU frame time, browser heap, Canvas fallback Chrome screenshot,
  physical smartphone/touch/thermal, screen-reader, forced-colors, and 200%
  zoom evidence remain unmeasured.

## Next actions by contest impact

1. Give every advanced Memory unlock a distinct complete consumer or replace it
   with an honest implemented atlas effect; strengthen branch shape/material.
2. Deep Monte Carlo geography/archetype balance and improve final dense-network
   visual hierarchy while retaining the 270–330 s median.
3. Physical smartphone Chrome, Canvas fallback, reduced-motion, large-text,
   keyboard, and screen-reader review/fixes.
4. Complete English/Japanese localization and the four-run campaign resolution;
   only then add trophies/challenges/audio/share/PWA breadth.
5. Final submission branch/tag/form audit and exact Pages revision freeze.
