# Accessibility and responsive interaction

## Semantics

- One persistent `role="tablist"` exposes Home, World, Evolution, and Trophies.
  Arrow keys, Home, and End move among tabs.
- Touch targets are at least 44 CSS px and respect safe areas.
- SCORE, REACH, ENV LEVEL, and terminal RESULT are native buttons with
  persistent borders, backgrounds, and disclosure marks; affordance is not
  hover-only. ENV LEVEL opens a current Environment detail with level timing
  and five visible whole percentages for Resource yield, Renewal, Climate,
  Toxicity, and Maintenance & transport. Each static row names its pressure and
  percentage for assistive technology. Interpolation does not use a live region;
  History remains its own temporal surface.
  RESULT is last in reading/visual order and remains restrained at extinction.
- Evolution exposes one bounded native navigator for the selected cell. It names
  stable cell position, archetype, domain, local level, shared aggregate rank,
  ownership, reachability, affordability, and exact next cost; it adds only five
  or six direct-neighbor buttons, previous/next traversal, next-ready navigation,
  and the purchase action. The 2,562 rendered cells never become persistent DOM
  controls or live announcements.
- Trophy Sphere exposes all 96 criteria in a semantic grid.
- Inspector fields use real headings and definition lists. Locked habitats name
  the missing Evolution capability. The selected-cell inspector remains the
  non-color oracle for living state, ecological role, local resource condition,
  stress, and Luminous charge; canvas color is never the only source of those
  meanings. The canvas is a keyboard stop: Enter or Space inspects the cell at
  the projected sphere center, and closing the Inspector restores canvas focus.

## Shared detail shell

Result, History, Menu, metrics, Inspector, Evolution detail, Trophy
detail, and New World confirmation use one bounded nonmodal shell. The selected
globe remains visible and draggable. A 44 CSS px **Drag globe** strip at the
top of that shell passes drag, pinch, and wheel gestures to the same globe input
owner without becoming a focusable control, moving native detail focus, or
turning a tap into inspection, purchase, or dismissal. Evolution detail reserves
a dedicated intrinsic footer
track, so its 44 CSS px Unlock action cannot be collapsed or clipped by the
scrolling evidence body. In short landscape at enlarged text, the complete
Evolution detail becomes the sole scroll owner; Close is reachable at scroll-top
and the full purchase action is reachable at scroll-bottom without page overflow.

Interaction contract:

- repeated non-Evolution metric triggers toggle;
- a repeated selected Evolution activation purchases one ready level or announces
  the stable non-ready reason; it never closes the detail;
- another trigger replaces the current detail in one gesture;
- Escape and Close dismiss;
- opening a pane does not move or zoom the camera;
- drag, pinch, and wheel on the globe or the shell's Drag globe strip preserve
  the open detail;
- focus moves to the new heading and returns to a sensible trigger on close.

Result actions are ordered **Next World**, **Evolution**, and **History**. Its
continuation status and primary action sit outside the scrolling Result body, so
both remain reachable on compact viewports. A nonnumeric World-cycle ring shows
bounded progress from the existing continuation authority. A visually hidden
description exposes exact rounded seconds and the interaction-cancellation rule;
the 13.5-second default truthfully begins at 14 seconds under ceiling semantics,
updates at most at second boundaries, and is not a live region. Counting,
paused, cancelled, disabled, firing, and complete state transitions use text and
shape as well as color, and meaningful transitions announce once. The persistent
selector and metric controls remain the primary navigation for SCORE, REACH,
Environment Level, Evolution, and Trophies; Result provides its own terminal-world
continuation and review routes. History keeps its World selector and playback
controls outside its sole scroll owner. While visual checkpoints load or are
unavailable, its disabled range/step controls and explicit semantic-only copy
prevent an assistive user from being told the live globe is historical.

## Notifications

Trophy and Evolution notifications use bounded FIFO queues, persist unread state,
and never block world authority. Only one reveal is announced at a time. Reduced
motion uses static emphasis rather than removing information.

