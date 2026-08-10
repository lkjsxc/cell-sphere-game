# AGENTS.md

## Purpose
This file is the standing repository contract for coding agents working on `lkjsxc/cell-sphere-game`.
Read it before editing code.
Read the repository before trusting this document about implementation details.
Treat the product rules in this document as authoritative until the user explicitly supersedes them.
The user authorizes substantial changes.
Long-term product quality is more important than preserving prior implementation choices.
Backward compatibility is not a goal.
Old local data, old schemas, old node IDs, old replay formats, and old internal APIs may be discarded.
Do not preserve a weak design merely because code already exists for it.
Do not turn that freedom into speculative architecture.
Choose the smallest coherent system that can satisfy the product contract and be tested convincingly.

## Product north star
`cell-sphere-game` is an autonomous ecological roguelite played on a cellular sphere.
The player observes a living network spread across a finite world.
The world is attractive, legible, and materially constrained.
Resources are finite enough that extinction is inevitable.
Environment Level rises with elapsed authoritative world time.
Each new world starts again at Environment Level 0.
Extinction converts realized performance into permanent progression currency.
Permanent Evolution changes the rules inherited by later worlds.
Early worlds are short, fragile, and restricted to favorable cells.
Evolution gradually enables broader habitat use, stronger reproduction, better resource efficiency, longer survival, and more expressive worldmaking.
The core emotional arc is:
1. A small organism begins in a rich place.
2. It expands autonomously.
3. Local abundance is consumed.
4. The network struggles.
5. The final cells disappear.
6. The result makes the failure understandable.
7. Evolution offers one meaningful permanent improvement.
8. The next world survives differently and usually longer.
9. The player can see the accumulated biological history in the living world itself.
The product should be understandable without reading a manual.
The globe is the primary interface.
UI exists to explain and support the globe, not compete with it.

## Product vocabulary
Use `World` for one autonomous run.
Use `Environment Level` for the within-world chronic pressure clock.
Use `Evolution` for permanent progression.
Use `Echoes` for permanent progression currency unless the user explicitly renames it.
Use `History` for durable observation of prior moments and completed worlds.
Use `Result` for the terminal summary of one world.
Use `SCORE` for realized world performance.
Use `REACH` for the proportion of world cells that life currently occupies or has meaningfully occupied, according to the current scoring contract.
Use `Luminous` for the bioelectric Evolution domain.
Do not reintroduce retired public terminology merely because an old schema or test mentions it.

## Non-goals
Do not add manual unit control.
Do not add combat.
Do not add disaster cards, event attacks, or a hidden game director.
Do not add random choice popups during a world.
Do not add a separate adaptation draft.
Do not make the player click repeatedly to keep life alive.
Do not turn the simulation into a conventional idle-game spreadsheet.
Do not expose internal simulation telemetry merely because it exists.
Do not create lore systems before the core loop is excellent.
Do not add a framework to solve ordinary DOM and module problems.
Do not add an ECS unless measured evidence proves that the current typed-array model cannot meet requirements.
Do not build a generic replay engine when bounded render-history checkpoints are sufficient.
Do not build a generic graph editor for Evolution.
Do not preserve obsolete compatibility layers.
Do not maintain two authoritative implementations of the same rule.
Do not create procedural filler content to reach an arbitrary catalog size.
Do not replace product judgment with a larger settings menu.
Do not treat more UI as more clarity.

## Engineering posture
Prefer deletion over adaptation when the old abstraction encodes the wrong product.
Prefer direct data flow over indirection.
Prefer explicit state machines over scattered booleans.
Prefer typed arrays in simulation and rendering hot paths.
Prefer immutable snapshots at authority boundaries.
Prefer pure functions for scoring, progression compilation, schedules, and codecs.
Prefer one owner for each scroll region.
Prefer one owner for each surface.
Prefer one source of truth for each formatted metric.
Prefer relative visual tests over brittle exact-color snapshots.
Prefer paired-seed cohort tests over anecdotes.
Prefer browser evidence over CSS inspection alone.
Prefer current-only schemas over migration code.
Prefer comments that explain invariants and tradeoffs.
Delete comments that narrate obvious syntax.
Keep modules cohesive.
Split files when a clear responsibility boundary exists.
Do not split files solely to satisfy an arbitrary line count.
Do not merge unrelated responsibilities into a universal manager.

