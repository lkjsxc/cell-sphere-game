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
Level/progress on stable grid tracks. Activating Environment Level opens a
current Environment detail with timing and chronic-pressure context; History
remains independently reachable. Result keeps its continuation status and
**Next World** action outside the scroll body, then offers **Evolution** and
**History**; it never offers static level selection/retry. The Menu owns only
common preferences and collapsed local data/reset actions; History retention is
an internal bounded policy.
Evolution explains that every world starts at Level 0 and displays the achieved
best record. Exact values use canonical decimal formatting. Scene/camera/speed
changes remain authority-neutral.
