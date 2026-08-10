# `src/interface/`

DOM-facing composition translates player intent into explicit commands. It never
mutates simulation arrays, consumes authoritative randomness, or changes SCORE.

| Module | Authority boundary |
|---|---|
| `app-controller.js` | Home/World/Evolution/Trophies composition and persistence orchestration. |
| `run-driver.js` | Worker-first run protocol v8 with identical fallback. |
| `policies/run-session.js` | First-wins replacement, neutral Level-0 blank frame, immutable start identity. |
| `policies/run-result.js` | Validated SCORE/Echo/best-record/History-9/Trophy transaction. |
| `surfaces.js` / `inspection/` | SCORE/REACH/Environment HUD, dynamic result evidence, metrics, and Inspector. |
| `panel-surfaces.js` / `progression-spheres.js` | Evolution detail and second-activation transaction. |
| `history-*` / `app-data.js` | Bounded History and validated import/export. |

Evolution activation is select first, then a later discrete activation purchases
one ready selected cell. During an active world, detail states that upgrades
become available after that world and disables the transaction control. Drag,
pinch, wheel, inertia, cancellation, blank taps, non-ready state, and stale
level/revision never purchase.

The World HUD displays SCORE, REACH, and live within-world Environment
Level/progress. Activating Environment Level opens current-world History with
Environment records emphasized. Result shows final/peak/exposure and **Next
World**, **Evolution**, and **History**, never static level selection/retry.
Evolution explains that every world starts at Level 0 and displays the achieved
best record. Exact values use canonical decimal formatting. Scene/camera/speed
changes remain authority-neutral.
