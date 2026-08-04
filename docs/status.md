# Status

Revision date: 2026-08-04. Evidence words are used literally: implemented,
tested, measured, observed, deployed, modeled, and target are not interchangeable.

## Release identity

- Canonical product/package: `cell-sphere-game`.
- Tagline: `Every extinction becomes memory.`
- Canonical repository: `lkjsxc/cell-sphere-game`.
- Canonical Pages URL: `https://lkjsxc.github.io/cell-sphere-game/`.
- The GitHub repository was renamed in place; history and Pages configuration
  were preserved. Local `origin` now uses the canonical repository.
- The repository started this release at
  `440a565b5ae952c4bc389bf91081db462ea2c6dd`. The replacement root contract is
  commit `1ab584486a793d9104a6a64c8d262f55a5480bf9`. The pushed protective tag
  `pre-cell-lakes-unified-shell-20260803` points to the verified start.
- Source implementation through
  `6bb6960d40c5daaf1d8f3f13a842a7050e1a4672` is pushed to canonical `main`.
  Final documentation and deployment evidence are recorded by the release
  commit that follows it.

## Product and architecture

### Cell-only freshwater world

- WebGL2 no longer creates or uploads `riverDown`, `riverUp`, `riverMeta`,
  `aRiverDown`, `aRiverUp`, or `aRiverMeta`. The within-cell shader channel and
  Canvas `drawRivers`/boundary-curve path were deleted rather than hidden.
- Deterministic private drainage now selects 6–8 separated connected whole-cell
  lakes per ordinary world. Frozen public records expose area/depth classes,
  surface elevation, catchment, outlet status, type, salinity, whole-cell shore,
  and whole-cell wetland sets without exposing an outflow route.
- Lakes affect moisture, nutrients, growth suitability, drought/freeze/event
  proof, Inspector, landmarks, Reach explanation, semantic History, and
  lake-centric Trophies. Old river ownership is retained only as an explicit
  Legacy Trophy and supplies no current lake proof.
- `audit:cell-visuals` rejects the removed geometry/shader/Canvas identifiers,
  including prefixed `aRiver*`/`vRiver*` forms. `audit:lakes` is the current water
  audit; the temporary `audit:rivers` alias has been removed.

### Atomic world sessions and terminal truth

- Every world start enters the same first-wins replacement coordinator with the
  immutable tuple `{worldSessionId, runId, seed, presentationGeneration,
  resultTransactionKey}`.
- Replacement retires authority and requests, clears every world-owned surface,
  event, History preview, highlight, Adaptation buffer, snapshot, timer, and
  renderer mirror, then binds and renders one typed zero-life `starting` frame
  before new authority begins.
- Worker-to-fallback handover now has an independent transport generation.
  Queued callbacks from the retired Worker cannot kill or mutate fallback
  authority in the same world session.
- Extinction emits the authoritative terminal snapshot before the result. Result
  HUD, Reach, Entropy, event state, and the rotatable final globe therefore agree
  on zero living cells rather than retaining the penultimate snapshot.
- WebGL context loss replaces the context-locked canvas element before creating
  Canvas 2D, rebinds globe input and ResizeObserver, and continues rendering.
- In-run replacement requests always await authoritative reward-free abandonment;
  behavior no longer depends on one special reason string. Pre-authority recovery
  is bounded rather than consuming seeds in an unbounded retry loop.

### Untouched-only Auto Next

- A new result receives one inactivity countdown. Trusted pointer, touch, wheel,
  keyboard, focus, navigation, panel, metric, globe, or control interaction
  cancels it permanently for that result. Movement, synthetic input, and
  visibility alone do not cancel it.
- Hidden time is excluded even when extinction is delivered after the document
  was already hidden. Manual and automatic replacement racing in one frame is
  first-wins.
- Real Chrome now lets an untouched countdown expire and verifies the first clean
  new frame; interaction cancellation is separately exercised with trusted CDP
  input.

### Unified shell

- SCORE, ENTROPY, and REACH are 44px semantic buttons using one fixed-size detail
  shell. At 1440×900 all three measured exactly `460.796875 × 652` at
  `left=16, top=144` through live updates.
- One physical context shell presents Inspector, metrics, Result, History, Event
  Log, Menu, Adaptations, Skill, and Trophy details. It is left-side on wide
  screens and bounded bottom/side on mobile. Globe drag/pinch retains open
  surfaces; a classified tap applies cell/blank policy.
- Terminal World retains the globe, HUD, metrics, Event Log trigger, Menu, and
  scene selector. Result opens in the shared shell and has a persistent reopen
  control. History uses a three-track header/scroll-body/footer shell.
- Current-event remains visible and opens the bounded 80-row Event Log on mobile
  and desktop. Current product copy uses `Event Log`, not `Event History`.
- The active dock contains time, speed, Adaptations, and Menu. Menu owns
  Preferences, History/Event Log/Result routes, and confirmed reward-free New
  World. The long and short hands advance on independent bounded phases and
  both accelerate at every world-speed step. They freeze only while paused or
  terminal; reduced motion uses a slower, still speed-aware sweep. Mobile Adaptations is capped at 36dvh; cards and the disclosure
  target remain at least 44px.
