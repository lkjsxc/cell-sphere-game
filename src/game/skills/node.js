/** Shared immutable schema for all 252 Evolution Globe Skill Cells. */
import { MEMORY_BRANCH_SIZE, memoryAtlasCell } from './atlas.js';
import { affinityForTerritory, habitatContributionsFor, secondaryTagsFor,
  tradeoffForAffinity, transformationContributionsFor } from './affinities.js';
import { buildContributionsFor } from './builds.js';
import { evolutionPowerForKind } from './potential.js';

const LANDMARK_SLOTS = Object.freeze([0, 3, 7, 11, 15, 19, 23, 27, 31, 35, 38, 41]);
const LANDMARK_ROWS = Object.freeze([0, 1, 2, 3, 4, 5, 8, 9, 12, 13, 15, 17]);
const LANDMARK_KINDS = Object.freeze([
  'root', ...Array(5).fill('major'), ...Array(2).fill('conditional'),
  ...Array(2).fill('unlock'), 'keystone', 'capstone',
]);
const LANDMARK_COSTS = Object.freeze([8, 18, 24, 32, 42, 55, 60, 90, 75, 140, 350, 800]);
const WORDS = Object.freeze({
  reach: [['Fine', 'Patient', 'Sunward', 'Tender', 'Distant', 'Frugal', 'Open', 'Rooted', 'Branching'], ['Runner', 'Front', 'Bud', 'Thread', 'Tip', 'Path', 'Stem', 'Trace', 'Horizon', 'Foothold']],
  flow: [['Clear', 'Pulsed', 'Steady', 'Braided', 'Quiet', 'Swift', 'Open', 'Elastic', 'Deep'], ['Current', 'Channel', 'Junction', 'Pulse', 'Vessel', 'Exchange', 'Stream', 'Conduit', 'Circuit', 'Flow']],
  reserve: [['Deep', 'Frugal', 'Cool', 'Dense', 'Patient', 'Sealed', 'Quiet', 'Stored', 'Layered'], ['Vault', 'Granule', 'Cache', 'Pocket', 'Reserve', 'Kernel', 'Buffer', 'Store', 'Larder', 'Core']],
  ecology: [['Rich', 'Mutual', 'Tempered', 'Living', 'Renewed', 'Gentle', 'Fertile', 'Balanced', 'Adaptive'], ['Film', 'Loam', 'Exchange', 'Niche', 'Cycle', 'Scar', 'Symbiont', 'Patch', 'Garden', 'Web']],
  perception: [['Early', 'Quiet', 'Wide', 'Attentive', 'Sensitive', 'Distant', 'Layered', 'Sharp', 'Measured'], ['Signal', 'Echo', 'Warning', 'Gradient', 'Sense', 'Forecast', 'Pulse', 'Marker', 'Reading', 'Watch']],
  continuity: [['Strong', 'Redundant', 'Remembered', 'Joined', 'Steady', 'Elastic', 'Lasting', 'Woven', 'Restored'], ['Cord', 'Loop', 'Bridge', 'Knot', 'Route', 'Bond', 'Lattice', 'Link', 'Path', 'Thread']],
});
const RESONANCE_EFFECTS = Object.freeze({
  reach: [['reach', 'up', 0.40], ['growCost', 'down', 0.30], ['regrow', 'up', 0.40]],
  flow: [['conductance', 'up', 0.40], ['uptake', 'up', 0.40], ['maintenance', 'down', 0.30]],
  reserve: [['energyCap', 'up', 0.40], ['maintenance', 'down', 0.30], ['reinforce', 'up', 0.40]],
  ecology: [['uptake', 'up', 0.40], ['stressResist', 'up', 0.40], ['regrow', 'up', 0.40]],
  perception: [['stressResist', 'up', 0.40], ['heatTol', 'up', 0.40], ['droughtTol', 'up', 0.40]],
  continuity: [['reinforce', 'up', 0.40], ['regrow', 'up', 0.40], ['conductance', 'up', 0.40]],
});
const TRAIT_LABELS = Object.freeze({ reach: 'Frontier readiness', growCost: 'Expansion cost', regrow: 'Scar regrowth',
  conductance: 'Neighbor conductance', uptake: 'Nutrient uptake', maintenance: 'Maintenance cost', energyCap: 'Energy capacity',
  reinforce: 'Route reinforcement', stressResist: 'Stress resistance', heatTol: 'Heat tolerance', droughtTol: 'Drought tolerance', toxinTol: 'Toxin tolerance' });

