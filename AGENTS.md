# AGENTS.md — current superseding contract
> Revision: 2026-08-04. Replace the repository-root `AGENTS.md` with this file.
> Do not merge obsolete requirements back into it. It applies repository-wide
> unless a narrower `AGENTS.md` overrides one local implementation detail.
## 1. Authority and freshness
Follow, in order: platform instructions; the user's current explicit task and
corrections; this file; actual source/tests/schemas/deployment; focused docs;
status reports and old commits as historical evidence only.
A current user decision overrides stale tests, prose, status reports, and past
architecture. Replace tests that protect rejected behavior. `docs/status.md` is
a release snapshot, not a constitution. Update this file whenever durable
product policy changes.
At the start of substantial work, inspect Git state, remotes, HEAD, deployment,
relevant source/tests, persisted schemas, and intentional uncommitted work.
Reproduce reported behavior before assuming its cause. Never reset or discard
unrelated work merely to obtain a clean tree.
## 2. Canonical identity
- Product/package: `cell-sphere-game`.
- Repository: `lkjsxc/cell-sphere-game`.
- Pages: `https://lkjsxc.github.io/cell-sphere-game/`.
- Tagline: `Every extinction becomes memory.`
`incremental-network-game` is legacy identity allowed only in isolated migration
code/tests or clearly historical evidence.
## 3. Current product direction
- The game is an autonomous deterministic spherical ecology. There is no current
  mid-run Adaptations system.
- Remove Adaptation offers, cards, mode settings, protocol commands, RNG,
  renderer effects, current-run History, result summaries, and Trophy criteria.
  Old archived Adaptation records may remain read-only legacy evidence.
- The Evolution Globe contains exactly **252** meaningful Skill Cells on a
  frequency-5 geodesic sphere: 12 pentagons, 240 hexagons, 750 boundaries.
- Skill effects and costs are materially larger than the former 642-cell tree.
  Every purchase must have a legible immediate before/after effect.
- Skill eligibility is enough Echoes plus at least one directly adjacent owned
  cell. No `Worlds observed`, run-count, all-parent, or hidden experience gate.
- Fresh-world final SCORE targets roughly 8,000–15,000.
- After roughly 12–18 minutes of normal-speed play, a typical progressing save
  should reach roughly 80,000–130,000.
- Strong late/full progression targets roughly 850,000–1,100,000, with
  exceptional play allowed modestly above one million.
- SCORE is a transparent product of run quality and permanent World Potential;
  camera, quality, frame rate, and speed never affect it.
- The first two ordinary worlds have no harmful planetary crises. They normally
  end through finite local-resource exhaustion and maintenance.
- The first mild environmental pressure should normally appear late in world 3,
  after roughly 13–16 minutes of 1x-equivalent play. Later worlds introduce
  environmental pressure gradually.
- Evolution eventually unlocks cold and aquatic habitats, including tundra,
  snow/ice, lakes, shallow ocean, and deep ocean. Locked habitats explain the
  required Evolution capability.
- Result uses the persistent primary-view selector for Evolution and Trophies.
  Do not duplicate Evolution/Trophies navigation buttons inside Result.
- SCORE, ENTROPY, and REACH are unmistakably interactive at rest, including a
  persistent border/background/disclosure cue rather than hover-only feedback.
- Whole cells remain the smallest visible world-surface unit. Lakes, habitats,
  life, events, Skills, and Trophies use whole-cell state/material changes.
  Sub-cell rivers, paths, ribbons, and terrain glyphs remain forbidden.
## 4. Product north star
Build a calm, distinctive, legible incremental roguelite whose progression feels
material after each purchase. The first worlds should teach autonomous resource
use before crises appear. Later progression should visibly expand survivable
habitats, score potential, and strategic world variety without adding mandatory
mid-run interaction.
Ordinary worlds remain approximately 270–330 game seconds with a bounded
terminal near 360 seconds. The first campaign resolution remains approximately
18–24 minutes at 1x. Full Evolution/Trophy mastery remains a long-horizon
pursuit without real-time gates or forced slow speed.
## 5. Durable invariants
- Same seed, world progression, and accepted start configuration produce the
  same authority at every speed and in Worker/fallback execution.
- Frame rate, rendering quality, camera, menus, metrics, History, and Trophies
  never alter simulation or SCORE.
- Simulation imports no DOM, WebGL, storage, or wall-clock presentation state;
  rendering never mutates authority.
- Commands are acknowledged or explicitly rejected.
- Extinction, abandonment, continuation, rewards, Skill purchases, Trophies,
  world replacement, and migration are idempotent exactly-once transactions.
- Valid player data survives schema and topology migrations.
- WebGL2 is primary; Canvas 2D remains usable and semantically equivalent.
- Hidden documents suspend or reduce work appropriately.
- Evidence distinguishes implemented, tested, measured, observed, modeled,
  target, and deployed.
