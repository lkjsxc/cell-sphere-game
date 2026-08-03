# styles/

Native CSS split by responsibility; no framework or preprocessing.

| File | Responsibility |
|---|---|
| `tokens.css` | Authored palette, type, spacing, safe areas, and motion tokens. |
| `base.css` | Reset, focus, forced colors, semantic helpers. |
| `layout.css` | Canvas, four scene layers, HUD, and progression composition. |
| `components.css` | Buttons, metrics, and speed controls. |
| `surfaces.css` | Adaptation cards, result rows, panels, and bounded notices. |
| `atlas.css` | Shared controls and content-module internals. |
| `motion.css` | Transform/opacity motion and reduced-motion overrides. |
| `shell.css` | Fixed scene selector, compact dock/event, and one physical context shell. |

Load order is tokens → base → layout → components → surfaces → atlas → motion → shell.
Touch targets remain at least 44 CSS px; mobile sheets honor safe areas; all
state has a text/shape cue; user contrast and motion settings apply through
root data attributes.
