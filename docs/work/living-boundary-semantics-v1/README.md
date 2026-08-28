# Codex Implementation Mandate — Living Boundary Semantics v1

## Implementation record

- Starting branch/revision: `main` at `ca1b05bf41d0d01c93e39979eedfc414bfc34956`, exactly aligned with `origin/main` (`0` ahead / `0` behind).
- Starting user work: the companion `AGENTS.md` modification and untracked `docs/campaigns/202608282058.md`; both were inspected and are nonconflicting. The companion contract is preserved in `d55addf`; the original user artifact remains untouched and untracked.
- Starting external state: workflow run `33163257669` succeeded for the starting revision; Pages is workflow-built from `main` at `https://lkjsxc.github.io/cell-sphere-game/`; remote `main` matched the starting revision.
- Confirmed root causes: the WebGL globe shader owns ordinary living/frontier whole-cell tint and dark-side emission; the boundary pass has static lake/coast data only; Canvas `lifeStyles` owns full/inset ordinary-life fills and separately draws geography boundaries.
- Reconciled owners: canonical edge endpoints/order are `topo.edgeA` / `topo.edgeB`; `dual.boundaryCornerA` / `dual.boundaryCornerB` use the same edge index. Live Worker/fallback, title showcase, and current/past visual History all provide categorical `lifeState` through the existing production renderer entry points.
- Active-checkout corrections: no separate `render-state.js` owner exists; render selection is directly owned by `AppController.frameStep`. Visual History v3 always reconstructs the required categorical state from its existing cell byte, biomass, and stress channels, so no codec, protocol, identity, or persistence change is required. The starting canvas was pointer-focusable only and therefore could not satisfy the mandated keyboard-inspection oracle; the bounded correction makes the canvas focusable and maps Enter/Space to the already-authoritative projected sphere-center pick.
- Baseline focused evidence: 39/39 selected renderer, History, Worker/fallback, and replacement tests pass; `audit:cell-visuals` passes; `showcase:check` reports source `a89fdfaf…`, 30 frames, and 230,904 bytes. Benchmark measured 9,731 ticks/s with authority hash `471ba1cc` and fresh profile hash `bec4a764`.
- Baseline browser evidence: trusted Chrome for Testing 152 passed Worker/WebGL2 at four draws with title render mean/p95 `0.96/1.20 ms`, and forced Canvas passed the same production shell/History/Luminous paths. One earlier WebGL attempt failed the timing-sensitive touch-release assertion and is not counted as a pass.
- Stopping-rule disposition: met. One shared deterministic projection is authoritative in WebGL2 and Canvas; the ordinary whole-cell predecessor is deleted; selected-scope local, CI, Pages, cache-busted-byte, and deployed controlled-browser evidence passes; no severe selected-scope regression remains.
- Completed coherent phases: Milestone 0 repository/external reconciliation, ownership trace, focused authority baseline, and trusted WebGL2/Canvas browser baseline; Milestone 1 shared edge projection and exhaustive semantic oracle; Milestone 2 atomic WebGL2/Canvas cutover, predecessor deletion, source audit, and controlled production-browser proof; Milestone 3 accessibility, responsive, fallback, context-loss, documentation, CI, Pages, deployed-byte, and deployed controlled-browser closure.
- Milestone 1 focused evidence: 5/5 `life-edges` tests pass alongside 21/21 affected renderer tests. All 36 categorical endpoint pairs and reversals prove symmetry, precedence, relation, finite one-byte output even with malformed unused intensity arguments, deterministic repetition, canonical `edgeA`/`edgeB` ordering, four-vertex expansion, and absence of time/camera/RNG/simulation dependencies.
- Selected packing: intensity was removed after browser timing showed that the authored categorical hierarchy did not consume it. One byte packs dominant state plus relation, making the canonical 7,680-edge projection 7,680 bytes and the existing four-vertex WebGL attribute 30,720 bytes as a portable `UNSIGNED_BYTE` scalar. This keeps four draws and avoids an unused dynamic channel.
- Milestone 2 browser evidence: `reports/life-boundary-final-webgl2.json` (`999e9ac1…`) and `reports/life-boundary-final-canvas2d.json` (`c46642a0…`) pass all calibrated inequalities with three identical renders per input, zero observed repeat noise, and a `0.004` normalized threshold. Ordinary interior delta is `0` in both backends; exposed/internal edge salience is `9.72×` in WebGL2 and `11.95×` in Canvas; occupied resource contrast retains `100%`; severe/remains pairs, non-color critical urgency, Luminous, selection, History, transformation, near/far/limb, and coincident geography checks all pass. The same reports prove production Inspector text for living, stressed, critical, remains, zero-charge, and powered inputs.
- Performance decision: three matched Chrome 152 cohorts compare the starting revision with final production code. Median WebGL steady/update p95 is `1.2/2.0 ms` versus `1.3/1.6 ms`; Canvas is `1.9/2.3 ms` versus `1.6/1.7 ms`. One Canvas final cohort was a host outlier (`4.6/8.3 ms`). The stable added cost is the required bounded Canvas stroke plus `O(edgeCount)` snapshot projection/batching; it remains well inside the frame budget and does not run because animation time advances. The one-byte cut reduced the initial WebGL steady p95 from `1.7 ms` to the final median `1.2 ms`.
- Final local browser matrix: Chrome 152 passes Worker/WebGL2, fallback/WebGL2, and Worker/Canvas with realized SCORE `192888`, current and past visual History, charged/zero-charge Luminous ordering, real Tab entry to the canvas, forced-color focus/textual Inspector evidence and focus restoration, eight responsive viewports, `200%` text, reduced motion, release motion, and continuous center/limb coverage. Both WebGL authorities retain four draws; the latest Worker/fallback title mean/p95 is `1.01/1.40 ms` and `1.03/1.40 ms`. The Worker run also passes real context loss into the production Canvas replacement.
- Final repository and CI gates: the focused edge/renderer/input set is 36/36; `audit:cell-visuals`, `audit:luminous`, `showcase:check`, `check:links`, README mirror equality, and `git diff --check` pass. Exact committed tree `e3db4aa8f24aade98c30e5c81d1540815ba13f63` passes all 26 `npm run verify` gates in an isolated worktree: 201 unit tests, 72 integration tests, structure, every production audit, title-showcase identity, links, and a 13,123-ticks/s benchmark with unchanged authority hash `471ba1cc` and fresh-profile hash `bec4a764`. Workflow run `33178892928` independently passes every mirrored gate for published implementation revision `7f4c25913caf2ccda46beccd905821fefc2de9fd`; verify job `98874659899` completed in 17m38s. `check:structure` in the active workspace still fails only on the preserved, untracked user artifact `docs/campaigns/202608282058.md` (944 lines and no directory README); that failure is not counted as a pass.
- Publication evidence: Pages job `98879669340` succeeded in 16s; deployment `6142915509` has success status `17463962115` at `https://lkjsxc.github.io/cell-sphere-game/`. Cache-busted public bytes exactly match local `index.html` (`dac192ed…`), `globe-input.js` (`557d108d…`), `layout.css` (`a0969bca…`), `life-edges.js` (`95c6c317…`), `world-pass.js` (`72ee47c0…`), `shaders-boundary.js` (`aacbffc4…`), `shaders.js` (`5de90c3c…`), and `fallback2d.js` (`085601ea…`). Deployed production WebGL2 and Canvas controlled fixtures pass every semantic inequality with zero repeat noise at threshold `0.004`; reports are `3e3aee75…` and `e33ffe69…`, with steady/update p95 `1.5/2.0 ms` and `1.6/2.7 ms` respectively.
- Failed attempts not counted as passes: the first revised Canvas Luminous oracle rejected a negative zero-charge contrast until it was corrected to bound only positive emission; the first limb probe placed the edge below the existing facing cutoff and was recalibrated to a still-limb-facing visible position. Two final Worker/WebGL attempts then exposed that the newly focusable canvas emitted `focusin` after `pointerdown` and cleared the release sampler; focusing before sampling preserved trusted activity and restored production mouse/touch release evidence. The first strengthened Worker forced-color run retained Chrome's hidden Begin-button navigation origin and did not Tab to the canvas; the oracle now establishes the document-body navigation origin before issuing a real Tab. The first isolated-verification command created the detached tree but accidentally ran from the active checkout; it was stopped, not counted, and repeated with an explicit detached-tree working directory. On first post-deploy use, Chrome received a transient HTTP 503 before a World began; both public routes then returned 200 and the retry passed. Two broad deployed shell attempts reached a live World but failed the existing timing-sensitive touch-release camera assertion; they are not counted as passes, do not contradict the passed exact-content local Worker/fallback/Canvas shell matrix, and do not weaken the deployed renderer proof. None of these attempts is counted as product evidence.
- Unavailable evidence: physical-device mouse, touch, pen, safe-area hardware, high-refresh, thermal, physical-screen-reader, and physical forced-colors checks were not available on this host.
- Exact next coherent step: `none`.