export const scalar = (key, value, operation = 'multiply') => Object.freeze({ type: 'scalar', key, value, operation });
export const conditional = (trigger, key, value, operation = 'multiply') => Object.freeze({ type: 'conditional', trigger, key, value, operation });
export const unlock = (key, mode, bonus = null) => Object.freeze({ type: 'unlock', key, mode, ...(bonus ? { bonus } : {}) });
export const resonance = (branch, key, direction, cap, scale = 10) =>
  Object.freeze({ type: 'resonance', branch, key, direction, cap, scale });

/** Twelve authored landmarks are interleaved with 30 bounded Resonance Skills. */
export function defineBranch(branch, rows) {
  if (rows.length !== 18) throw new Error(`${branch} source must define 18 authored rows`);
  const landmarkAt = new Map(LANDMARK_SLOTS.map((slot, index) => [slot, index])); let filler = 0;
  return Object.freeze(Array.from({ length: MEMORY_BRANCH_SIZE }, (_, index) => {
    const landmark = landmarkAt.get(index);
    const node = landmark !== undefined ? landmarkDraft(branch, rows[LANDMARK_ROWS[landmark]], landmark, index)
      : resonanceDraft(branch, filler++, index);
    return Object.freeze(node);
  }));
}

function landmarkDraft(branch, row, landmark, index) {
  const kind = LANDMARK_KINDS[landmark];
  const completion = completeUnlock(branch, kind, strengthenEffect(row[5], kind)); const effect = completion.effect;
  return decorateNode({ id: `${branch}-${row[0]}`, nameEn: row[1], effectEn: completion.summary ?? effectSummary(effect, row[2]),
    description: completion.description ?? row[3], cost: LANDMARK_COSTS[landmark],
    branch: title(branch), tier: tier(index), kind, authored: true, cell: memoryAtlasCell(branch, index),
    effect, effects: Object.freeze(effect.type === 'scalar' ? { [effect.key]: effect.value } : {}) }, index);
}
function resonanceDraft(branch, filler, index) {
  const words = WORDS[branch]; const name = `${words[0][Math.floor(filler / 10)]} ${words[1][filler % 10]}`;
  const [key, direction, cap] = RESONANCE_EFFECTS[branch][filler % RESONANCE_EFFECTS[branch].length];
  const effect = resonance(branch, key, direction, cap);
  return decorateNode({ id: `${branch}-resonance-${name.toLowerCase().replace(' ', '-')}`, nameEn: `${name} Resonance`,
    effectEn: `${TRAIT_LABELS[key]} follows a bounded diminishing ${title(branch)} curve.`,
    description: `This permanent Resonance point makes an immediate visible change without unbounded multiplication.`,
    cost: resonanceCost(filler), branch: title(branch), tier: tier(index),
    kind: 'resonance', authored: false, cell: memoryAtlasCell(branch, index), effect, effects: Object.freeze({}) }, index);
}
function decorateNode(node, index) {
  const affinity = affinityForTerritory(node.branch); const secondaryTags = secondaryTagsFor(affinity, index, node.effect);
  return { ...node, affinity, secondaryTags, evolutionPower: evolutionPowerForKind(node.kind),
    tradeoff: tradeoffForAffinity(affinity), habitatContributions: habitatContributionsFor(affinity, node.effect),
    transformationContributions: transformationContributionsFor(secondaryTags),
    buildContributions: buildContributionsFor(affinity, secondaryTags) };
}
function resonanceCost(ordinal) { return 10 + Math.round(90 * (ordinal / 29) ** 1.8); }
function tier(index) { return Math.min(8, 1 + Math.floor(index * 8 / MEMORY_BRANCH_SIZE)); }
function title(value) { return `${value[0].toUpperCase()}${value.slice(1)}`; }
function effectSummary(effect, fallback) {
  if (effect.type === 'conditional') return `${TRAIT_LABELS[effect.key] ?? effect.key} changes by ${Math.round(Math.abs(effect.value - 1) * 100)}% while ${effect.trigger.replaceAll('-', ' ')}.`;
  if (effect.type !== 'scalar' || effect.operation === 'add') return fallback;
  const amount = Math.round(Math.abs(effect.value - 1) * 1000) / 10;
  return `${TRAIT_LABELS[effect.key]} ${effect.value < 1 ? 'falls' : 'rises'} by ${amount}%.`;
}
function strengthenEffect(effect, kind) {
  if (effect.type === 'unlock') return effect;
  if (effect.operation === 'add') return effect;
  const floor = kind === 'root' ? 0.12 : kind === 'major' ? 0.08 : kind === 'conditional' ? 0.15 : 0.20;
  const amount = Math.max(floor, Math.abs(effect.value - 1) * (kind === 'major' ? 2.5 : 2));
  return Object.freeze({ ...effect, value: effect.value < 1 ? 1 - amount : 1 + amount });
}

