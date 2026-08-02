/** Shared immutable schema for Memory atlas content modules. */
import { MEMORY_PARENT_TEMPLATE, memoryAtlasCell } from './memory-atlas.js';

const TIERS = Object.freeze([1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 8]);
const KINDS = Object.freeze([
  ...Array(8).fill('micro'), ...Array(4).fill('conditional'),
  ...Array(3).fill('unlock'), 'keystone', 'connector', 'capstone',
]);
export const scalar = (key, value, operation = 'multiply') =>
  Object.freeze({ type: 'scalar', key, value, operation });
export const conditional = (trigger, key, value, operation = 'multiply') =>
  Object.freeze({ type: 'conditional', trigger, key, value, operation });
export const unlock = (key, mode, bonus = null) => Object.freeze({
  type: 'unlock', key, mode, ...(bonus ? { bonus } : {}),
});

/** Rows: slug, name, summary, description, cost, effect. */
export function defineBranch(branch, connectorPrerequisite, rows) {
  if (rows.length !== 18) throw new Error(`${branch} must define 18 Memory nodes`);
  const ids = rows.map((row) => `${branch}-${row[0]}`);
  return Object.freeze(rows.map((row, index) => {
    const requires = MEMORY_PARENT_TEMPLATE[index].map((required) => ids[required]);
    if (index === 16) requires.push(connectorPrerequisite);
    const completion = completeUnlock(branch, KINDS[index], row[5]); const effect = completion.effect;
    const effects = effect.type === 'scalar' ? { [effect.key]: effect.value } : {};
    return Object.freeze({
      id: ids[index], nameEn: row[1], effectEn: completion.summary ?? row[2], description: completion.description ?? row[3],
      cost: row[4], requires: Object.freeze(requires),
      branch: `${branch[0].toUpperCase()}${branch.slice(1)}`, tier: TIERS[index],
      kind: KINDS[index], cell: memoryAtlasCell(branch, index), effect, effects: Object.freeze(effects),
    });
  }));
}

const UNLOCK_TRAITS = Object.freeze({
  reach: ['reach', 'Frontier readiness'], flow: ['conductance', 'Transport capacity'],
  reserve: ['energyCap', 'Stored-energy capacity'], continuity: ['reinforce', 'Useful-route reinforcement'],
  ecology: ['uptake', 'Nutrient uptake'], perception: ['stressResist', 'Stress resistance'],
});
function completeUnlock(branch, kind, raw) {
  if (raw.type !== 'unlock') return { effect: raw };
  const [key, label] = UNLOCK_TRAITS[branch]; const gain = kind === 'capstone' ? 0.04 : kind === 'unlock' ? 0.015 : 0.025;
  const bonus = raw.bonus ?? scalar(key, 1 + gain); const effect = Object.freeze({ ...raw, bonus });
  const role = kind === 'connector' ? 'The adjacent cell requires both branches and carries this deterministic improvement.'
    : kind === 'capstone' ? 'The branch’s final adjacent cell carries its strongest completed trait improvement.'
      : kind === 'keystone' ? 'The completed branch lesson carries this deterministic improvement.'
        : 'Later worlds carry this deterministic improvement from their first inoculated cell.';
  return { effect, summary: bonusSummary(bonus, label, gain), description: role };
}
function bonusSummary(bonus, defaultLabel, defaultGain) {
  if (bonus.key === 'distributedSensing') return 'Crisis warnings arrive one interval earlier.';
  const labels = { stressResist: 'Stress resistance', uptake: 'Nutrient uptake', maintenance: 'Maintenance cost' };
  const label = labels[bonus.key] ?? defaultLabel;
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
  for (const effect of conditions) {
    if (!conditionActive(effect.trigger, state, context) || !(effect.key in target)) continue;
    target[effect.key] = effect.operation === 'add' ? target[effect.key] + effect.value : target[effect.key] * effect.value;
  }
  return target;
}
function conditionContext(state) {
  let energy = 0; let moisture = 0; let toxin = 0; let alive = 0;
  for (let i = 0; i < state.topo.nodeCount; i++) if (state.alive[i]) {
    alive++; energy += Math.max(0, state.energy[i]); moisture += state.moisture[i]; toxin += state.toxicity[i];
  }
  const active = state.events.filter((event) => state.tick >= event.startTick && state.tick <= event.endTick);
  return { energy: alive ? energy / alive / 6 : 0, moisture: alive ? moisture / alive : 0,
    toxin: alive ? toxin / alive : 0, crisis: active.some((event) => event.crisis), active };
}
function conditionActive(trigger, state, c) {
  switch (trigger) {
    case 'coverage-below-25': return state.coverage < 0.25;
    case 'coverage-above-70': return state.coverage > 0.70;
    case 'components-above-one': return state.aliveCount > 1 && state.connectedShare < 0.98;
    case 'connectivity-below-45': return state.connectedShare < 0.45;
    case 'connectivity-below-35': return state.connectedShare < 0.35;
    case 'crisis-active': return c.crisis;
    case 'nutrient-bloom-active': return c.active.some((event) => event.family === 'bloom');
    case 'energy-below-20': return c.energy < 0.20;
    case 'energy-above-80': return c.energy > 0.80;
    case 'recent-biomass-loss-above-20': return state.peakCoverage - state.coverage > 0.20;
    case 'heat-crisis-active': return c.active.some((event) => event.family === 'heat');
    case 'moisture-below-30': return c.moisture < 0.30;
    case 'toxin-pressure-above-50': return c.toxin > 0.50;
    case 'crisis-recently-ended': return state.events.some((event) => state.tick > event.endTick && state.tick <= event.endTick + 200);
    case 'crisis-telegraphed': return state.events.some((event) => (event.announced & 1) && !(event.announced & 2));
    case 'component-just-rejoined': return (state.reconnectedUntil ?? -1) >= state.tick;
    default: return false;
  }
}
