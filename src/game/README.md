# `src/game/`

Pure product rules imported by simulation, interface, audits, and fair agents.
No DOM or storage I/O belongs here.

| Module | Authority |
|---|---|
| `environment-level.js` | Environment model/schedule v2, exact tick↔level/progress/hash, onboarding modifier, and explicit legacy-frontier migration reader. |
| `environment-exposure.js` | Bounded exact pressure-time/quality exposure evidence. |
| `scoring.js` | SCORE v5, exact Echoes, ranks, and monotone exposure-bonus high-water authority. |
| `balance.js` | Finite simulation constants; no normal world-duration ceiling. |
| `skills/` | 252-cell exact Evolution levels/costs/effects/Potential/build mastery/transactions. |
| `events-content.js` | Whole-cell environmental event families. |
| `trophies/` | Read-only 96-Trophy catalog and completed-world proof. |

Environment Level is a within-world public clock. New worlds start Level 0;
Evolution changes finite effective pressure but never clock thresholds. Exact
values remain canonical decimal strings at external boundaries. Legacy static
frontier data is readable only for migration and never affects a new world,
SCORE, eligibility, or rewards.