## Required working protocol
Start every substantial task by checking the current branch, worktree, and recent commits.
Read the current root `AGENTS.md`.
Read `docs/status.md`.
Read the active work note, if one exists.
Inspect the actual implementation paths involved in the request.
Reproduce the user-visible problem before proposing a fix when practical.
Record a baseline before changing performance, balance, persistence, or rendering.
Use a single concise work note for a multi-turn initiative.
Do not create a forest of planning documents.
Update the work note after each coherent phase.
The work note must state:
- starting revision;
- current branch;
- relevant dirty files;
- confirmed root causes;
- decisions made;
- completed phases;
- verification performed;
- evidence not yet obtained;
- exact next coherent phase.
Commit coherent phases separately when repository access permits.
Do not leave an old authority path active beside its replacement.
Do not claim completion from source inspection alone.
Do not claim physical-device behavior without physical-device evidence.
Do not claim deployment without deployment evidence.
Do not claim CI success unless CI ran.
If execution limits stop the task, stop at a coherent boundary and leave the repository buildable.

## Source architecture
Keep the native ES module architecture unless evidence supports a change.
Keep the browser entry point small.
Keep simulation authority outside the DOM.
Keep rendering read-only with respect to simulation authority.
Keep History observational.
Keep UI formatting out of simulation hot loops.
Keep persistence behind narrow platform modules.
Keep deterministic game rules independent of wall-clock time.
Keep the Worker protocol explicit and versioned.
Keep world-session identity checks at asynchronous boundaries.
Keep stale Worker messages unable to mutate or present the current world.
Keep renderer state bound to the current world session.
Keep progression purchases transactional and idempotent.
Keep agent play on production simulation authority.
Do not create a parallel simplified simulator for tests or agents.

## Determinism
A world is determined by explicit inputs.
At minimum, those inputs include the world seed, compiled Evolution state, and versioned rule constants.
The same inputs must produce the same authoritative result.
Rendering time must not alter simulation authority.
DOM state must not alter simulation authority.
History playback must not alter simulation authority.
Frame rate must not alter simulation authority.
Game speed changes wall-clock presentation rate, not tick semantics.
Pause changes tick advancement, not accumulated hidden pressure.
Environment Level is derived from authoritative world ticks.
A new world always derives Environment Level from tick zero.
No prior world may leak its Environment Level into a new world.
Use deterministic tests for all new mechanics.

## World ecology
The world begins with visible ocean.
No starting build may erase the ocean before life expands.
Water, land, lakes, coast, forest, cold regions, poor terrain, and rich terrain must remain whole-cell visual concepts.
Adjacent cells are the primary spatial relationship.
Do not reintroduce decorative graph edges as gameplay geometry.
Early life should establish in favorable terrain.
Fresh progression should not spread freely through every biome.
Rich cells should be visibly inviting.
Poor and depleted cells should be visibly exhausted.
Resource appearance should follow resource condition, not an arbitrary global color timer.
Expansion should consume local resources.
Maintenance should create persistent ecological cost.
Renewal should be bounded.
Recycling may delay extinction.
Recycling must not create an unbounded positive loop.
Habitat unlocks may broaden viable territory.
Habitat unlocks must still carry ecological costs.
The simulation must eventually extinguish under unbounded Environment Level.
No build may become literally immortal.

