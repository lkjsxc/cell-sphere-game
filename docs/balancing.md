# Balancing

Balance is measured with production `RunController` cohorts, fixed seed sets,
and explicit external budgets. An exhausted audit budget is incomplete and
reward-free; it is never converted into an extinction.

## Current profile-v5 cohorts

Environment Pressure Differentiation v1 selected the highest fixed
resource-yield cap candidate, `0.15`, using only the 48-seed development cohort.
No other ecology constant was tuned. The frozen candidate then ran once against
the untouched 48-seed holdout. Values below are medians in game seconds:

| Fixture | Development v4 → v5 | Change | Holdout v4 → v5 | Change |
|---|---:|---:|---:|---:|
| Fresh | 135.3 → 134.9 | −0.30% | 136.6 → 137.9 | +0.95% |
| Foundation | 156.1 → 158.4 | +1.47% | 163.7 → 163.0 | −0.43% |
| Scarcity | 205.1 → 208.0 | +1.41% | 222.2 → 216.5 | −2.57% |
| Luminous | 145.9 → 148.4 | +1.71% | 151.7 → 152.8 | +0.73% |
| Mature | 213.5 → 213.1 | −0.19% | 231.3 → 215.6 | −6.79% |

All 240 development and 240 holdout Worlds ended through authoritative
extinction. Development v5 peak/sustained REACH medians are
4.996%/2.766% fresh, 4.996%/2.648% Foundation, 13.622%/6.136% Scarcity,
4.996%/2.621% Luminous, and 19.711%/8.442% mature. Causes remain
maintenance-starvation or resource-exhaustion; no audit cutoff was rewarded.
The ignored reports retain seed-level authority hashes, habitat occupancy,
powered-cell evidence, Environment peaks, SCORE, Echoes, causes, and resource
conservation.

At the nominal 1× wall-clock rate, the fresh development median implies about
33.7 foreground seconds before browser overhead. That division is a pacing
implication, not observed browser survival duration. Browser pacing is measured
separately.

The v4 values are historical paired baselines, not current authority. Profile
v5 keeps the Environment schedule, SCORE formula, Evolution effects, and seed
sets unchanged while making scarcity mechanically real. No finite Evolution
build may be immortal; any future balance change still requires development and
untouched holdout cohorts plus multi-World campaign evidence.

## Commands

```bash
npm run balance:smoke
node scripts/balance.mjs --runs 48 --strict
node scripts/balance.mjs --holdout --runs 48 --strict
npm run audit:environment-levels
npm run audit:campaign
```

Balance schema 3 reports include profile/schedule/runtime identity, per-seed
authority hashes, peak/final/sustained REACH, habitat and powered-cell evidence,
Environment peaks, causes, SCORE/Echoes, and resource conservation.
