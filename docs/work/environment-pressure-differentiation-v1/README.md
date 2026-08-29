# Environment Pressure Differentiation v1

Status: active.

## Starting point

- Branch: `main`.
- Revision: `915dbcf4e340aea48003af5cf96a77937b9e232a`.
- Upstream: `origin/main`, ahead `0`, behind `0` at activation.
- Relevant dirty input: untracked user-owned handoff artifact
  `docs/work/202608300500.md`; it is preserved unchanged and excluded from
  campaign commits.
- Root `AGENTS.md` blob: `e55a504a0747793459c0a874ab62207d07f068c2`,
  matching the supplied contract.
- No competing active work package exists.
- Orientation revision equals the active checkout. The latest `verify` run for
  that starting revision is GitHub Actions run `33262262891` (successful), and
  Pages deployment `6157747163` names the same revision. These are starting
  state only, not final evidence.

## Confirmed root causes

- `src/simulation/challenge-profile.js` assigns `1000 × Environment Level` to
  every dimension before defense, so fresh trajectories are identical.
- The compiler calculates `scarcityRamp` but no production ecology consumer
  reads it.
- Runtime coefficients interpolate current-to-next profiles, while the
  snapshot/Result dimension summary remains on the current rung.
- `src/interface/inspection/metric-surface.js` replaces numeric pressure with
  `Baseline`, `Mild`, `Rising`, `Strong`, or `Severe`.
- `src/agent/observation.js` exposes raw `netRating` and internal effective
  coefficients.
- Existing tests and the Environment audit do not reject identical fresh
  curves or a dimension with no dedicated consumer.

## Selected decisions and deviations

- Keep `src/simulation/challenge-profile.js` as the single pure owner of the
  fixed dimension table, exact rating laws, coefficient compilation, and live
  current/next pressure interpolation.
- Preserve Environment model/schedule version `2`, schedule hash, run protocol
  `12`, and SCORE model semantics. Version consequences for Result,
  observation, agent save, and semantic History will be finalized against
  their validators during the projection cutover.
- Use the mandate's fixed cap-candidate order and keep holdout post-change
  evidence untouched until one development candidate is frozen.
- No objective-preserving deviation is currently required.

The sole profile-v5 compiler uses these exact direct laws for positive Level
`L`, with every rating zero at Level 0:

| Dimension | Player label | Rating at Level 1 | Later-Level slope |
|---|---|---:|---:|
| `scarcity` | Resource yield | 1400 | 700 |
| `renewal` | Renewal | 1200 | 850 |
| `climate` | Climate | 800 | 1150 |
| `toxicity` | Toxicity | 600 | 1300 |
| `maintenance` | Maintenance & transport | 1000 | 1000 |

For positive `L`, each rating is `base + slope × (L − 1)` in exact progression
arithmetic. Their sum is exactly `5000 × L`; compilation is direct and bounded
for hundreds-of-digits Levels. Level 1 descending pressure is
`0.452885/0.403657/0.350000/0.291515/0.227768` for scarcity, renewal,
maintenance, climate, and toxicity. Level 3 reverses leadership to
toxicity, climate, maintenance, renewal, scarcity.

## Completed coherent phases

- Repository, upstream, worktree, remotes, recent commits, root contract,
  active-work index, current status, current GitHub Actions run, and current
  Pages deployment reconciled.
- Source tracing confirmed one shared production `RunController`, current/next
  profile caching, the nutrient-to-energy conversion site, and the existing
  metric-shell browser scenario as the narrow production-path browser owner.
- Cut the sole profile authority from version `4` to `5` while preserving
  Environment model/schedule version `2`, schedule hash `763e6328`, and run
  protocol `12`. The fixed direct laws compile all five dimensions in bounded
  work and retain exact raw sum `5000 × Level`.
- Added `resourceYieldScale` with candidate cap `0.15` and consumed it exactly
  once at finite nutrient-to-energy conversion. The obsolete equal-rating
  broadcast and unused scarcity ramp are gone.