## Early-world balance
Fresh progression should usually die quickly.
The fresh cohort should commonly fail because it cannot reproduce far enough, cannot maintain its network, or cannot leave favorable terrain.
Fresh progression should not commonly reach a mature planetary network.
Fresh progression should not commonly reach high Environment Levels.
The first few completed worlds should feel fragile rather than merely shorter versions of late worlds.
The first permanent purchases should produce visible and measurable improvement.
Improvement should be causal.
Do not use world ordinal, pity multipliers, or hidden run-count bonuses to fake progress.
Use paired seeds to compare progression states.
Do not require every upgraded run to outlive its fresh counterpart.
Require a clear upward distributional trend.
Measure median, quartiles, paired win rate, peak reach, habitat occupancy, Environment Level reached, and extinction cause.
Use a holdout seed set when tuning.
Do not tune solely to the development seed set.
Keep provisional timing targets in the balance documentation.
Change timing targets only with written product reasoning and evidence.

## Environment Level
Environment Level is a within-world clock.
Every world starts at Level 0.
The level rises from authoritative elapsed ticks.
The schedule may be unbounded.
Pressure effects must remain finite and numerically safe.
Environment Level must not be permanent progression.
Evolution may help life withstand higher levels.
Evolution must not change the fact that a new world starts at Level 0.
The World HUD displays the current level.
Activating `ENV LEVEL` opens a dedicated current Environment Level detail.
It must not open History.
The detail must explain the current state, not present a timeline.
The detail should include:
- current level;
- progress to the next level;
- game-time remaining until the next transition;
- the current chronic pressure dimensions;
- the strongest current pressure;
- a concise explanation that every world starts at zero;
- terminal peak/final context after extinction when relevant.
The detail should update at a bounded cadence.
Do not update DOM text every animation frame.
Do not expose giant exact integers when a compact presentation is clearer.
Preserve an exact accessible value where useful.
Do not make the Environment detail a second History surface.

## World HUD
The standard World metric order is:
1. SCORE
2. REACH
3. ENV LEVEL
4. RESULT, only when a result exists
Metric containers must not change width when values gain digits.
Use stable grid tracks.
Use tabular numerals.
Use compact deterministic formatting for very large values.
Expose an exact value through an accessible label or detail surface when the visible value is abbreviated.
Do not allow one long metric to push another metric around.
Do not allow value changes to move the globe controls.
Do not allow a terminal RESULT control to cause horizontal overflow.
Measure actual bounding rectangles before and after representative value transitions.
Test values around formatting boundaries.
At minimum, test:
- 0;
- 9;
- 10;
- 99;
- 100;
- 999;
- 1,000;
- 9,999;
- 10,000;
- a large engineering-notation value.
Apply the same stability rule to Echoes, Evolution levels, countdown labels, result values, and repeated numeric cards.

## Result
Extinction must produce an unmistakable Result.
The result must explain why the world ended.
The result must show SCORE and Echoes clearly.
The result may show a small number of meaningful realized score axes.
Do not show predictive World Potential.
Do not show a modeled future score range.
Do not bury the primary next action below a long scroll.
On small viewports, the `Next World` action must remain reachable without scrolling to the end of the content.
An automatic next-world countdown, when enabled, must remain visible.
Place the countdown in a sticky header or sticky action footer.
Do not place the only countdown status at the bottom of a scroll body.
Any trusted user interaction cancels automatic continuation according to the continuation policy.
The cancellation must be deterministic and tested.
The Result body may scroll.
The Result header and primary actions should remain stable.
Avoid nested scrolling inside Result.

## Menu
The menu is not a second navigation system.
Global scene navigation already owns Home, World, Evolution, and Trophies.
Do not duplicate those destinations in the menu without a demonstrated need.
The menu should contain only common, understandable actions.
A reasonable production menu contains:
- History access during a live world, if no equally clear direct route exists;
- New World, only when relevant and clearly destructive;
- automatic continuation preference;
- motion preference;
- contrast preference;
- a simple quality preference if automatic quality is insufficient;
- a collapsed secondary data/reset area.
Remove duplicate default-speed settings when the in-world speed control already persists the preference.
Remove technical History-retention controls from normal product UI.
Choose adaptive internal retention instead.
Remove camera-inertia tuning unless user testing proves it important.
Remove idle-rotation tuning unless user testing proves it important.
Remove camera reset from the normal menu unless the camera can become meaningfully lost.
Remove duplicate Result access when the RESULT metric already exists.
Remove production diagnostics.
Diagnostics belong behind explicit developer mode.
Do not label a rendering-quality preset `Luminous`.
That name belongs to Evolution.
Data export, import, History clearing, and progression reset may remain in a collapsed `Data and reset` area.
Destructive actions require explicit confirmation.
Do not let secondary data tools dominate the menu.

