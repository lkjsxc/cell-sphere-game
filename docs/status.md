# Status

Truthful current state. Updated every session.

- **Last verified commit:** (set after Gate B part 2 commit)
- **Branch:** main → origin/main (not pushed yet)
- **Contest readiness:** simulation nucleus complete; not playable in browser yet.

## Playable now

- Static title shell boots through the dev server with capability detection.
- Full headless run lifecycle: inoculation → growth → crises → drafts →
  extinction → result summary with deterministic hash (Node only).

## Complete and verified

- Gate A: repo contract, docs, structure gate, dev server, CI workflow.
- Gate B part 1: core primitives + world generation (70 unit tests).
- Gate B part 2: deterministic simulation (tick phases, events, drafts,
  signals, extinction), 7 integration tests incl. speed invariance
  (chunk 1/7/32/50 → identical hash), benchmark (~17k ticks/s desktop),
  balance harness with smoke mode.

## Incomplete

- WebGL2 renderer + interaction (Gate C)
- Full browser run loop: HUD, draft UI, result screen (Gate D)
- Scoring formula, phenotypes (Gate D)
- Progression, trophies, autoplay, archive (Gate E)
- Sharing, audio, PWA (Gate F)
- Accessibility pass, balance tuning, CI evidence, polish (Gate G)

## Current gates (all green locally)

| Gate | State |
|---|---|
| check:structure | PASS (95 files, 16 dirs) |
| test:unit | PASS 70/70 |
| test:integration | PASS 7/7 |
| balance:smoke | PASS |
| benchmark | PASS 17,234 ticks/s (min 3,000), hash d02cae0d |
| check:links | PASS |

## Latest metrics

- Median extinction: balanced 361 s / expansion 325 s / resilience 361 s
  (n=4 each — above the 270–330 target; tuning pass planned, see
  `docs/balancing.md`).
- Peak coverage median 0.40–0.52; crisis survival 0.91–1.0.

## Known risks

- Extinction timing leans on the terminal ceiling; mid-run pressure needs
  strengthening before score design lands.
- Mobile performance unverified physically.

## Next actions (priority order)

1. Gate C: WebGL2 renderer (globe, instanced vein ribbons, atmosphere,
   event footprints), orbit camera, ray-sphere picking, Canvas 2D fallback.
2. Gate D: browser run loop — worker driver, HUD, adaptation sheet, result
   screen, scoring, phenotypes, speed controls, 32× batching.
3. Gate E: Memory Globe, Echoes, trophies, autoplay, archive, challenges.
4. Gate F: share text/card, procedural audio, PWA.
5. Gate G: accessibility pass, balance tuning with evidence, CI + Pages,
   README captures, submission checklist.
