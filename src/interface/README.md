# `src/interface/`

DOM-facing composition translates player intent into explicit commands. It never
mutates simulation arrays, consumes authoritative randomness, or changes SCORE.

| Module | Authority boundary |
|---|---|
| `app-controller.js` | Home/World/Evolution/Trophies composition and persistence orchestration. |
| `run-driver.js` | Worker-first run protocol v6 with identical fallback. |
| `policies/run-session.js` | First-wins replacement, neutral Level-0 blank frame, immutable start identity. |
| `policies/run-result.js` | Validated SCORE-v5/Echo/best-record/History-7/Trophy transaction. |
| `surfaces.js` / `inspection/` | Live Environment HUD, dynamic result evidence, metrics, Inspector, Event Log. |
| `panel-surfaces.js` / `progression-spheres.js` | 252-cell Evolution detail and second-activation transaction. |
| `history-*` / `app-data.js` | Bounded History and validated import/export. |

Evolution activation is select first, then a later discrete activation purchases
one ready selected cell. Drag, pinch, wheel, inertia, cancellation, blank taps,
non-ready state, and stale level/revision never purchase.

The World HUD displays live within-world Environment Level/progress. Result shows
final/peak/exposure and **Next World**, never static level selection/retry.
Evolution explains that every world starts at Level 0 and displays the achieved
best record. Exact values use canonical decimal formatting. Scene/camera/speed
changes remain authority-neutral.