- Controlled production tests now show renewal changing reserve-funded nutrient
  regeneration, climate changing moisture and temperature, toxicity changing
  accumulated load, maintenance changing metabolism/recovery/transport, and
  scarcity changing energy yield while consumed nutrient remains identical.
- Added one live current/next pressure projection in the profile owner. It
  interpolates the five normalized pressures on `environmentLevelProgressQ`,
  derives aggregate/severity from those values, preserves both profile
  identities, and removes raw ratings from maintained read projections.
- Cut terminal Result schema `9` to `10` and fair observation schema `6` to
  `7`. Run protocol `12`, browser meta `15`, semantic History `10`, replay `9`,
  and agent save `6` remain unchanged. The agent-save validator now strips
  incompatible legacy pressure detail while preserving permanent campaign
  meta and History.
- History retains v5 dimension percentages only when profile identity and all
  five values validate. Older profile facts retain trustworthy Level, time,
  SCORE, aggregate pressure, and terminal evidence while dimension detail is
  explicitly unavailable; it is never recomputed under v5.
- Replaced the qualitative-only metric rows with `0%`–`100%` whole
  percentages, the five authored labels, stable unrounded strongest selection,
  and static accessible row names. A compact metric surface at `<=420 px` now
  uses one surface scroll owner so 200% text keeps Close and all rows reachable.
- Extended the existing metric-shell browser owner with a bounded focused
  Environment receipt. It covers production snapshots and terminal Result,
  Worker/WebGL2, fallback/WebGL2, fallback/Canvas 2D, keyboard focus restore,
  forced colors, reduced motion, 200% text, and the required five viewports.
- Froze `resourceYieldEffectCap = 0.15`, the first and highest candidate in the
  mandated order. Its full development cohort passed before the post-change
  holdout was inspected; no lower candidate or other ecology constant was
  evaluated. The one post-change holdout cohort then passed unchanged.
- Extended the existing production balance audit rather than adding another
  simulator. Its bounded report now records runtime and profile identity,
  per-run authority hashes, peak/final/sustained REACH, habitat and powered-cell
  evidence, peak/final Environment Level, causes, SCORE, Echoes, and resource
  conservation. An isolated detached worktree at the starting revision
  captured the same fields for supplemental exact before/after evidence.
- Extended the existing benchmark with a fixed 1,000-tick production trace,
  after the terminal-length throughput metric proved unsuitable for this
  ecology change. The trace excludes initialization, remains alive under both
  profiles, runs seven samples after one warm-up, and verifies one authority
  hash per profile. This is measurement correction, not a second simulator.
- Reconciled every current documentation owner: root and GitHub README mirror,
  status, game design, simulation, balancing, fair-agent play, accessibility,
  testing, decisions, and the two relevant script indexes. Historical work
  packages and their measurements remain unchanged.

## Focused verification

- PASS — focused baseline (`46/46`) across profile/schedule, production
  progression, resources, agent, History, and Worker/fallback tests.
- PASS — full pre-change Environment audit. It records schedule hash
  `763e6328`, profile version `4`, exact equal Level-1 pressure `0.35` in all
  dimensions, bounded huge-Level compilation, and complete finite cohorts.
  Report:
  `reports/environment-pressure-differentiation-v1/baseline/environment-level-audit-full-v4.json`,
  SHA-256 `a6e91556343375c80b635d295d68012312fc73fcb65d39a57fc3f6789e7798f7`.
- PASS — pre-change development balance, 48 paired runs per fixture. Fresh
  median is `135.3 s`; Foundation `156.1 s`; Scarcity `205.1 s`; Luminous
  `145.9 s`; mature `213.5 s`; all complete. Report:
  `reports/environment-pressure-differentiation-v1/baseline/balance-development-v4.json`,
  SHA-256 `a8ace3ab87413653864805985451b727bbe6505e91b07165ce05909156aed98d`.
