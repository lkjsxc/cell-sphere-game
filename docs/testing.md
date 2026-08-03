# Testing and evidence

`npm run verify` runs structure, unit, integration, balance smoke, benchmark,
and deployment-path/link gates. `npm run test:browser:file` uses real headless
Chrome/WebGL2 through a CDP pipe when local HTTP sockets are sandbox-blocked.
`npm run test:browser:canvas` starts the same browser with WebGL disabled and
verifies the Canvas 2D path. The same-origin harness exits 77 rather than
reporting a false pass when Chrome cannot connect.

## Automated contracts

Unit coverage includes topology/dual manifold, deterministic WorldModel hash,
land bounds, climate/biomes/forest coherence, priority-flood acyclic drainage,
river mouths/order, landmarks/sources, generation budget, renderer geometry
and uniforms, tap/camera math, settings/pause/rotation, simulation queue/RNG,
pure inspection, History cap, the 642-node graph/migration/economy, and the
96-criterion Trophy catalog/topology/proof boundaries.

Integration coverage includes seed/chunk/speed invariance, zero-input Random
completion, exact manual resolution ticks, stream isolation, replay schema,
conditional skills, concrete effects for all 642 Skill Cell purchases, strict
visual-History codec bounds/malformed input, primary-cell migration, stale load
guards, and an observed run matching a quiet run in hash, score, extinction,
decisions, semantic History, and Imprint. Trophy integration proves schema-5 load grants nothing, explicit
legacy reconciliation, bounded schema-3 proof, idempotent result awards, and
reward-free abandonment. A 100-world integration soak also
checks automatic result transitions, duplicate-award rejection, hidden countdown
pause ownership, unresolved Manual offers, persistence caps, and heap bounds.

## Real Chrome scenario

The file/CDP scenario clears itself through a disposable profile and checks:
rotation default off; drag; title inspector; Settings and opt-in idle rotation;
manual queued offer without pause; explicit panel/close/reopen/choice; switch
back to Random; nonmodal History scrub/previous/next/Live with highlighted
primary cells and continuing authority; 32× result; compact result History;
IndexedDB visual-detail reload when available; 642-cell/642-skill Evolution
Globe; select-before-Unlock; 162-cell/96-achievement Trophy Sphere with pointer
and semantic selection; fixed-flow mobile skill detail; semantic offscreen
tree; Evolution restoration after History; a second unattended result counting
down into the third world; New World cancel/accept with no reward; reload; and
no obsolete guidance or console/runtime errors.

Generated WebGL2 evidence includes six fixed title lifecycle phases plus title layouts at 390×844, 430×932,
768×1024, 1024×768, 1440×900, and 1920×1080; mobile/tablet/desktop inspector;
mobile/desktop Settings, run, Adaptations, visual History, result, and Evolution Globe;
full/reduced Adaptation propagation; and automatic continuation. Dedicated
Canvas screenshots cover mobile/desktop title, History, and Evolution Globe.

## Honest limitations

The CDP file path is real Chrome/WebGL2 but bypasses same-origin HTTP security
to accommodate this container. Physical Android, thermal, screen-reader,
Japanese localization, 200% zoom, forced-colors review, browser heap trend,
actual GPU frame timing, and unrestricted public-URL visual observation remain
unmeasured unless status records newer specific evidence.
