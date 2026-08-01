# Status

Truthful current state. Updated every session.

- **Starting commit (this turn):** `db31bfb`
- **Commits this turn:** `6a72824` (renderer + verification), `41c81b0`
  (canonical-name alignment + decision records), `c4400e1` (status), plus
  this push-failure note.
- **Branch / upstream:** `main`. **Push to `origin` FAILED** with
  `fatal: repository 'https://github.com/lkjsxc/incremental-network-game/' not
  found`. Diagnostics: `gh auth status` is logged in as `lkjsxc` with a token
  carrying `repo` scope, but `gh repo view lkjsxc/incremental-network-game`
  returns *"Could not resolve to a Repository"* — i.e. the remote repository
  no longer exists on GitHub (it resolved fine in the previous session, so it
  was deleted or renamed externally between sessions). This is an external
  state change, not a code or credential defect. Local history is intact and
  the working tree is clean. The remote was **not** recreated from here
  (that is the account owner's decision); recreate or restore it, then
  `git push origin main` will fast-forward the 6 local commits.
- **Contest readiness:** Gate C renderer landed and logic-verified; the game
  is **not yet playable as a full loop in the browser** (no HUD/draft/result
  UI, no worker wiring in-browser). See gates below.

## Playable now

- Title screen renders the **live rotating WebGL2 globe** (Canvas 2D fallback
  if WebGL2 init throws); `?preview=1` runs the real main-thread simulation
  through the renderer for visual checks.
- Full headless run lifecycle in Node: inoculation → growth → crises →
  drafts → extinction → result summary with a deterministic hash.

## Complete and verified

- Gate A: repo contract, docs, structure gate, dev server, CI workflow.
- Gate B: core primitives + world generation + deterministic simulation
  (78 unit tests, 7 integration tests incl. speed invariance chunk 1/7/32,
  benchmark ~17–19k ticks/s desktop, balance harness with smoke mode).
- Gate C (this turn): WebGL2 renderer (globe, atmosphere, instanced vein
  ribbons + tips, event/signal overlays), Canvas 2D fallback, orbit camera,
  ray-sphere picking, quality governor; renderer **logic** unit-tested in
  Node (8 tests, incl. a static shader-uniform cross-check); browser smoke
  harness added. Canonical name aligned to `incremental-network-game`
  everywhere it is asserted.

## Incomplete

- In-browser run loop: worker driver, HUD, adaptation sheet, result screen,
  speed controls wired to the DOM (Gate D).
- Scoring formula, phenotypes/synergies, run epithet (Gate D).
- Memory Globe, Echoes, Imprints, trophies, autoplay, archive, challenges,
  world archetypes, strains beyond the initial three (Gate E).
- Share card, procedural audio, PWA (Gate F).
- **Full English + Japanese player-facing localization** (tracked gate;
  Japanese premise + canonical name ship now, full bilingual copy does not).
- The 8 Hz tick-rate + fixed-point numeric convention from the revised
  mission (deferred to a dedicated rebaseline turn — see `docs/decisions.md`
  D9; current 10 Hz Float32 simulation is green and deterministic).
- Accessibility pass, balance tuning with evidence, physical-device tests,
  CI evidence, README screenshot (Gate G).

## Current gates

| Gate | State |
|---|---|
| check:structure | PASS (110 files, 17 dirs) |
| test:unit | PASS 78/78 |
| test:integration | PASS 7/7 |
| balance:smoke | PASS |
| benchmark | PASS ~17–19k ticks/s (min 3,000), hash d02cae0d |
| check:links | PASS |
| test:browser | SKIP 77 — container seccomp blocks Chrome network stack |

`test:browser` is intentionally outside `npm run verify`: in this sandbox
Chrome's network stack gets `EPERM` on `socket()` (curl/Node connect fine),
so headless Chrome cannot load the dev server. The harness reports this as a
skip with the exact signature — never a false pass. A real GPU render is
claimed only when observed on unrestricted hardware (see `docs/decisions.md`
D8, `docs/testing.md`).

## Latest metrics

- Benchmark: 3,396 ticks / ~190–230 ms ≈ 17–19k ticks/s single-threaded on a
  20-core Linux desktop; 8 MB heap; hash `d02cae0d` stable across runs.
- Balance smoke (n=4/policy): balanced median ~361 s, expansion ~325 s,
  resilience ~361 s — extinction leans on the terminal ceiling; a mid-run
  pressure tuning pass is planned (recorded in `docs/balancing.md`).
- Physical mobile / GPU render: **not observed this turn** (environment
  limitation, stated plainly).

## Known risks

- No in-browser play yet: the renderer is logic-verified but a pixel has not
  been observed from this environment. The next turn must wire the worker +
  HUD and capture a real frame on unrestricted hardware or CI.
- Extinction timing clusters near the 360 s ceiling rather than the 270–330 s
  median target; needs a balance pass before score design lands.
- The revised mission's 8 Hz / fixed-point numeric contract is not yet
  adopted; doing it carelessly would rebaseline determinism and balance.

## Next actions (priority order, by contest impact)

1. **Gate D in-browser loop**: worker driver + main-thread fallback wired to
   the DOM, running HUD (score, pressure, Signal charges, speed/pause),
   adaptation bottom sheet, extinction transition, result screen, restart;
   capture a real rendered frame and verify the ten-second judge path.
2. **Balance pass**: strengthen mid-run pressure so the median extinction
   lands in 270–330 s; record before/after in `docs/balancing.md`.
3. **Numeric rebaseline turn**: adopt 8 Hz + fixed-point convention with full
   golden/balance/performance rebaselining per `docs/decisions.md` D9.
4. **Scoring + phenotypes**: 5-component Network Score, ranks, epithet,
   synergy recognition (Gate D content).
5. **Gate E**: Memory Globe + Echoes + Imprints + first campaign resolution
   + trophies + autoplay + archive.
6. **Localization**: complete English + Japanese player-facing copy.
7. **Gate F/G**: share card, audio, PWA, accessibility, physical-device +
   thermal evidence, CI/Pages, README capture, submission checklist.
