# src/interface/

DOM-facing composition. It translates player intent into explicit commands;
it never mutates simulation arrays or consumes authoritative randomness.

| Module | Responsibility |
|---|---|
| `app-controller.js` | Orthogonal scene/phase composition, one-shell ownership, persistence transactions. |
| `app-state.js` | Independent world phase and Home/World/Evolution/Trophies scene state. |
| `run-driver.js` | Worker-first timing with the same main-thread fallback controller. |
| `globe-input.js` | Tap/drag/pinch/wheel classification and pointer capture. |
| `camera-policy.js` | Optional idle rotation, interruption, and reduced-motion gate. |
| `pause-control.js` | Independent manual/hidden/panel pause reasons. |
| `surfaces.js` | Core HUD, terminal Result data, notices, and scene visibility. |
| `inspection/` | Read-only cell, shared metric, and bounded Event Log surfaces. |
| `panel-surfaces.js` | Explicit Adaptation and Memory-node/list interactions. |
| `policies/adaptation-effects.js` | Two-event visual queue, reduced-motion gate, bottom caption lifetime. |
| `policies/continuation.js` | Untouched-only nine-second result countdown; hidden-time pause and trusted-interaction cancellation. |
| `policies/run-session.js` | First-wins atomic teardown, typed blank frame, and authority replacement transaction. |
| `policies/run-result.js` | Idempotent Echo/Imprint/History completion transaction. |
| `policies/surface-coordinator.js` | One physical shell, post-gesture dismissal, Escape, and focus restoration. |
| `policies/scene-selector.js` | Stable semantic four-scene tablist and keyboard navigation. |
| `history-surface.js` | Nonmodal scrubber, world/event navigation, and Event Log route. |
| `history-playback.js` | Current/past bundle loading, stale guards, projection, and live restoration. |
| `settings-surface.js` | Unified Menu groups, validated preferences, and local-data actions. |
| `app-data.js` | Quality/DPR, seed, and export/import browser helpers. |

Selected scene, authoritative world phase, simulation status, and shell mode are
separate concerns. Ordinary world taps only select cells; only Skill Cell Unlock
commands spend currency, and an active run receives those Skills next world.
The one bounded context shell continues world time unless the panel pause
preference owns its explicit pause reason. Adaptation captions are nonblocking and render
below context sheets; presentation events are released at world/result
transitions. Automatic continuation never purchases Memory.