## 6. Evolution and migration
Use a stable 252-cell topology and mapping hash. Six connected territories of
42 cells are preferred.
Compress the former 642 cells into stronger current cells through an explicit
versioned manifest. Preserve every recognized owned legacy Skill by mapping it
to a current cell. If several old Skills collapse into one current cell, preserve
ownership and refund any positive difference between recognized legacy spend and
the canonical cost represented after migration. Never charge a migration.
Disconnected migrated ownership remains valid and opens adjacent frontiers.
Every Skill detail and purchase feedback should show:
- gameplay effect before → after;
- World Potential before → after;
- cost and held Echoes;
- habitat or rule unlocked;
- newly available adjacent cells.
## 7. Environment and habitats
Early extinction should be driven by finite local resources, nutrient renewal,
maintenance, and overextension—not hidden scripted death or early crises.
Pass a stable world ordinal/era into simulation. Harmful event scheduling and
entropy effects use that era, not wall-clock waiting. Fast game speed may
compress wall time but cannot change authoritative sequencing.
Habitat access is an explicit compiled Evolution capability. Growth rejects an
inaccessible biome before RNG consumption and explains the lock in Inspector.
Marine and cold access must remain costly, bounded, and ecologically distinct.
## 8. Interaction and presentation
- One gesture may replace one detail with another without being swallowed.
- Globe drag/pinch/wheel preserves an open detail pane.
- Same trigger toggles; another trigger replaces; Escape and Close work.
- Opening a pane never moves or zooms the globe.
- All visible controls work through real pointer/touch and keyboard input.
- Metric controls retain visible affordance without hover.
- Skill/Trophy notifications are queued, bounded, nonblocking, and accessible.
- No dead control, fake metric, placeholder content, or silent transaction
  failure is acceptable.
## 9. Persistence
Validate every field. Migrate old Adaptation settings/state, the 642-cell Skill
schema, Trophy aliases, History, exports, and product namespaces idempotently.
Never duplicate or lose Echoes, current Skill ownership, legacy Skill value,
Trophies, Imprints, History, scores, runs, seed cursors, or rewards. Old
Adaptation History remains readable but cannot affect current simulation.
Corruption degrades field by field. Storage-unavailable sessions remain playable
and report temporary persistence honestly.
## 10. Development and structure
Work autonomously through:
`inspect → reproduce → model → implement → test → measure → integrate →
document → commit → push → verify`
Do not stop after a plan, mockup, migration scaffold, or foundation commit.
Prefer complete vertical slices. Delete obsolete Adaptation and 642-tree code
and tests in the same turn.
The historic 200-line/16-child limits are maintainability heuristics, not product
laws. Prefer focused modules, but revise the checker/docs when arbitrary numbers
distort architecture. Git history is the archive; do not create graveyard
directories.
Production remains browser-native HTML/CSS/ES modules. Prefer JS/TS and Node
tooling. Avoid new shipped dependencies. Use deterministic data-oriented
per-cell systems and bounded queues/buffers/caches.
## 11. Verification
Use production modules, not copied simplified models.
```bash
npm run test:unit
npm run test:integration
npm run balance:smoke
npm run benchmark
npm run check:links
npm run check:structure
npm run verify
npm run test:browser:file
npm run test:browser:canvas
npm run balance
npm run audit:cell-visuals
npm run audit:lakes
npm run audit:events
npm run audit:skills
npm run audit:trophies
npm run terminal:soak
```
Add or update audits for:
- 252-cell topology/economy/effects/migration;
- SCORE progression at fresh, 3-world, first-cycle, mid, and full progression;
- early extinction-cause and event-onboarding distributions;
- cold/marine habitat locks and unlocks;
- complete absence of active Adaptation code and UI.
Browser interaction defects require real CDP pointer/keyboard input. Test fresh
and migrated saves, Worker/fallback, speed invariance, WebGL2/Canvas, responsive
viewports, repeated world replacement, and bounded memory.
A skipped test is not a pass. Physical-device claims require a physical device.
## 12. Git, deployment, and documentation
Make coherent commits, preserve history, and never force-push unless explicitly
ordered with understood consequences. Verify branch/upstream, Actions, Pages,
cache-busted public bytes, and the exact reviewed revision.
Update README, focused docs, this file, and `docs/status.md`. Remove current
Adaptation and 642-cell claims rather than retaining contradictory prose.
## 13. Definition of done
A task is complete only when requested balance works in the real product;
obsolete systems/dead code are removed; authority, Worker/fallback, rendering,
UI, persistence, History, scoring, and progression agree; fresh and migrated
states work; relevant gates and real-browser paths pass; performance and memory
remain bounded; docs are truthful; requested commits are pushed; and the exact
build is deployed when in scope.
Report starting/final commits, root causes, score/economy models, measured
distributions, migration results, exact tests/audits/browser evidence, hashes,
performance, responsive/accessibility results, push/CI/Pages revision, modeled
versus measured claims, limitations, and next actions.
