# AGENTS.md — current superseding contract
> Revision: 2026-08-04. Replace the repository-root `AGENTS.md` with this file.
> Do not merge obsolete requirements back into it. This contract applies to the
> whole repository unless a narrower `AGENTS.md` overrides one local detail.
## 1. Authority and freshness
Follow, in order: platform instructions; the user's current explicit task and
corrections; this file; actual source/tests/schemas/deployment; focused docs;
status reports and old commits as historical evidence only.
A current user decision overrides stale tests, prose, status reports, and past
architecture. Replace tests that protect rejected behavior. `docs/status.md` is
a release snapshot, not a constitution. Update this file whenever durable
product policy changes.
At the start of substantial work, inspect Git state, remotes, HEAD, deployed
revision, relevant source/tests, persisted schemas, and intentional uncommitted
work. Reproduce reported behavior before assuming its cause. Never reset or
discard unrelated work merely to obtain a clean tree.
## 2. Canonical identity
- Product/package: `cell-sphere-game`.
- Repository: `lkjsxc/cell-sphere-game`.
- Pages: `https://lkjsxc.github.io/cell-sphere-game/`.
- Tagline: `Every extinction becomes memory.`
`incremental-network-game` is legacy identity allowed only in isolated
migration code/tests or clearly historical evidence.
## 3. Core product direction
- The game is an autonomous deterministic spherical ecology with no active
  mid-run Adaptations system.
- A whole cell is the smallest visible world-surface unit.
- Freshwater is represented by whole-cell lakes, shores, wetlands, and local
  influence; sub-cell rivers, paths, ribbons, and terrain glyphs remain
  forbidden.
- A new save initially spreads mainly through resource-rich ecological niches,
  not nearly every ordinary land cell.
- Per-cell resource state, habitat, moisture, temperature, toxicity, life, and
  transformation determine world-surface color. Global time or ENTROPY must not
  recolor or desaturate the whole terrain.
- Resource-poor and exhausted cells must be visually legible as poor or
  exhausted. Recovering cells must look distinct from untouched rich cells.
- Freshwater proximity provides a real but finite survival advantage.
- Ordinary worlds remain approximately 270–330 game seconds with a bounded
  terminal near 360 seconds.
- The first campaign resolution remains approximately 18–24 minutes at 1x.
- Full Evolution/Trophy mastery remains a long-horizon pursuit.
## 4. Evolution and World Potential
- Evolution remains a 252-cell frequency-5 geodesic sphere.
- Skill eligibility is enough Echoes plus at least one directly adjacent owned
  cell. No run-count, all-parent, or hidden experience gate.
- Evolution uses six visible environmental affinities:
  Fertility, Freshwater, Scarcity, Cryogenic, Marine, and Luminous.
- Affinity colors, patterns, labels, and effects correspond to the habitats or
  cell states they improve. Color is never the only cue.
- Skills may combine into visible build recipes and synergies; synergies are not
  hidden.
- The first purchased Skill must not multiply World Potential or expected SCORE
  by an order of magnitude. From a 16,000 fresh potential, the first purchase
  should normally add only about 2,000–4,000 and the next-world SCORE should
  remain roughly 10,000–20,000.
- World Potential is derived from bounded Evolution Power through a versioned
  monotone curve. Do not store a 100,000-plus early absolute potential jump on
  one root.
- Progression targets remain smooth: about 80,000–130,000 after roughly
  12–18 minutes, and about 850,000–1,100,000 for strong late/full progression.
- Every purchase shows gameplay before/after, World Potential before/after,
  affinity, synergy progress, cost, and newly available neighbors.
## 5. SCORE
- SCORE uses one versioned production model shared by HUD, Result, audits, and
  agent play.
- Live SCORE is monotone nondecreasing and grows from cumulative authoritative
  accomplishments rather than unstable snapshot ratios.
- Final SCORE should already be substantially visible before extinction; Result
  must not introduce a surprising large correction.
- Camera, UI, quality, frame rate, speed, and developer mode never affect SCORE.
- Fresh final SCORE targets roughly 8,000–15,000.
- One early Skill does not jump a normal 10,000 result to roughly 100,000.
- One million is a strong late-game outcome, not an automatic consequence of
  one or a few purchases.
- Old SCORE models remain readable as legacy records but do not block current
  personal bests.
## 6. Builds, transformation, and Reach 100%
Support many mechanically distinct, combinable builds. At minimum the released
system must include viable paths for sustainability, freshwater, scarcity
reclamation, cold survival, marine use, and bioelectric infrastructure.
Evaluate and implement coherent combinations such as lake gardens, circular
metabolism, wasteland reclamation, cold dormancy, cryogenic lakes, salt
harvesting, pelagic forests, hydrothermal power, bioelectric wetlands, and an
illuminated biosphere. Examples are design input, not permission for incoherent
features.
World transformations remain whole-cell, deterministic, bounded, and visible.
Electricity is represented by whole-cell energized illumination, never wires.
`REACH 100%` is an explicit late-game goal: all authoritative world cells alive
simultaneously for a documented minimum interval. It must be possible on some
valid late-game seeds/builds, never available to a fresh save, and must not make
extinction impossible afterward.
## 7. Speed and developer mode
- Normal player speeds are 1x, 2x, 4x, and 8x only.
- 16x and above are unavailable in normal UI and validated settings.
- Explicit developer mode may expose 16x, 32x, 64x, 128x, and 256x.
- Developer mode is visibly marked, session-scoped or explicitly enabled, and
  excluded from ordinary exports/preferences.