## History purpose
History helps the player understand how a world changed.
History is the sole durable temporal observation surface.
Environment detail is not History.
An Event Log must not exist as a separate competing surface.
History may combine a timeline and visual playback.
It must feel like one coherent product.
It must not feel like a developer trace viewer.
History should answer:
- Which world am I viewing?
- What time am I viewing?
- What did life look like then?
- What materially changed around that time?
- Am I viewing live state, a historical checkpoint, or semantic-only data?
History should not answer every internal debugging question.

## History information architecture
Use one primary scroll owner.
Do not place a short nested scrolling list inside an already scrolling panel.
Do not create a narrow timeline viewport inside a large empty frame.
Keep the header and core playback controls stable.
Allow the timeline content to use the available body height.
On desktop, a bounded side surface is acceptable.
On mobile, a bottom sheet is acceptable.
On short landscape viewports, a side surface is usually preferable.
The globe should remain visible where practical.
Playback controls must remain usable with touch.
Targets must meet the minimum touch size.
The range control must receive meaningful width.
Previous, next, and live controls must not squeeze the range to an unusable sliver.
A compact two-row control layout is acceptable on narrow screens.
A world selector must not force horizontal overflow.
A selected event must be visually distinct.
A selected checkpoint must be visually distinct.
Timeline entries should be concise.
Avoid repeated boilerplate prose.
Use progressive disclosure for secondary semantic detail.

## History visual truth
History may be approximate.
History must never be misleading.
Never label the globe as an earlier time while rendering the current live snapshot.
Never render a prior world using unrelated current-world dynamic buffers.
Never show a historical Luminous state without its historical charge state.
Never show current resource depletion at an old checkpoint.
Never show current transformations at an old checkpoint.
When visual data is loading, present an explicit loading state.
Disable or defer historical seeking until a renderable checkpoint is available.
Switch the label, snapshot, and controls atomically.
When visual data is unavailable, show semantic History honestly.
Do not substitute a fabricated visual reconstruction.
The visual History format should store only channels needed to reproduce meaningful appearance.
It is not a full simulation save.
The required render-semantic channels normally include:
- tick;
- alive/life state;
- biomass band;
- stress band;
- resource condition;
- resource richness when visually necessary;
- transformation state;
- effective biome when transformation state is insufficient;
- bioelectric charge;
- frame-level Luminous development;
- atmosphere or world-wear value if it materially changes the render;
- terminal/checkpoint flags.
Use the static world seed and generated fields for immutable geography.
Do not duplicate immutable geography per frame.
Use bounded quantization.
Use bounded retention.
Prefer adaptive checkpoint thinning to an unbounded log.
Preserve terminal, initial, and meaningful transition checkpoints.
Preserve enough ordinary checkpoints for motion through the run.
Version the codec.
Because backward compatibility is not required, delete the old codec path when the replacement is complete.
Do not keep a v1 decoder in production without a current need.

## Evolution product model
Evolution is a physical sphere of Skill Cells.
The current old 252-cell, six-bootstrap-root, procedural-resonance design is not a product constraint.
The replacement begins from exactly one root.
The canonical root concept is `First Division`.
The root represents the organism learning to establish and reproduce reliably.
A fresh progression state may purchase only this root.
No other starting cell is reachable.
The immediate physical neighbors of the root must be major general survival abilities.
The first ring must not begin with obscure specialist systems.
Good first-ring concepts include:
- more reliable budding;
- better nutrient uptake;
- lower maintenance;
- larger energy reserve;
- stronger local repair;
- more stable transport or cohesion.
Use actual physical adjacency as the unlock rule.
A Level 1 or higher adjacent cell opens a frontier cell.
Owned cells may receive additional levels indefinitely.
Levels must have diminishing bounded effects.
Costs must grow monotonically.
The early purchase cadence must support one understandable decision after most early extinctions.
The graph must remain useful indefinitely.
Infinite levels do not justify infinite visual clutter.

