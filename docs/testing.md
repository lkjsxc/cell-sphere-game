# Testing and evidence

`npm run verify` runs structure, unit, integration, balance smoke, benchmark,
and deployment-path/link gates. `npm run test:browser:file` uses real headless
Chrome/WebGL2 through a CDP pipe when local HTTP sockets are sandbox-blocked.
The same-origin harness exits 77 rather than reporting a false pass when Chrome
cannot connect.

## Automated contracts

Unit coverage includes topology/dual manifold, deterministic WorldModel hash,
land bounds, climate/biomes/forest coherence, priority-flood acyclic drainage,
river mouths/order, landmarks/sources, generation budget, renderer geometry
and uniforms, tap/camera math, settings/pause/rotation, simulation queue/RNG,
pure inspection, History cap, and the 108-node graph/migration/economy.

Current local and Docker verification pass **107 unit** and **11 integration**
tests. Integration coverage includes seed/chunk/speed invariance, zero-input Random
completion, exact manual resolution ticks, stream isolation, replay schema,
conditional Memory, and a run with hundreds of inspection/snapshot queries
matching a quiet run in hash, score, extinction, decisions, History, and
Imprint.

## Real Chrome scenario

The file/CDP scenario clears itself through a disposable profile and checks:
rotation default off; drag; title inspector; Settings and opt-in idle rotation;
manual queued offer without pause; explicit panel/close/reopen/choice; switch
back to Random; live History without pause; 32× result; result History;
108 Memory scene nodes; select-before-Unlock; currency/persistence; accessible
list; reload; no obsolete run guidance; and no console/runtime errors.

Generated evidence includes mobile title/run/river inspector/Adaptations/
History/result/Memory selections/Settings and desktop title/run/Memory at
390×844 and 1440×900.

## Honest limitations

The CDP file path is real Chrome/WebGL2 but bypasses same-origin HTTP security
to accommodate this container. Physical Android, thermal, screen-reader,
Japanese localization, browser heap trend, p95 frame timing, and unrestricted
public-URL visual observation remain unmeasured unless status records newer
specific evidence.
