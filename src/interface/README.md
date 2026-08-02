# src/interface/

DOM-facing composition. It translates player intent into explicit commands;
it never mutates simulation arrays or consumes authoritative randomness.

| Module | Responsibility |
|---|---|
| `app-controller.js` | Primary screens, one-overlay ownership, persistence transactions. |
| `app-state.js` | Legal title → running → result → Memory screen transitions. |
| `run-driver.js` | Worker-first timing with the same main-thread fallback controller. |
| `globe-input.js` | Tap/drag/pinch/wheel classification and pointer capture. |
| `camera-policy.js` | Optional idle rotation, interruption, and reduced-motion gate. |
| `pause-control.js` | Independent manual/hidden/panel pause reasons. |
| `surfaces.js` | Core HUD, result, notices, and screen visibility. |
| `inspector-surface.js` | Read-only static geography and low-cadence living detail. |
| `panel-surfaces.js` | Explicit Adaptation and Memory-node/list interactions. |
| `history-surface.js` | Semantic current/past timelines and location actions. |
| `settings-surface.js` | Live validated preference form and local-data actions. |
| `app-data.js` | Quality/DPR, seed, and export/import browser helpers. |

Primary screen, simulation status, and overlay are separate concerns. Ordinary
world taps only select cells; only Memory-node Unlock commands spend currency.
Full-screen panels continue world time unless the panel pause preference owns
its explicit pause reason.
