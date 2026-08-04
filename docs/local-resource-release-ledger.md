# Local-resource ecology release ledger

Status vocabulary: **implemented**, **tested**, **measured**, **deployed**. A
later status includes earlier stages only when its evidence is complete.

Baseline: `aff524595b491226ee4c337430f6a1600b7ed722`; protective tag:
`pre-local-resource-ecology-20260804`; replacement contract: `6ffd46a`. Baseline
verify, deep campaign/Skill/lake/event/Trophy audits, 1,000-world soak, WebGL2,
and Canvas tests passed before implementation.

| # | Requirement | Implementation | Current evidence | Migration | Status |
|---:|---|---|---|---|---|
| 1 | Local rich/strained/exhausted/recovering cells | Resource baselines, eight hysteretic states, compact snapshot bytes, Inspector details | Unit resource/renderer tests; visual/browser rerun pending | Run-local; snapshots validate defaults | tested |
| 2 | Local ecology, no global terrain fade | Removed WebGL entropy grayscale and Canvas entropy dim; local resource material in both | Cell visual audit implemented; final image/browser matrix pending | None | implemented |
| 3 | Resource-gated fresh growth | Pre-RNG ecological access and 0.565 fresh floor | 150 seeds: median land occupancy 26.5%, p90 42.8%; 75.0% living time richest quintile | None | measured |
| 4 | Finite freshwater advantage | Conservation-accounted catchment/founder stock plus bounded local buffering | 60 matched pairs: median duration ratio 1.154, controls win 6.7%; final 300-pair run pending | New fields default safely | measured |
| 5 | No first-Skill explosion | First root 16,000 → 19,000 | 60 paired seeds: median SCORE 8,892 → 10,676 | Owned roots recompile free | measured |
| 6 | Versioned smooth World Potential | Evolution Power + monotone v2 anchors, full 1.2m | Skill audit/unit migration/order tests pass | Old models remain readable | tested |
| 7 | Monotone cumulative SCORE | SCORE v3 six cumulative merit ledgers, shared live/final model | 150 traces: zero decreases/mismatches; backend/speed final rerun pending | v1/v2 records legacy-separated | measured |
| 8 | Fresh/mid/full curve | Component caps and revised potential curve | fresh median 8,692; first root 10,676; full cap ~1.099m; deep policy rerun pending | Versioned PB separation | measured |
| 9 | Six affinities | Fertility, Freshwater, Scarcity, Cryogenic, Marine, Luminous metadata over stable IDs | 252 complete nodes; 42 each; hashes `9e0063bd` / `938f6e87` | Stable 252 and 642 manifest | tested |
| 10 | Visible combinable builds | Sixteen recipes, effects, tradeoffs, habitats, preview progress | Skill audit: 16 distinct signatures, all active at full | Derived, never charged/stored as authority | tested |
| 11 | Whole-cell transformations/power | Reclamation, cryolakes, littoral succession/forests, electric glow | 24 full seeds: median 106 transformed/17 reclaimed/105 ever powered; fresh zero | Run-local defaults | measured |
| 12 | Exact late REACH 100% | All 2,562 alive for 25 consecutive ticks; exactly-once History/Trophy proof | 100 full seeds: 4%; 100 fresh: zero; all later extinct | New proof fields validate | measured |
| 13 | RESULT after REACH | Persistent metric sequence reordered; terminal recommendation state | Unit/DOM tests from UI slice; real responsive browser pending | None | tested |
| 14 | Remove redundant Result routes | SCORE/entropy/reach duplicate buttons deleted | Unit Result policy assertions; browser pending | None | tested |
| 15 | Visible metric affordance | Persistent border/background/disclosure treatment | Static/unit coverage; contrast/browser screenshots pending | None | implemented |
| 16 | Normal max 8× | Settings/UI expose 1×, 2×, 4×, 8× only | Unit/settings tests; browser pending | Legacy normal values clamp | tested |
| 17 | Explicit DEV through 256× | `?dev=1`, visible DEV, session-only high-speed scheduler with all ticks | Unit speed/protocol tests; Worker/fallback browser parity pending | Excluded from preferences/exports | tested |
| 18 | Fair production agent | Allowlisted observation/actions over production simulation/progression | 5 agent tests pass; deterministic replay/hash/schema checks | Separate validated schema | tested |
| 19 | Agent campaign tuning | Eleven deterministic policies plus bounded action/observation traces | Five-world all-policy run complete; 12-world multi-policy cohorts pending | Reports only | implemented |
| 20 | Persistence/transactions | SCORE/build/reach/Trophy/History facts and migration validation updated | 142 unit + 72 integration currently pass; full gates pending | Exactly-once existing transaction retained | tested |

## Iteration log

| Iteration | Candidate and evidence | Decision |
|---|---|---|
| Baseline | v2 global fade, ungated spread, 125k root gain | Replace rather than tune around discontinuities. |
| Resource A | floor below 0.525: median land occupancy above desired niche range | Raise floor. |
| Resource B | floor 0.565: median 26.5%, p90 42.8%, SCORE 8,692 | Accept for deep verification. |
| Freshwater A | strong support/founder reserve: median benefit 16.6%, hard-bound rate 41.7% | Reduce non-resource support and reserve. |
| Freshwater B | bounded support: median benefit 15.4%, controls sometimes win | Accept; repeat 300 matched pairs. |
| REACH A | full build peaked near 99% but never sustained all cells | Add late World Gardener cross-habitat synergy. |
| REACH B | low final route cost achieved 37%, too common | Reject and restore meaningful cost. |
| REACH C | route cost 0.72: exact sustained rate 4/100; all later extinct | Accept for 300-seed verification. |
| SCORE cap | full cohort saturated at 1.106m | Tighten component caps to ~1.099m. |

Final deploy/browser/CI evidence will change relevant rows to **deployed** only after
public bytes are verified against the reviewed revision.
