# Status

Release handoff for the visual-integrity, completion, and progression pass.

- **Starting commit:** `75a843e5e5b929d45e6375ae465f8b9171c7ff31`.
- **Implementation tip before this record:** `eb2c0f0`.
- **Branch/upstream:** `main`; implementation and release documentation are synchronized with `origin/main`. This file is the final evidence follow-up.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/>. Workflow `30791379842` completed verification (`91615441512`) and Pages deployment (`91615583669`) for release commit `b21eea5`.
- **Protective tag:** `pre-visual-integrity-pass-20260803` at the starting commit.

## Playable product

- Every world reaches an authoritative terminal state. Liveness is reconciled
  against cell state, a visible terminal-collapse phase is bounded by tick
  3,620, and extinction is committed exactly once.
- The production-generated title lifecycle uses seed `20260701`: 89 frames,
  228,754 bytes, 535-cell peak, loop, pressure, fragmentation, and extinction
  over 22.25 seconds. Reduced motion holds a representative frame and hidden
  documents freeze it.
- The renderer has four steady WebGL2 draws. Detached cyan river ribbons and
  all organism/prerequisite path geometry are absent. Canvas 2D remains a
  cellular fallback.
- Adaptations propagate from an authoritative living origin through a
  deterministic weighted local subset. Category, biomass, energy, stress,
  terrain, and topology affect a bounded `Uint16` arrival field.
- The compact run dock provides a clock-dial pause control, speed selector,
  Adaptations with pending count and direct `AUTO · RANDOM` / `MANUAL` control,
  History, New World, and Settings. Action salience distinguishes recommended,
  available, quiet, urgent, and destructive actions.
- Context surfaces close through Close, the same trigger, Escape, outside
  pointer input, or replacement by another surface. Focus restores to the
  invoker and outside dismissal does not leak a globe selection.
- New World is an in-run confirmation transaction. Cancel owns and releases its
  own pause lease. Accept advances seed/run identity once, grants no reward,
  records a visible abandoned History event, and begins the next world only
  after authoritative abort acknowledgment.
- Result keeps **Next World** visually recommended; Evolution Globe remains
  available but secondary. The fourth completed world reports **First Cycle
  Resolved**.
- **Evolution Globe · Permanent Skill Tree** replaces the old visible feature
  name. It has a larger 642-cell globe, 108 Skill Cells, no visible List mode,
  a synchronized offscreen semantic tree, fixed detail header/body/footer, and
  a quiet Focus available action.

## Architecture and reliability

- Worker and main-thread fallback messages carry monotonic run IDs. Stale
  snapshots/results are rejected. Heartbeats and status probes turn Worker
  silence into an explicit recoverable failure instead of an eternal run.
- Terminal, abort, and extinction races are first-wins. Result transaction keys
  are bounded to 16 entries; continuation retention remains bounded.
- Progress schema 5 persists a validated world-seed cursor. Migration preserves
  all owned skills, Echoes, History, Imprints, and prior idempotency guarantees.
- Layering remains `interface → rendering → simulation → world → core`; no DOM,
  storage, renderer, or time source entered simulation authority.

## Simulation, balance, and progression

- Production smoke remains deterministic and finite; the current benchmark
  result is 2,853 ticks with hash `c55ddab5`.
- A 1,000-world production soak completed in 146,847.5 ms with zero invalid
  outcomes, duplicate terminal messages, or liveness repairs. Terminal tick
  min/median/p95/max was 263/2,701/3,613/3,620.
- Weighted propagation measured over 40 production worlds: median 34% affected,
  median arrival 678 ms, maximum median 1,107 ms; computation median 0.042 ms,
  p95 0.198 ms.
- First resolution is four worlds (18–24 min target at 1×). Visible
  `Worlds observed` gates place 54 skills at world 144, all keystones at 164,
  connectors at 600, and capstones at 900. This models roughly 70–85 hours for
  all 108 skills at 1×; the 100–200 hour challenge/trophy breadth target remains
  honestly incomplete.

## Rendering, UI, and accessibility evidence

- Real Chrome geometry assertions cover 320×568, 360×640, 375×667, 390×844,
  430×932, 844×390, 768×1024, 1024×768, 1280×720, 1366×768,
  1440×900, and 1920×1080, plus 200% run-dock text.
- The compact dock stays within 72 CSS px where required; visible controls are
  at least 43×43 measured / 44×44 authored and do not overlap or leave the
  viewport. Skill detail geometry is asserted in portrait, landscape, tablet,
  and desktop layouts.
- Current Chrome captures were visually inspected for title phases, required
  run viewports, Adaptations, New World, result hierarchy, Evolution Globe,
  selection, purchase, and fixed-flow skill details. No physical-device claim
  is made.
- Pointer-only completion remains intact. The semantic skill tree supports
  keyboard focus/selection; arbitrary world-cell inspection still requires
  pointer hit testing. Screen-reader and forced-colors manual audits remain.

## Exact verification

Environment: Node v22.22.3, Linux x64, 20 logical CPUs.

- `npm run verify` — PASS: structure; showcase freshness; 109 unit; 50
  integration; balance smoke; benchmark; 96-module/9-HTML link gate.
- Benchmark — 2,853 ticks in 192 ms, 14,868 ticks/s, hash `c55ddab5`.
- `node scripts/terminal-soak.mjs --count=1000` — PASS with the results above.
- `npm run test:browser:file` — PASS in real headless Chrome/WebGL2: score
  605,185; 32× result in 9.08 s; four draws; title JS presentation mean
  0.09 ms / p95 0.20 ms; visual IndexedDB reload; responsive and interaction
  matrices pass with no browser errors.
- `npm run test:browser:canvas` — PASS in real Chrome with WebGL disabled through
  title, run, visual History, and Evolution Globe.
- `docker compose run --rm verify` — PASS: 109 unit, 50 integration, all gates;
  benchmark 2,853 ticks in 190 ms, 15,018 ticks/s, hash `c55ddab5`.
- Cache-busted public `index.html`, entry point, run driver, Worker, skill gates,
  showcase data, primary CSS, and this status file returned HTTP 200 and matched
  release-commit bytes exactly by SHA-256.

## Known limitations and next actions

- Public-URL headless Chrome navigation is sandbox-network blocked with
  `ERR_INTERNET_DISCONNECTED`. The deployed bytes were verified over HTTPS and
  those exact repository bytes were exercised through the CDP-pipe Chrome
  harness; no public-browser screenshot is claimed.
- Physical mobile touch/thermal/battery/GPU timing, screen-reader traversal,
  forced-colors review, Japanese localization, and 100–200 hour challenge,
  discovery, and trophy breadth remain incomplete.