- PASS — pre-change untouched holdout, 48 paired runs per fixture. Fresh median
  is `136.6 s`; Foundation `163.7 s`; Scarcity `222.2 s`; Luminous `151.7 s`;
  mature `231.3 s`; all complete. Report:
  `reports/environment-pressure-differentiation-v1/baseline/balance-holdout-v4.json`,
  SHA-256 `827db21e6065ed9230b4e7dc9d41ca950e11055606736961b7fc69e68d0c872d`.
- PASS — supplemental schema-3 baselines from an isolated detached checkout of
  exact starting revision `915dbcf4`, using the final bounded report shape.
  Development SHA-256 is
  `c601a1b5ce95a514742ba7ad344cd9c28888ce5a6a8b8e153c7a54cdb9a4aedb`;
  holdout SHA-256 is
  `a92f9a026fa84179e7f82c9e0706083f2667dcc2004a340af2d788a70bb3a61b`.
- PASS — isolated pre-change benchmark on Node `v24.18.1`, Linux x64, AMD
  Ryzen 9 9955HX host: authority sample times `239/156/151 ms`, median
  `13,030 ticks/s`, authority hash `471ba1cc`. Report:
  `reports/environment-pressure-differentiation-v1/baseline/benchmark-v4.json`,
  SHA-256 `1d7d7dfc1477aa4118593310bf239f423b60d5912c81c6df802b08b7fff6d9ae`.
- FAILED/UNAVAILABLE BASELINE — an unconfigured browser launch exited `77`.
  The cached Chrome `152.0.7977.64` launch initially lacked its library path;
  with cached libraries it reached CDP but twice timed out at
  `Emulation.setDeviceMetricsOverride` (10 s and 60 s bounds). These attempts
  are not browser passes. The source and pure projection reproduce the current
  qualitative-only path; final browser evidence remains mandatory and
  unresolved.
- PASS — profile version `5` focused and full test gates: `npm test` passes
  `217/217` unit and `72/72` integration tests. The full Environment audit
  proves the exact Level-0 law, Levels `1/2/3/4/8/32/1000000` and huge-Level
  laws, distinct fresh trajectories, authored leadership change, exact sum,
  scalar preservation, bounded coefficients, defense specificity, production
  reachability, finite cohorts, and unchanged schedule. Report:
  `reports/environment-pressure-differentiation-v1/milestone2/environment-level-audit-full-v5.json`,
  SHA-256 `f8b9dc1dbf4ea9bec3e35aba52249137b66d6487971ccb22d04040921b2122c5`.
- PASS — the 24-run resource audit remains valid with zero conservation error.
  Report:
  `reports/environment-pressure-differentiation-v1/milestone2/resource-audit-v5.json`,
  SHA-256 `f04864a06598c54aa3fb99183f408a10a541cc8b18700839c119c4312046607e`.
- FAILED DURING ITERATION — the first defense-specific coefficient assertion
  used Level `1`, where the maintenance difficulty ramp deliberately remains
  at its baseline for a small defense; the oracle was corrected to Level `2`.
  A later transport-consumer fixture started with zero conductance and could
  not exercise decay; it was corrected to initialize a real active route.
  Neither failed run is counted as evidence.
- PASS — projection-focused tests plus full `npm test`: `218/218` unit and
  `72/72` integration tests. Worker/fallback terminal summaries agree exactly;
  Result captures terminal-tick effective pressure; History v4 detail is
  omitted and v5 detail retained; the fair agent exposes no `netRating`, raw
  rating, or effective coefficient.
- PASS — full 0.15 development selection cohort, 48 paired runs for each of
  five fixtures. Median lifetime changes against v4 are fresh `-0.30%`,
  Foundation `+1.47%`, Scarcity `+1.41%`, Luminous `+1.71%`, and mature
  `-0.19%`. All `240` Worlds ended authoritatively; maximum absolute resource
  conservation error was below `7e-11`. Report:
  `reports/environment-pressure-differentiation-v1/candidate/balance-development-cap-0.15.json`,
  SHA-256 `c70124834dd0e7b22464ec2a738bfd14fb056782e291ec23e1a72526f3e2dc20`.
