# Status — local-resource ecology release

> Snapshot: 2026-08-04. Implementation `6f56735` is pushed, CI-verified, deployed
> by Pages, and cache-busted public-byte verified.

## Product state

- Canonical product: `cell-sphere-game` — **Every extinction becomes memory.**
- Production URL: https://lkjsxc.github.io/cell-sphere-game/
- Loop: autonomous deterministic ecology → finite-resource extinction → monotone
  SCORE/Echo reward → adjacent Evolution purchase → next world.
- Active mid-run Adaptations remain removed. Archived records are readable/inert.
- World surfaces are whole-cell only. No rivers, routes, ribbons, terrain glyphs,
  or electricity wires are rendered.

## Local ecology and worldmaking

- Immutable per-cell resource baselines combine nutrient, reserve, climate,
  toxicity, biome, altitude, renewal, and freshwater context.
- Available resource, reserve, recyclable stock, finite lake catchments, and
  founder freshwater stock have an explicit conservation ledger.
- Growth rejects poor/inaccessible cells before RNG. Fresh living-cell time is
  concentrated in the top two richness quintiles; rich, strained, depleted,
  exhausted, recovering, and reclaimed cells have distinct snapshot materials.
- WebGL2 and Canvas use local resource/transformation bytes. ENTROPY no longer
  dims or desaturates the whole terrain.
- Finite freshwater improves matched survival but is not mandatory or immortal.
- Sixteen Skill builds drive bounded whole-cell reclamation, glacial lakes,
  littoral wetlands/maritime forests, and bioelectric illumination.
- `REACH 100%` requires every one of 2,562 authoritative world cells alive for
  25 consecutive ticks. It is late-build-only and does not prevent extinction.

## Evolution, builds, and migration

- Evolution remains a frequency-5 sphere: 252 cells, 750 boundaries, 12
  pentagons, and 240 hexagons.
- The six 42-cell affinities are Fertility, Freshwater, Scarcity, Cryogenic,
  Marine, and Luminous. Affinity hash: `9e0063bd`; content hash: `938f6e87`.
- Eligibility is enough Echoes plus one directly adjacent owned cell. No hidden
  run, experience, or all-parent gate exists.
- World Potential v2 is compiled from bounded Evolution Power: 16,000 fresh,
  19,000 after the first root, 80,000 at power 4, and 1,200,000 at power 384.
- Sixteen recipes have distinct mechanical signatures; full ownership activates
  all sixteen and fifteen capability contributions.
- Schema-9 migration preserves recognized 642/252 ownership, Echoes, scores,
  History, Trophies, seed cursors, and inert Adaptation History idempotently.

## SCORE v3 and measured balance

SCORE v3 is monotone cumulative merit across Survival, Exploration, Presence,
Coherence, Stewardship, and Worldmaking, multiplied by versioned World Potential
and challenge. HUD, Result, audits, and agent play share this model; Result adds
no correction.

Current production-module evidence:

- fresh 500 seeds: median SCORE 8,782, median duration 312.0 seconds, median peak
  land occupancy 27.5%, p90 40.7%, and conservation error zero at 1e-6;
- SCORE trace 500 seeds: zero decreases, zero Result mismatch, median 8.4% of
  final visible at 15 seconds and 100% before terminal Result;
- matched freshwater 300 seeds/294 pairs: median duration ratio 1.175 and
  5.5-second median resource-exhaustion delay; controls sometimes win;
- paired first-root 60 seeds: 16,000 → 19,000 potential and median SCORE
  8,892 → 10,676;
- full-build 24 seeds: median 107 transformed, 20 reclaimed, 24 glacial-lake,
  5 maritime-forest, and 100 ever-powered cells; fresh controls had zero;
- full-build 300 seeds: exact sustained REACH 100 in 8 (2.67%); all achieved
  worlds later became extinct; 100 fresh controls achieved zero;
- full SCORE median/max: 1,099,200.

## Interface, speed, and accessibility

- Persistent metric order is `SCORE | ENTROPY | REACH | RESULT`; RESULT becomes
  the recommended terminal action and avoids redundant navigation buttons.
- SCORE, ENTROPY, REACH, and terminal RESULT look interactive at rest.
- Globe drag, pinch, and wheel preserve an open detail pane; opening a pane does
  not move or zoom the globe.
