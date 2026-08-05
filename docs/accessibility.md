# Accessibility and responsive interaction

## Semantics

- One persistent `role="tablist"` exposes Home, World, Evolution, and Trophies.
  Arrow keys, Home, and End move among tabs.
- Touch targets are at least 44 CSS px and respect safe areas.
- SCORE, ENTROPY, REACH, and terminal RESULT are native buttons with persistent
  borders, backgrounds, and disclosure marks; affordance is not hover-only.
  RESULT follows REACH in reading/visual order and gains a recommended-action
  cue at extinction.
- Evolution exposes a synchronized offscreen `role="tree"` with all 252 Skill
  Cells, owned/reachable/affordable state, and roving keyboard focus.
- Trophy Sphere exposes all 96 criteria in a semantic grid.
- Inspector fields use real headings and definition lists. Locked habitats name
  the missing Evolution capability.

## Shared detail shell

Result, History, Event Log, Menu, metrics, Inspector, Skill detail, Trophy detail,
and New World confirmation use one bounded nonmodal shell. The selected globe
remains visible and draggable. Skill detail reserves a dedicated intrinsic footer
track, so its 44 CSS px Unlock action cannot be collapsed or clipped by the
scrolling evidence body.

Interaction contract:

- same trigger toggles;
- another trigger replaces the current detail in one gesture;
- Escape and Close dismiss;
- opening a pane does not move or zoom the camera;
- drag, pinch, and wheel preserve the open detail;
- focus moves to the new heading and returns to a sensible trigger on close.

Result relies on the persistent primary selector and metric controls for SCORE,
ENTROPY, REACH, Evolution, and Trophies. It does not duplicate those navigation
or summary buttons.

## Notifications

Trophy and Skill notifications use bounded FIFO queues, persist unread state,
and never block world authority. Only one reveal is announced at a time. Reduced
motion uses static emphasis rather than removing information.

## Motion, contrast, and scaling

Motion settings use centralized duration variables. Reduced motion preserves
world-time meaning in the clock while removing decorative transitions. High
contrast strengthens material boundaries and focus indicators. Text and controls
remain bounded at 200% font scaling. The Skill action is geometry-tested at
320×568, short 390×320 and 640/667 landscape viewports, tablet/desktop sizes,
and 200% text.

The real-browser matrix covers 320×568, 390×844, 430×932, 768×1024, 844×390,
and 1440×900. CDP pointer/keyboard tests verify no horizontal overflow, 44px
selector/event targets, no dock or shell overlap, stable metric geometry, and
camera/detail behavior. Canvas 2D runs the same mobile-to-desktop path.

## Visibility and storage

Hidden documents suspend rendering and reduce authority work according to the
transport policy. Returning to the document does not invent elapsed presentation
time. Storage-unavailable sessions remain playable and expose temporary
persistence honestly.