const UNLOCK_TRAITS = Object.freeze({ reach: ['reach', 'Frontier readiness'], flow: ['conductance', 'Transport capacity'],
  reserve: ['energyCap', 'Stored-energy capacity'], continuity: ['reinforce', 'Useful-route reinforcement'],
  ecology: ['uptake', 'Nutrient uptake'], perception: ['stressResist', 'Stress resistance'] });
function completeUnlock(branch, kind, raw) {
  if (raw.type !== 'unlock') return { effect: raw };
  const [key, label] = UNLOCK_TRAITS[branch]; const gain = kind === 'capstone' ? 0.30 : kind === 'keystone' ? 0.22 : 0.10;
  const supplied = raw.bonus;
  const bonus = supplied ? strengthenEffect(supplied, kind) : scalar(key, 1 + gain);
  const effect = Object.freeze({ ...raw, bonus });
  const role = kind === 'capstone' ? 'The branch’s final cell applies its strongest completed trait improvement.'
    : kind === 'connector' ? 'This late branch cell applies a durable integration improvement.'
      : kind === 'keystone' ? 'The completed branch lesson applies this deterministic improvement.'
        : 'Later worlds carry this deterministic improvement from their first inoculated cell.';
  return { effect, summary: bonusSummary(bonus, label, gain), description: role };
}
function bonusSummary(bonus, defaultLabel, defaultGain) {
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
  let energy = 0; let moisture = 0; let temperature = 0; let toxin = 0; let alive = 0;
  for (let i = 0; i < state.topo.nodeCount; i++) if (state.alive[i]) {
    alive++; energy += Math.max(0, state.energy[i]); moisture += state.moisture[i]; temperature += state.temperature[i]; toxin += state.toxicity[i];
  }
  return { energy: alive ? energy / alive / 6 : 0, moisture: alive ? moisture / alive : 0,
    temperature: alive ? temperature / alive : 0, toxin: alive ? toxin / alive : 0 };
}
function conditionActive(trigger, state, c) {
  switch (trigger) {
    case 'coverage-below-25': return state.coverage < 0.25; case 'coverage-above-70': return state.coverage > 0.70;
    case 'components-above-one': return state.aliveCount > 1 && state.connectedShare < 0.98;
    case 'connectivity-below-45': return state.connectedShare < 0.45; case 'connectivity-below-35': return state.connectedShare < 0.35;
    case 'energy-below-20': return c.energy < 0.20; case 'energy-above-80': return c.energy > 0.80;
    case 'recent-biomass-loss-above-20': return state.peakCoverage - state.coverage > 0.20;
    case 'temperature-above-75': return c.temperature > 0.75; case 'moisture-below-30': return c.moisture < 0.30;
    case 'moisture-above-70': return c.moisture > 0.70; case 'toxin-pressure-above-50': return c.toxin > 0.50;
    case 'component-just-rejoined': return (state.reconnectedUntil ?? -1) >= state.tick; default: return false;
  }
}
