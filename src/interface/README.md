# `src/interface/`

DOM-facing composition translates player intent into explicit commands. It never
mutates simulation arrays, consumes authoritative randomness, or changes SCORE.

| Module | Source-of-truth responsibility |
|---|---|
| `app-controller.js` | Home/World/Evolution/Trophies composition, shell ownership, and persistence orchestration. |
| `app-state.js` | Independent world phase and selected-scene state. |
| `run-driver.js` | Worker-first run-protocol-v5 timing with identical fallback. |
| `globe-input.js` | Tap versus drag/pinch/wheel/cancellation classification and pointer capture. |
| `panel-surfaces.js` | 252-cell Evolution semantic tree/detail, exact levels/costs, ready states, and purchase button. |
| `policies/progression-spheres.js` | Shared second-activation Evolution transaction and Trophy selection. |
| `policies/run-session.js` | First-wins atomic replacement and typed blank frame. |
| `policies/run-result.js` | Idempotent SCORE-v4/Echo/History-6/frontier/Trophy transaction. |
| `surfaces.js` / `inspection/` | HUD, Result, pressure/metric explanations, Inspector, and Event Log. |
| `runtime-speed-controls.js` | Player 1×/2×/4×/8× and explicit session-only developer 16×–256× controls. |
| `history-surface.js` / `history-playback.js` | Bounded semantic and optional visual History. |
| `settings-surface.js` / `app-data.js` | Validated preferences and browser import/export helpers. |

Evolution activation is a state machine: an unselected cell activation selects
and opens detail without buying; a later discrete activation of the same selected
ready cell buys exactly one level. Different-cell selection, blank taps, non-ready
activation, and movement/gesture/inertia/cancellation never buy. Pointer, touch,
keyboard, hidden semantic tree, and visible button converge on one transaction,
which sends expected level/meta revision and leaves the cell selected after success.
Activating an already selected Evolution cell never closes its detail.

The UI presents canonical decimal strings for exact Echoes, Potential v3, SCORE
v4, Environment Level, and costs from meta schema 11/History 6. Active
Adaptations are retired; only inert archived evidence may be displayed. Opening
panes and changing scene/camera/speed remain authority-neutral. Relevant gates
are interface unit tests, integration transaction tests, `test:browser:file`,
`test:browser:canvas`, and `audit:evolution-levels`.
