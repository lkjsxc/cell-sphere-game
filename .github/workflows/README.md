# .github/workflows/

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | push to `main`/`contest-submission`, pull requests, manual | `verify` (all fast gates) → `pages` (deploy, only after verify, only on the two protected branches) |

The same gates run locally via `npm run verify`; CI mirrors them exactly,
including canonical identity, local-resource/freshwater/SCORE traces,
transformations, exact REACH 100, and fair-agent campaign smoke gates, so local
green exercises the same release-critical authority as CI.
