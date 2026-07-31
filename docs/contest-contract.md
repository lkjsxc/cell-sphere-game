# Contest contract

Facts verified against the official page on **2026-07-31**. If official rules
change, the official page overrides this document — re-verify before submission.

## Official sources

- Contest page: <https://progedu.github.io/webappcontest/2026/summer/index.html>
- 2025 results (competitive context): <https://progedu.github.io/webappcontest/2025/summer/result/index.html>
- Apple design reference (discipline standard, not imitation target):
  <https://developer.apple.com/jp/design/>, <https://developer.apple.com/design/tips/>

## Binding facts (verified 2026-07-31)

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
- Japanese is the player-facing language; the English title is kept exactly.
- All visuals/audio procedural — no copied media, no font downloads.
- GitHub Pages under a repository subpath: all URLs relative.
- A `contest-submission` branch + annotated tag freezes the reviewed state.

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
