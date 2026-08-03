/** Shared immutable schema for all 642 Evolution Globe Skill Cells. */
import { MEMORY_BRANCH_SIZE, memoryAtlasCell, memoryAtlasParent } from './atlas.js';

const LANDMARK_SLOTS = Object.freeze([0, 6, 12, 18, 24, 31, 37, 43, 49, 56, 62, 68, 74, 81, 87, 93, 99, 106]);
const LANDMARK_KINDS = Object.freeze([
  ...Array(8).fill('micro'), ...Array(4).fill('conditional'),
  ...Array(3).fill('unlock'), 'keystone', 'connector', 'capstone',
]);
const WORDS = Object.freeze({
  reach: [['Fine', 'Patient', 'Sunward', 'Tender', 'Distant', 'Frugal', 'Open', 'Rooted', 'Branching'], ['Runner', 'Front', 'Bud', 'Thread', 'Tip', 'Path', 'Stem', 'Trace', 'Horizon', 'Foothold']],
  flow: [['Clear', 'Pulsed', 'Steady', 'Braided', 'Quiet', 'Swift', 'Open', 'Elastic', 'Deep'], ['Current', 'Channel', 'Junction', 'Pulse', 'Vessel', 'Exchange', 'Stream', 'Conduit', 'Circuit', 'Flow']],
  reserve: [['Deep', 'Frugal', 'Cool', 'Dense', 'Patient', 'Sealed', 'Quiet', 'Stored', 'Layered'], ['Vault', 'Granule', 'Cache', 'Pocket', 'Reserve', 'Kernel', 'Buffer', 'Store', 'Larder', 'Core']],
  ecology: [['Rich', 'Mutual', 'Tempered', 'Living', 'Renewed', 'Gentle', 'Fertile', 'Balanced', 'Adaptive'], ['Film', 'Loam', 'Exchange', 'Niche', 'Cycle', 'Scar', 'Symbiont', 'Patch', 'Garden', 'Web']],
  perception: [['Early', 'Quiet', 'Wide', 'Attentive', 'Sensitive', 'Distant', 'Layered', 'Sharp', 'Measured'], ['Signal', 'Echo', 'Warning', 'Gradient', 'Sense', 'Forecast', 'Pulse', 'Marker', 'Reading', 'Watch']],
  continuity: [['Strong', 'Redundant', 'Remembered', 'Joined', 'Steady', 'Elastic', 'Lasting', 'Woven', 'Restored'], ['Cord', 'Loop', 'Bridge', 'Knot', 'Route', 'Bond', 'Lattice', 'Link', 'Path', 'Thread']],
});
const MICRO_EFFECTS = Object.freeze({
  reach: [['reach', 1.0015], ['growCost', 0.9985], ['regrow', 1.0015]],
  flow: [['conductance', 1.0015], ['uptake', 1.0012], ['maintenance', 0.9988]],
  reserve: [['energyCap', 1.0015], ['maintenance', 0.9988], ['reinforce', 1.0012]],
  ecology: [['uptake', 1.0015], ['stressResist', 1.0012], ['regrow', 1.0012]],
  perception: [['stressResist', 1.0012], ['heatTol', 1.0012], ['droughtTol', 1.0012], ['toxinTol', 1.0012]],
  continuity: [['reinforce', 1.0015], ['regrow', 1.0012], ['conductance', 1.0012]],
});
const TRAIT_LABELS = Object.freeze({ reach: 'Frontier readiness', growCost: 'Expansion cost', regrow: 'Scar regrowth',
  conductance: 'Neighbor conductance', uptake: 'Nutrient uptake', maintenance: 'Maintenance cost', energyCap: 'Energy capacity',
  reinforce: 'Route reinforcement', stressResist: 'Stress resistance', heatTol: 'Heat tolerance', droughtTol: 'Drought tolerance', toxinTol: 'Toxin tolerance' });

export const scalar = (key, value, operation = 'multiply') => Object.freeze({ type: 'scalar', key, value, operation });
export const conditional = (trigger, key, value, operation = 'multiply') => Object.freeze({ type: 'conditional', trigger, key, value, operation });
export const unlock = (key, mode, bonus = null) => Object.freeze({ type: 'unlock', key, mode, ...(bonus ? { bonus } : {}) });

/** Eighteen authored landmarks are interleaved with 89 exact minor skills. */
export function defineBranch(branch, _connectorPrerequisite, rows) {
  if (rows.length !== 18) throw new Error(`${branch} must define 18 authored landmarks`);
  const landmarkAt = new Map(LANDMARK_SLOTS.map((slot, index) => [slot, index])); let filler = 0;
  const drafts = Array.from({ length: MEMORY_BRANCH_SIZE }, (_, index) => {
    const landmark = landmarkAt.get(index);
    if (landmark !== undefined) return landmarkDraft(branch, rows[landmark], landmark, index);
    return minorDraft(branch, filler++, index);
  });
  const ids = drafts.map((node) => node.id);
  return Object.freeze(drafts.map((node, index) => Object.freeze({ ...node,
    requires: Object.freeze(index ? [ids[memoryAtlasParent(branch, index)]] : []),
  })));
}

