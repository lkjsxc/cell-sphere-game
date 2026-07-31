# Submission

Final submission plan and checklist. Nothing here is claimed done until
evidence is recorded.

## Targets

- Division: Webページ部門 — ZEN大学 (最優秀賞 target).
- Deadline: 2026-09-13 (日).
- Hosted URL: GitHub Pages at `https://lkjsxc.github.io/incremental-network-game/`
  (verify after enabling Pages).
- Repository: `https://github.com/lkjsxc/incremental-network-game` (Public).

## Branch / tag plan

1. Development on `main`; CI verifies every push.
2. When Gate G passes: create `contest-submission` branch from the verified
   commit; enable Pages from that branch (or `/docs` — decide at that time;
   root deployment from branch is simplest).
3. Create annotated tag `submission-2026-summer` on the same commit.
4. Freeze risky changes; fixes only, each re-verified.
5. Record both commit hashes here.

## Checklist

- [ ] `npm run verify` green on the tagged commit (paste output summary).
- [ ] Clean-clone verification: clone to a temp dir, `npm run verify`.
- [ ] Hosted URL serves the exact tagged source (diff a fetched file).
- [ ] Fresh-storage first-run flow on desktop Chrome.
- [ ] Smartphone Chrome flow (physical or emulation — record which).
- [ ] 32× complete run; reduced-motion flow; WebGL2-disabled fallback.
- [ ] Offline reload after service-worker install; no stale-cache trap.
- [ ] Share text + generated card verified.
- [ ] 100-run auto-retry soak; console clean.
- [ ] README screenshot/capture is real and current.
- [ ] Application form submitted (ZEN大学 tab; was preparing as of
      2026-07-30 — recheck official page).

## Record

- Submission commit: (pending)
- Tag: (pending)
- Hosted URL verified at: (pending)
- Form submitted at: (pending)