## Evolution topology and content
Prefer a compact geodesic sphere.
A frequency-3 sphere with 92 cells is the default target.
Use a smaller frequency-2 sphere with 42 cells if 92 durable authored abilities cannot be justified.
Do not create filler to preserve 92.
Do not use a higher frequency merely for visual density.
Every visible Skill Cell needs a durable purpose.
Every visible Skill Cell needs authored player-facing text.
Every visible Skill Cell needs a testable effect, unlock, or meaningful bounded refinement role.
Do not generate thirty near-identical resonance names per branch.
Specialized domains should emerge after the foundation ring.
The major specialization domains may include:
- Fertility;
- Freshwater;
- Scarcity;
- Cryogenic;
- Marine;
- Luminous.
Domains may overlap physically.
The sphere should feel like one ecology, not six disconnected menus painted on a globe.
Late cells may combine domains.
Capstones must change play visibly.
Capstones must not create immortality.
Do not expose implementation tags, compiler versions, or recipe accounting in normal detail UI.

## Evolution detail surface
The default detail surface should be concise.
Show:
- ability name;
- current level;
- one-sentence effect;
- exact next cost;
- clear before-to-after change;
- concise unlock reason when locked;
- purchase instruction when ready.
Hide secondary implementation detail unless it helps a real decision.
Do not show World Potential.
Do not show modeled SCORE ranges.
Do not show long lists of internal affinity tags.
Do not show build-recipe accounting by default.
Do not show document-security implementation language in ordinary progression.
Handle extreme imported values safely without making security boundaries part of the normal fantasy.
The primary purchase button remains available as an accessible alternative to second activation.

## Evolution interaction
First activation selects a Skill Cell.
Selection opens or updates its detail.
A second discrete activation on the same selected cell purchases exactly one level only when the cell is ready.
Ready means:
- the cell is reachable;
- the player has enough Echoes;
- the world is between runs;
- no transaction is in flight;
- the current level and revision still match.
A selected ready cell must look inviting.
It should use a unique center, ring, material, and restrained pulse.
A selected cell that is locked or unaffordable must not use the same purchase invitation.
A ready but unselected cell may look available.
It must be less emphatic than the selected ready cell.
The visual invitation must survive color-vision differences.
Use shape, contrast, motion, and text, not color alone.
The detail must state `Activate this selected cell again to unlock` or `...to upgrade` only when true.
Keyboard activation must follow the same two-step model.
The semantic tree must expose the same state.
Dragging the globe must not purchase a cell.
A blank tap must not purchase a cell.
A stale second activation must not spend Echoes.
A successful purchase spends once.
A rapid third activation must not accidentally buy another level.

## Evolution effects and survival
Evolution should generally increase survival time.
That relationship must arise from mechanics.
The main causal channels are:
- establishment reliability;
- reproduction viability;
- resource uptake;
- maintenance efficiency;
- storage;
- transport;
- repair;
- stress tolerance;
- habitat access;
- recycling;
- bounded worldmaking.
Do not add a direct hidden `survival time` multiplier.
Do not scale all stats from one generic power number.
Do not use a predictive World Potential multiplier.
Let different paths produce different survival shapes.
A reach-heavy path may spread farther and burn resources faster.
A scarcity path may grow slowly and last longer.
A marine path may open more cells at higher upkeep.
A Luminous path may improve powered transport and recovery after setup cost.
Use cohort evidence to ensure the overall progression trend remains upward.

