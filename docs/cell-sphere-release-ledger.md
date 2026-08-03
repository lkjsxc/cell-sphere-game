# cell-sphere-game release ledger

Vocabulary is evidence-scoped: **implemented**, **tested**, **measured**, **observed**, **deployed**, **modeled**, and **target** are not interchangeable. The verified starting revision is `fcbb544f60b37b13005b29f954ad5dcd8231738e`; ignored baseline artifacts are under `reports/cell-sphere-baseline/`.

## Baseline truth

- **observed** GitHub repository `lkjsxc/incremental-network-game`, `main`, clean and synchronized with `origin/main`; Pages deployment `5722080281` points at the starting revision.
- **tested** `npm run verify`: 109 unit and 50 integration tests plus every fast gate passed; benchmark hash `c55ddab5`.
- **tested** real Chrome WebGL2 and Canvas scenarios passed; WebGL2 completed 32× in 9.25 s with four draws.
- **deployed** protective tag `pre-cell-sphere-game-rename-20260803` resolves locally and remotely to the starting revision.
- **measured** at 1440×900, Settings changed normalized camera offset by `0.0133355`, about `9.60 CSS px`; camera basis and distance stayed equal.
- **observed** Settings → Adaptations through one real pointer gesture dismissed Settings but did not open Adaptations.
- **observed** Settings → globe through one real pointer gesture dismissed Settings but did not select a cell.
- **observed** repeated real CDP pointers at the same Adaptation card center produced one success and one silent no-op; the command had no explicit acknowledgement/rejection transaction.
- **measured** the clock minute hand moved while the hour hand remained fixed; pause changed both hands to `display:none`.
- **observed** a result-globe drag changed camera direction without changing score, but left automatic continuation paused with 8,439 ms remaining after 11.5 s idle.

## Requirement map

| Requirement | Current evidence | Production scope | Acceptance evidence |
|---|---|---|---|
| 0. Integrated objective | observed baseline above | all slices below | release gates and public review |
| 1. Baseline/failure paths | observed key interface defects; world-system measurements recorded with their slices | policies, simulation, world, rendering | baseline Chrome, world audits |
| 2. Constraints | tested deterministic baseline and zero runtime dependencies | architecture and verification | parity, speed, structure gates |
| 3. Execution protocol | deployed protective tag; measured baseline | this ledger, coherent commits | exact commands and revisions |
| 4. Canonical rename | target `cell-sphere-game` | package, product, globals, storage, docs, GitHub | exact-name audit and Pages inspection |
| 5. Stable composition | implemented viewport-only policy; measured Settings delta `0 px` at 1440×900 | `layout-policy.js`, camera resize | unit test and real-Chrome paired capture |
| 6. Outside dismissal | implemented scoped target classification; tested Settings→Adaptations and Settings→cell with native CDP pointers | `surface-coordinator.js`, browser scenario | mouse passes; touch/cancel matrix pending |
| 7. Manual Adaptation | observed intermittent real-pointer no-op and unacknowledged authority | UI, protocol, Worker/fallback | success/rejection/double-click scenarios |
| 8. Time dial | implemented one frame-loop phase; measured both hands moving and frozen visibly on pause | `time-dial.js`, pause semantics, CSS | unit and real-Chrome transform tests pass |
| 9. 642 Skill Cells | observed 642 rendered cells but 108 definitions | canonical skill content/scene/storage | mapping validator and full legal unlock |
| 10. Skill migration | target lossless old ownership migration | progression adapter/export/import | old-save and corrupt-field fixtures |
| 11. Auto continuation | observed permanent interaction suspension | one-shot continuation state machine | result interaction lifecycle matrix |
| 12. Reach Balance | target authoritative direct and condition evidence | lifecycle ledger, snapshots, result UI | exact reconciliation and parity |
| 13. Result globe | observed direct rotation neutral to score | globe input and continuation leases | real-CDP drag and screenshots |
| 14. Trophy Sphere | target 96 implemented achievements on 162 cells | definitions, evaluator, persistence, scene/UI | schema, idempotency, browser/fallback |
| 15. Graph effects | target terrain/family propagation | shared graph field, events, renderer | determinism, permeability, screenshots |
| 16. Major rivers | target explicit trunks/tributaries | hydrology, fields, renderer, audit | 500–1,000 seed distributions |
| 17. Shared graph primitives | target reusable pure traversal | core/world graph modules | focused unit use across systems |
| 18. Protocol contracts | target versioned acknowledged messages | driver, Worker, simulator | stale and duplicate command tests |
| 19. Responsive quality | tested baseline viewport matrix | CSS, semantics, browser evidence | required geometry matrix and 200% text |
| 20. Performance | measured four baseline draws and 9.25 s 32× | bounded fields/uploads/evaluation | benchmark, browser timing, draw counts |
| 21. Persistence/export | target validated current schema | platform stores and migrations | idempotent localStorage/IndexedDB/import |
| 22. Automated tests | target additive coverage | unit, integration, browser, audits | exact command results |
| 23. Visual evidence | observed baseline capture inventory | ignored reports | paired final screenshots and overlays |
| 24. File audit map | observed repository modules; changed files recorded per slice | all named subsystems | structure/link/name gates |
| 25. Ordered gates | target A–J | release process | ledger status and commit evidence |
| 26. Anti-goals | target absence of listed regressions | implementation and audits | focused tests and source audit |
| 27. Final report | target complete handoff | status and release evidence | 32 requested report fields |
| 28. Definition of done | target exact reviewed deployed revision | integrated product | clean tree, Actions, Pages, public inspection |
