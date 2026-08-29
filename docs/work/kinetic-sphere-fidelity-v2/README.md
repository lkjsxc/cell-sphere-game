# Kinetic Sphere Fidelity v2

## Starting state

- Branch `main` at `738775ede741ed43482d72eb30686cda376904f3`, equal to
  `origin/main` (`0` ahead, `0` behind).
- The starting checkout contained the user-supplied root `AGENTS.md` update and
  two untracked transfer artifacts under `docs/campaigns/`.
- The untracked artifacts were preserved byte-for-byte outside the repository at
  `/home/coder/workspace/cell-sphere-game-preserved/202608290727.md` (SHA-256
  `8e73ba55e50dad2b448a2371b5fc9ccca92d110a20f4a7e517141cedbd97049f`)
  and `/home/coder/workspace/cell-sphere-game-preserved/cell-sphere-game-codex-mandate-202608281253.md`
  (SHA-256 `fbca49e3c1bc7384792d840e8694d66ef2d005bc2c107a677b5ac70dedb97ac9`).
- The two unchanged tracked transfer copies under `docs/campaigns/` were deleted.
  `docs/work/` is again the only repository planning authority.
- Orientation Actions run `33215273506` failed only at the structure gate. The
  last deployed revision was `f0bca691b25d00ff93234645ade4947323a73e61`.

## Confirmed root causes

- Ordinary globe input maps CSS pixels through asymmetric fixed factors
  (`0.006` horizontal, `0.005` vertical) while responsive framing changes the
  projected sphere radius.
- At default World framing, a one-radius drag therefore predicts horizontal
  travel from `1.0368` to `2.4300 rad` and vertical travel from `0.8640` to
  `2.0250 rad` across the required viewport set.
- Release sampling measures angular velocity correctly, then a quadratic mapping
  amplifies medium traces, saturates strong traces at `8 rad/s`, and terminates
  every release at `5,000 ms` even when velocity remains above rest.
- Hosted CI duplicates a narrower unit-test glob and omits
  `tests/unit/presentation/*.test.js` from its Unit tests step.

## Selected decisions and deviations

- Freeze one finite projected sphere radius in CSS pixels at the first pointer
  down of each one-pointer gesture. Divide both CSS delta axes by that radius and
  feed the exact applied angular delta into the existing recent sampler.
- Transfer every finite above-threshold measured velocity vector directly.
  Retain the six-sample/120 ms estimator, `0.30 rad/s` threshold, `600 ms`
  damping half-life, `0.025 rad/s` rest threshold, bounded frame step,
  `4,500 ms` idle delay, and `0.022 rad/s` idle orbit.
- Delete the nonlinear response, velocity ceiling, mapped-speed duplicate, and
  hard inertia lifetime. Natural rest or established lifecycle cancellation is
  the only release terminus.
- No deviation from the presentation-only authority boundary is selected.

## Completed coherent phases

- Reconciled branch, upstream, worktree, active packages, source owners, tests,
  workflow, Actions, Pages, and the deployed revision.
- Preserved untracked user artifacts and removed the tracked competing planning
  tree.
- Captured the predecessor benchmark (`12,323 ticks/s`, authority hash
  `471ba1cc`) and focused tests (`20/20`).
- Captured a fresh Chrome 152 Worker/WebGL2 predecessor receipt with strong
  mouse/touch releases saturated at about `8 rad/s` and `1.09872` turns, medium
  input amplified from about `1.43` to `2.82 rad/s`, slow release at zero,
  SCORE `192,888`, four draws, and zero browser errors. Ignored report:
  `reports/kinetic-sphere-fidelity-v2-baseline-worker-webgl2.json`, SHA-256
  `df4d6d3ebe2f8da0194aab0d4553a3d4860fdab98ed40d3cb2a85d1561afeaea`.
- Cut ordinary input and preview manipulation over to one finite projected
  radius frozen at pointerdown. Both axes apply `delta / radius`, and the exact
  applied angular pair enters release sampling. Invalid geometry produces no
  rotation or release; pinch, cancellation, focus, scene, visibility, and World
  replacement clear gesture scale.
- Cut camera release over to direct measured-vector transfer. Deleted the
  quadratic response, input knee, output ceiling, mapped-speed field, and fixed
  lifetime. Analytic damping now owns natural rest, while one retained
  foreground-debt scalar drains through at most 100 ms per frame and every hold
  or reset clears it.
- Replaced predecessor unit/browser classifications with identity-transfer,
  natural-rest, multi-turn, normalized-gesture, no-plateau, zoom, resize,
  cancellation, boundedness, and paused-authority oracles.
- Contracted local and hosted test ownership to `npm run test:unit` and
  `npm run test:integration`; hosted CI no longer owns narrower duplicate globs.
- Reconciled current camera documentation and added D27. D22 retains the
  free-orbit/framing architecture, and D26 remains explicitly historical.

## Focused verification

- `node --test tests/unit/presentation/camera-motion.test.js tests/unit/state-machine.test.js`
  — predecessor pass, `20/20`.
- `npm run benchmark` — predecessor pass, `12,323 ticks/s`; authority/profile
  hashes unchanged from the terminal predecessor evidence.
- `npm run check:structure` — predecessor failure solely from the two tracked
  transfer files and missing `docs/campaigns/README.md`; this is not a pass.
- `npm run test:browser:file` — initial unavailable and library/font setup
  attempts are not passes; the corrected cached-Chrome run passes as recorded
  above.
- `node --test tests/unit/presentation/camera-motion.test.js tests/unit/state-machine.test.js`
  — current implementation pass, `23/23`, including direct identity through
  `32 rad/s`, natural rest, four frame cadences, three handler delays, retained
  foreground debt, malformed traces, lifecycle cancellation, and fixed storage.