## Mandate metadata and authority

- **Repository:** `lkjsxc/cell-sphere-game`
- **Intended coding agent:** Codex CLI operating in the real repository checkout
- **Language:** use English for code, comments, tests, documentation, work records, commit messages, and player-facing copy
- **Asia/Tokyo timestamp:** 2026-08-28 20:58 JST
- **User-to-Codex artifact:** `202608282058.md`
- **Canonical repository work package:** `docs/work/living-boundary-semantics-v1/README.md`
- **Planning-system decision:** `docs/work/` is the current canonical work-package system; do not create `docs/campaigns/`, `prompts/`, or another competing planning tree
- **Nonbinding orientation branch and revision:** remote default branch `main` at `ca1b05bf41d0d01c93e39979eedfc414bfc34956`
- **Orientation commit:** `docs: close autonomous world contract evidence`
- **Active-work disposition at upstream inspection:** no active package; `docs/work/autonomous-world-contract-closure-v1/README.md` is terminal current evidence and must remain completed rather than being reopened
- **Companion contract:** replace repository-root `AGENTS.md` with the companion complete file supplied with this mandate, while preserving unrelated user work
- **Authorization:** the user authorizes routine technical judgment, coherent current-only breaking internal changes when genuinely required, deletion of superseded renderer paths and tests, coherent commits, a normal push, GitHub Actions verification, GitHub Pages deployment, cache-busted deployed-byte comparison, and deployed-browser verification when branch safety and credentials permit
- **Forbidden external actions:** no force-push, published-history rewrite, tag or release creation, issue or pull-request mutation, branch/ruleset/settings change, credential or secret mutation, unrelated publication, or destructive worktree cleanup
- **Repository safety:** inspect the active branch, `HEAD`, upstream, ahead/behind state, worktree, and recent commits before editing; preserve every unrelated tracked or untracked change; never reset or clean a dirty worktree destructively
- **Reconciliation requirement:** this mandate is an implementation specification, not a request for another broad plan. Reconcile its orientation snapshot with the active checkout, resolve only the bounded empirical questions identified below, then implement the objective

> **Primary objective:** make ordinary World life state read primarily through dynamic cell perimeters and inter-cell boundaries in both WebGL2 and Canvas 2D, while preserving biome and resource interiors, geography edges, selection, History, Luminous charge, deterministic authority, the four-draw WebGL posture, and current performance bounds.

> **Stopping rule:** stop when one shared, deterministic life-edge projection is authoritative for both renderer backends; ordinary living and frontier state no longer depend on destructive whole-cell recoloring; stress, critical state, and remains retain a distinct subordinate hierarchy; every conflicting predecessor path and current claim is deleted or superseded; controlled browser, accessibility, fallback, performance, CI, Pages, and deployed-behavior evidence passes or is honestly classified; and no severe selected-scope regression remains.

Do not continue into atmosphere smoothing, simulation balance, Environment redesign, Evolution topology or economy, camera or speed changes, Result changes, or adjacent visual polish after this stopping rule is met.

---

## 1. Executive outcome

At completion, a player watching a World must be able to read the living ecology from the cellular boundaries themselves.

1. A living region has a clear perimeter where active life meets inactive territory. Its expansion and contraction are visible without painting the whole occupied cell white, cream, or a dominant life color.
2. Boundaries between two ordinary living cells remain present but quieter than the exposed frontier. The World still reads as cellular rather than as one undifferentiated blob or a dense wireframe.
3. Stress, critical state, and dead remains have a stable visual hierarchy carried primarily by boundary treatment. Critical state is more urgent than stress; remains are visibly residual rather than alive or powered.
4. Biome, local resource richness, depletion, recovery, lakes, shores, transformations, and terrain remain legible inside occupied cells.
5. Ordinary life does not resemble Luminous charge. A zero-charge living cell has no powered emission, while authoritative charge remains an unmistakable whole-cell bioelectric state.
6. Selection, History emphasis, coast and lake boundaries, and other established semantic cues remain independent and legible when they overlap life boundaries.
7. WebGL2 and Canvas 2D consume the same life-edge classification and preserve the same semantic ordering, even though exact rasterization and pixels differ.
8. Live Worker, live fallback, current History, past visual History, and the title showcase all project the same snapshot life semantics without adding simulation or persistence authority.
9. WebGL2 still uses the existing four World draws. No extra renderer pass, higher simulation topology, post-processing system, or player setting is introduced.
10. Camera, framing, speed, Result continuation, Environment, Evolution, ecology, SCORE, rewards, persistence, and World identity are unchanged.
11. The selected-cell inspector remains a non-color textual oracle for life, role, resource, stress, and Luminous state. The visual cutover does not make canvas color the sole accessible source of meaning.
12. Current documentation says that whole cells remain the simulation and geography unit while ordinary life presentation is edge-primary. It no longer states that whole-cell material is the primary visual for ordinary life.

---

## 2. Why this campaign was selected now

The immediately preceding autonomous-World campaign is complete. It closed the public speed ladder, 13.5-second Result continuation, wide responsive composition, release evidence, CI, Pages, and deployed interaction. Reopening that work would consume constrained Codex time without addressing the current player concern.

The latest explicit user direction is that living status should be communicated by lines along boundaries between cells rather than by changing the cells themselves. Current production source contradicts that direction in a specific, well-bounded way:

- the WebGL globe shader mixes ordinary life, frontier, stress, critical state, and remains into whole-cell material;
- the WebGL boundary pass carries static lake and coast features but no life data;
- Canvas 2D fills or insets whole cells for life and treats its boundary path primarily as geography;
- current rendering documentation says life changes whole-cell material;
- the life-state authority and visual History already provide the semantic inputs needed for an edge projection.

This is therefore a renderer-semantic cutover, not a simulation feature, CSS adjustment, or balance retune.

### Candidate comparison

| Candidate | Player value | Root-cause confidence | Dependency closure | Codex cost and risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Living boundary semantic cutover | High: directly answers the current user concern and improves moment-to-moment ecological legibility | High: current life fill and static boundary owners are known | High when limited to one shared projection, two renderer consumers, deletion, fixtures, docs, and deployment | Moderate and independently verifiable | **Selected** |
| Smooth atmosphere independent of gameplay topology | High visual value, but a different silhouette/geometry authority | High root-cause confidence | High as its own campaign, low when bundled with life semantics | Moderate; separate shader/geometry and silhouette oracles | Deferred as the next independent renderer candidate |
| Environment-dimension differentiation | Potentially high | Current equal raw ratings are known, but the correct authoritative model requires product and balance choices | Low inside a renderer campaign | High; simulation, UI, audits, cohorts, docs | Deferred |
| Larger Evolution sphere and economy | Potentially high | The current authored topology is known, but target catalog and economy are not closed | Low | Very high; topology, content, reachability, persistence, agents, balance | Deferred |
| Ecology and progression balance retune | Potentially high | Insufficient while visual observability is still being corrected | Low | High; paired development/holdout cohorts and multi-World agents | Deferred until observability is stronger |
| No repository change | Low | The previous package is closed, but the current explicit visual contradiction remains | N/A | Low | Rejected |

