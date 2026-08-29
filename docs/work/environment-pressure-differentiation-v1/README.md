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

## Evidence not obtained

- A completed pre-change browser scenario; the failed attempts above are the
  only browser baseline available.
- Final local, CI, Pages, deployed-byte, and deployed-browser evidence.
- Physical-device evidence is outside this campaign.

## Exact next coherent step

Commit the coherent profile/consumer cutover, then replace the rung-only raw
summary with one live effective-pressure projection across snapshots, Results,
History, the fair agent, and the metric surface.
