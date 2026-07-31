# styles/

Native CSS, split by responsibility. No preprocessors, no frameworks.

| File | Responsibility |
|---|---|
| `tokens.css` | Design tokens: color, type, space, radii, z-layers, motion durations, safe areas. The only place raw values are invented. |
| `base.css` | Reset, document defaults, focus visibility, `.sr-only`, forced-colors support. |
| `layout.css` | App shell: canvas, screen stack, HUD grid, bottom sheets, panel screens, diagnostics overlay. Portrait-first. |
| `components.css` | Buttons, metric chips, signal pips, segmented controls. |
| `surfaces.css` | Adaptation cards, panels, dialogs, toasts, trophies, gallery grids. |
| `motion.css` | Keyframes and reduced-motion kill switches. Transform/opacity only. |

Invariants:

- Load order in `index.html`: tokens → base → layout → components → surfaces → motion.
- No component may invent a color or spacing value; use tokens.
- Touch targets ≥ 44×44 CSS px; body text ≥ 16px.
- Information is never color-only: pair hue with shape, label, or pattern.
- Animate only `transform` and `opacity`; no animated `backdrop-filter`,
  no full-screen blur, no box-shadow keyframes.
- `prefers-reduced-motion` and `prefers-contrast` are respected as defaults;
  user settings override via `data-motion` / `data-contrast` on `<html>`.
