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
| `inspection/` | Read-only cell detail and authoritative Reach Balance surfaces. |
| `panel-surfaces.js` | Explicit Adaptation and Memory-node/list interactions. |
| `policies/adaptation-effects.js` | Two-event visual queue, reduced-motion gate, bottom caption lifetime. |
| `policies/continuation.js` | Nine-second result countdown with independent suspension reasons. |
| `policies/run-result.js` | Idempotent Echo/Imprint/History completion transaction. |
| `policies/surface-coordinator.js` | One nonmodal context surface, Escape, and focus restoration. |
| `history-surface.js` | Nonmodal scrubber, world/event navigation, and expanded semantic list. |
| `history-playback.js` | Current/past bundle loading, stale guards, projection, and live restoration. |
| `settings-surface.js` | Live validated preference form and local-data actions. |
| `app-data.js` | Quality/DPR, seed, and export/import browser helpers. |

Primary screen, simulation status, and overlay are separate concerns. Ordinary
world taps only select cells; only Memory-node Unlock commands spend currency.
Bounded context surfaces continue world time unless the panel pause preference
owns its explicit pause reason. Adaptation captions are nonblocking and render
below context sheets; presentation events are released at world/result
transitions. Automatic continuation never purchases Memory.
