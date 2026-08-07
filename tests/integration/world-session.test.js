/** Production atomic replacement coordinator exercised without browser presentation. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../../src/platform/storage.js';
import { createWorldIdentity, sameWorldIdentity } from '../../src/core/world-session.js';
import {createContinuation} from '../../src/interface/policies/continuation.js';
import {defaultHistory} from '../../src/platform/history.js';
import {createWorldReplacementState,markWorldStarted,recoverAuthorityLossDuringReplacement,requestWorldReplacement} from '../../src/interface/policies/run-session.js';
import { ENVIRONMENT_MODEL_VERSION, ENVIRONMENT_ONBOARDING_MODIFIER_VERSION,
  ENVIRONMENT_SCHEDULE_HASH, ENVIRONMENT_SCHEDULE_VERSION } from '../../src/game/environment-level.js';

function identity(value) { return createWorldIdentity({ environmentModelVersion: ENVIRONMENT_MODEL_VERSION,
  environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION, environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH,
  immutableStartConfigurationHash: 'abcdef12', onboardingEnvironmentModifierVersion: ENVIRONMENT_ONBOARDING_MODIFIER_VERSION,
  ...value }); }
function node() { return { textContent: '', hidden: false, disabled: false, dataset: {}, classList: { toggle() {}, add() {}, remove() {} },
  setAttribute() {}, removeAttribute() {}, replaceChildren() {} }; }
function elements() { const value = {}; for (const name of ['title','run','memory','trophies','countdown','event','live',
  'resultRank','resultScore','resultEnvironment','resultPower','resultCause','echoes','resultTrophies','resultImprint','resultFirstCycle','breakdown','score',
  'pressure','reach','trace','environmentLevel','resultControl','resultNext','resultRetry','pause','speed',
  'eventTime','eventButton']) value[name] = node();
  return value; }
function harness() {
  const counts = new Map(); const hit = (name) => counts.set(name, (counts.get(name) ?? 0) + 1); let runId = 0;
  const renderer = { backend: 'test', lastFrameAudit: null, bindWorldSession() { hit('bind'); }, resetDynamicState() { hit('renderer-reset'); },
    render(scene) { hit('render'); const snap = scene.snapshot; this.lastFrameAudit = { lifeCells: snap.alive.reduce((a,b)=>a+b,0),
      eventCells: snap.eventStrength.reduce((a,b)=>a+(b>0),0), highlights: scene.highlightedCells.length }; return true; } };
  const app={phase:'idle',scene:'home',meta:defaultMeta(),archive:defaultHistory(),settings:{historyRetention:24},speed:32,
    el: elements(), topo4: { nodeCount: 32 }, worldIdentity: null, retiredWorldIdentity: null, activeRunId: 0,
    worldSessionSequence: 0, presentationGeneration: 0, worldReplacement: createWorldReplacementState(),
    requestId: 0, requestGeneration: 0, continuation: createContinuation(), countdownLabel: '', renderer,
    presentationAudit: { blankFrames: 0, lastBlank: null }, currentHistory: [{ seq: 1 }],
    lastResult: { old: true }, lastResultIdentity: null, historySnapshot: { old: true }, historyHighlights: [4],
    snapshot: { old: true }, worldFields: { old: true }, fields: { old: true }, selectedNode: 4, overlay: 'history',
    lastInspect: 9, lastRender: 9,
    driver: { outcome: null, starts: [], stop() { hit('driver-stop'); this.snapshot = null; }, installSnapshot(value) { this.snapshot = value; },
      abort() { hit('driver-abort'); return true; },
      reserveIdentity(value) { const reserved = identity({ ...value, runId: ++runId }); this.identity = reserved; return reserved; },
      start(config, speed, identity) { this.starts.push({ config, speed, identity }); return identity.runId; } },
    flow: { send(event) { hit(`flow-${event}`); app.phase = 'starting'; }, select(scene) { app.scene = scene; } }, sceneSelector: { update() {} }, pause: { clear() { hit('pause-clear'); } },
    historyPlayback: { retire() { hit('history-retire'); } },
    surfaces: { reset() { hit('surfaces-reset'); } }, inspector: { close() { hit('inspector-close'); } },
    historyUi: { reset() { hit('history-reset'); } }, metricUi: { reset() { hit('metric-reset'); } }, eventLogUi: { reset() { hit('event-log-reset'); } },
    newWorld: { close() { hit('new-world-close'); } }, settingsUi: { close() { hit('settings-close'); } },
    memoryUi: { closeNode() { hit('memory-close'); } }, trophyUi: { close() { hit('trophy-close'); } },
    timeDial: { reset() { hit('time-reset'); } }, makeRenderer() { hit('make-renderer'); this.renderer = renderer; }, updateSceneActions() {}, resize() { hit('resize'); },
  };
  return { app, counts };
}

test('replacement teardown clears every current-world field before one static blank and authority', () => {
  const oldLocation = globalThis.location; globalThis.location = { search: '' }; const { app, counts } = harness();
  try { assert.equal(requestWorldReplacement(app, 'title-grow'), true); } finally {
    if (oldLocation) globalThis.location = oldLocation; else delete globalThis.location;
  }
  assert.equal(app.worldReplacement.status, 'starting'); assert.equal(app.driver.starts.length, 1);
  assert.equal(app.meta.worldSeedIndex, '1'); assert.equal(app.presentationAudit.blankFrames, 1);
  assert.deepEqual(app.renderer.lastFrameAudit, { lifeCells: 0, eventCells: 0, highlights: 0 });
  assert.equal(sameWorldIdentity(app.snapshot, app.worldIdentity), true); assert.equal(app.snapshot.status, 'starting');
  assert.equal(counts.get('renderer-reset'), 2, 'old and new renderer dynamic state');
  for (const name of ['driver-stop','pause-clear','history-retire','surfaces-reset','inspector-close',
    'history-reset','metric-reset','event-log-reset','new-world-close','settings-close','memory-close','trophy-close','time-reset']) assert.equal(counts.get(name), 1, name);
  assert.deepEqual(app.currentHistory, []);
  assert.equal(app.selectedNode, null); assert.equal(app.overlay, null); assert.equal(app.historySnapshot, null); assert.deepEqual(app.historyHighlights, []);
  assert.equal(app.lastResult, null); assert.equal(app.worldFields, null); assert.equal(app.driver.snapshot, app.snapshot);
  assert.equal(app.el.eventTime.textContent, '00:00 · STARTING'); assert.equal(app.el.eventButton.dataset.read, 'true');
  assert.equal(app.el.pause.disabled, false); assert.equal(app.el.speed.disabled, false);
});

test('every in-run replacement request waits for authoritative abandonment', () => {
  const { app, counts } = harness(); app.phase = 'running';
  app.worldIdentity = identity({ worldSessionId: 1, runId: 1, seed: 7, presentationGeneration: 1 });
  assert.equal(requestWorldReplacement(app, 'requested-restart'), true);
  assert.equal(app.worldReplacement.status, 'awaiting-authority'); assert.equal(counts.get('driver-abort'), 1);
  assert.equal(app.driver.starts.length, 0); assert.equal(requestWorldReplacement(app, 'same-frame-race'), false);
});

test('fatal authority loss after accepted abort records no reward and continues replacement',()=>{
 const oldLocation=globalThis.location;globalThis.location={search:''};const{app}=harness();app.phase='running';app.meta={...app.meta,worldSeedIndex:'1'};
 app.worldIdentity=identity({worldSessionId:1,runId:1,seed:7,presentationGeneration:1});app.snapshot={...app.worldIdentity,tick:50,worldOrdinal:'1',score:'0'};
 try{assert.equal(requestWorldReplacement(app,'authority-loss'),true);const failed={...app.worldIdentity,t:'worker-failed'};
  assert.equal(recoverAuthorityLossDuringReplacement(app,failed),true);assert.equal(app.worldReplacement.status,'starting');assert.equal(app.driver.starts.length,1);
  assert.equal(app.archive.worlds.length,1);assert.equal(app.archive.worlds[0].cause,'abandoned');assert.equal(app.meta.totalEchoes,'0');
 }finally{if(oldLocation)globalThis.location=oldLocation;else delete globalThis.location}
});

test('100 replacement cycles are first-wins with unique seed, authority, identity, and blank frame', () => {
  const oldLocation = globalThis.location; globalThis.location = { search: '' }; const { app } = harness(); const keys = new Set(); const seeds = new Set();
  try { for (let cycle = 0; cycle < 100; cycle++) {
    assert.equal(requestWorldReplacement(app, 'soak'), true); assert.equal(requestWorldReplacement(app, 'same-frame-race'), false);
    const identity = app.worldIdentity; keys.add(identity.resultTransactionKey); seeds.add(identity.seed);
    assert.equal(markWorldStarted(app, identity), true); app.phase = 'result';
  } } finally { if (oldLocation) globalThis.location = oldLocation; else delete globalThis.location; }
  assert.equal(app.driver.starts.length, 100); assert.equal(app.presentationAudit.blankFrames, 100);
  assert.equal(app.worldReplacement.accepted, 100); assert.equal(app.worldReplacement.rejected, 100);
  assert.equal(keys.size, 100); assert.equal(seeds.size, 100); assert.equal(app.meta.worldSeedIndex, '100');
  assert.equal(new Set(app.driver.starts.map((item) => item.identity.runId)).size, 100);
  assert.equal(new Set(app.driver.starts.map((item)=>item.identity.presentationGeneration)).size,100);
  assert.equal(new Set(app.driver.starts.map((item)=>item.config.worldOrdinal)).size,100);
});
