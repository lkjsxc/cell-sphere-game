# Status

The harder Trophy mastery, lake proof, queued feedback, and centralized timing
vertical slice is implemented and locally verified on `main`.

- **Slice base:** `25edde742df955a2dae51ddf932ac42074d9816c`.
- **Branch/upstream:** `main` tracking `origin/main`; this slice is ready for its
  coherent implementation commit and push.
- **Playable local entry:** `file://…/index.html?demo=1` through the disposable
  Chrome/CDP harness, or `npm run serve` at `http://127.0.0.1:8080`.

## Product and catalog

- The Trophy Sphere still has exactly 96 current cells: 16 each in Reach, Form,
  Endurance, Adaptation, Evolution, and Mastery. Conditions now use validated
  threshold/bitset/all/any combinators over a strict key whitelist. There is one
  explicit onboarding Trophy; fresh production worlds no longer receive
  geography/event/card contact awards.
- Criteria combine high-percentile SCORE axes, sustained coverage/morphology,
  crisis and lake-region survival, Manual/Automatic practice, cumulative card
  and ecology diversity, physically adjacent Evolution ownership, and long-run
  milestones. All current Trophy metric copy uses SCORE.
- Facts v3 stores bounded whole-cell lake cells/shores/distinct and complete
  lakes, five type/three salinity masks, lake-wetland-forest-highland
  combinations, sustained large-lake living/loops, and lake-adjacent
  drought/freeze survival. Cells mark proof once on first birth; current living
  proof scans only at the existing one-second summary cadence. These values
  intentionally join terminal hashes and consume no RNG.

## Migration and exactly-once feedback

- Progression schema 8 maps old `reach-river-touch` ownership to a separate
  explicit Legacy list. The current lake ID is `reach-lake-network`. Facts-v1
  bit 2 is masked; no river-era ownership or proof can award current lake
  mastery. Every other recognized old ID remains owned. Facts/progress/catalog
  migration is idempotent; load/import grants nothing.
- History schema 4 stores one bounded semantic Trophy event globally and, when
  available, on the awarding world. Result, Skill, explicit review, and
  History-clear reconciliation share monotonic evaluation. Duplicate result
  delivery adds no Echoes, ownership, event, reward, or queue entry.
- Current awards append unique ordered IDs to persisted `trophyQueue`. One 4.2 s
  actionable reveal shows family, name, exact criterion, Trophy Cell reward,
  and `n / 96`; Result lists names. The tab badge counts unread items. Hover and
  focus hold, reduced motion is static, click acknowledges and opens exact
  Trophy detail, and the queue survives automatic world replacement without
  retaining old world-cell highlights.
- Shared presentation policy is toast **2,700 ms**, Adaptation caption
  **3,750 ms**, Trophy **4,200 ms**, important fallback **4,500 ms**. Toasts and
  Adaptation captions are FIFO rather than replacement. Generation tokens make
  retired run timers no-op. Simulation event durations, nine-second Auto Next,
  camera policy, preview reload, and Worker watchdog thresholds are unchanged.

## Calibration evidence

`npm run audit:trophies` passed in 52.971 s with deterministic audit hash
`40aa0e55`. It executed 24 fresh production Automatic worlds plus a production
240-world modeled campaign alternating Automatic/deterministic Manual policies
and buying one affordable adjacent Skill per world.

| Horizon | Target | Exact modeled/current total |
|---:|---:|---:|
| fresh completed world cohort | usually 0–2 | 1 in all 24 worlds |
| 1 world + adjacent purchase | 0–2 | 2 |
| 4 worlds | 3–8 | 6 |
| 12 worlds / roughly first hour | 8–18 | 9 |
| 48 worlds / roughly four hours | 15–30 | 20 |
| 240 worlds / roughly twenty hours | meaningful, far from complete | 63 / 96 |

At 240 worlds the modeled family totals were Reach 6, Form 7, Endurance 14,
Adaptation 12, Evolution 14, Mastery 10, with 240 Skills owned and 33 Trophies
still current and earnable. The audit found zero impossible criteria, duplicate
conditions/copy, or non-onboarding criteria earned in at least half of fresh
worlds. It reports 30 dominance pairs honestly, primarily intentional nested
run/Skill/weather mastery rather than duplicate ladders. A separate 60-world
full-642-Skill production feasibility sweep observed SCORE up to 844,785 and
simultaneous demanding axis combinations; this is local model evidence, not
player-time measurement.

## Exact verification

- Baseline `npm run verify` before editing: PASS, 131 unit + 71 integration;
  benchmark 2,715 ticks / 272 ms / 9,998 ticks/s, hash `813c4f49`.
- Final `npm run verify`: PASS all nine gates, 136 unit + 72 integration tests,
  structure, cell-visual audit, showcase, 500-seed lake audit, balance smoke,
  benchmark, and links.
- Final benchmark: Node v22.22.3, Linux x64, 20 logical CPUs; 2,715 ticks in
  177 ms, 15,349 ticks/s, hash `256388b9` (proof hash intentionally changed).
- Showcase: 89 frames / 228,754 bytes, data hash `22ac0d97…`; source metadata
  `3c1a1717…`. Frame bytes remained unchanged.
- `npm run audit:trophies`: PASS; exact distribution above, no impossible or
  duplicate criteria, one-time transaction and Legacy migration valid.
- `npm run test:browser:file`: PASS real Chrome/WebGL2; SCORE 595,964, complete
  32× interval 7.92 s, exactly four draws, title mean 1.00 ms / p95 1.30 ms,
  visual IndexedDB available, sequential Trophy names/badge/reduced reveal/
  automatic replacement/click detail passed, no browser errors.
- `npm run test:browser:canvas`: PASS real Chrome Canvas 2D; SCORE 614,507;
  terminal shell, History, Evolution, Trophies, and atomic replacement passed.

`check:structure` has no hard violations. Existing warnings remain for the app
controller, hydrology, renderer/settings tests, and 18 unit-test children; the
expanded balancing ledger is now also above the 200-line warning.

## Limitations / next actions

- No Docker, physical-device, screen-reader, browser zoom, forced-colors visual,
  thermal, GPU-time, public URL, CI, or deployment claim is made for this local
  slice.
- Horizon values are deterministic modeled production campaigns, not observed
  wall-clock player distributions. The exact policy is recorded by the audit.
- Full 96/96 mastery was validated by condition bounds and production
  feasibility envelopes, not observed as a 642-Skill human campaign.
- The canonical package/repository/storage/Pages rename remains separate and was
  intentionally not performed in this worktree.
