# Status — progression compression release candidate

> Snapshot: 2026-08-04. This file records evidence for the current working
> release candidate. Deployment revision is filled only after Pages verification.

## Product state

- Canonical product: `cell-sphere-game` — **Every extinction becomes memory.**
- Production URL: https://lkjsxc.github.io/cell-sphere-game/
- Active loop: autonomous world → finite-resource extinction → SCORE/Echo reward
  → permanent Evolution purchase → next world.
- Active mid-run Adaptations have been removed from authority, protocol,
  rendering, settings, current History, Result, and Trophy criteria. Old archived
  records remain readable and inert.
- World surfaces remain whole-cell only. Lakes, habitat, life, events, Skills,
  and Trophies are cell state/material changes rather than sub-cell decoration.

## Evolution and migration

- Evolution is a frequency-5 geodesic sphere with exactly 252 cells, 750
  boundaries, 12 pentagons, and 240 hexagons.
- Six connected 42-cell territories cover Reach, Flow, Reserve, Ecology,
  Perception, and Continuity.
- Composition: 6 roots, 30 majors, 12 conditionals, 12 unlocks, 6 keystones,
  6 capstones, and 180 named Resonance cells.
- Total cost: 17,820 Echoes. Fresh/full World Potential: 16,000 / 1,196,800.
- Atlas hash: `0e47f1a1`; economy hash: `1f3de716`; authored effect hash:
  `76898d4d`.
- Schema 9 uses an explicit 642-entry graph-v4 migration manifest. Every former
  ID maps to one of all 252 current targets. Source hash: `34b4e4a9`; mapping
  hash: `85f93318`.
- Migration preserves recognized legacy IDs, current ownership, disconnected
  valid ownership, Echo balances, and idempotence. Positive represented-spend
  differences are refunded; migration never charges.

## Ecology, events, and habitats

- Per-cell finite reserve, bounded renewal, uptake, transfer, and maintenance are
  authoritative simulation state.
- Fresh 200-seed causes: 126 resource exhaustion and 74 maintenance starvation;
  no scripted early crisis death.
- Worlds 1–2 schedule no harmful events. World 3 schedules one mild event at
  tick 2400–2520. Later world ordinals ramp count and intensity gradually.
- Lake, tundra, snow/ice, shallow-ocean edge, general shallow ocean, and deep
  ocean are compiled Evolution capabilities checked before growth RNG.
- Inspector reports the missing capability. Full-Evolution habitat evidence has
  median 37.6% marine lifetime visited share and 69.2% peak Reach.

## SCORE and measured progression

SCORE model v2 is `Run Quality × World Potential × Challenge`. Run Quality has
six visible axes: Survival, Peak Reach, Sustained Reach, Unity, Resource
Efficiency, and Stability.

Deep production-authority audit:

- fresh 200 seeds: median SCORE 10,762, median 14 Echoes, median 273.1 seconds;
- progressing world 3: median SCORE 104,048, seven Skills, 13.09 campaign minutes;
- first pressure: median 13.23 campaign minutes;
- first five-world cycle: median 20.73 minutes;
- 63 Skills: median SCORE 267,653;
- 126 Skills: median SCORE 451,443;
- full 252 Skills: median SCORE 959,558, p90 981,893.

At full progression, median duration is 330.3 seconds and the hard bound occurs
in 20% of the mature-era cohort, not a majority. No speed or presentation input
enters scoring.

## Interface and accessibility

- One persistent `Home | World | Evolution | Trophies` selector owns primary
  views, including from Result; Result does not duplicate Evolution/Trophy nav.
- The compact world rail is Time, Speed, and Menu.
- SCORE, ENTROPY, and REACH are semantic 44px buttons with persistent border,
  background, and disclosure cues at rest.
- The shared context shell supports same-trigger toggle, replacement by another
  detail, Escape, Close, and globe drag without dismissal or camera movement on
  open.
- Evolution has a synchronized 252-node semantic tree; Trophies expose all 96
  criteria in a semantic grid. Notifications are FIFO, bounded, persisted,
  nonblocking, and announced accessibly.
- WebGL2 and Canvas 2D passed real CDP pointer/keyboard vertical slices at mobile
  and desktop viewports. Current measured browser result SCORE: 10,822.

## Verification evidence

Current local candidate evidence:

- unit: 125 / 125;
- integration: 67 / 67;
- browser WebGL2: PASS, 4 draws, 32× completion 7.65 seconds, title render mean
  0.71 ms and p95 0.90 ms;
- browser Canvas 2D: PASS with SCORE 10,822;
- benchmark: 12,157 ticks/s in the final verify run (minimum 3,000);
- whole-cell lake audit: 500 worlds, no topology/integrity violations;
- cell visual, active-system removal, Skill, event, habitat, Trophy, link, and
  structure audits: PASS;
- 1,000-world terminal soak: zero invalid states, duplicate terminal messages,
  or liveness repairs; median 2,702 ticks and 10 hard-bound worlds;
- deterministic title artifact SHA-256:
  `bc53b6d0f04dc9b2cd169034813a78f7e2c187ea94f1490fd0415afef0acd910`.

The final deep campaign report passed with 200 fresh seeds and production-backed
campaign/progression cohorts in 163.7 seconds. Reports are ignored local evidence;
canonical claims live in source, tests, and this snapshot.

## Release state

- Starting code revision: `a3fa43131261a0cdf207d63e25c448646857914c`.
- Protective tag: `pre-balance-compression-20260804`.
- Superseding contract commit: `884909b9d3ca77ae380164fd84fc4f63039dbc36`.
- Implementation commit: `0774c2ac5d186e86337f5abd58e55d6d841da597`.
- Public Pages revision: pending deployment verification.
