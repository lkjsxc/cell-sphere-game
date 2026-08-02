# src/interface/

DOM-facing game interface. It renders screen state and sends explicit player
intent to the app controller; it never reads or mutates simulation arrays.

| Module | Responsibility |
| --- | --- |
| `app-controller.js` | Composition, worker/fallback lifecycle, camera/input, visibility handling. |
| `app-state.js` | Legal title/run/draft/result transitions. |
| `surfaces.js` | Semantic DOM updates for HUD, drafts, and results. |

Snapshots and terminal summaries enter through the controller. Simulation,
rendering, and persistence remain outside this directory.
