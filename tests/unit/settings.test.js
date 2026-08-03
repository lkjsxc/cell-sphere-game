/** Settings, schema migration, and the permanent Memory transaction boundary. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSettings, defaultSettings } from '../../src/platform/settings.js';
import { defaultMeta, LEGACY_MEMORY_MAP, saveMeta, validateMeta } from '../../src/platform/storage.js';
import {
  MEMORY_BRANCHES, MEMORY_LANDMARK_IDS, MEMORY_NODE_IDS, MEMORY_NODES, MEMORY_PHYSICAL_ADJACENCY,
  MEMORY_ROOT_IDS, availableMemoryNodes, buildMemorySnapshot, campaignResolved, canPurchaseMemory, compileMemory,
  groupAccessibleMemory, purchaseMemory, validateMemoryGraph,
} from '../../src/game/skills/index.js';
import { parseImportedData } from '../../src/interface/app-data.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createCamera, viewProjection } from '../../src/rendering/camera.js';
import { applyAutoRotation, createCameraPolicy, interruptCameraPolicy } from '../../src/interface/camera-policy.js';
import { createPauseControl } from '../../src/interface/pause-control.js';
import { advanceContinuation, cancelContinuation, completeContinuation, continuationInteractionType, continuationLabel,
  createContinuation, createContinuationInteractionGuard, disableContinuation, setContinuationHidden,
  startContinuation } from '../../src/interface/policies/continuation.js';

const LEGACY_IDS = Object.keys(LEGACY_MEMORY_MAP);

test('settings default to unattended Automatic play with idle rotation off', () => {
  const d = defaultSettings();
  assert.equal(d.adaptationMode, 'random'); assert.equal(d.idleRotation, 'off'); assert.equal(d.autoContinue, true);
  assert.equal(d.pauseOnPanels, false); assert.ok(['full', 'reduced'].includes(d.motion));
  const s = validateSettings({ schema: 2, motion: 'reduced', quality: 'eco', adaptationMode: 'manual',
    autoRotate: true, autoContinue: false, pauseOnPanels: true, speed: 32 });
  assert.deepEqual({ motion: s.motion, quality: s.quality, adaptationMode: s.adaptationMode,
    idleRotation: s.idleRotation, autoContinue: s.autoContinue, pauseOnPanels: s.pauseOnPanels, speed: s.speed },
  { motion: 'reduced', quality: 'eco', adaptationMode: 'manual', idleRotation: 'calm',
    autoContinue: false, pauseOnPanels: true, speed: 32 });
});

test('settings reject garbage, invalid enums, and prototype pollution', () => {
  assert.deepEqual(validateSettings(null), defaultSettings());
  assert.deepEqual(validateSettings('junk'), defaultSettings());
  const s = validateSettings({ motion: 'sideways', quality: 'ultra', adaptationMode: 'weighted', speed: 3 });
  assert.equal(s.motion, defaultSettings().motion); assert.equal(s.quality, 'auto');
  assert.equal(s.adaptationMode, 'random'); assert.equal(s.speed, 1);
  validateSettings(JSON.parse('{"__proto__":{"polluted":true},"idleRotation":"gentle"}'));
  assert.equal({}.polluted, undefined);
});

test('Memory atlas has the exact validated composition and economy', () => {
  const report = validateMemoryGraph();
  assert.equal(MEMORY_NODES.length, 642); assert.equal(report.valid, true, report.errors.join('\n'));
  assert.deepEqual(report.composition,
    { micro: 582, conditional: 24, unlock: 18, keystone: 6, connector: 6, capstone: 6 });
  assert.deepEqual(report.branchCounts, Object.fromEntries(MEMORY_BRANCHES.map((branch) => [branch, 107])));
  assert.equal(report.roots.length, 6); assert.equal(report.reachable, 642);
  assert.equal(report.totalCost, 2462);
  assert.equal(new Set(MEMORY_NODE_IDS).size, 642); assert.equal(new Set(MEMORY_NODES.map((n) => n.cell)).size, 642);
  assert.equal(MEMORY_NODES.filter((node) => node.effect.type === 'scalar').length, 582);
  for (const node of MEMORY_NODES) {
    assert.match(node.id, /^[a-z][a-z-]+$/); assert.ok(node.nameEn.length >= 5);
    assert.ok(node.effectEn.length >= 12); assert.ok(node.description.length >= 35);
    assert.ok(node.cost > 0); assert.ok(node.tier >= 1 && node.tier <= 8);
  }
  const opening = availableMemoryNodes({ ...defaultMeta(), echoBalance: 3 });
  assert.equal(opening.length, 6); assert.equal(new Set(opening.map((node) => node.branch)).size, 6);
});

test('every legacy ownership subset migrates one-for-one without currency refunds', () => {
  for (let mask = 0; mask < 2 ** LEGACY_IDS.length; mask++) {
    const owned = LEGACY_IDS.filter((_, index) => mask & (1 << index));
    const migrated = validateMeta({ schema: 3, bestScore: 99, totalEchoes: 70,
      echoBalance: 17, runs: 4, signalHintShown: true, memoryNodes: owned });
    assert.equal(migrated.schema, 7); assert.equal(migrated.memoryGraphVersion, 4); assert.equal(migrated.worldSeedIndex, 4);
    assert.equal(migrated.memoryNodes.length, owned.length);
    const mapped = owned.map((id) => LEGACY_MEMORY_MAP[id]);
    assert.deepEqual(migrated.memoryNodes, MEMORY_NODE_IDS.filter((id) => mapped.includes(id)));
    assert.equal(migrated.totalEchoes, 70); assert.equal(migrated.echoBalance, 17);
    assert.equal('signalHintShown' in migrated, false);
    assert.deepEqual(migrated.migrationNotice, { kind: 'memory-atlas-v5', pending: true });
  }
});

test('all six proof nodes preserve bounded value while First Trace becomes resilience', () => {
  const migrated = validateMeta({ schema: 3, totalEchoes: 40, echoBalance: 0,
    runs: 6, memoryNodes: LEGACY_IDS });
  const compiled = compileMemory(migrated);
  assert.deepEqual(compiled.effects, { reach: 1.06, conductance: 1.08, energyCap: 1.08,
    stressResist: 1.1448, maintenance: 0.96 });
  assert.equal(compiled.unlocks.length, 0);
  assert.equal(campaignResolved(migrated), true);
});

test('schema 4 preserves every recognized island without parent closure or currency changes', () => {
  const meta = validateMeta({ schema: 4, memoryGraphVersion: 1, bestScore: 500,
    totalEchoes: 900, echoBalance: 79, runs: 12,
    memoryNodes: [...MEMORY_LANDMARK_IDS, 'foreign-memory'], quarantinedMemoryNodes: ['earlier-unknown'] });
  assert.deepEqual(meta.memoryNodes, MEMORY_LANDMARK_IDS); assert.equal(meta.memoryNodes.length, 108);
  assert.deepEqual(meta.quarantinedMemoryNodes, ['foreign-memory', 'earlier-unknown']);
  assert.equal(meta.echoBalance, 79); assert.equal(meta.totalEchoes, 900);
  assert.deepEqual(meta.migrationNotice, { kind: 'memory-atlas-v5', pending: true });
  assert.equal(meta.memoryGraphVersion, 4); assert.equal(meta.worldSeedIndex, 12);
  const island = validateMeta({ schema: 4, echoBalance: 11, memoryNodes: ['continuity-unbroken-lesson'] });
  assert.deepEqual(island.memoryNodes, ['continuity-unbroken-lesson']);
  assert.deepEqual(island.quarantinedMemoryNodes, []); assert.equal(island.echoBalance, 11);
});

test('each migrated disconnected island remains owned and opens its own physical frontier', () => {
  const islands = [];
  for (const id of MEMORY_NODE_IDS) {
    if (islands.every((owned) => !MEMORY_PHYSICAL_ADJACENCY[id].includes(owned))) islands.push(id);
    if (islands.length === 3) break;
  }
  const migrated = validateMeta({ schema: 6, memoryGraphVersion: 3, runs: 0, echoBalance: 100,
    memoryNodes: [...islands].reverse(), quarantinedMemoryNodes: ['foreign-memory'], requiredRuns: 999 });
  assert.deepEqual(new Set(migrated.memoryNodes), new Set(islands)); assert.equal(migrated.runs, 0);
  assert.deepEqual(migrated.quarantinedMemoryNodes, ['foreign-memory']);
  for (const id of islands) {
    const frontier = MEMORY_PHYSICAL_ADJACENCY[id].find((candidate) => !islands.includes(candidate));
    assert.equal(canPurchaseMemory(migrated, frontier), true, `${id}->${frontier}`);
  }
  const unrelated = MEMORY_NODE_IDS.find((id) => !MEMORY_ROOT_IDS.includes(id) && !islands.includes(id)
    && islands.every((owned) => !MEMORY_PHYSICAL_ADJACENCY[id].includes(owned)));
  if (unrelated) assert.equal(canPurchaseMemory(migrated, unrelated), false);
});

test('old semantic exports preserve recognized ownership and quarantine unknown IDs', () => {
  const owned = ['continuity-unbroken-lesson', 'reach-cell-fine-runner'];
  const parsed = parseImportedData(JSON.stringify({ schema: 1, product: 'incremental-network-game',
    meta: { schema: 6, memoryGraphVersion: 3, echoBalance: 9, memoryNodes: [...owned, 'foreign-memory'],
      quarantinedMemoryNodes: ['older-foreign'] }, history: null, settings: null }));
  assert.deepEqual(new Set(parsed.meta.memoryNodes), new Set(owned)); assert.equal(parsed.meta.echoBalance, 9);
  assert.deepEqual(parsed.meta.quarantinedMemoryNodes, ['foreign-memory', 'older-foreign']);
  assert.equal(parsed.meta.schema, 7); assert.equal(parsed.meta.memoryGraphVersion, 4);
});

test('old edge Imprints become bounded, connected level-3 morphology fossils idempotently', () => {
  const meta = validateMeta({ schema: 4, memoryNodes: [], imprints: [
    { kind: 'strongest-corridor', seed: 42, edges: [3, 4, 4, -1, 7680] },
    { kind: 'unknown', seed: 2, edges: [1] },
  ] });
  assert.equal(meta.imprints.length, 1); const fossil = meta.imprints[0];
  assert.equal(fossil.kind, 'strongest-corridor'); assert.equal(fossil.seed, 42);
  assert.ok(fossil.cells.length >= 32 && fossil.cells.length <= 64);
  assert.deepEqual(fossil.topology, { kind: 'icosphere', levels: 3, nodeCount: 642, edgeCount: 1920 });
  assert.deepEqual(validateMeta(meta), meta);
});

test('Memory purchases are immutable, repeat-safe, and conserve Echoes', () => {
  const original = Object.freeze({ ...defaultMeta(), echoBalance: 6, totalEchoes: 11,
    memoryNodes: Object.freeze([]) });
  const id = 'reach-horizon-instinct';
  assert.equal(canPurchaseMemory(original, id), true);
  const purchase = purchaseMemory(original, id);
  assert.equal(purchase.ok, true); assert.equal(purchase.spent, purchase.node.cost);
  assert.equal(purchase.meta.echoBalance + purchase.spent, original.echoBalance);
  assert.equal(purchase.meta.totalEchoes, original.totalEchoes); assert.deepEqual(original.memoryNodes, []);
  const repeat = purchaseMemory(purchase.meta, id);
  assert.equal(repeat.ok, false); assert.equal(repeat.meta, purchase.meta);
});

test('the complete graph can be purchased transactionally for its exact total cost', () => {
  const total = validateMemoryGraph().totalCost; let meta = { ...defaultMeta(), totalEchoes: total, echoBalance: total, runs: 0 };
  while (meta.memoryNodes.length < MEMORY_NODES.length) {
    const next = MEMORY_NODES.find((node) => canPurchaseMemory(meta, node.id));
    assert.ok(next, `stalled after ${meta.memoryNodes.length} nodes`);
    const before = meta; const result = purchaseMemory(meta, next.id);
    assert.equal(result.meta.echoBalance, before.echoBalance - next.cost);
    assert.equal(result.meta.totalEchoes, before.totalEchoes); meta = result.meta;
  }
  assert.equal(meta.echoBalance, 0); assert.equal(meta.memoryNodes.length, 642);
});

test('stable level-3 cells drive direct Memory status arrays without path cells', () => {
  const topo = createTopology(3); const owned = MEMORY_NODE_IDS.slice();
  const meta = { ...defaultMeta(), memoryNodes: owned,
    imprints: [{ kind: 'strongest-corridor', seed: 7, cells: [0, 12, 42] }] };
  const snapshot = buildMemorySnapshot(topo, meta, 'reach-world-seeder');
  const shuffled = buildMemorySnapshot(topo, { ...meta, memoryNodes: [...owned].reverse() }, 'reach-world-seeder');
  assert.deepEqual(snapshot.memoryStatus, shuffled.memoryStatus);
  assert.equal(snapshot.memoryStatus.length, 642); assert.equal(snapshot.memoryNodeIndex.length, 642);
  assert.equal(snapshot.memoryImprintWeight[0] > 0, true); assert.equal(snapshot.nodeStates.length, 642);
  assert.equal('alive' in snapshot, false); assert.equal('links' in snapshot.memoryScene, false);
  for (const node of snapshot.nodeStates) {
    assert.ok(node.cell < topo.nodeCount); assert.ok(snapshot.memoryStatus[node.cell] >= 4); const p = node.cell * 3;
    assert.ok(Math.abs(Math.hypot(topo.positions[p], topo.positions[p + 1], topo.positions[p + 2]) - 1) < 1e-5);
  }
  const groups = groupAccessibleMemory({ ...defaultMeta(), echoBalance: 3 }, 'reach-horizon-instinct');
  assert.equal(groups.length, 6); assert.equal(groups[0].nodes[0].selectedReady, true);
});

test('idle globe rotation is opt-in, interruptible, reduced-motion safe, and finite', () => {
  const camera = createCamera(); const start = camera.direction.slice(); const policy = createCameraPolicy(0);
  const off = defaultSettings();
  assert.equal(applyAutoRotation(camera, off, policy, { active: false, selected: false, overlay: false, hidden: false }, 4000, 1000), false);
  assert.deepEqual(camera.direction, start);
  const on = { ...off, motion: 'full', idleRotation: 'gentle' };
  assert.equal(applyAutoRotation(camera, on, policy, { active: false, selected: false, overlay: false, hidden: false }, 4000, 1000), true);
  const moved = camera.direction.slice(); interruptCameraPolicy(policy, 4000);
  assert.equal(applyAutoRotation(camera, on, policy, { active: false, selected: false, overlay: false, hidden: false }, 5000, 1000), false);
  assert.deepEqual(camera.direction, moved);
  assert.equal(applyAutoRotation(camera, { ...on, motion: 'reduced' }, policy,
    { active: false, selected: false, overlay: false, hidden: false }, 8000, 1000), false);
  for (let i = 0; i < 5000; i++) applyAutoRotation(camera, on, policy,
    { active: false, selected: false, overlay: false, hidden: false }, 8000 + i * 16, 16);
  for (const value of viewProjection(camera, 1)) assert.ok(Number.isFinite(value));
});

test('untouched continuation fires once, while hidden time is excluded', () => {
  const state = createContinuation(9000); let now = 0;
  for (let run = 0; run < 100; run++) {
    const generation = startContinuation(state, now, { resultTransactionKey: `result-${run}`, runId: run, presentationGeneration: run + 1 });
    now += 4000; assert.equal(advanceContinuation(state, now), false);
    setContinuationHidden(state, true, now); now += 20_000; assert.equal(advanceContinuation(state, now), false);
    setContinuationHidden(state, false, now); now += 5000; assert.equal(advanceContinuation(state, now), true);
    assert.equal(completeContinuation(state, generation), true); assert.equal(advanceContinuation(state, now + 1000), false);
  }
});

test('every trusted interaction class cancels permanently; untrusted and movement do not', () => {
  const cases = [
    [{ type: 'pointerdown', pointerType: 'mouse', isTrusted: true }, 'pointer'],
    [{ type: 'pointerdown', pointerType: 'touch', isTrusted: true }, 'touch'],
    [{ type: 'touchstart', isTrusted: true }, 'touch'], [{ type: 'wheel', isTrusted: true }, 'wheel'],
    [{ type: 'keydown', key: 'Tab', isTrusted: true }, 'keyboard'], [{ type: 'click', isTrusted: true }, 'control'],
    [{ type: 'focusin', isTrusted: true }, 'focus'], [{ type: 'input', isTrusted: true }, 'control'],
    [{ type: 'change', isTrusted: true }, 'control'],
  ];
  for (const [event, kind] of cases) { assert.equal(continuationInteractionType(event), kind); const state = createContinuation();
    const generation = startContinuation(state, 0, { resultTransactionKey: kind });
    assert.equal(cancelContinuation(state, kind), true); assert.equal(continuationLabel(state), 'Auto next cancelled for this result');
    assert.equal(advanceContinuation(state, 99_000), false); assert.equal(state.generation, generation); }
  for (const event of [{ type: 'pointermove', isTrusted: true }, { type: 'mousemove', isTrusted: true },
    { type: 'visibilitychange', isTrusted: true }, { type: 'click', isTrusted: false }, { type: 'keydown', key: 'x', isTrusted: false }]) {
    assert.equal(continuationInteractionType(event), null);
  }
});

test('interaction listener registry is bounded and suppresses only the exact programmatic focus call', () => {
  const listeners = new Map(); const target = { addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); } }; const seen = [];
  const guard = createContinuationInteractionGuard(target, (type) => seen.push(type));
  assert.equal(guard.listenerCount, 8); listeners.get('focusin')({ type: 'focusin', isTrusted: true });
  guard.runProgrammaticFocus(() => listeners.get('focusin')({ type: 'focusin', isTrusted: true }));
  listeners.get('pointerdown')({ type: 'pointerdown', pointerType: 'mouse', isTrusted: true });
  assert.deepEqual(seen, ['focus', 'pointer']); guard.dispose(); guard.dispose();
  assert.equal(guard.listenerCount, 0); assert.equal(listeners.size, 0);
});

test('setting toggles never rearm a cancelled result and a new result gets a fresh generation', () => {
  const state = createContinuation(); const first = startContinuation(state, 0, { resultTransactionKey: 'first' });
  cancelContinuation(state, 'control'); disableContinuation(state, { resultTransactionKey: 'first' });
  assert.equal(state.status, 'disabled'); assert.equal(advanceContinuation(state, 90_000), false);
  const second = startContinuation(state, 100_000, { resultTransactionKey: 'second' });
  assert.ok(second > first); assert.equal(state.status, 'counting'); assert.equal(state.resultKey, 'second');
});

test('pause reasons release only their own ownership', () => {
  const changes = []; const pause = createPauseControl((value, reasons) => changes.push([value, [...reasons]]));
  pause.set('manual', true); pause.set('panel', true); pause.set('panel', false);
  assert.equal(pause.paused, true); assert.equal(pause.has('manual'), true);
  pause.set('manual', false); assert.equal(pause.paused, false);
  assert.deepEqual(changes.map((entry) => entry[0]), [true, true, true, false]);
});

test('saveMeta reports persistence honestly and writes a validated copy', () => {
  assert.equal(saveMeta(defaultMeta()), false);
  let written = null; globalThis.localStorage = { setItem: (_key, value) => { written = value; } };
  try {
    const meta = { ...defaultMeta(), memoryNodes: ['reach-horizon-instinct', 'unknown-node'] };
    assert.equal(saveMeta(meta), true); assert.deepEqual(meta.memoryNodes, ['reach-horizon-instinct', 'unknown-node']);
    assert.deepEqual(JSON.parse(written).memoryNodes, ['reach-horizon-instinct']);
  } finally { delete globalThis.localStorage; }
});