function landmarkDraft(branch, row, landmark, index) {
  const completion = completeUnlock(branch, LANDMARK_KINDS[landmark], row[5]); const effect = completion.effect;
  return { id: `${branch}-${row[0]}`, nameEn: row[1], effectEn: completion.summary ?? row[2],
    description: completion.description ?? row[3], cost: row[4], requiredRuns: runGate(index),
    branch: title(branch), tier: tier(index), kind: LANDMARK_KINDS[landmark], authored: true, cell: memoryAtlasCell(branch, index),
    effect, effects: Object.freeze(effect.type === 'scalar' ? { [effect.key]: effect.value } : {}) };
}
function minorDraft(branch, filler, index) {
  const words = WORDS[branch]; const name = `${words[0][Math.floor(filler / 10)]} ${words[1][filler % 10]}`;
  const [key, value] = MICRO_EFFECTS[branch][filler % MICRO_EFFECTS[branch].length]; const effect = scalar(key, value);
  return { id: `${branch}-cell-${name.toLowerCase().replace(' ', '-')}`, nameEn: name, effectEn: scalarSummary(key, value),
    description: `This permanent ${title(branch)} cell applies its stated change to every later world.`,
    cost: 1 + Math.floor(runGate(index) / 32), requiredRuns: runGate(index), branch: title(branch),
    tier: tier(index), kind: 'micro', authored: false, cell: memoryAtlasCell(branch, index), effect,
    effects: Object.freeze({ [key]: value }) };
}
function runGate(index) { return Math.floor(index * 164 / (MEMORY_BRANCH_SIZE - 1)); }
function tier(index) { return Math.min(8, 1 + Math.floor(index * 8 / MEMORY_BRANCH_SIZE)); }
function title(value) { return `${value[0].toUpperCase()}${value.slice(1)}`; }
function scalarSummary(key, value) {
  const amount = Math.round(Math.abs(value - 1) * 10000) / 100;
  return `${TRAIT_LABELS[key]} ${value < 1 ? 'falls' : 'rises'} by ${amount}%.`;
}

const UNLOCK_TRAITS = Object.freeze({ reach: ['reach', 'Frontier readiness'], flow: ['conductance', 'Transport capacity'],
  reserve: ['energyCap', 'Stored-energy capacity'], continuity: ['reinforce', 'Useful-route reinforcement'],
  ecology: ['uptake', 'Nutrient uptake'], perception: ['stressResist', 'Stress resistance'] });
function completeUnlock(branch, kind, raw) {
  if (raw.type !== 'unlock') return { effect: raw };
  const [key, label] = UNLOCK_TRAITS[branch]; const gain = kind === 'capstone' ? 0.04 : kind === 'unlock' ? 0.015 : 0.025;
  const bonus = raw.bonus ?? scalar(key, 1 + gain); const effect = Object.freeze({ ...raw, bonus });
  const role = kind === 'capstone' ? 'The branch’s final cell applies its strongest completed trait improvement.'
    : kind === 'connector' ? 'This late branch cell applies a durable integration improvement.'
      : kind === 'keystone' ? 'The completed branch lesson applies this deterministic improvement.'
        : 'Later worlds carry this deterministic improvement from their first inoculated cell.';
  return { effect, summary: bonusSummary(bonus, label, gain), description: role };
}
function bonusSummary(bonus, defaultLabel, defaultGain) {
  if (bonus.key === 'distributedSensing') return 'Crisis warnings arrive one interval earlier.';
  const label = TRAIT_LABELS[bonus.key] ?? defaultLabel;
  if (bonus.operation === 'add') return `${label} rises by ${bonus.value}.`;
  const amount = Math.round(Math.abs(bonus.value - 1) * 1000) / 10;
  return `${label} ${bonus.value < 1 ? 'falls' : 'rises'} by ${amount || defaultGain * 100}%.`;
}

/** Rebuild the small effective trait block once per tick from owned conditions. */
export function applyMemoryConditionals(state) {
  const target = state.activeTraits;
  for (const key of Object.keys(state.traits)) target[key] = state.traits[key];
  const conditions = state.memoryConditionals ?? []; if (!conditions.length) return target;
  const context = conditionContext(state);
  for (const effect of conditions) if (conditionActive(effect.trigger, state, context) && effect.key in target)
    target[effect.key] = effect.operation === 'add' ? target[effect.key] + effect.value : target[effect.key] * effect.value;
  return target;
}
function conditionContext(state) {
  let energy = 0; let moisture = 0; let toxin = 0; let alive = 0;
  for (let i = 0; i < state.topo.nodeCount; i++) if (state.alive[i]) { alive++; energy += Math.max(0, state.energy[i]); moisture += state.moisture[i]; toxin += state.toxicity[i]; }
  const active = state.events.filter((event) => state.tick >= event.startTick && state.tick <= event.endTick);
  return { energy: alive ? energy / alive / 6 : 0, moisture: alive ? moisture / alive : 0,
    toxin: alive ? toxin / alive : 0, crisis: active.some((event) => event.crisis), active };
}
function conditionActive(trigger, state, c) {
  const active = c.active;
  switch (trigger) {
    case 'coverage-below-25': return state.coverage < 0.25; case 'coverage-above-70': return state.coverage > 0.70;
    case 'components-above-one': return state.aliveCount > 1 && state.connectedShare < 0.98;
    case 'connectivity-below-45': return state.connectedShare < 0.45; case 'connectivity-below-35': return state.connectedShare < 0.35;
    case 'crisis-active': return c.crisis; case 'nutrient-bloom-active': return active.some((event) => event.family === 'bloom');
    case 'energy-below-20': return c.energy < 0.20; case 'energy-above-80': return c.energy > 0.80;
    case 'recent-biomass-loss-above-20': return state.peakCoverage - state.coverage > 0.20;
    case 'heat-crisis-active': return active.some((event) => event.family === 'heat'); case 'moisture-below-30': return c.moisture < 0.30;
    case 'toxin-pressure-above-50': return c.toxin > 0.50;
    case 'crisis-recently-ended': return state.events.some((event) => state.tick > event.endTick && state.tick <= event.endTick + 200);
    case 'crisis-telegraphed': return state.events.some((event) => (event.announced & 1) && !(event.announced & 2));
    case 'component-just-rejoined': return (state.reconnectedUntil ?? -1) >= state.tick; default: return false;
  }
}