- `npm run check:structure` — current pass, 304 tracked files and 40 directories;
  maintainability warnings remain warnings.
- Preliminary dirty-tree Chrome 152 Worker/WebGL2, fallback/WebGL2, and
  Worker/Canvas 2D runs pass with SCORE `192,888`, zero browser errors,
  one-radius paths of `0.99999996–1.00000017 rad`, post-zoom and frozen-resize
  paths near one radian, measured strong/faster speeds near `8.867/16.16 rad/s`,
  natural paths near `1.218/2.223` turns, slow release at zero, basis error below
  `4.5e-16`, and sample high-water six. Exact-revision reruns remain required.
- `npm run test:unit` — pass, `207/207`; the hosted command now invokes this
  exact maintained script.
- `npm run test:integration` — pass, `72/72`.
- `npm run benchmark` — isolated final pass, `12,351 ticks/s` versus the
  `12,323` predecessor baseline (`+0.23%`), with unchanged authority/profile
  hashes. The full-verifier sample was `12,454 ticks/s`.
- `npm run verify` — fresh stable-implementation pass, all 26 gates including
  structure, identity, simulation/progression/resource audits, showcase,
  `207/207` unit tests, `72/72` integration tests, benchmark, and links.
- `npm run check:links` and `npm run showcase:check` — pass; 135 module links,
  11 HTML references, and unchanged showcase digest `a89fdfaf…`.
- Exact revision `526d4b39e5c3774fc68caafda57326d932f13226` passes
  `npm run test:browser:file`, `npm run test:browser:fallback`, and
  `npm run test:browser:canvas` in Chrome `152.0.7977.64`. Reports:
  - Worker/WebGL2: `reports/kinetic-sphere-fidelity-v2-final-worker-webgl2.json`,
    SHA-256 `c8eea74c2ba92d6643ffec9d55a1c2b6931bb058f61850d6b809a3df0a69f2cb`.
  - fallback/WebGL2: `reports/kinetic-sphere-fidelity-v2-final-fallback-webgl2.json`,
    SHA-256 `21c3437d11e904a48880eb8ff797fedf5a337366f9cc1e977781df23490462bb`.
  - Worker/Canvas 2D: `reports/kinetic-sphere-fidelity-v2-final-worker-canvas2d.json`,
    SHA-256 `fdd907cb97abd8d2b6d8566320a4d6fe94752014030dd608a5689e435033cb78`.
- All three exact-revision reports record one-radius paths of
  `0.99999996–1.00000017 rad` across all eight viewports (spread
  `2.18e-7 rad`), post-wheel travel `0.99999998 rad`, and frozen-resize travel
  `0.99999996 rad`. Selected nodes remain unchanged and picking stays valid.
- Worker/WebGL2 measured strong/touch/faster/medium/slow speeds of
  `8.8671/8.8671/16.1555/1.4116/0.2600 rad/s`. Natural paths and durations were
  `1.2182/1.2182/2.2224/0.1911/0` turns and
  `5056/5047/5594/3477/0 ms`. The other two paths remain within the authored
  tolerance; maximum mouse/touch difference is `0.125%`.
- Every trusted cancellation ends at zero speed; reduced motion keeps direct
  drag at zero release speed; calm orbit measures `0.02168–0.02210 rad/s`;
  sample high-water is six; maximum basis error is `4.45e-16`; browser errors
  are zero. Paused snapshot tick/hash/identity are unchanged before and after
  all camera gestures in every path.
- The same runs pass real keyboard Inspector entry/focus restoration, forced
  colors, 200% text, reduced motion, responsive geometry, History, Evolution,
  Trophies, selection/purchase guards, SCORE `192,888`, and shared picking.
  Both WebGL2 runs retain four draws.
- Six ignored landscape/wide screenshots accompany the reports:
  - Worker/WebGL2 `844×390`: `reports/kinetic-fidelity-worker-webgl2-844x390.png`,
    SHA-256 `e1c5a0549b76e19b4b560c4a310f64db884140dadc01e1d972d62d60b5104a4d`.
  - Worker/WebGL2 `1440×900`: `reports/kinetic-fidelity-worker-webgl2-1440x900.png`,
    SHA-256 `f03cb30baf98b286e82094dcfffd9dab44906daec454dd14d94156c080dd538f`.
  - fallback/WebGL2 `844×390`: `reports/kinetic-fidelity-fallback-webgl2-844x390.png`,
    SHA-256 `bcbdca44f752044abee1fd3860aa184afed58d23ccdad6de2caba96a2a6bc09c`.
  - fallback/WebGL2 `1440×900`: `reports/kinetic-fidelity-fallback-webgl2-1440x900.png`,
    SHA-256 `be39bbe84e520337c3dcd6ebf150e9d183e85cbdac43ba289585b72c6105bff3`.
  - Worker/Canvas `844×390`: `reports/kinetic-fidelity-worker-canvas2d-844x390.png`,
    SHA-256 `5e8e510c45bc95f69ccf269e89d3585969c8aa927cdf543be1445381954f2586`.
  - Worker/Canvas `1440×900`: `reports/kinetic-fidelity-worker-canvas2d-1440x900.png`,
    SHA-256 `df01a635cc3028851acd380fd9afc2ac5430fab457156b02c87b305222c17318`.

## Evidence not obtained

- CI, Pages, deployed-byte, and deployed-browser evidence remain pending.
- Pen and physical-device mouse, touch, high-refresh, thermal, screen-reader,
  forced-colors, and safe-area evidence are unavailable on this host.

## Exact next coherent step

Commit this bounded local-evidence record, normal-push the two coherent commits,
then verify Actions, Pages, cache-busted bytes, and deployed browser behavior.
