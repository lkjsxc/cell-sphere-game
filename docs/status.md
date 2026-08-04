# Status — local-resource ecology release candidate

> Snapshot: 2026-08-04. This describes the current candidate. Public deployment
> evidence is recorded only after the exact revision is pushed and Pages succeeds.

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

- fresh 150 seeds: median SCORE 8,692, median duration 323.5 seconds, median peak
  land occupancy 26.5%, p90 42.8%, and conservation error zero at 1e-6;
- SCORE trace 150 seeds: zero decreases, zero Result mismatch, median 8.5% of
  final visible at 15 seconds and 100% before terminal Result;
- matched freshwater 60 seeds: median duration ratio 1.154 and 5.4-second median
  resource-exhaustion delay; controls sometimes win;
- paired first-root 60 seeds: 16,000 → 19,000 potential and median SCORE
  8,892 → 10,676;
- full-build 24 seeds: median 106 transformed, 17 reclaimed, 24 glacial-lake,
  5 maritime-forest, and 105 ever-powered cells; fresh controls had zero;
- full-build 100 seeds: exact sustained REACH 100 in 4%; all achieved worlds
  later became extinct; 100 fresh controls achieved zero;
- full SCORE is bounded near 1.099 million.

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

- unit: 142 / 142;
- integration: 73 / 73 after production worldmaking/REACH and Trophy-proof tests;
- agent smoke: 5 / 5;
- Skill topology/content/build audit: PASS (252 cells, 16 recipes);
- resource 150, SCORE trace 150, transformation 24: PASS;
- freshwater 60 measured within target after finite-support tuning;
- exact REACH cohort 100: 4 achievements, zero fresh, terminal bounded;
- deep 1,000-world pre-final resource and SCORE cohorts established monotonicity,
  conservation, and fresh score bounds before the final access-floor retune.

Full `npm run verify`, balance, browser WebGL2/Canvas, soak, deep audits, CI, and
Pages/public-byte verification are required again for the final candidate.

## Revision state

- Starting revision: `aff524595b491226ee4c337430f6a1600b7ed722`.
- Protective tag: `pre-local-resource-ecology-20260804`.
- Superseding contract: `6ffd46a09bcbd278d4ca1e06d0bd4b1e7ce4543e`.
- Local ecology/SCORE base: `a466ef0`.
- Evolution/build compiler: `32cedd6`.
- RESULT/developer speed: `2fc6bc6`.
- Fair agent environment: `745c78d`.
- Exact final product build, push, Actions run, Pages revision, and cache-busted
  public browser evidence: pending final verification.