Atmosphere smoothing and life boundaries were previously discussed together as a visual-legibility candidate, but they do not share data ownership, cutover, deletion, or independent proof. Bundling them would violate dependency closure and obscure causality. This campaign selects life boundaries only.

---

## 3. Reconciled baseline

### 3.1 Verified current remote facts

The upstream author directly inspected the public GitHub repository, not an active local checkout.

- The default branch is `main`.
- Remote `main` was at `ca1b05bf41d0d01c93e39979eedfc414bfc34956` during upstream inspection.
- The previous implementation commit is `728889a00562bd700567f9e138768867a4365185` (`feat: close autonomous world presentation contract`).
- The current head commit records terminal release evidence for that implementation.
- `docs/work/README.md` reports no active work package.
- `docs/work/autonomous-world-contract-closure-v1/README.md` reports an exact next coherent step of `none` and explicitly defers renderer, Environment/Evolution, ecology-balance, and physical-device work.
- No open issue or pull request was found during upstream inspection.
- GitHub Actions run `33163257669` completed successfully for current head `ca1b05bf41d0d01c93e39979eedfc414bfc34956`.
- The previous implementation record contains successful CI, Pages, deployed-byte, and deployed Worker/WebGL2 evidence for `728889a00562bd700567f9e138768867a4365185`.
- This upstream session did not independently run the deployed game, a local browser, tests, builds, or benchmarks. Codex must reproduce current rendering through the trusted production browser path before claiming the visual baseline.

The orientation revision is not a required base. Newer active-checkout facts supersede it.

### 3.2 Verified current life and renderer ownership

The following source facts were verified from remote `main`.

#### Authoritative semantic input

- `src/core/life-state.js` owns the categorical life states used by snapshots: ordinary living, frontier, stressed, critical, dead remains, and unoccupied.
- Production snapshots already carry `alive`, `biomass`, `stress`, `lifeState`, resource state, transformation state, and Luminous charge.
- Visual History already stores and reconstructs renderer-semantic life channels. No new History channel is required for the selected design.
- The selected-cell inspector already exposes textual living state, role, stress, resources, and Luminous charge.

#### WebGL2 current path

- `src/rendering/world-pass.js` owns the dynamic World buffers and the globe, boundary, and atmosphere draws.
- Life data is expanded from cell snapshots into the globe vertex buffer.
- The current boundary vertex array contains static position and geography feature data only.
- `src/rendering/shaders.js` currently alters whole-cell base material for ordinary living, frontier, stressed, critical, and remains states.
- `src/rendering/shaders-boundary.js` currently shades lake and coast features without life state.
- `src/rendering/cell-geometry.js` already constructs one boundary quad for each topology edge and carries static geography metadata.
- The current steady World renderer posture is four draws including background, globe, boundaries, and atmosphere.

#### Canvas 2D current path

- `src/rendering/fallback2d.js` paints biome and resource material, then uses `lifeStyles` and inset/full-cell paths for life overlays.
- It later draws ordinary and emphasized static geography boundaries.
- Selection, History emphasis, and Luminous charge have their own semantics and must not be absorbed into the new ordinary-life boundary authority.

#### Current documentation and tests

- `docs/rendering.md` currently says that life changes whole-cell material.
- Decision D13 in `docs/decisions.md` records the historical replacement of organism route fragments with cell material. Its anti-route decision remains valid, but its assertion that cell material is the life visual is now superseded for ordinary World life projection.
- `scripts/audits/cell-visual-audit.mjs` protects whole-cell geography, resources, no sub-cell waterways, and the four-draw posture, but does not yet require dynamic life-edge semantics.
- `tests/unit/renderer.test.js` protects renderer contracts and categorical life-state derivation but does not yet prove edge projection or edge-versus-interior hierarchy.
- Existing developer-only continuity and Luminous fixtures establish the repository pattern for controlled browser pixel evidence.

### 3.3 Latest user product policy

Treat the following as a mandate, not an optional suggestion:

> Ordinary World life should be communicated primarily by lines at cell boundaries rather than by destructive whole-cell recoloring.

Interpret this as a semantic hierarchy, not a demand for a literal implementation technique that damages other contracts:

- whole cells remain the authoritative simulation, geography, habitat, transformation, and Luminous units;
- ordinary life and frontier should be edge-primary;
- terrain and resources should remain visible inside occupied cells;
- stress, critical state, and remains may retain restrained interior support when required for low-zoom legibility, but their boundary must remain the primary state cue;
- the design must not create graph routes, organism paths, wires, or a second simulation interpretation.

### 3.4 Likely root cause

The current globe shader and Canvas overlay code make life compete directly with biome and resource material because all three are expressed through the cell interior. The static boundary pass cannot carry life, so the renderer has no shared edge-level owner. This causes the player to read occupancy as cell whitening or tint rather than as a living territorial boundary.

The target does not require more simulation cells, a new snapshot channel, a new render pass, or an ecology retune. It requires moving ordinary-life projection from backend-specific cell fills to one shared edge classification consumed by both backends.

### 3.5 Current strengths to preserve

Preserve all of the following unless a direct active-checkout contradiction is documented:

- deterministic fixed-step simulation;
- identical Worker and fallback authority;
- exact World identity and stale-snapshot rejection;
- current topology and edge ordering;
- continuous WebGL shell and opaque Canvas substrate;
- whole-cell biome, resource, lake, shore, transformation, and Luminous material;
- current visual History channel coverage and bounds;
- selection and History truthfulness;
- four WebGL World draws;
- context-loss fallback;
- current camera, picking, framing, speed, Result, accessibility, and responsive contracts;
- zero runtime dependencies;
- bounded typed-array rendering posture;
- current-only persistence policy.

### 3.6 Facts Codex must verify locally before editing

Codex must establish these exact local facts and record them in the canonical work package:

1. active branch, `HEAD`, upstream, ahead/behind state, remotes, dirty and untracked files, and concurrent user work;
2. whether newer commits supersede any orientation fact or activate another work package;
3. the exact topology edge endpoint fields and ordering used by current production source;
4. every live, History, showcase, Worker, fallback, WebGL2, and Canvas consumer of the life channels;
5. the current source and shader expressions that make ordinary life a whole-cell fill;
6. the current browser-visible baseline at matched controlled cells and in an ordinary World;
7. current WebGL attribute availability, buffer update cadence, draw count, and renderer timing on the implementation host;
8. current Canvas path batching and allocation behavior;
9. whether any current visual fixture, generated output, snapshot, or documentation hash becomes stale after the renderer-only cutover;
10. current CI, Pages, and deployed revision before any external action.

These are bounded verification questions. They are not authorization to reopen product direction.

---

## 4. Requirement classification

### 4.1 Mandates

Codex must not casually change these requirements.