- PASS — the single post-change holdout cohort for frozen cap `0.15`, 48 paired
  runs for each fixture. Median lifetime changes are fresh `+0.95%`, Foundation
  `-0.43%`, Scarcity `-2.57%`, Luminous `+0.73%`, and mature `-6.79%`. All
  `240` Worlds ended authoritatively; maximum absolute resource conservation
  error was below `7e-11`; stronger finite builds retained positive paired
  outcomes. Report:
  `reports/environment-pressure-differentiation-v1/final/balance-holdout-cap-0.15.json`,
  SHA-256 `2fa0b309ad23046089cd5ca5e91d028847de2913400d8846b6bbecfef929f08c`.
- PASS — final full Environment audit, 16 Worlds per maintained cohort and a
  20,000-tick external budget. Every exact-curve, consumer, schedule, defense,
  finite-extinction, and huge-Level invariant is true. Report:
  `reports/environment-pressure-differentiation-v1/final/environment-level-audit-full-v5.json`,
  SHA-256 `ecb6b64a865e2e6048585407c5f88dde91458b5654e7257eb8b9403133b67745`.
- PASS — 500-World resource audit and 500-pair freshwater audit. Resource
  conservation error is zero at report precision; all finite/occupancy/SCORE
  bounds pass. Reports and SHA-256 digests:
  `reports/environment-pressure-differentiation-v1/final/resource-audit-full-v5.json`
  (`b977408d5185b3f57066ba086fa8d561223f4d27d62a475c72da433897179d79`)
  and
  `reports/environment-pressure-differentiation-v1/final/freshwater-audit-full-v5.json`
  (`d8d57b1d9e4952d32be71e4be64d3ebbf0b914cf9c545b3cfdffe602a385e81d`).
- PASS — 10,000-World production terminal/persistence soak. All Worlds
  completed, all 10,000 duplicate settlements were rejected, History remained
  at 24 entries, receipts at 16, and the report completed in `629,507.9 ms`.
  Report:
  `reports/environment-pressure-differentiation-v1/final/terminal-soak-10000-v5.json`,
  SHA-256 `0a23d3a64e6b37c1731f86c97c067b6d2f67660d364bd189a2ea934bcf8851a6`.
- PASS — full fair-agent training tournament: 68 six-World campaigns across 17
  policies, every policy repeated deterministically, no failures, bounded
  traces, valid specialist domains, and fair production observations. Report:
  `reports/environment-pressure-differentiation-v1/final/agent-tournament-training-v5.json`,
  SHA-256 `25da87b89b235626678c9039df95b3b941301f9c0473fd3da3343416a2963969`.
- FAILED/CONFOUNDED PERFORMANCE ATTEMPT — five ordinary terminal benchmark
  invocations reported a median `11,112 ticks/s` versus the original v4
  `13,030 ticks/s` (`-14.72%`). The measured authority fixture itself shortened
  from 2,036 to 1,492 ticks under the intended ecology change, so fixed setup
  cost and different tick content made that rate non-comparable. This is not
  counted as a performance pass.
- PASS — five alternating v4/v5 benchmark invocations using the new fixed
  1,000-tick production trace. The v4 invocation medians were
  `10,734/10,519/9,706/10,641/10,537 ticks/s` (aggregate median `10,537`);
  v5 medians were `10,791/10,688/10,245/10,740/10,649` (aggregate median
  `10,688`, `+1.43%`). Every seven-sample invocation was deterministic and
  valid. Median v4 report:
  `reports/environment-pressure-differentiation-v1/baseline/benchmark-v4-fixed-sample-5.json`,
  SHA-256 `a7f259b855eaee44db2950b622fd96671a64f39323ef91ed10603aa692bc9705`;
  median v5 report:
  `reports/environment-pressure-differentiation-v1/final/benchmark-v5-fixed-sample-2.json`,
  SHA-256 `90e37cc495c5a9f07499aa8a9c3f829f846fd6f5142c27b0462183b0a167c244`.
