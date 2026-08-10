# `src/simulation/`

Deterministic fixed-tick ecology. It imports no DOM, storage, WebGL, camera, or
wall-clock presentation authority.

| Module | Responsibility |
| --- | --- |
| `state.js` | Typed-array world authority, isolated RNG, Level-0 setup, schedule transition state. |
| `simulator.js` | Shared Worker/fallback tick controller and natural terminal authority. |
| `challenge-profile.js` | Exact Environment rating/defense compiler and finite current/next runtime profile. |
| `environment.js` / `metabolism.js` / `transport.js` | Chronic pressure, ecology, maintenance, and flow. |
| `summary.js` | Metrics, bounded semantic notices, exact exposure/SCORE sampling, and History. |
| `snapshot.js` / `result.js` / `replay.js` | Presentation projections, chronic-pressure evidence, versioned hash/replay. |
| `resource-ecology.js`, `worldmaking.js`, `lifecycle/` | Finite conservation, transformations/electricity, growth/death/REACH. |

Authoritative order is:

```text
increment tick → schedule transition/profile installation → conditionals
→ environment → metabolism → transport → worldmaking → growth → death/liveness
→ connectivity/summary/SCORE/History → terminal evaluation
```

Every new world begins at Environment Level 0. The public clock derives only
from authoritative ticks, including the bounded causal terminal-collapse fade;
Evolution changes effective chronic pressure, never the clock. There is no
onboarding exception, event director, future-event schedule, or gameplay
telegraph. Snapshot/result pressure summaries expose current/next profiles,
interpolation Q, and authority coefficients. Speed changes only how many exact
ticks are executed, never their content.