1. Ordinary World life and frontier are edge-primary in both WebGL2 and Canvas 2D.
2. Ordinary living state must not erase or dominate biome and resource material inside the cell.
3. A topology edge receives one deterministic life classification from its two adjacent cells. Do not draw two competing life lines for the same edge.
4. WebGL2 and Canvas consume the same semantic projection. Backend-specific duplicate classification logic is forbidden.
5. Critical state outranks stress; stress outranks ordinary life; dead remains are residual and not alive. The visual hierarchy must preserve that semantic ordering.
6. The exposed active frontier must be more salient than an edge between two ordinary living cells.
7. Luminous charge remains an authoritative whole-cell powered state and must remain distinct from ordinary life at zero charge.
8. Coast and lake boundaries, selection, History emphasis, transformation, and resource state remain legible when overlapping life.
9. No simulation rule, RNG consumption, snapshot authority, reward rule, SCORE rule, Environment rule, Evolution rule, camera rule, speed rule, Result rule, or World identity rule changes.
10. Do not increase World topology resolution to improve appearance.
11. Do not add a WebGL render pass. Preserve the four-draw World posture.
12. Do not add bloom, route fragments, organism paths, network lines, wires, or decorative sub-cell geography.
13. Do not add a player setting for life-boundary style, width, color, or intensity. Choose one good default.
14. Do not add animation or pulsing to ordinary life boundaries. Reduced motion must not need a second life-rendering implementation.
15. Reuse existing snapshot life semantics. Do not change Worker protocol, History codec, or persistence schema unless direct local evidence proves a required semantic input is absent. If that premise is disproved, stop and document the contradiction before broadening scope.
16. Dynamic edge work must be bounded, allocation-conscious, and driven by accepted snapshot changes rather than rebuilt from per-cell objects every animation frame.
17. The selected-cell inspector or an equivalent current textual surface must remain a non-color oracle for living state, role, stress, resources, and charge.
18. The final production design must be proved through trusted real-browser WebGL2 and Canvas paths. Source inspection and screenshots alone are insufficient.
19. Delete or supersede the predecessor whole-cell ordinary-life authority after cutover. Do not leave a hidden compatibility toggle or dormant alternate shader path.
20. Preserve unrelated user work and stop at a coherent state if interrupted.

### 4.2 Selected design

Implement one narrow pure renderer-semantic owner under the rendering layer. Exact module and symbol names are implementation latitude, but it must own the following projection.

#### Edge inputs

For each stable topology edge, consume the categorical life state of its two adjacent cells. Biomass or normalized stress may be used only as bounded intensity support after categorical state is established. Do not reinterpret simulation or invent a second life model.

#### Edge output

Produce a compact finite classification suitable for one reusable typed buffer. The conceptual output is:

- **dominant state:** none, living, stressed, critical, or remains;
- **relation:** inactive, internal active edge, exposed active frontier, or residual edge;
- **bounded intensity:** optional normalized support derived from existing snapshot values.

One edge has one output.

#### Deterministic precedence

Use this precedence when adjacent cells differ:

1. critical;
2. stressed;
3. active living/frontier;
4. dead remains;
5. none.

Treat categorical `FRONTIER` as active life. Determine exposed frontier from adjacency as well: an edge with active life on exactly one side is an exposed active frontier even if stale or approximate visual History produced a categorical combination that does not perfectly mirror current live topology classification.

An edge with active life on both sides is an internal active edge. If one or both sides are stressed or critical, the dominant severity controls the state while the relation remains internal or exposed as applicable.

An edge with no active life and at least one remains cell is residual. An unoccupied-to-unoccupied edge has no life signal.

The function must be deterministic, total for every recognized state pair, finite for malformed intensity inputs after safe normalization, and independent of renderer, camera, frame rate, quality, scene, and time.

#### Visual hierarchy

Use one restrained authored hierarchy rather than backend defaults.

- **Internal ordinary living edge:** continuous, quiet, and clearly weaker than the exposed frontier. It should preserve the cellular mesh without turning the whole living territory into a bright wireframe.
- **Exposed active frontier:** the clearest ordinary-life line. It is the primary silhouette of growth and retreat.
- **Stressed edge:** amber, copper, ochre, or an equivalent warning family, with greater non-color salience than ordinary life through line weight, coverage, contrast, or another static cue.
- **Critical edge:** the strongest urgent life boundary, distinct from stress by more than hue alone. Do not pulse it.
- **Remains edge:** muted and residual, visibly different from active living and from coast/lake geography.
- **None:** no life contribution.

Do not use pure white as the ordinary-life default if that makes life resemble selection or wipes out terrain. Preserve the established product palette where it remains effective.

Ordinary living and frontier cell interiors should remain materially close to a matched unoccupied cell with the same biome, resource, transformation, light, and charge inputs. Stress, critical state, and remains may retain a restrained interior tint or texture when browser evidence shows that boundary-only presentation becomes illegible at the far normal zoom. Any such support must remain subordinate to the edge and must not restore the old ordinary-life fill authority.

#### WebGL2 target

- Keep the existing static edge geometry and boundary draw.
- Add one reusable dynamic life-edge attribute or an equivalently bounded channel to the existing boundary pass.
- Populate it from stable topology edge endpoints and accepted snapshot life state.
- Upload only when the accepted snapshot semantic input changes, not because animation time advances.
- Preserve static lake/coast features as independent inputs in the same pass.
- Compose geography and life explicitly so neither silently overwrites the other. A shared edge may show both semantics through a deterministic priority or blend without a second draw.
- Do not rebuild boundary geometry per snapshot.
- Do not add a new framebuffer, texture pipeline, post-process, or draw call.
- Remove ordinary living/frontier whole-cell mixing from the globe shader after the boundary path is authoritative.
- Retain only the selected restrained interior support for stress, critical state, or remains, and make its subordinate role explicit in tests.

#### Canvas 2D target

- Consume the same edge projection, not a reimplemented `if` tree.
- Reuse one typed edge-class buffer per accepted snapshot.
- Batch a bounded finite set of paths by semantic class where practical; do not allocate one object or issue an avoidable state transition per edge.
- Replace ordinary living/frontier full-cell fills or inset fills with the shared boundary semantics.
- Preserve opaque substrate, biome/resource fills, static geography boundaries, selection, History emphasis, and Luminous treatment.
- Match semantic ordering and relative hierarchy rather than exact WebGL pixels.

#### Snapshot, History, and showcase behavior

- Live Worker and fallback snapshots project through the same edge owner.
- Current and past visual History use their decoded life state directly. A historical checkpoint must not borrow live edge data.
- Stale or rejected snapshots must not update dynamic edge buffers.
- A missing or semantic-only historical visual remains honest under the existing History policy.
- The title showcase uses the same production renderer path and therefore receives the boundary treatment without a parallel showcase-only implementation.
- Do not regenerate simulation showcase data unless the existing generator proves its source contract intentionally changed. A renderer appearance change alone is not permission to alter authoritative showcase frames.

#### Accessibility and motion

- Do not rely on hue alone for stress versus critical state. Controlled evidence must show a luminance, coverage, weight, texture, or equivalent non-color distinction.
- Preserve selected-cell textual state and keyboard/pointer access to inspection.
- Ordinary life boundaries are static projections of snapshot state. They do not animate, travel, or pulse.
- Reduced motion therefore uses the same life semantics without nonessential motion.
- Forced colors and high-contrast browser checks must confirm that controls, focus, selection, and textual inspection remain usable even when canvas raster colors are not transformed by the user agent.

#### Performance posture

- Time complexity is `O(edgeCount)` per accepted life-semantic snapshot update and bounded finite work per frame.
- Reuse typed arrays and GPU buffers.
- No unbounded sample history, per-frame edge objects, per-frame static geometry construction, or duplicate edge authorities.
- Preserve four WebGL draws.
- Record same-host baseline and final renderer timing under identical fixture, viewport, renderer, quality, and browser conditions.
- Investigate a stable same-host regression of approximately 10% or greater. Also investigate an absolute p95 increase greater than 0.20 ms when the baseline p95 is near the current one-millisecond order. A regression may be accepted only when repeated evidence shows it is real, the visible product gain justifies it, the frame budget remains safe, and the work record states the decision.

### 4.3 Narrow empirical questions for Codex

Codex must answer these locally and record the answers. They do not reopen the selected architecture.