## Luminous mechanics
Luminous is an authoritative bioelectric ecology.
The first meaningful Luminous purchase must be visible in the following world.
Do not require a deep three-node recipe before any cell can charge.
A first Luminous ability may enable modest charge on viable high-flux living cells.
Higher Luminous levels may improve:
- generation;
- retention;
- viable domain;
- transport efficiency;
- powered recovery;
- setup cost;
- upkeep efficiency.
Keep charge as whole-cell state.
Do not render decorative wires.
Do not fake charge in the renderer when authority is zero.
A powered cell must have a bounded ecological benefit.
A powered cell must also have setup or upkeep cost.
A viable Luminous build should improve survival distribution on suitable seeds.
An unsuitable or premature Luminous build may underperform a general foundation build.
This tradeoff is acceptable when visible and measured.
Charge must decay when generation stops.
Extinction must clear live charge.
Results may record realized powered-cell evidence.
History must preserve charge appearance.

## Luminous rendering
Living cells without Luminous should still have a subtle biological presence on the dark hemisphere.
That baseline must be clearly dimmer than powered Luminous cells.
The intended impression is a living analogue of Earth at night.
Powered cells should read as clustered cellular lights at globe scale.
Use warm amber, gold, or pale biological light.
Avoid uniform neon coverage.
Avoid a flat emissive wash over every living cell.
Avoid white clipping that erases cell shape.
Keep a visible cell core or local material structure.
Powered light should remain somewhat visible on the day side.
Its strongest contrast should appear on the night side.
Name shader factors truthfully.
A factor that is one on the lit side should be called `daylight`, not `night`.
Apply ordinary biological emission primarily on the dark side.
Apply powered emission more strongly on the dark side.
WebGL2 and Canvas 2D must communicate the same hierarchy.
Exact pixels do not need to match.
The semantic ordering must match:
1. unoccupied dark cell;
2. ordinary living dark-side cell;
3. powered living day-side cell;
4. powered living dark-side cell.
Higher Luminous development should increase visible intensity, duration, or coverage through authoritative state.
It should not be a quality-preset effect.

## Cell-sphere rendering
The sphere surface must read as continuous.
Tiny background gaps between adjacent cells are defects.
The defect is most important near the silhouette.
Do not preserve per-cell radial displacement if it separates shared boundaries.
Prefer a continuous spherical shell.
Create depth with fragment shading, inset patterns, boundaries, and material contrast.
Do not add mesh skirts unless a simpler continuous-shell solution fails.
Do not add a tessellation system.
Do not add another render pass solely to hide cracks.
WebGL2 and Canvas 2D must avoid visible background seams.
A low-contrast boundary line is acceptable.
A black or background-colored hole is not.
Use a forced uniform-material browser fixture to test seam continuity.
Inspect the center and limb.

## SCORE and Echoes
SCORE is based on realized world outcomes.
Do not multiply realized quality by permanent predictive World Potential.
Do not preview a modeled score range in Evolution.
A score may use realized dimensions such as:
- survival;
- unique exploration;
- sustained presence;
- coherence;
- stewardship;
- worldmaking;
- sustained Environment pressure performance.
Use a small number of explainable axes.
Avoid double-counting survival through several correlated terms.
Keep live SCORE monotone within a world if the UI promises monotonicity.
Echoes derive from realized SCORE.
Echo rewards should support the intended early purchase cadence.
Large values must remain exact in authority and compact in presentation.
Rank labels may continue indefinitely.
Do not let infinite ranks require unbounded tables.

## Persistence
Use current-only persistence.
Version every persisted document.
Reject or reset mismatched versions.
Do not migrate obsolete Evolution graphs.
Do not map old Skill IDs to new Skill IDs.
Do not translate old History codecs.
Do not preserve old World Potential fields.
Do not preserve old menu settings solely for compatibility.
Import validation must be strict.
A failed import must not partially persist.
Transactions must be atomic to the practical limits of browser storage.
History semantic data may live in local storage if bounded.
Visual History belongs in bounded device-local binary storage.
Export may omit device-local visual checkpoints when documented.
Data reset must be explicit.