- Normal speeds are 1×, 2×, 4×, and 8×. Explicit `?dev=1` visibly enables
  session-only DEV 16×–256×. Every authoritative tick executes; only snapshots
  and rendering may be decimated.
- Evolution's semantic tree exposes affinity/pattern labels, gameplay and
  potential before/after, build progress, tradeoffs, cost, and neighbors.

## Fair agent play

- `src/agent/` projects an allowlisted fair observation over production
  simulation, SCORE, Skills/builds, Trophies, History, and migration.
- Actions: observe, set goal, buy a legal Skill, run the next world, inspect the
  last result/builds, export/reset a validated agent save.
- Deterministic policies cover balanced, sustainability, freshwater, scarcity,
  cryogenic, marine, luminous, terraforming, REACH 100, and random-legal play.
- CLI campaign output includes bounded fair observation/action traces, rationales,
  state hashes, progression, active builds, resources, transformations, and
  exact-REACH evidence. Hidden future events, future seeds, RNG state, and raw
  typed arrays are excluded.

## Candidate verification

- unit: 143 / 143;
- integration: 73 / 73 after production worldmaking/REACH and Trophy-proof tests;
- agent smoke: 6 / 6;
- Skill topology/content/build audit: PASS (252 cells, 16 recipes);
- final resource 500, SCORE trace 500, freshwater 300, transformation 24: PASS;
- exact REACH cohort 300: 8 achievements, zero fresh, terminal bounded;
- nine fair policies completed twelve-world campaigns with bounded traces. At
  world 12: Scarcity activated Wasteland Reclaimer and transformed 47 cells;
  Marine activated Pelagic Colony; Luminous energized 311 cells; Terraforming
  activated reclamation and transformed 14 cells. Best SCORE ranged 151k–247k.

Final local release gates:

- `npm run verify`: all 22 gates PASS; three-sample median benchmark 7,319
  ticks/s, 11 MB heap;
- deep campaign: 200 fresh median SCORE 9,061 / 18 Echoes / 312.4 seconds;
  potential-policy median 105,000 after 15.565 minutes and first resolution
  20.197 minutes; full median SCORE 1,099,200;
- deep habitat: 60 seeds/configuration, fresh locks exact, deep-only unlock median
  13 visited cells, full marine share 49.2% and peak Reach 98.8%; PASS;
- full balance: six 30-run policies; PASS;
- terminal soak: 1,000 worlds, zero invalid states, duplicate terminal messages,
  or liveness repairs; median 3,169 ticks, maximum 3,620;
- WebGL2 real-CDP: PASS, 4 draws, SCORE 10,774, 8× completion 37.98 seconds,
  DEV 256× 1.72 seconds, title mean 1.15 ms / p95 1.30 ms;
- Canvas real-CDP: PASS with SCORE 10,774;
- production full-build fixtures rendered and manually inspected in both backends:
  local resource variation, recovering/reclaimed soil, cryolakes, maritime
  succession, and energized whole cells were visible; no wire geometry;
- title showcase replay v4: 89 frames, SHA-256
  `b19a8ccf45fd583b8ddcbb924aa190d006c7710f2a2f59dbf8bc8af802e2ae5b`.

GitHub Actions run `30948480380` passed verify and Pages for implementation
`6f56735fd6d1832b84831476426df9ad47f68f72`. Cache-busted public `index.html`,
SCORE, potential, resource ecology, worldmaking, shaders, and agent environment
were SHA-256-identical to that revision. Public-network Chrome on the audit host
returned `ERR_INTERNET_DISCONNECTED`; deployed interaction is therefore not
claimed. The same byte-identical files passed the complete local trusted-CDP
WebGL2/Canvas paths.

## Revision state

- Starting revision: `aff524595b491226ee4c337430f6a1600b7ed722`.
- Protective tag: `pre-local-resource-ecology-20260804`.
- Superseding contract: `6ffd46a09bcbd278d4ca1e06d0bd4b1e7ce4543e`.
- Local ecology/SCORE base: `a466ef0`.
- Evolution/build compiler: `32cedd6`.
- RESULT/developer speed: `2fc6bc6`.
- Fair agent environment: `745c78d`.
- Final product implementation/performance build:
  `6f56735fd6d1832b84831476426df9ad47f68f72`.
- GitHub Actions/Pages: run `30948480380`, verify and pages both succeeded.
- Public product bytes: exact match to `6f56735`; deployed-Chrome limitation is
  recorded above rather than reported as a pass.
