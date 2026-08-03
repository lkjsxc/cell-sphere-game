# Accessibility

Accessibility is a completion criterion, not a claim of audited conformance.

## Implemented

- English player UI with semantic buttons, sections, headings, lists, forms,
  fieldsets, definition lists, timestamps, and explicit close actions.
- One fixed `role="tablist"` exposes Home, World, Evolution, and Trophies in
  stable order with one `aria-selected` tab and Left/Right/Home/End navigation.
- Touch controls target at least 44 CSS px and honor mobile safe areas; SCORE,
  ENTROPY, REACH, and the current-event control are genuine buttons.
- Evolution Globe exposes a synchronized offscreen `role="tree"` for all 642
  Skill Cells; Home or the quiet Focus available control selects the nearest
  reachable skill. Arbitrary world-cell inspection still requires pointer hit testing.
- Cell inspector exposes static geography and low-cadence living state in a
  readable definition list. History exposes selected event text while primary
  cells receive a redundant visual material emphasis.
- Adaptation cards are ordinary generous buttons; offers never expire and the
  bounded surface opens only by explicit action.
- Result, History, Event Log, Menu, metrics, Adaptations, Inspector, Skill, and
  Trophy detail use one bounded nonmodal physical shell that leaves the selected
  globe visible. Optional panel pause defaults off and uses an independent lease.
- The shell focuses its active heading, never traps focus as if blocking, restores
  the invoking control after an ordinary close, and does not restore focus after
  a globe drag. Close, same trigger, Escape, blank tap, or a replacing action work
  without dismissing at canvas pointerdown.
- Skill status, cost, an actual adjacent unlocked cell when present, the locked
  adjacency reason, fresh-save root status, and explicit Unlock intent exist in
  DOM; the semantic tree and globe share one source of truth.
- Trophy Sphere exposes all 96 criteria in a six-row semantic grid with roving
  arrow-key focus. Pointer and semantic selection open the same read-only earned
  or not-earned detail; neutral sphere cells do nothing.
- One polite live region announces meaningful changes; rapid metrics do not.
- Reduced motion disables effective idle rotation and expanding waves and
  replaces two-second Adaptation propagation with brief static origin emphasis;
  cell stage, selection, and geographic meaning remain visible.
- Authored focus-visible, forced-colors, and high-contrast styles are present.

## Continuing-time safeguards

Pause is reachable before opening panels. Manual, hidden-document, and panel
reasons are independent; closing Menu cannot resume a manual pause.
Pending manual Adaptations remain indefinitely. Hidden documents stop rendering
through browser scheduling, pause authority through the lifecycle adapter, and
pause rather than consume the unattended result countdown. Any trusted focus,
keyboard, pointer, touch, wheel, or control interaction at a result permanently
cancels Auto Next for that result; the quiet cancellation status remains visible.

## Known limitations / unmeasured

Complete Japanese localization/language switching, keyboard globe orbit,
screen-reader manual audit, browser-zoom review, forced-colors visual review, and
physical mobile touch/thermal testing remain incomplete. Real Chrome checks 200%
text sizing, reduced-motion tokens, authored high contrast, and long selector
labels without horizontal overflow; that is not a screen-reader or forced-colors audit. Canvas fallback now has real-
Chrome screenshots, but its assistive-technology behavior has not been audited.
All advanced Skill Cells compile a concrete bounded run trait; named milestone
identities do not claim controls or readers that the interface does not ship.