## Responsive layout
Design from small screens first.
Required viewport evidence includes:
- 320 × 568;
- 360 × 640;
- 390 × 844;
- 430 × 932;
- 768 × 1024;
- 844 × 390;
- 1024 × 600;
- 1440 × 900.
Also test 200% text where practical.
Respect safe-area insets.
No production surface may cause horizontal page overflow.
The app shell should not depend on body scrolling.
A bounded surface may scroll internally.
That surface must own the scroll.
Avoid nested scroll areas.
Sticky headers and action footers must not overlap content.
The globe must not jump abruptly when a surface opens.
The selected cell should remain visible where layout allows.
Touch controls must be at least 44 CSS pixels in their primary dimension.
Controls must remain usable with coarse pointers.
Do not rely on hover.

## Accessibility
All meaningful controls require accessible names.
All visual states require non-color cues.
Use native buttons, selects, ranges, and details where they are suitable.
Preserve visible focus.
Keep focus within the active surface policy without turning nonmodal surfaces into inaccessible modal traps.
Return focus sensibly after closing a surface.
Announce purchases, failures, extinction, and destructive actions.
Do not announce high-frequency metric updates.
Respect reduced motion.
Pulse animations must become static emphasis under reduced motion.
Respect high contrast.
Do not hide exact state from keyboard users.
The semantic Evolution tree must match the visible sphere.
History controls must be operable by keyboard.

## Performance
Performance is a feature.
Measure before optimizing.
Retain the typed-array simulation design.
Avoid per-cell object allocation in hot loops.
Avoid rebuilding static geometry during ordinary frames.
Avoid recompiling Evolution during every frame.
Compile progression when inputs change.
Bound compile caches by count and bytes.
Bound History storage by bytes.
Bound semantic History entries.
Bound DOM lists.
Use event delegation when it reduces hundreds of closures without reducing clarity.
Do not micro-optimize cold code at the cost of readability.
Do not add a dependency to save a few lines.
Maintain the established simulation benchmark floor unless a documented replacement benchmark supersedes it.
Treat a regression greater than roughly ten percent as requiring investigation.
Keep renderer draw calls stable unless a measured visual gain justifies another pass.
Do not add post-processing bloom merely to make Luminous visible.
Prefer direct emissive material and relative contrast first.

## Testing
Every bug fix needs a regression test at the correct layer.
Pure rule changes need unit tests.
Authority-boundary changes need integration tests.
Layout and interaction changes need real-browser tests.
Renderer semantics need WebGL2 and Canvas evidence.
History fidelity needs codec, playback-state, and browser tests.
Balance needs multi-seed production-simulation audits.
Performance changes need benchmark evidence.
Test second activation with trusted pointer events.
Test keyboard activation separately.
Test that one purchase spends exactly once.
Test that unaffordable second activation spends nothing.
Test that dragging does not purchase.
Test ENV LEVEL opens Environment detail.
Test ENV LEVEL does not open History.
Test History remains reachable through its intended routes.
Test live History loading cannot display an old label over a live snapshot.
Test historical resource, transformation, and charge channels.
Test metric rectangles remain stable across value thresholds.
Test the Result countdown is visible at small viewports without scrolling to the bottom.
Test the primary Result action remains visible.
Test the menu no longer contains removed duplicate controls.
Test the sphere has no detectable interior background cracks in a uniform fixture.
Test ordinary night-side life is visible.
Test powered night-side life is materially brighter.
Test zero authoritative charge produces no powered emission.
Test WebGL2 and Canvas retain the same semantic order.

## Balance audits
Use production `RunController`.
Use explicit compiled Evolution fixtures.
Use deterministic seeds.
Use paired-seed comparisons.
Separate smoke validity gates from deeper statistical gates.
Smoke runs should remain CI-safe.
Deep tuning runs may be local or scheduled.
Write machine-readable reports.
Record the exact rule versions and progression fixture.
Record extinction distributions.
Record cause distributions.
Record habitat occupancy.
Record peak and sustained Reach.
Record Environment Level distribution.
Record powered-cell evidence for Luminous cohorts.
Record score and Echo distributions.
Keep development seeds and holdout seeds separate.
Do not approve a balance change from one seed.

