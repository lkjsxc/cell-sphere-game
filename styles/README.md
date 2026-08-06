# `styles/`

Native CSS split by responsibility; no framework or preprocessing.

| File | Responsibility |
|---|---|
| `tokens.css` | Authored palette, type, spacing, safe areas, contrast, and motion tokens. |
| `base.css` | Reset, focus, forced colors, and semantic helpers. |
| `layout.css` | Canvas, four scene layers, HUD, and progression composition. |
| `components.css` | Buttons, metrics, exact-value formatting, and speed controls. |
| `surfaces.css` | Result rows, panels, Evolution level/purchase detail, and bounded notices. |
| `atlas.css` | Evolution/Trophy controls, affinity patterns, and cell-status content. |
| `motion.css` | Transform/opacity motion and reduced-motion overrides. |
| `shell.css` | Fixed scene selector, compact dock/event, and one physical detail shell. |

Load order is tokens → base → layout → components → surfaces → atlas → motion →
shell. Evolution styles distinguish locked, reachable-unaffordable, ready,
selected-ready, owned, owned-ready, selected-owned-ready, and recent-upgrade
states with shape/outline/inset/text as well as color. Normal motion may pulse a
selected ready cell; reduced motion uses a static high-contrast alternative.

There are no active Adaptation cards. Touch targets remain at least 44 CSS px;
short landscape, portrait, safe areas, keyboard focus, forced colors, and 200%
text retain a visible `Unlock Level 1` / `Upgrade to Level N` control.