## Motion, contrast, and scaling

Motion settings use centralized duration variables. Reduced motion preserves
direct globe manipulation, world-time meaning in the clock, and the informative
continuation trace while disabling camera inertia, automatic orbit, and the
ring's travelling marker. Ordinary life boundaries are static snapshot
projections and use the same implementation under reduced motion. Stress and
critical edges differ through static contrast/coverage as well as hue. Forced
colors keeps controls, focus, selection access, and textual inspection in system
colors even though the user agent does not recolor pixels inside the WebGL2 or
Canvas bitmap; cancelled and disabled text remains explicit. High contrast
strengthens material boundaries and focus indicators. Text and controls remain
bounded at 200% font scaling. Home copy has one bounded content scroll owner when
the enlarged text cannot fit, while exposed canvas remains directly manipulable.
Evolution state is never canvas-color-only: the bounded navigator and detail name
locked, reachable-unaffordable, ready, owned, owned-ready, and selected state;
small kind-sensitive inset shapes and progressively stronger exact-cell
perimeters provide non-color visual shape/weight cues over unchanged geographic
material. Connected archetype perimeters differ from dashed domain perimeters in
Canvas, while WebGL uses distinct restrained weight; exact progression-state
perimeters remain stronger in both. Domain and archetype remain named in text;
the fresh detail explicitly names `First Division`, so green location is never
the only start cue. Land, water, biome, and progression colors are not semantic
substitutes for those names. Large exact
progression values use compact
engineering notation and expose their canonical value through an accessible label
or detail. The Evolution action is geometry-tested at 320×568, short 390×320
and 640/667 landscape viewports, tablet/desktop sizes, and 200% text.
At compact widths the Environment detail itself is the one vertical scroll
owner, keeping Close and all five pressure rows reachable at 200% text without
horizontal page overflow. Strongest pressure is also named in text, so color is
never its only distinction.

The real-browser matrix covers 320×568, 360×640, 390×844, 430×932, 768×1024,
844×390, 1024×600, and 1440×900. CDP pointer/keyboard tests verify no horizontal
overflow, 44px selector/metric targets, no dock or shell overlap, stable
production-formatted metric geometry (including an exact accessible large SCORE),
terminal footer visibility at 200% text, projected globe geometry, mouse/touch
release parity, one-radius direct travel, post-zoom and resize-stable gesture
geometry, surface-held direct manipulation (including the detail-shell Drag
globe strip), reduced motion, and camera/detail
behavior. The native Game speed select exposes all six ordinary
values with visible focus and a 44px target at 320×568 and 200% text. Canvas 2D
runs the same mobile-to-desktop path.

The focused Evolution-cell matrix covers all eight maintained viewports at 200%
text in Worker/WebGL2, fallback/WebGL2, and fallback/Canvas 2D. It proves bounded
DOM independent of cell count, one exact selected cell, named direct neighbors,
deterministic native traversal, forced colors, stable reduced motion, reachable
actions, 44 px controls/tabs, canvas reachability, no horizontal page or panel
overflow, and stable unchanged frames. It also proves the sole green-land root is
focused and named, connected archetype/domain edge structure remains legible at
far/close and center/limb views, and the same fixed geographic substrate remains
beneath local state cues.

The focused Environment matrix additionally covers 390×844, 768×1024,
844×390, and 1440×900 in Worker/WebGL2, fallback/WebGL2, and
fallback/Canvas 2D. It records percentage text and accessible names, keyboard
open/Escape/focus restoration, forced colors, reduced motion, 200% text,
surface rectangles, and scroll ownership.

## Visibility and storage

Hidden documents suspend rendering and reduce authority work according to the
transport policy. Returning to the document does not invent elapsed presentation
time: camera velocity is cleared, continuation progress is paused, and a fresh
idle delay begins on return. Storage-unavailable sessions remain playable and expose temporary
persistence honestly.