- One fixed semantic `Home | World | Evolution | Trophies` selector owns scene
  navigation and camera restoration.
- Presentation durations are centralized at 2.7s toast, 3.75s Adaptation, 4.2s
  Trophy, and 4.5s important feedback. Trophy presentation is persisted,
  sequential, nonblocking, actionable, and honest when acknowledgement storage
  fails.

### Evolution, Trophies, and persistence

- All 642 Evolution cells have effects and remain legally purchasable for 2,462
  Echoes. Exactly six roots bootstrap an empty save. After the first ownership,
  every purchase requires enough Echoes and at least one actual adjacent owned
  cell; run count, `Worlds observed`, experience, and all-parent gates are absent.
- Existing recognized ownership, including disconnected migrated islands,
  remains owned and effective. Unknown IDs remain quarantined without charges or
  refunds.
- The 96 current Trophies use richer bounded evidence across lake ecology,
  morphology, crises, Adaptation modes, Evolution, SCORE, and cumulative mastery.
  Recognition, History, reward, ownership, and queue insertion are deterministic
  and exactly once.
- Canonical localStorage documents, IndexedDB visual History, diagnostics, JSON
  exports, package metadata, UI, repository, and Pages identity use
  `cell-sphere-game`. Legacy documents and exports are accepted only through
  isolated idempotent migration. Canonical verified writes win coexistence;
  legacy sources are retained for recovery.

## Measurements and verification

- Unit: **145/145 passed**.
- Integration: **76/76 passed**, including a 100-cycle first-wins replacement
  coordinator test and stale same-session Worker callback rejection.
- Cell visual audit: **25 production files, zero violations, four draws**.
- Lake audit: **500 worlds**, 6–8 lakes/world (mean 6.6), 3–18 cells/lake
  (median 10), deterministic hash `d8ee64b9`, all connectivity/overlap/shore/
  wetland/privacy counters zero, mean generation **2.73ms/world**.
- Evolution audit: 642 cells, 1,920 physical boundaries, 3,840 directed
  frontiers, 407,682 nonadjacent single-owner denials, six fresh roots, exact
  2,462-Echo economy, mapping hash `d6bdc218`, economy hash `34b4e4a9`.
- Event audit: 200 worlds / 1,386 fields, zero ocean violations, median field
  compute 0.212ms.
- Trophy audit: 96 unique cells; fresh 24-world cohort earned one each. The
  production-modeled campaign reaches **2 / 6 / 8 / 18 / 62** total at
  1 / 4 / 12 / 48 / 240 worlds, leaving 34 after the twenty-hour-equivalent
  horizon; deterministic audit hash `4f67241f`; no impossible criteria; Legacy
  migration and one-time rewards valid.
- Full balance: 30 worlds per policy. Median ordinary lifetimes were 272.2s
  balanced, 291.5s random, 277.2s expansion, 334.9s resilience, and 279.7s
  efficiency.
- Terminal soak: **1,000/1,000 valid**, zero duplicate terminal messages;
  median 2,782 ticks, p95 3,613, maximum 3,620.
- Benchmark: 2,715 ticks in 187ms, **14,484 ticks/s**, hash `256388b9`, 9MB
  process heap used by the benchmark report.
- Static geometry arrays fell from **2,411,700** to **1,838,196 bytes**
  (`−573,504`, `−23.78%`); shader attributes fell from 10 to 7. Draw count stays
  four.
- Real Chrome/WebGL2: PASS; final SCORE 595,964; 32× completion **7.85s**;
  title render mean 0.89ms / p95 1.10ms; exact metric rectangles; actual untouched
  countdown; clean replacement frame; dynamic WebGL-context-loss transition to
  Canvas 2D; no recorded browser error.
- Real Chrome/forced Canvas 2D: PASS; SCORE 614,507; authoritative zero-life
  terminal snapshot, History, Evolution, Trophies, and clean replacement passed.
- Responsive CDP evidence covered 320×568, 390×844, 430×932, 768×1024,
  844×390, and 1440×900 plus 200% text, reduced motion, high contrast, and a long
  selector label. The complete requested title matrix also remains in the browser
  evidence harness.
- Showcase remains byte-identical at 89 frames / 228,754 bytes, data hash
  `22ac0d97…`; source fingerprint updated to `53b97a33…` for the terminal snapshot
  transport change.

## Honest limitations

- Physical Android/iOS, thermal, screen-reader, Japanese localization, browser
  zoom controls, actual GPU timing, and public-app visual interaction were not
  physically measured in this environment. CDP emulation is not a physical-device
  claim.
- Forced-GC browser heap trend was not available. Bounded queues/listeners/
  requests are asserted, the 100-cycle coordinator test is deterministic, and
  the 1,000-world terminal soak passed, but those are not a physical browser heap
  profile.
- The final canonical Actions/Pages run and cache-busted public-byte hash must be
  checked after the release-status commit is pushed; the final handoff records
  that exact external result.
