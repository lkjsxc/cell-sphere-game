# Contest contract

Facts re-verified against the official page on **2026-08-01**. If official rules
change, the official page overrides this document — re-verify before submission.

## Official sources

- Contest page: <https://progedu.github.io/webappcontest/2026/summer/index.html>
- 2025 results (competitive context): <https://progedu.github.io/webappcontest/2025/summer/result/index.html>
- Apple design reference (discipline standard, not imitation target):
  <https://developer.apple.com/jp/design/>, <https://developer.apple.com/design/tips/>

## Binding facts (verified 2026-08-01)

1. Deadline: **2026-09-13 (日)**.
2. Division: **Webページ部門 — ZEN大学** (最優秀賞 1名 / 優秀賞 2名 / 健闘賞 複数名).
3. Work: HTML / CSS / JavaScript で作成された**動きのある** Web ページ.
4. External libraries: prohibited except Bootstrap and Tailwind CSS
   ("他に使いたいライブラリがありましたらSlackやフォーラム等でご相談ください").
   This project uses **neither** — native CSS/JS demonstrates authorship.
5. Originality: textbook copies or slight modifications are not judged.
6. Media/code must be copyright-clean; the work may be publicly shared in
   classes and on the result page — keep public presentation quality high.
7. Code submission: **public GitHub repository URL**. Code changes during
   judging are allowed but bugs lower the score; a review branch is advised.
8. Hosting: a playable URL must be submitted, behaving the same as the source.
   GitHub Pages recommended.
9. Judged in **desktop and smartphone Google Chrome**.
10. Evaluation axes:
    - コーディング: file/folder organization, readable code, comments,
      effective GitHub use, **test code**.
    - 完成度: no bugs, design fit for purpose, refined UI/UX,
      first-time users must not get lost.
    - アイデア: new theme/idea, original implementation, trend relevance,
      design ingenuity, evidence of real users.

## Project interpretation

- Zero runtime dependencies; zero external requests after load.
- Canonical product identifier is `incremental-network-game` (title, metadata,
  package name, storage namespaces, share cards). Player-facing copy currently
  ships in Japanese; complete English localization is a tracked gate
  (`docs/status.md`), not yet claimed done.
- All visuals/audio procedural — no copied media, no font downloads.
- GitHub Pages under a repository subpath: all URLs relative.
- A `contest-submission` branch + annotated tag freezes the reviewed state.

## Requirement-to-evidence matrix

Status vocabulary: **implemented** = code exists; **verified** = a stated check
passed; **observed** = a human or physical device was used; **target** = not
yet proven. Emulation is never reported as a physical observation.

| Requirement | Status | Evidence |
|---|---|---|
| Original HTML/CSS/JS, no prohibited runtime lib | implemented + verified | `check:links` (no remote/bare imports); dedicated `check:forbidden` = target |
| Public GitHub source | implemented | public repo, coherent history; signed-out check = target at submission |
| Hosted URL matches source | target | GitHub Pages not yet enabled/verified |
| Desktop Chrome | implemented | WebGL2 + Canvas 2D fallback; headless observe = target (seccomp here) |
| Smartphone Chrome | target | physical test pending |
| File/folder organization | verified | `check:structure` (≤200 lines/file, ≤16 children, README per dir) |
| Readable code + comments | implemented | JSDoc + invariant comments; review at submission |
| Effective GitHub use | implemented | small commits + CI workflow; Pages deploy = target |
| Tests | verified | unit 82 + integration 7 pass; browser harness opens normal app route (skips here only because Chrome networking is sandbox-blocked) |
| Few bugs / high finish | implemented + partially verified | title → run → draft → result uses production worker/fallback; physical/browser observation remains target |
| Purpose-fit design / refined UX / first-time clarity | implemented + target | HUD, draft, result, touch grammar exist; fresh-user observation remains target |
| Originality | implemented | real spherical adaptive-network simulation, no engine |
| Current relevance | implemented | offline-first, deterministic, low-heat oriented |
| Real-use evidence | target | no playtests yet |
| Copyright safety | implemented | procedural art, system fonts, no external media |

## Pre-submission recheck checklist

- [ ] Official page re-read within 7 days of submission (rules may move).
- [ ] ZEN大学 application form submitted (form was "準備中" as of 2026-07-30;
      check <https://progedu.github.io/webappcontest/2026/summer/index.html#award>).
- [ ] Repository is Public; hosted URL serves the tagged source.
- [ ] `npm run verify` passes on the tagged commit.
- [ ] Desktop Chrome + smartphone Chrome (or emulation) smoke flows pass.
- [ ] README playable URL, controls, and screenshots are current.
- [ ] No console errors in a fresh-storage first run.
- [ ] `docs/submission.md` records commit hashes and hosted URL.
