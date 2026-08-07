# Decisions

## 2026-08-07 — D1: Replace static frontier semantics

**Decision.** Environment Level is an unlimited per-world deterministic time progression. Every new production world starts at Level 0; Evolution changes effective pressure and survivability rather than the public schedule; Result records evidence; `Next World` starts at 0.

**Rejected.** Selected/unlocked/attempted/retry/next static levels, run-count starts, static profile-for-whole-run authority, and a persistent `highestEnvironmentLevel` unlock state.

**Reason.** The user correction and root contract supersede the previous cross-world interpretation.

## 2026-08-07 — D2: Preserve historical evidence without authority

**Decision.** Old frontier values and static-attempt History retain explicit legacy labels/readers only. They cannot become v2 best peaks, Rewards, Trophies, start levels, or pressure inputs without trustworthy equivalent dynamic evidence.

## 2026-08-07 — D3: Avoid a rewarded normal timeout

**Decision.** The observed old approximately 362-second normal cap is a baseline defect, not a v2 terminal. A technical watchdog or agent external budget is error/incomplete and reward-free; escalating finite dynamic pressure naturally defeats finite builds.

## 2026-08-07 — D4: Bounded exact boundary / finite hot-path split

**Decision.** Canonical exact strings and bigint-like arithmetic live at schedule/profile/persistence/result boundaries. Simulation cell/edge loops consume finite projected coefficients only. Runtime profile/event/history caches have fixed bounds.

## 2026-08-07 — D5: Initial schedule candidate

**Decision.** Implement schedule v2 with exact integer thresholds: Level 0 starts at tick 0; Level 1 starts at tick 1200; each later level starts 600 ticks later. At the current authoritative 10 ticks/second this yields a 120-second calm opening and 60-second later rungs. The formula has direct exact inverse evaluation and no threshold table.

**Reason.** It aligns the old observed entropy onset with a visible mild Level 1, places levels 3–4 near the current ordinary 270–330-second balance window, and preserves ample nonzero transition duration. Production cohorts may retune the constants only through the versioned source.

## Pending evidence-backed choices

- Exact schedule formula/constants/version.
- Exact profile/exposure/SCORE formula versions and calibration.
- Existing protocol/schema version numbers to bump.
- Rolling event director capacities/cadence and onboarding version.
- Browser/CI/Pages availability and deployed revision.

These choices must be recorded here with measured source evidence before final release claims.
