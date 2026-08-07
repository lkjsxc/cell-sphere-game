# `src/simulation/`

Deterministic fixed-tick ecology. It imports no DOM, storage, WebGL, camera, or
wall-clock presentation authority.

| Module | Responsibility |
| --- | --- |
| `state.js` | Typed-array world authority, isolated RNG, Level-0 setup, schedule transition state. |
| `simulator.js` | Shared Worker/fallback tick controller and natural terminal authority. |
| `challenge-profile.js` | Exact Environment rating/defense compiler and finite current/next runtime profile. |
| `environment.js` / `metabolism.js` / `transport.js` | Prospective pressure, ecology, maintenance, and flow. |
| `events.js` | Bounded rolling deterministic whole-cell event director. |
| `summary.js` | Metrics, event notices/reclamation, exact exposure/SCORE sampling, semantic History. |
| `snapshot.js` / `result.js` / `replay.js` | Presentation projections, dynamic result evidence, versioned hash/replay. |
| `resource-ecology.js`, `worldmaking.js`, `lifecycle/` | Finite conservation, transformations/electricity, growth/death/REACH. |

Authoritative order is:

```text
increment tick → schedule transition/profile installation → event director
→ conditionals → environment → metabolism → transport → worldmaking → growth
→ death/liveness → connectivity/summary/SCORE/History → terminal evaluation
```

Every new world begins at Environment Level 0. The public clock derives only
from authoritative ticks, including the bounded causal terminal-collapse fade;
Evolution changes effective pressure, never the clock. Worlds one and two have
an explicit onboarding event modifier only. The director owns bounded
active/future/recent evidence, reserves summary-cadence slack for a
player-visible minimum telegraph, and does not precompute a whole-world event
schedule. Snapshot/result pressure summaries expose current/next profiles,
interpolation Q, and the authority coefficients. Speed changes only how many
exact ticks are executed, never their content.
