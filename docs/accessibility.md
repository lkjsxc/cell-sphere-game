# Accessibility

Accessibility is part of completion. This document records implemented
behaviors, the manual test matrix, and known limitations. Do not claim
conformance to a standard that has not been audited.

## Implemented (updated as systems land)

- Japanese UI with short sentences; one concept introduced at a time.
- All touch targets ≥ 44×44 CSS px; body text ≥ 16px.
- Portrait-primary layout usable at 360×640; safe-area insets respected.
- Information is never color-only: category, state, rarity, and locked
  states pair hue with symbol shape, line pattern, or label.
- `prefers-reduced-motion` honored as default; user override via settings.
  Reduced motion removes inertia, particle bursts, score count-up, and vein
  travel pulses while preserving state comprehension. No screen shake, no
  full-screen flashing.
- `prefers-contrast: more` strengthens borders/text; `forced-colors` gets
  system-color borders.
- Semantic DOM: real buttons/dialogs, visible focus, logical order, focus
  trapping only in true modals with restoration.
- Canvas has an accessible name; core HUD metrics mirrored in semantic DOM;
  polite live region announces adaptation choices, trophies, and errors —
  never rapid score updates.
- Settings reachable from the title screen; pause always reachable in-run.
- Audio muted by default; suspends when hidden; haptics off by default.

## Manual test matrix

| Scenario | Desktop Chrome | Mobile Chrome / emulation |
|---|---|---|
| Fresh-storage first run | pending | pending |
| 360×640 portrait reachability | pending | pending |
| Reduced motion flow | pending | pending |
| High contrast / forced colors | pending | pending |
| Browser zoom 150% / large text | pending | pending |
| Muted vs audio-enabled | pending | pending |
| WebGL2-disabled fallback | pending | pending |
| Worker-failure fallback | pending | pending |
| Corrupted-save recovery | pending | pending |
| Hidden-tab pause/resume | pending | pending |

Physical-device rows are only marked done with device/OS/browser recorded.

## Known limitations

- (record honestly as discovered)