1. Which current topology arrays are the canonical edge endpoint and edge ordering source?
2. What is the smallest compact attribute packing accepted by the current WebGL implementation and hardware without reducing portability?
3. Which existing globe-shader life terms are necessary only for subordinate stress/critical/remains support, and which are obsolete ordinary-life fill authority?
4. What finite Canvas batching arrangement best matches the shared classes without per-edge object churn?
5. What exact anti-alias-safe interior and boundary masks produce stable controlled measurements in the trusted Chrome harness?
6. What thresholds satisfy the relative acceptance rules below with at least three times measured repeat noise and a meaningful safety margin?
7. Does the current visual History decoder always provide the required categorical state for every renderable checkpoint? If not, is a deterministic derivation from its existing stored life channels already available without a codec change?
8. Which checked-in documentation, fixture metadata, source audit, or generated hash becomes stale from the final renderer source change?
9. What is the repeated same-host render-cost delta for WebGL2 and Canvas?
10. What exact public revision is served after an authorized deployment?

### 4.4 Implementation latitude

Codex may choose without another design round:

- exact module, function, enum, and shader attribute names;
- typed packing width and normalization;
- exact authored colors within the mandated semantic hierarchy;
- exact static line width, opacity, coverage, and texture values;
- whether restrained stress/critical/remains interior support is implemented in the existing globe material or omitted after evidence;
- exact Canvas batching implementation;
- exact developer-only fixture route or hook, provided it is absent from ordinary player UI;
- exact anti-alias-safe pixel masks and backend-specific numeric thresholds, provided the semantic inequalities and calibration rule are met;
- focused test file placement;
- coherent commit count and messages;
- ignored report paths.

### 4.5 Non-goals and deferred concerns

Do not pull any of the following into this campaign:

- atmosphere geometry, silhouette smoothing, screen-space atmosphere, or topology decoupling;
- simulation cell count or topology change;
- ecology constants, resource rules, Environment schedule, pressure dimensions, extinction timing, SCORE, Echoes, or balance targets;
- Evolution sphere size, catalog, reachability, economy, effects, persistence, or purchase interaction;
- Luminous mechanics or a new Luminous renderer, beyond proving semantic preservation;
- History format, storage limits, semantic event model, or replay redesign;
- camera inertia, idle orbit, responsive framing, picking policy, speed catalog, Result duration, or continuation design;
- Home, Evolution, or Trophy visual redesign;
- new settings or tutorial surfaces;
- physical-device optimization beyond recording available evidence;
- general shader cleanup, renderer abstraction, or formatting churn not required by the cutover.

---

## 5. Ownership and dependency map

| Behavior or data | Current owner | Target owner | Consumers | Conflicting predecessor to delete or supersede |
| --- | --- | --- | --- | --- |
| Categorical life state | production life-state/snapshot authority | unchanged | live Worker/fallback, History, renderers, inspector, showcase | none |
| Edge adjacency and stable ordering | production World topology/geometry | unchanged canonical topology input | shared edge projection, WebGL boundary geometry, Canvas paths | any duplicate locally inferred edge ordering |
| Life-to-edge classification | absent as one owner | one pure rendering-semantic projection | WebGL2 and Canvas 2D | backend-specific whole-cell ordinary-life classification as primary visual authority |
| WebGL life presentation | globe material plus static boundary pass | existing boundary pass with dynamic life input; globe retains only allowed subordinate support | live, History, showcase | ordinary living/frontier base mixing and obsolete life-fill shader branches |
| Canvas life presentation | `lifeStyles` plus full/inset cell overlays | shared edge classification drawn in bounded boundary batches | live, History, showcase | ordinary living/frontier full-cell and inset fills; duplicate state mapping |
| Geography edges | static boundary features | preserved static channel composed with life | both renderers | any overwrite that hides coast/lake semantics |
| Luminous | snapshot charge plus established whole-cell material | unchanged | both renderers, inspector, fixtures | any life palette or emission that makes zero charge look powered |
| Selection and History | established renderer/presentation owners | unchanged | both renderers | any life line that masks or absorbs these cues |
| Visual proof | current browser harness and audits | controlled life-boundary fixture plus updated audit and existing production scenarios | local verification, CI, next ChatGPT turn | screenshot-only or exact cross-GPU hash claims |
| Current documentation | `docs/rendering.md`, current decisions/status/work index, related READMEs | same canonical documents plus one work package | future agents and users | claims that whole-cell material is the primary ordinary-life visual |

The pure edge projection may import the categorical life-state definition and topology inputs. Simulation, UI, persistence, and History must not import renderer policy.

---

## 6. Transition, deletion, migration, and recovery

### 6.1 Transition policy

Use a direct current-only renderer cutover.

- No save migration.
- No settings reset.
- No Worker protocol bump.
- No History codec bump.
- No World identity version bump.
- No simulation rebaseline.
- No dual-rendering toggle.
- No compatibility branch.

If active-checkout evidence proves that the required state is not present in a renderable visual History checkpoint, first determine whether it can be derived deterministically from already stored `alive`, `biomass`, and `stress` channels. Only a proven missing semantic input may justify stopping and documenting a required broader format campaign. Do not silently expand this campaign into persistence migration.

### 6.2 Required predecessor deletion

After both backends use the shared edge projection:

- delete WebGL ordinary living and frontier whole-cell material authority;
- delete Canvas ordinary living and frontier whole-cell or inset fill authority;
- delete duplicate backend life-state precedence logic;
- remove dead shader attributes, uniforms, buffers, helper functions, constants, tests, and comments that exist only for the rejected path;
- update the cell-visual source audit to reject restoration of destructive ordinary-life fill and to require both backend consumers of the shared projection;
- supersede the relevant current sentence in D13 and current rendering documentation;
- do not preserve rejected current architecture as a commented alternative.

Retain state channels still used by allowed subordinate stress/critical/remains support, the inspector, History, Luminous, metrics, or another verified consumer. Do not delete authoritative data merely because one renderer use changes.

### 6.3 Recovery policy

The renderer-only cutover has no durable data migration. Recovery is a normal code revert to the prior renderer revision.

Before normal push, keep the repository at one of these coherent states:

1. old production rendering remains fully authoritative and new shared projection code is pure, tested, and not wired; or
2. both WebGL2 and Canvas use the new authority and all predecessor production paths are deleted.

Do not commit or push a state where one backend uses the new life semantics and the other backend retains the old primary fill semantics.

If a material active-checkout fact makes one-pass cross-backend completion unsafe or incoherent, stop before production cutover, leave the old authority active, record the contradiction and evidence in the work package, and report the exact next design question. Do not add a speculative fifth draw or format migration as an emergency workaround.

### 6.4 External-state and unknown-outcome policy

A normal push and Pages deployment are authorized only after final local content is stable and verified.

For each external operation:

- record the local commit intended for publication;
- verify the remote ref after push;
- verify CI jobs against that exact commit;
- verify Pages deployment source against that exact commit;
- compare cache-busted deployed bytes for the changed production owners;
- run the relevant deployed browser scenario;
- classify timeouts, HTTP failures, missing credentials, or ambiguous responses as failed, unavailable, or unknown, not passed;
- do not retry by force-pushing or changing repository settings.

---

## 7. Ordered milestones

Use focused verification during iteration. Run the complete repository verification only once final content is stable, except when a repository-specific gate makes an earlier broad run necessary.

### Milestone 0 — Reconcile, reproduce, and record the baseline

**Purpose:** establish that the selected contradiction still exists in the active checkout and create one canonical work record.

**Prerequisites:** none beyond repository access.

**Initial read set:**

1. root `AGENTS.md` and this mandate;
2. `docs/work/README.md` and every package currently marked active;
3. `docs/work/autonomous-world-contract-closure-v1/README.md` only as terminal predecessor evidence;
4. `docs/status.md`, `docs/rendering.md`, `docs/decisions.md`, `docs/testing.md`, and `docs/accessibility.md`;
5. `package.json`;
6. the production life-state owner and snapshot definition;
7. `src/rendering/world-pass.js`, `src/rendering/shaders.js`, `src/rendering/shaders-boundary.js`, `src/rendering/cell-geometry.js`, `src/rendering/fallback2d.js`, and renderer READMEs;
8. `tests/unit/renderer.test.js`, `scripts/audits/cell-visual-audit.mjs`, `scripts/browser/continuity-fixture.mjs`, `scripts/browser/luminous-fixture.mjs`, the shell browser scenario, and browser harness documentation;
9. the selected-cell inspector and visual History decoder only to confirm existing semantics.

