# Accessibility

Accessibility is a completion criterion, not a claim of audited conformance.

## Implemented

- English player UI with semantic buttons, sections, headings, lists, forms,
  fieldsets, definition lists, timestamps, and explicit close actions.
- Touch controls target at least 44 CSS px and honor mobile safe areas.
- Evolution Globe exposes a synchronized offscreen `role="tree"` for all 108
  Skill Cells; Home or the quiet Focus available control selects the nearest
  reachable skill. Arbitrary world-cell inspection still requires pointer hit testing.
- Cell inspector exposes static geography and low-cadence living state in a
  readable definition list. History exposes selected event text while primary
  cells receive a redundant visual material emphasis.
- Adaptation cards are ordinary generous buttons; offers never expire and the
  bounded surface opens only by explicit action.
- Adaptations, History, Settings, inspector, details, and Evolution Globe use bounded
  nonmodal context surfaces that leave the world visible. Optional panel pause
  defaults off and uses an independent lease.
- Context surfaces focus their heading, never trap focus as if blocking, restore
  the invoking control, and close through Close, their trigger, Escape, outside
  pointer input, or opening another surface.
- Skill status, cost, named prerequisites, locked reason, and explicit Unlock
  intent exist in DOM; the semantic tree and globe share one source of truth.
- One polite live region announces meaningful changes; rapid metrics do not.
- Reduced motion disables effective idle rotation and expanding waves and
  replaces two-second Adaptation propagation with brief static origin emphasis;
  cell stage, selection, and geographic meaning remain visible.
- Authored focus-visible, forced-colors, and high-contrast styles are present.

## Continuing-time safeguards

Pause is reachable before opening panels. Manual, hidden-document, and panel
reasons are independent; closing Settings cannot resume a manual pause.
Pending manual Adaptations remain indefinitely. Hidden documents stop rendering
through browser scheduling, pause authority through the lifecycle adapter, and
suspend rather than consume the unattended result countdown.

## Known limitations / unmeasured

Complete Japanese localization/language switching, keyboard globe orbit,
screen-reader manual audit, full-surface 200% zoom, forced-colors visual review, physical
mobile touch/thermal testing remain incomplete. Canvas fallback now has real-
Chrome screenshots, but its assistive-technology behavior has not been audited.
All advanced Skill Cells compile a concrete bounded run trait; named milestone
identities do not claim controls or readers that the interface does not ship.