- Every speed executes every authoritative tick. High-speed rendering and
  snapshots may be decimated, but simulation may not skip work or change
  outcomes.
## 8. Agent-play contract
Maintain a machine-readable, deterministic agent-play interface backed by the
production simulation, scoring, Skill, Trophy, History, and migration modules.
A fair agent observation exposes only player-visible information. Supported
actions include observing progression, buying an available Skill, starting the
next world, and reviewing results/builds. Hidden future events or raw secret
state are not fair-policy inputs.
Provide deterministic policies for at least balanced, sustainability,
freshwater, scarcity, cryogenic, marine, luminous, terraforming, and Reach-100
goals. Use the interface for real balance iterations, not only smoke tests.
## 9. Architecture and determinism
Default dependency direction:
`interface → rendering → simulation → world → core`
Simulation imports no DOM, WebGL, storage, UI, or wall-clock presentation state.
Rendering never mutates authority. Worker and fallback use the same production
simulation. Reject stale run/session/request messages. Commands are acknowledged
or explicitly rejected.
Extinction, abandonment, continuation, reward, Skill, Trophy, transformation,
world replacement, and migration transactions are idempotent exactly once.
Use isolated deterministic RNG streams. Never use `Math.random()` in authority
or seeded content.
## 10. Interaction and UI
- Globe drag/pinch/wheel preserves an open detail pane.
- Opening a pane never moves or zooms the globe.
- SCORE, ENTROPY, REACH, and terminal RESULT are visibly interactive without
  hover, with persistent border/background/disclosure cues.
- RESULT occupies the metric sequence immediately after REACH and becomes a
  clearly recommended action at extinction.
- Result does not duplicate SCORE-details, ENTROPY-summary, REACH-summary,
  Evolution, or Trophies navigation already available elsewhere.
- All visible controls work through real pointer/touch and keyboard input.
- Notifications are queued, bounded, nonblocking, and accessible.
## 11. Persistence and migration
Validate every loaded field. Migrate previous 642-cell and current 252-cell
schemas, affinity/content changes, habitat capabilities, SCORE versions,
Trophy aliases, History, and exports idempotently.
Never duplicate or lose Echoes, recognized Skill value, Trophies, Imprints,
History, scores, runs, seed cursors, transformations, or rewards. Migration
never charges the player. Old Adaptation History remains readable and inert.
Corruption degrades field by field. Storage-unavailable sessions remain playable
and report temporary persistence honestly.
## 12. Development and structure
Work autonomously through:
`inspect → reproduce → model → implement → test → measure → play →
integrate → document → commit → push → verify`
Do not stop after a plan, mockup, scaffold, or foundation commit. Prefer complete
vertical slices. Delete obsolete code and tests in the same turn.
The historic 200-line/16-child limits are maintainability heuristics, not product
laws. Prefer focused modules, but revise the checker/docs when arbitrary numbers
distort architecture. Git history is the archive; do not create graveyard
directories.
Production remains browser-native HTML/CSS/ES modules. Prefer JS/TS and Node
tooling. Avoid new shipped dependencies. Bound buffers, queues, logs, caches,
notifications, and agent-play state.
## 13. Verification
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
npm run agent:smoke
npm run agent:campaign
```
Add or update audits for local resource color/state, resource-gated colonization,
freshwater survival advantage, smooth World Potential/SCORE, build diversity,
habitat transformations, standard/developer speed exposure, Reach 100%, and
agent-play fairness.
Browser interaction defects require real CDP pointer/keyboard input. Test fresh
and migrated saves, Worker/fallback, speed invariance, WebGL2/Canvas, responsive
viewports, repeated world replacement, and bounded memory.
A skipped test is not a pass. Physical-device claims require a physical device.
## 14. Git, deployment, docs, and completion
Make coherent commits, preserve history, and never force-push unless explicitly
ordered with understood consequences. Verify branch/upstream, Actions, Pages,
cache-busted public bytes, and the exact reviewed revision.
Update README, focused docs, this file, and `docs/status.md`. Documentation
follows implemented truth.
A task is complete only when requested behavior works in the real product;
authority, Worker/fallback, rendering, UI, persistence, History, scoring,
progression, agent play, and migrations agree; relevant gates and browser paths
pass; performance/memory stay bounded; commits are pushed; and the exact build
is deployed when in scope.
Report starting/final commits, root causes, models, measured distributions,
playtest outcomes, migration evidence, exact tests/audits/browser results,
hashes, performance, responsive/accessibility evidence, push/CI/Pages revision,
limitations, and next actions.
