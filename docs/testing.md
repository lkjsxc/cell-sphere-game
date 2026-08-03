# Testing and evidence

`npm run verify` runs structure, canonical identity and cell-visual source audits,
unit, integration, the 500-seed lake audit, balance smoke, benchmark, showcase,
and deployment-path/link gates. `npm run test:browser:file` uses real headless
Chrome/WebGL2 through a CDP pipe when local HTTP sockets are sandbox-blocked.
`npm run test:browser:canvas` starts the same browser with WebGL disabled and
verifies the Canvas 2D path. The same-origin harness exits 77 rather than
reporting a false pass when Chrome cannot connect.

## Automated contracts

Unit coverage includes topology/dual manifold, deterministic WorldModel hash,
land bounds, climate/biomes/forest coherence, private drainage fields, connected
and separated whole-cell lake IDs, frozen lake/shore/wetland records, bounded
lake ecology, landmarks/sources, generation budget, renderer geometry and uniforms, tap/camera math, settings/pause/rotation, simulation queue/RNG,
pure inspection, History cap, the 642-node graph-4/schema-8 migration/economy,
and the 96-criterion Trophy catalog/topology/rich-condition boundaries. Identity
coverage verifies fresh canonical saves; exact legacy schema-8 Echoes, scores,
runs, seed cursor, 642 ownership, Imprints, current/Legacy Trophies, queue/proof,
result keys, Settings, and History; canonical coexistence priority; field-level
corruption; safe malformed recovery; partial/exception/repeated migration;
transactional import rollback; canonical export; and nonblocking visual-History
unavailable/corrupt/duplicate/retention behavior. Evolution tests
cover exactly six empty-save roots, run-zero acquisition, each of 3,840 directed
physical frontiers, nonadjacent rejection, one-neighbor sufficiency, repeat and
insufficient-fund transactions, preserved disconnected islands, and a legal
642-cell purchase sequence spending exactly 2,462 Echoes.

Integration coverage includes seed/chunk/speed invariance, zero-input Random
completion, exact manual resolution ticks, stream isolation, replay schema,
conditional skills, concrete effects for all 642 Skill Cell purchases, no
current experience/layout-parent authority or copy, strict
visual-History codec bounds/malformed input, primary-cell migration, stale load
guards, and an observed run matching a quiet run in hash, score, extinction,
decisions, semantic History, Imprint, and bounded lake proof. Trophy integration
proves schema-5 load grants nothing, schema-7 river ownership becomes separate
Legacy ownership, facts-v1 bit 2 never becomes lake proof, all other old IDs are
grandfathered, facts-v3 and schema-8 imports are idempotent, result/skill/History
recognition is exactly once, queues survive progression transactions, and
abandonment is reward-free. Fake-clock tests cover 2.7 s toast, 3.75 s
Adaptation, 4.2 s Trophy FIFO order, duplicate suppression, stale-generation
no-op, hover/focus holds, reduced motion, and selected-route acknowledgement. A 100-world simulation/result soak checks automatic
result transitions, duplicate-award rejection, hidden countdown pause ownership,
unresolved Manual offers, persistence caps, and heap bounds. A separate 100-cycle
production-coordinator soak checks first-wins races, unique seeds/authorities/
identities, one typed blank frame per cycle, and complete current-world teardown.

## Real Chrome scenario

The disposable-profile file/CDP scenario first seeds all three old localStorage
namespaces and an old-product semantic export, reloads, proves exact canonical
adoption and source retention, changes the old copy, reloads to prove canonical
coexistence priority/no duplicate reward, then starts the ordinary scenario from
a fresh canonical save. It uses trusted pointer and keyboard input for scene,
surface, gesture, confirmation, Result, and purchase semantics. It
checks one stable Home/World/Evolution/Trophies tablist, exact World camera return
while authority advances off-scene, four renderer draws, and one shell rectangle
across SCORE/ENTROPY/REACH and many snapshots. Globe drag retains metric scroll,
Result, History, and Event Log. Blank/cell tap policy, Inspector focus, terminal
HUD/input retention, Result close/reopen, disabled completed-world time controls,
Menu grouping and reward-free New World confirmation, bounded Event Log rows,
and History final/live restoration are exercised.

The responsive matrix covers 320×568, 390×844, 430×932, 768×1024, 844×390,
and 1440×900 with no horizontal overflow or event/dock overlap. It also emulates
200% text, long selector labels, reduced motion, and authored high contrast.
Mobile Adaptations is bounded to 36dvh with three 44px choices and a visible
current-event control. The run completes at 32×, purchases one physically
adjacent Skill Cell, verifies two sequential persisted Trophy names and badge,
a static reduced-motion reveal, Result names, survival through the automatic
replacement coordinator, and click routing to Trophy detail. It visits all 642
Evolution and 96 Trophy records, intercepts the next world's zero-life first
frame, and checks bounded resources and browser errors. Dedicated Canvas 2D evidence completes a run and repeats terminal
History, Evolution, Trophies, and atomic replacement.

## Honest limitations

The CDP file path is real Chrome/WebGL2 but bypasses same-origin HTTP security
to accommodate this container. Physical Android, thermal, screen-reader,
Japanese localization, browser zoom, forced-colors review, browser heap trend,
actual GPU frame timing, and unrestricted public-URL visual observation remain
unmeasured unless status records newer specific evidence.
