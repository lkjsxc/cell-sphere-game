# `src/interface/`

DOM-facing composition translates player intent into explicit commands. It never
mutates simulation arrays, consumes authoritative randomness, or changes SCORE.

| Module | Authority boundary |
|---|---|
| `app-controller.js` | Home/World/Evolution/Trophies composition and persistence orchestration. |
| `run-driver.js` | Current Worker-first run protocol with identical fallback and relative-speed conversion. |
| `policies/run-session.js` | First-wins replacement, neutral Level-0 blank frame, immutable start identity. |
| `policies/run-result.js` | Validated SCORE/Echo/best-record/History/Trophy transaction. |
| `policies/camera-motion.js` | Presentation-only recent gesture samples, direct measured-vector release, elapsed-time damping to natural rest, idle orbit, and holds. |
| `globe-input.js` | One canvas input owner plus the shared detail shell's gesture-only camera proxy. |
| `policies/continuation.js` | One-shot 13.5-second Result authority and its bounded visual/assistive projection. |
| `surfaces.js` / `inspection/` | SCORE/REACH/Environment HUD, dynamic result evidence, metrics, and Inspector. |
| `panel-surfaces.js` / `progression-spheres.js` | Exact Evolution-cell selection, bounded navigation, detail, and transaction. |
| `history-*` / `app-data.js` | Bounded History and validated import/export. |

Evolution activation is select first, then a later discrete activation purchases
one ready selected cell. Fine-cell picking returns that exact cell. A bounded
native navigator exposes the current cell, its five or six direct neighbors,
stable previous/next traversal, and the next actionable frontier without
creating 2,562 persistent controls.
During an active world, detail states that upgrades
become available after that world and disables the transaction control. Drag,
pinch, wheel, inertia, cancellation, blank taps, non-ready state, and stale
local-level/aggregate-rank/revision preconditions never purchase.

The World HUD displays SCORE, REACH, and live within-world Environment
Level/progress on stable grid tracks. Activating Environment Level opens a
current Environment detail with timing and chronic-pressure context; History
remains independently reachable. Result keeps its continuation status and
**Next World** action outside the scroll body, then offers **Evolution** and
**History**; it never offers static level selection/retry. The Menu owns only
common preferences and collapsed local data/reset actions; History retention is
an internal bounded policy. History keeps controls stable above its sole scroll
owner, renders a complete v3 checkpoint atomically, and stays explicitly
semantic-only while visual data is loading or unavailable.
Evolution explains that every world starts at Level 0 and displays the achieved
best record. Exact values use canonical decimal formatting. The six standard
public speeds are relative multipliers converted once to effective game rates
1–6. Scene/camera/speed changes remain authority-neutral.