Use high-value searches such as:

```text
rg -n "LIFE_STATE|lifeState|lifeData|lifeStyles|drawCellOverlays|drawBoundaries|boundaryFeature|FS_BOUNDARY|VS_BOUNDARY|deadRemains|critical|frontier|drawCalls = 4" src tests scripts docs
```

Do not perform a repeated undirected full-repository scan after this read set answers the ownership questions.

**Work-package action:** create `docs/work/living-boundary-semantics-v1/README.md`; mark only it active in `docs/work/README.md`; preserve the mandate and add one compact implementation record near the top as work proceeds.

**Baseline evidence:**

- reproduce a matched ordinary living/unoccupied cell interior and boundary in WebGL2 and Canvas;
- capture current life hierarchy and resource interference through the trusted developer browser path;
- record current draw count, dynamic upload behavior, WebGL timing, Canvas timing, and relevant screenshot paths in ignored evidence;
- record that simulation hashes are unchanged across renderer choices;
- classify any unavailable browser path honestly.

**Public behavior changed:** none.

**Completion condition:** the active checkout confirms or disproves the stated root cause; current owners and consumers are recorded; baseline evidence exists; no production renderer path has changed.

**Recovery condition:** because production is unchanged, stop safely if the premise is materially disproved and report the contradiction.

### Milestone 1 — Establish the shared edge projection and exhaustive semantic oracle

**Purpose:** create one deterministic owner for edge semantics before changing production rendering.

**Implementation:**

- implement the pure edge projection and compact reusable output;
- derive every edge from canonical stable topology endpoints;
- normalize malformed optional intensities safely;
- add exhaustive pair coverage over every recognized life-state combination and both endpoint orders;
- prove symmetry: swapping edge endpoints cannot change classification;
- prove precedence, relation, finite values, bounded output length, and deterministic repetition;
- prove unoccupied-to-unoccupied has no life signal;
- prove one-active-side is exposed frontier;
- prove two-active-side is internal unless severity changes only the dominant state;
- prove critical and stress precedence;
- prove remains is never classified as active;
- prove the projection has no time, camera, renderer, RNG, or mutable simulation dependency.

**Predecessor deletion:** none yet; old production authority remains active until both backends are ready.

**Focused verification:** run the new pure tests and the affected renderer unit tests only.

**Documentation:** update only the active work record; do not claim player-visible completion.

**Commit boundary:** a pure, tested, unused semantic owner may be committed if production behavior remains exactly old and the work record clearly says the cutover is incomplete. Do not push it as a completed campaign.

**Completion condition:** one shared classification exists and all pairwise invariants pass.

### Milestone 2 — Atomic WebGL2 and Canvas cutover with predecessor deletion

**Purpose:** make the selected visual authority real in both production backends without an intermediate shipped split.

**WebGL2 implementation:**

- add the reusable dynamic edge channel to the existing boundary pass;
- update it only for accepted snapshot changes;
- compose it with static lake/coast features;
- implement the selected hierarchy;
- remove ordinary living/frontier whole-cell fill authority;
- retain only evidence-justified subordinate severe/remains interior support;
- retain four draws and current shell continuity.

**Canvas implementation:**

- consume the same edge projection;
- batch finite semantic paths;
- remove ordinary living/frontier whole-cell and inset fill authority;
- preserve geography, substrate, resource, transformation, selection, History, and Luminous paths;
- avoid per-edge object allocation and unbounded context state churn.

**Controlled fixture:** add one developer-only life-boundary fixture that produces matched cells and edges for:

- unoccupied control;
- internal ordinary living;
- exposed active frontier;
- stressed internal and exposed edges;
- critical internal and exposed edges;
- remains;
- abundant versus exhausted resource material;
- zero-charge versus powered Luminous state;
- selected and History-highlighted overlaps;
- center-facing and limb-facing geometry;
- near and far normal zoom positions.

The fixture must use production geometry, shaders, Canvas code, snapshot shape, camera, and renderer. It must not become a player mode or a separate renderer.

**Measurement design:** derive pixel masks from projected production geometry. Separate interior masks from edge bands and exclude unstable antialias transition pixels. Render each exact input at least three times to measure repeat noise.

Lock thresholds only when they satisfy all of these rules:

1. each threshold margin exceeds the larger of three times observed repeat noise and a small absolute normalized color/luminance floor appropriate to the measured channel;
2. ordinary living interior delta from its matched unoccupied control is no more than `0.35` of the ordinary-life edge-band delta;
3. ordinary living interior delta is no more than one half of the abundant-versus-exhausted resource interior delta in the same biome and lighting;
4. occupied abundant-versus-exhausted resource contrast retains at least `80%` of the matched unoccupied resource contrast;
5. exposed frontier salience is at least `1.25` times internal ordinary-living edge salience under the fixture's normalized metric;
6. stressed, critical, living, and remains edge classes are pairwise distinguishable where semantics require it by more than the calibrated noise margin;
7. critical has a stronger non-color urgency cue than stress;
8. zero-charge ordinary life does not produce powered whole-cell emission; existing Luminous paired controls retain their semantic ordering;
9. selected and History emphasis remain distinguishable from the strongest life edge;
10. coast and lake edge evidence remains legible when coincident with life;
11. the same semantic inequalities pass in WebGL2 and Canvas, though backend-specific raster thresholds may be documented when justified by antialiasing.

If a numeric target proves brittle across the two production backends, do not weaken the product invariant. Improve the metric or use a relative semantic measurement with repeat-noise calibration and record the reason.

**Focused verification:**

- new pure edge tests;
- affected renderer unit tests;
- updated `audit:cell-visuals`;
- controlled fixture under WebGL2 and forced Canvas;
- current continuity fixture;
- current Luminous fixture;
- one ordinary live World and one visual History checkpoint under Worker/WebGL2, fallback/WebGL2, and Worker/Canvas;
- stale-snapshot rejection and World-replacement checks;
- focused context-loss path when affected.

**Predecessor deletion:** perform every deletion in section 6.2 before this milestone is complete.

**Public behavior intentionally unchanged:** simulation, camera, input, picking, speed, Result, layout, progression, persistence, and balance.

**Commit boundary:** both backends, shared owner, deletion, focused tests, fixture, and source audit form one coherent renderer cutover. Do not commit or push only one backend.

**Completion condition:** both production backends use one edge authority; old ordinary-life fill authority is gone; controlled and focused production-path evidence passes; four draws remain.

**Recovery condition:** revert the uncommitted or coherent cutover commit; no durable data recovery is needed.

### Milestone 3 — Accessibility, performance, documentation, and release closure

**Purpose:** prove the final content and close current authority.

**Accessibility and responsive verification:**

- keyboard-select and open the inspector for living, stressed/critical where reproducible, remains, and zero-charge/powered cells;
- verify truthful textual state and focus restoration;
- run reduced-motion and forced-colors scenarios;
- verify no new animation, live-region churn, hover-only meaning, focus loss, or control overlap;
- verify representative portrait, wide, small-landscape, and `200%` text layouts remain stable; the renderer change should not require a full layout redesign, but existing geometry and controls must remain intact.

**Performance verification:**

- compare same-host WebGL2 and Canvas fixtures against Milestone 0 with identical inputs;
- record draw count, dynamic edge-buffer bytes, update frequency, render mean and p95, and allocation observations;
- run the production benchmark to prove simulation throughput and authority hashes are unchanged;
- investigate regressions under the posture in section 4.2;
- do not optimize unrelated simulation code.

