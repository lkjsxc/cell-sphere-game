# Accessibility and responsive interaction

## Semantics

- One persistent `role="tablist"` exposes Home, World, Evolution, and Trophies.
  Arrow keys, Home, and End move among tabs.
- Touch targets are at least 44 CSS px and respect safe areas.
- SCORE, REACH, ENV LEVEL, and terminal RESULT are native buttons with
  persistent borders, backgrounds, and disclosure marks; affordance is not
  hover-only. ENV LEVEL opens a current Environment detail with level timing
  and chronic-pressure context; History remains its own temporal surface.
  RESULT is last in reading/visual order and remains restrained at extinction.
- Evolution exposes a synchronized offscreen `role="tree"` with every current
  cell, exact levels, owned/reachable/affordable state, and roving keyboard focus.
- Trophy Sphere exposes all 96 criteria in a semantic grid.
- Inspector fields use real headings and definition lists. Locked habitats name
  the missing Evolution capability.

## Shared detail shell

Result, History, Menu, metrics, Inspector, Evolution detail, Trophy
detail, and New World confirmation use one bounded nonmodal shell. The selected
globe remains visible and draggable. Evolution detail reserves a dedicated
intrinsic footer
track, so its 44 CSS px Unlock action cannot be collapsed or clipped by the
scrolling evidence body.

Interaction contract:

- repeated non-Evolution metric triggers toggle;
- a repeated selected Evolution activation purchases one ready level or announces
  the stable non-ready reason; it never closes the detail;
- another trigger replaces the current detail in one gesture;
- Escape and Close dismiss;
- opening a pane does not move or zoom the camera;
- drag, pinch, and wheel preserve the open detail;
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
ring's travelling marker. Forced colors keeps the ring track and progress in
system colors; cancelled and disabled text remains explicit. High contrast
strengthens material boundaries and focus indicators. Text and controls remain
bounded at 200% font scaling. Home copy has one bounded content scroll owner when
the enlarged text cannot fit, while exposed canvas remains directly manipulable.
Large exact progression values use compact
engineering notation and expose their canonical value through an accessible label
or detail. The Evolution action is geometry-tested at 320×568, short 390×320
and 640/667 landscape viewports, tablet/desktop sizes, and 200% text.

The real-browser matrix covers 320×568, 360×640, 390×844, 430×932, 768×1024,
844×390, 1024×600, and 1440×900. CDP pointer/keyboard tests verify no horizontal
overflow, 44px selector/metric targets, no dock or shell overlap, stable
production-formatted metric geometry (including an exact accessible large SCORE),
terminal footer visibility at 200% text, projected globe geometry, mouse/touch
release classification, surface-held direct manipulation, reduced motion, and
camera/detail behavior. The native Game speed select exposes all six ordinary
values with visible focus and a 44px target at 320×568 and 200% text. Canvas 2D
runs the same mobile-to-desktop path.

## Visibility and storage

Hidden documents suspend rendering and reduce authority work according to the
transport policy. Returning to the document does not invent elapsed presentation
time: camera velocity is cleared, continuation progress is paused, and a fresh
idle delay begins on return. Storage-unavailable sessions remain playable and expose temporary
persistence honestly.
