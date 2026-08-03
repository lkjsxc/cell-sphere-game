# cell-sphere-game release ledger

Evidence words are scoped: **implemented**, **tested**, **measured**, **observed**, **deployed**, **modeled**, and **target** are not interchangeable.

## Verified start

- **observed** start `440a565b5ae952c4bc389bf91081db462ea2c6dd`, branch `main`, upstream `origin/main`, clean except for the supplied replacement `AGENTS.md`.
- **observed** GitHub repository `lkjsxc/incremental-network-game`, viewer permission `ADMIN`, workflow Pages at `https://lkjsxc.github.io/incremental-network-game/`, and successful workflow `30808633485` for the start commit.
- **implemented / pushed** replacement contract commit `1ab584486a793d9104a6a64c8d262f55a5480bf9`.
- **deployed** protective tag `pre-cell-lakes-unified-shell-20260803` at the verified start.
- **tested** `npm run check:structure` and `npm run verify`: 103 unit and 61 integration tests, balance smoke, benchmark, showcase, links, and structure passed; benchmark `15,547 ticks/s`, hash `637b2473`.
- **observed failure** `npm run test:browser:file`: History scrub raced terminal state at tick 2,592 and did not produce an approximate checkpoint.
- **observed** 18 real-Chrome baseline captures and a state dump under ignored `reports/cell-lakes-shell-baseline-440a565/`.

## Baseline contradictions

- **observed** sub-cell teal channels cross cell interiors in `09-river-channel-closeup.png`.
- **observed** mobile current-event copy exists but has `display:none` in `03-run-mobile-event-hud.png`.
- **observed** SCORE and ENTROPY are `DIV`; only REACH is a `BUTTON`.
- **observed** the active dock exposes Adaptations, History, New World, and Settings.
- **measured** Reach used the mobile sheet rectangle `0,489.53,390,354.47` at ticks 480 and 896; its globe drag changed the surface from open to hidden.
- **observed** terminal composition is a replacement `result-screen` with a bottom result strip and no context surface.
- **observed** automatic continuation advanced run ID `1 → 2`, but `13-auto-next-first-observed-frame.png` retained the previous terminal globe, SCORE `613,052`, ENTROPY `100%`, and last-cell state while the app already reported new run state `starting`.
- **observed** Evolution copy includes `Locked, observe … more worlds`; Trophy evidence includes automatic one-cell coast/river/forest/highland/wetland awards.
- **observed** Home/World/Evolution/Trophies expose different navigation clusters and ordering.

## Requirement-to-evidence map

| Gate | Production requirement | Current state | Required release evidence |
|---|---|---|---|
| A | replacement contract, exact baseline, protective tag | complete | pushed commit/tag plus this ledger |
| B | cell-only visible world and connected whole-cell lakes | target | source visual-grammar gate, lake audit, WebGL2/Canvas captures |
| C | atomic first-wins world replacement and blank new frame | baseline leak reproduced | state-machine tests, stale rejection, 100-cycle soak, first-frame captures |
| D | untouched-only Auto Next; trusted input cancels permanently | rejected temporary-suspension behavior present | fake-timer/unit matrix and trusted CDP scenarios |
| E1 | clickable stable SCORE/ENTROPY/REACH details | only REACH interactive | semantics plus stable-rectangle measurements |
| E2 | shared Result/History/Event Log/Menu context shell | separate bottom/replacement surfaces present | desktop/mobile Chrome scenarios and gesture persistence |
| E3 | compact dock/Adaptations, visible mobile event, fixed scene selector | contradicted by baseline | responsive matrix, 200% text, long labels |
| F1 | Evolution cost plus one owned adjacent cell only | observed-world gates present | schema/audit/migration and run-zero purchase proof |
| F2 | harder lake-centric Trophies and queued feedback | trivial river/geography awards present | horizon audit, legacy migration, queue tests/browser capture |
| G | `cell-sphere-game` package/storage/repository/Pages identity | legacy identity deployed; GitHub ADMIN observed | namespace migration tests, renamed origin, Actions and exact Pages bytes |
| H | deterministic Worker/fallback, 32×, bounded performance | baseline fast gates pass | final parity, balance, benchmark, Canvas, lake/event/Trophy audits and soaks |
| I | coherent push and exact public deployment | target | clean tree, successful workflow, cache-busted public inspection |