- PASS (INTERIM; DIRTY CONTENT TREE, TO BE SUPERSEDED) — Chrome
  `152.0.7977.64` focused pressure scenarios pass on Worker/WebGL2,
  fallback/WebGL2, and fallback/Canvas 2D with zero browser-console errors.
  Level 1 renders `45/40/29/23/35%`; midpoint renders
  `52/50/43/39/46%`; all required viewports have no horizontal page scroll and
  exactly one pressure-surface scroll owner. Final revision-bound reruns remain
  required.
- PASS — clean revision-bound Chrome `152.0.7977.64` browser receipts for exact
  content revision `d7d3dc5518c05ff1ca052050f2cb9fa19b672d49` in
  Worker/WebGL2, fallback/WebGL2, and fallback/Canvas 2D. Controlled semantic
  projections agree exactly. Level 1 renders `45/40/29/23/35%`; midpoint
  renders `52/50/43/39/46%`. All 15 required responsive cases retain one scroll
  owner, reachable controls/rows, and no horizontal page overflow at 200% text.
  Keyboard open/Escape/focus restoration, static accessible row names, forced
  colors, reduced motion, terminal Result schema 10, and zero browser errors
  pass. Reports and SHA-256 digests:
  - `reports/environment-pressure-differentiation-v1-final-worker-webgl2.json`
    — `afc064b59abded55536780357d6ad1aeb0ea0b44b5d2188ba68020a4a4782790`;
  - `reports/environment-pressure-differentiation-v1-final-fallback-webgl2.json`
    — `12b084d40e4697bd338ca7bb91828726fe6933e8e28af6b72b9f837f2c69cca8`;
  - `reports/environment-pressure-differentiation-v1-final-fallback-canvas2d.json`
    — `505c260baf17a43fb0bd3c1ddb69392cc749d7a8991ca3902e1824165329ffee`.
- FAILED DURING ITERATION — initial browser attempts skipped the World start
  because the harness assumed a `home` phase instead of the production `idle`
  phase. A later run used a fontconfig path without its sysroot and Chrome
  aborted in its font manager. Once the runtime was configured, the first real
  `320×568`/200% check found Close outside the viewport; the bounded one-scroll
  layout correction fixed it. None of these failed attempts is counted as a
  browser pass.
- SUPERSEDED RECEIPTS — the first clean revision-bound browser rerun used a
  mistyped supplied full revision even though its independently captured
  harness revision was correct. Those three behavior passes are rejected as
  identity evidence and replaced by the matching receipts above. A subsequent
  read-only aggregation script expected `layouts` instead of the report's
  `responsive` key and threw before validation; the corrected aggregation
  proves identity, semantic parity, geometry, and zero errors. Neither failed
  evidence-processing attempt is counted as a pass.
- EXPECTED WORKSPACE-ONLY STRUCTURE FAILURE — current documentation links and
  the tracked README mirror pass. Direct `check:structure` sees the preserved
  untracked `docs/work/202608300500.md` and rejects its 1,054 lines. No tracked
  campaign file violates a hard cap. Final verification must run from a clean
  exact-revision worktree so the user's unrelated artifact remains unchanged.
- FAILED DURING FINALIZATION — `showcase:check` correctly rejected the v4
  production-simulation title fixture after the profile cutover. The bounded
  fixture was regenerated once; its current digest is
  `608dec0905e713b0e1343de5259ac4c96b34f296836ce80394bf3f935d5f9fd7`
  and its fresh self-check passes. The stale check is not counted as a pass.

## Evidence not obtained

- A completed pre-change browser scenario; the failed attempts above are the
  only browser baseline available.
- Fresh complete final verification, CI, Pages, deployed-byte, and
  deployed-browser evidence.
- Physical-device evidence is outside this campaign.

## Exact next coherent step

Commit this final local evidence, run one fresh complete verification from a
clean exact-revision worktree, review the final diff, then perform the authorized
normal push and verify CI, Pages, deployed bytes, and cache-busted deployed
browser behavior before closing the package.