## Browser evidence
Use the existing trusted CDP harness unless there is a concrete reason to replace it.
Exercise the production entry point.
Exercise the real Worker path and the fallback path.
Exercise WebGL2 and forced Canvas 2D.
Collect layout rectangles.
Collect scroll ownership evidence.
Collect focus evidence.
Collect state-machine evidence.
For rendering assertions, prefer controlled fixtures and relative luminance measurements.
Do not depend on a single exact screenshot hash across GPUs.
A screenshot may supplement measurements.
A screenshot does not replace semantic assertions.

## Documentation
Keep `README.md` product-facing.
Keep `docs/status.md` current and short.
Keep design documentation aligned with production behavior.
Delete stale statements during the same phase that changes behavior.
Do not document rejected architecture as current.
Do not preserve obsolete migration instructions.
Document balance targets as targets, not facts, until measured.
Document performance measurements with host and command.
Document unverified claims explicitly.
Use one active work note for a multi-turn initiative.
Archive or delete finished scratch notes when they no longer add value.

## Code style
Use English for code, comments, documentation, tests, and user-facing copy unless localization work is explicitly requested.
Use semicolons consistently with the existing codebase.
Use descriptive names.
Avoid ambiguous abbreviations in product code.
Short mathematical names are acceptable in tight numeric functions.
Keep functions focused.
Prefer early returns for invalid state.
Validate external data.
Freeze shared catalogs and immutable public records.
Use exact progression-integer helpers for unbounded authority values.
Use bounded numeric projections in hot loops.
Do not parse untrusted giant integers directly with native `BigInt` without the repository’s guards.
Do not use `innerHTML` for dynamic content.
Use `textContent` or node construction.

## Git hygiene
Do not overwrite unrelated user changes.
Do not discard a dirty worktree.
Do not commit generated reports unless the repository policy requires them.
Do not commit runtime artifacts.
Keep commits coherent.
Use messages that describe product or authority changes.
Run focused tests before broad verification.
Run broad verification before claiming the phase complete.
Record commands and outcomes.

## Completion standard
A phase is complete only when:
- the old conflicting path is deleted;
- the new path is authoritative;
- focused tests pass;
- relevant browser evidence passes;
- documentation matches;
- no known severe regression remains;
- performance or balance evidence exists when those areas changed;
- the work note identifies the next phase.
A feature is not complete because its source exists.
A feature is not complete because a unit test passes.
A visual feature is not complete until it is visible in the production renderer.
A responsive feature is not complete until small viewports are observed.
A balance feature is not complete until cohorts are measured.
A multi-turn initiative may stop before all goals are complete.
It must stop cleanly.
The repository must remain understandable to the next agent.

## Current correction priority
When this file is first introduced, prioritize the following in order:
1. Replace the ENV LEVEL → History route with dedicated Environment detail.
2. Stabilize metric and result geometry on small screens.
3. Simplify the production menu.
4. Rebuild History UX and visual truth.
5. Remove visible cell-sphere cracks by restoring a continuous shell.
6. Replace the old Evolution topology and filler content with one root and authored progression.
7. Retune early-world survival and habitat restriction.
8. Make first-level Luminous mechanics visibly illuminate real charged cells.
9. Remove World Potential and complete realized-only SCORE.
10. Consolidate tests, audits, documentation, and performance evidence.
Do not force all ten items into one unsafe commit.
Do not reorder them casually.
A later phase may expose a prerequisite.
Document the prerequisite and adjust the order deliberately.

## Final instruction
Build the best coherent version of the product, not the most elaborate version of the specification.
The player should see cause and consequence.
The player should see Evolution accumulating in the world.
The player should never need to understand the implementation to understand the game.
