# Current status

## Autonomous World Feel v1

- The normal public speed ladder is 0.5×, 1×, and 2×. One runtime-speed policy
  converts those public values to effective game rates 2, 4, and 8 before the
  shared Worker/fallback clocks. New settings default to 1×; mismatched older
  settings reset under the current-only persistence policy.
- Game time, wall-clock time, and animation time are separate. Speed changes
  tick delivery and the World time dial only. Camera inertia/orbit, Result
  continuation, panels, and focus remain wall-clock presentation.
- A fixed-capacity presentation controller owns direct gesture samples, bounded
  release inertia, a 4.5-second idle delay, and a calm Home/World orbit. Trusted
  interaction, surfaces, focus, scene or World replacement, hidden visibility,
  and reduced motion clear or hold nonessential motion. Evolution and Trophies
  never auto-orbit.
- World/Home distance now derives from projected globe geometry. Required
  viewport measurements are 1.080 of the shorter canvas in phone portrait,
  0.989 at 768×1024, and 0.900 in wide/landscape layouts. Primary control
  centers stay outside the globe's inner 70%, picking remains correct, and
  same-class resize preserves intentional zoom.
- Result retains one nine-second, identity-checked continuation authority. A
  nonnumeric World-cycle ring projects its progress at a bounded cadence; exact
  remaining seconds are non-live assistive text. Hidden time pauses it and the
  first trusted interaction cancels it. Native Next World, Evolution, and
  History actions remain in the fixed footer.
- Home identifies the product as an autonomous incremental ecology, explains
  finite-world exhaustion and Echoes/Evolution, and says no tending is required.
  It does not promise offline progress.
- Authoritative ecology, Environment Level, SCORE, Echoes, Evolution, History,
  atmosphere, boundary rendering, and the four-draw WebGL2 World path are
  unchanged by this campaign.

## Current local evidence

- Focused speed tests and all-speed fallback determinism passed, including a
  mixed-speed terminal run and Worker/fallback parity.
- Trusted Chrome for Testing 152 passed Worker/WebGL2, synchronous
  fallback/WebGL2, and forced Canvas 2D production paths. The scenarios cover
  public and developer speed isolation, real mouse/touch release inertia,
  tap/pinch/cancel safeguards, Home idle orbit, surface-held direct drag,
  reduced/hidden behavior, the eight required viewports, Result
  progress/accessibility states, forced colors, 200% text, and unattended
  continuation. WebGL2 remained at four World draws.
- Eight-second foreground pacing measured 2.022, 4.032, and 7.937 game seconds
  per wall second at public 0.5×, 1×, and 2× on this host.
- `npm run test` passed 193 unit and 72 integration tests. The final same-host
  benchmark measured 12,300 ticks/s versus the 12,579-tick/s baseline (−2.2%),
  with unchanged authority hash `471ba1cc` and fresh profile hash `bec4a764`.
- `npm run balance:smoke` retained the fresh 131.7-game-second median and the
  completed ecology distributions; no simulation rule changed.
- `npm run showcase:check`, `npm run check:links`, and
  `npm run check:structure` pass; structure reports only maintainability
  warnings.
- Final `npm run verify` passed all 26 gates on stable local content, including
  193 unit tests, 72 integration tests, terminal extinction, balance smoke,
  benchmark, showcase, structure, and link validation.

CI and Pages evidence is pending the final normal push. Physical-device mouse,
touch, pen, thermal, and high-refresh evidence is unavailable on this host.