**Documentation and generated outputs:** reconcile section 10 below, update the work record, and regenerate only outputs whose exact owners changed.

**Fresh final verification:** after final content is stable:

1. run focused life-boundary tests and audit once more;
2. run trusted Worker/WebGL2, fallback/WebGL2, and Worker/Canvas browser scenarios;
3. run `npm run showcase:check`;
4. run `npm run check:links` and `npm run check:structure`;
5. run `git diff --check`;
6. run one fresh `npm run verify` against stable final content;
7. review the entire final diff for duplicate authority, stale claims, obsolete tests, dead attributes/buffers/helpers, accidental scope, generated churn, and unbounded work;
8. confirm the worktree and coherent commits.

Do not rerun the full suite after a documentation-only change unless that change affects a generated or verification input. Rerun the exact relevant gates instead.

**External actions:** when local completion is proven and branch safety permits, commit, push normally, verify remote ref, CI, Pages source, deployment, cache-busted bytes, and the deployed controlled/ordinary browser behavior. Do not claim public completion before those postconditions.

**Work-package closure:** mark `docs/work/living-boundary-semantics-v1/README.md` completed, update `docs/work/README.md` to report no active package, and state exact next coherent step `none` when the stopping rule is met.

**Completion condition:** the stopping rule is satisfied and the final evidence packet is complete.

---

## 8. Acceptance criteria

Every criterion below is independently decidable.

### A. Authority neutrality

- For fixed World inputs, authoritative final hashes, SCORE, Echoes, extinction, History semantics, and progression results are unchanged across WebGL2, Canvas, camera state, frame cadence, and presentation speed.
- Worker and fallback continue to use the same simulation authority.
- Rendering imports no mutable simulation authority and sends no gameplay mutation.
- Stale snapshots cannot update current life-edge data.

**Oracle:** existing determinism/integration tests plus focused stale-identity renderer tests and unchanged benchmark hashes.

### B. One shared edge classification

- Exactly one production semantic owner classifies life per topology edge.
- Every recognized state pair and reversed endpoint order is tested.
- One edge yields one finite classification.
- Backend code does not reimplement precedence.

**Oracle:** pure exhaustive unit tests, source review, and updated source audit.

### C. Ordinary life is edge-primary

- Internal ordinary-life cell interiors remain close to matched unoccupied terrain/resource controls.
- Exposed active frontier is visibly stronger than internal ordinary-life boundaries.
- Ordinary life no longer relies on whole-cell white or dominant life tint in either backend.

**Oracle:** calibrated controlled fixture inequalities, source-negative audit, and ordinary World browser inspection.

### D. State hierarchy is legible

- stressed, critical, ordinary living, and remains boundaries are distinguishable;
- critical outranks stress through a non-color cue;
- remains never reads as living or powered;
- no life class pulses or depends on animation time.

**Oracle:** pure state ordering tests, pixel/coverage measurements, reduced-motion browser run, and supplemental screenshots.

### E. Geography and resources survive

- biome and resource-rich/exhausted distinctions remain measurable within occupied cells;
- lake and coast boundary semantics remain visible where life overlaps them;
- transformations remain legible;
- no new background cracks or limb holes appear.

**Oracle:** controlled resource/geography variants, current continuity fixture, `audit:cell-visuals`, and normal World screenshots.

### F. Luminous, selection, and History remain distinct

- zero-charge living cells produce no powered emission;
- powered cells retain established day/night hierarchy;
- selection and History emphasis remain readable over every life class;
- past visual History uses its own checkpoint edge state and returns atomically to Live.

**Oracle:** current Luminous fixture, controlled overlap variants, History browser scenario, and selected-cell browser interaction.

### G. WebGL2 and Canvas semantic parity

- both backends pass the same semantic inequalities and state ordering;
- forced Canvas remains playable;
- context-loss fallback remains coherent;
- exact pixels need not match.

**Oracle:** trusted WebGL2 and Canvas fixture reports, normal browser scenarios, and context-loss coverage.

### H. Accessibility and responsive preservation

- keyboard and pointer inspection still expose textual state;
- visible focus and focus restoration work;
- no color-only action or control is introduced;
- reduced motion has no life-boundary animation;
- forced colors retains usable controls, focus, selection access, and textual inspection;
- required layouts, safe areas, `200%` text, and page overflow remain within current contracts.

**Oracle:** trusted browser keyboard, reduced-motion, forced-colors, viewport rectangle, and `200%` text evidence.

### I. Performance and boundedness

- WebGL World draw count remains four;
- static geometry is not rebuilt per snapshot or frame;
- edge projection is `O(edgeCount)` per accepted update with reusable typed buffers;
- no per-edge object churn exists in hot paths;
- same-host regression is within the selected posture or explicitly justified by repeated evidence;
- production simulation benchmark and hashes remain valid.

**Oracle:** unit/source contract, browser instrumentation, same-host reports, benchmark, and final diff review.

### J. Deletion and documentation closure

- old ordinary-life whole-cell primary paths, dead helpers, and protecting tests are gone;
- D13 is explicitly superseded only for ordinary-life projection while its rejection of organism routes remains historical rationale;
- current rendering docs describe edge-primary life and whole-cell simulation/geography correctly;
- one canonical work package records implementation and evidence;
- no active competing planning tree or duplicate current claim remains.

**Oracle:** repository search, link/structure checks, final diff, work index, and documentation review.

### K. Production closure

- coherent commits exist;
- normal push, remote ref, CI, Pages, cache-busted bytes, and deployed browser behavior are verified when credentials and services are available;
- every external failure or unavailable check is classified honestly;
- no severe selected-scope regression remains.

**Oracle:** exact commit/ref/workflow/deployment identities and deployed evidence report.

---

## 9. Risk-driven verification matrix

| Risk | Focused oracle | Production-path oracle | Failure classification |
| --- | --- | --- | --- |
| Backend-specific life interpretation | exhaustive shared projection tests; source audit | WebGL2 and Canvas controlled fixture | any semantic-order mismatch fails |
| Life still erases terrain/resources | matched edge/interior/resource measurements | ordinary World in both backends | threshold or visual contradiction fails |
| Geography edge is hidden | static/dynamic composition tests | lake/coast overlap fixture | missing geography signal fails |
| Ordinary life resembles Luminous | zero-charge and powered controls | existing day/night Luminous browser fixture | zero-charge emission or ordering loss fails |
| History borrows live state | snapshot identity and History tests | past checkpoint, seek, Live restore | mismatched label/edge state fails |
| Stale World updates edge buffer | identity unit/integration tests | rapid World replacement | stale update fails |
| Added pass or excessive work | draw-count/source contract; buffer-size tests | browser timing and instrumentation | fifth draw fails; material regression requires decision |
| GPU-specific screenshot brittleness | relative metrics and repeat-noise calibration | both production backends | exact screenshot mismatch alone is not failure or proof |
| Color-only accessibility | state coverage/luminance oracle; inspector text | keyboard, forced colors, reduced motion | missing textual/non-color cue fails |
| Scope creep into atmosphere/balance/progression | final diff and search | unchanged hashes and docs | unrelated authority change requires removal or stop |
| Deployment drift | exact changed-owner byte list | cache-busted Pages and deployed browser | local-only or stale deployment is not pass |

Classify each check as passed, failed, skipped, unavailable, not run, stale, or superseded. Never convert skipped, unavailable, or stale evidence into a pass.

---

## 10. Documentation and generated-output reconciliation

Update only documents whose current claims or evidence change.

Required review set:

- `docs/work/living-boundary-semantics-v1/README.md` — canonical mandate and implementation record;
- `docs/work/README.md` — one active package during work, none after terminal closure;
- `docs/rendering.md` — edge-primary ordinary life, shared projection, backend semantics, four-draw and bounded-update posture;
- `docs/decisions.md` — add a new current decision that supersedes D13 only for ordinary-life visual projection; retain D13 as historical evidence against route fragments;
- `docs/status.md` — concise exact final revision and evidence, without self-referential commit claims inside the same commit;
- root `README.md` — update the current implementation-status link and player-facing visual description only when needed;
- `docs/testing.md` — controlled life-boundary fixture and relevant browser gates;
- `docs/accessibility.md` — textual and non-color life-state evidence if current wording becomes incomplete;
- `src/rendering/README.md`, `scripts/README.md`, and `scripts/browser/README.md` — update only if their current ownership or fixture map changes;
- `scripts/audits/cell-visual-audit.mjs` and its documentation — protect the new current contract without weakening whole-cell geography and no-sub-cell-waterway rules;
- checked-in generated data or snapshots — update only when their authoritative generator reports a real source-input change.

Search current prose for at least:

```text
whole-cell material
cell material is the life visual
life visual
ordinary life
frontier
boundary pass
four draws
lifeStyles
```

Do not rewrite historical implementation records to pretend they measured the new design. Mark them historical or superseded where necessary. Git history is the archive.

---

## 11. Scope control and contradiction protocol

### Decisions Codex must not reinvestigate

- life is edge-primary for ordinary World presentation;
- one shared edge projection serves both backends;
- current simulation life state remains authoritative;
- the existing boundary pass is the selected WebGL owner;
- no fifth draw is allowed;
- no topology increase, new setting, animation, bloom, organism route, or new snapshot channel is intended;
- atmosphere is deferred;
- balance, Environment, Evolution, camera, speed, Result, and persistence are deferred;
- controlled relative measurements plus real browser evidence are required.

### Objective-preserving corrections Codex may make

Codex may correct exact active-checkout assumptions while preserving the objective, including:

- choosing the actual canonical topology edge fields;
- adjusting attribute packing;
- retaining a smaller existing life buffer for an independently maintained consumer;
- selecting backend-specific antialias thresholds;
- using a restrained severe/remains interior support after evidence;
- reorganizing cohesive renderer modules within repository structure policy;
- updating additional directly stale tests or docs discovered by search.

Record material corrections in the work package.

### Changes that require stopping and documenting a contradiction

Stop before broadening scope if evidence shows any of the following:

- the current renderer cannot add dynamic edge data to the existing boundary pass without a new draw or unsupported portability cost;
- required renderable History semantics are absent and cannot be derived from existing stored channels;
- a newer active package owns the same renderer authority;
- unrelated dirty work conflicts with safe atomic cutover;
- the selected design would require simulation topology or rule changes;
- production WebGL2 and Canvas cannot preserve semantic parity under the chosen one-pass authority;
- repository rules or external state make normal publication unsafe.

Leave production on one coherent authority, record evidence, and return the exact unresolved design question. Do not improvise a broad workaround.

### Unrelated work to preserve

Preserve all unrelated user files, ignored evidence, local configuration, historical mandates, and concurrent changes. Do not normalize or delete an ignored historical `docs/campaigns/` artifact merely because the canonical current system is `docs/work/`; only avoid creating or activating a competing tree.

---

## 12. Codex working protocol

Codex must:

1. inspect branch, `HEAD`, remotes, upstream, ahead/behind state, worktree, recent commits, and current external state;
2. preserve unrelated user changes and never reset a dirty worktree destructively;
3. read and install the companion complete `AGENTS.md` only after checking for conflicting unrelated edits;
4. reconcile the orientation snapshot against current local facts;
5. inspect `docs/work/README.md` and any package marked active;
6. reproduce the current whole-cell life presentation before changing it when the trusted browser environment is available;
7. record baseline visual, draw, upload, timing, and authority evidence;
8. create or update only `docs/work/living-boundary-semantics-v1/README.md` as the active cross-layer record;
9. implement the dependency-closed shared projection and both backend consumers rather than a scaffold;
10. keep one authority for edge classification;
11. delete conflicting predecessor paths after cutover;
12. add regression tests at the pure, renderer, audit, and real-browser layers;
13. use focused verification while iterating;
14. exercise live Worker, live fallback, WebGL2, Canvas, History, Luminous, selection, reduced motion, forced colors, and relevant responsive paths;
15. review the final diff for duplicate authority, stale claims, obsolete tests, dead files, unused attributes/buffers, accidental scope, generated churn, and unbounded work;
16. run fresh final verification against stable final content;
17. make coherent commits;
18. perform only authorized external actions;
19. verify remote, CI, Pages, deployed bytes, and public browser behavior against the exact final implementation revision;
20. update and close the canonical implementation record;
21. return the evidence packet below;
22. stop when the stopping rule is met.

Do not ask for routine implementation approval covered by implementation latitude.

If interrupted by limits, stop at a coherent dependency boundary:

- repository remains buildable;
- old production authority remains active, or both backends have completed the cutover;
- old and new production authorities are not simultaneously active;
- incomplete scaffolding is not described as complete;
- the work record states exact completed milestones, evidence, and next coherent step.

Write large raw browser or benchmark output to ignored evidence files. Return paths, hashes, and concise measurements rather than pasting large logs. Reuse prior evidence only when the exact relevant inputs are unchanged; renderer source, fixture, browser version, threshold, or production bytes changing requires fresh evidence.

Avoid parallel subagents that duplicate repository scans, browser launches, builds, or full-suite runs. Parallelize only independent reading or analysis that does not duplicate expensive work or create competing implementation authority.

---

## 13. Required final evidence packet

Return a concise factual report containing all of the following:

- starting branch and full revision;
- starting upstream relationship and ahead/behind state;
- starting dirty and untracked files and how each was preserved;
- final branch and full revision;
- coherent commit list;
- final upstream and remote relationship;
- final worktree state and `git diff --check` result;
- selected campaign and stopping-rule disposition;
- confirmed root causes;
- disproved hypotheses;
- exact active-checkout facts that corrected this mandate;
- important implementation decisions and implementation-latitude choices;
- deviations from the selected design and why;
- shared projection owner and all production consumers;
- predecessor paths, helpers, attributes, tests, and current claims deleted or superseded;
- confirmation that simulation, snapshot, protocol, History, settings, and persistence authority did or did not change;
- pure exhaustive edge-classification tests and results;
- focused renderer tests and results;
- updated cell-visual audit result;
- controlled fixture report paths, hashes, repeat-noise measurements, thresholds, and pass margins for WebGL2 and Canvas;
- ordinary World and visual History scenarios exercised;
- Worker, fallback, WebGL2, Canvas, and context-loss evidence;
- deterministic and stale-identity evidence;
- Luminous zero-charge and powered hierarchy evidence;
- selection and History overlap evidence;
- accessibility, keyboard, reduced-motion, forced-colors, and textual-inspector evidence;
- responsive viewport and `200%` text evidence relevant to preservation;
- WebGL draw count, dynamic buffer size/update cadence, Canvas batching/allocation observations, and same-host timing comparison;
- production benchmark and authority hashes;
- full verification command and result;
- CI, Pages, deployment, cache-busted changed-owner bytes, and deployed browser evidence when authorized;
- failed attempts and why they are not counted as passes;
- skipped, unavailable, not-run, stale, and superseded evidence;
- documentation and generated outputs reconciled;
- remaining deferred concerns: atmosphere silhouette, Environment differentiation, Evolution scale/economy, ecology/progression balance, and physical-device/high-refresh/safe-area/thermal evidence;
- exact next coherent step, or `none` when the stopping rule is met;
- exact facts the next ChatGPT turn should reassess.

A report containing only changed files and unit tests is not sufficient.

---

## 14. Final instruction

Implement the living-boundary semantic cutover, prove it through the actual production rendering paths, delete the whole-cell ordinary-life predecessor authority, publish only when explicitly authorized postconditions are met, and stop. Do not spend remaining Codex capacity on atmosphere, balance, progression, or unrelated polish after the selected boundary is closed.
