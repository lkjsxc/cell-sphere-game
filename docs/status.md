# Status

Truthful current state. Updated every session.

- **Last verified commit:** (set after Gate A commit)
- **Branch:** main → origin/main
- **Contest readiness:** early foundation; not playable yet.

## Playable now

- Static title shell boots through the dev server; capability detection
  reports renderer backend (WebGL2/Canvas2D) and execution mode.

## Incomplete

- World topology + simulation nucleus (Gate B)
- WebGL2 renderer + interaction (Gate C)
- Full run loop, content, scoring, result (Gate D)
- Progression, trophies, autoplay, archive (Gate E)
- Sharing, audio, PWA (Gate F)
- Accessibility pass, balance report, CI evidence, polish (Gate G)

## Current gates

| Gate | State |
|---|---|
| check:structure | expected pass (run pending) |
| test:unit | no suites yet |
| test:integration | no suites yet |
| balance:smoke | harness pending |
| benchmark | pending simulation |
| check:links | expected pass (run pending) |

## Latest metrics

None yet (no simulation).

## Known risks

- Single-session build of a large scope: mitigate by gating each commit on
  real verification and keeping content data-driven.
- Mobile performance unverified physically; use desktop CPU throttling and
  label physical evidence honestly.

## Next actions (priority order)

1. Land `core/` (PRNG, math, hash, seeds) + `world/` (icosphere, fields)
   with unit tests.
2. Land `simulation/` tick + invariants + 3,000-tick benchmark.
3. Land WebGL2 renderer with globe + veins + picking; Canvas fallback.
4. Wire the full playable extinction loop (Gate D).
5. Progression/trophies/autoplay (Gate E), then share/audio/PWA (Gate F),
   then polish + evidence (Gate G).
