# `src/game/`

Pure product rules imported by simulation, interface, audits, and fair agents.
No DOM or storage I/O belongs here.

| Module | Authority |
|---|---|
| `environment-level.js` | Environment model/schedule v2 and exact tick↔level/progress/hash authority. |
| `environment-exposure.js` | Bounded exact chronic-pressure time and quality evidence. |
| `scoring.js` | Current SCORE v5 and exact Echo reward authority. |
| `balance.js` | Finite simulation constants; no normal world-duration ceiling. |
| `skills/` | Current exact Evolution levels, costs, effects, and transactions. |
| `trophies/` | Read-only Trophy catalog and completed-world proof. |

Environment Level is a within-world public clock. New worlds start at Level 0;
Evolution changes effective chronic pressure but never clock thresholds. Exact
values remain canonical decimal strings at external boundaries. There is no
legacy-frontier reader, onboarding exception, or gameplay-event authority.
