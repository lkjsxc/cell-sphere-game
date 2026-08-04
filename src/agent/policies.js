/** Deterministic campaign policies. Inputs are fair observations only. */
import { hashStringU32 } from '../core/hash.js';

export const AGENT_POLICIES = Object.freeze([
  'balanced', 'sustainability', 'freshwater', 'rich-rush', 'scarcity-reclaimer',
  'cryogenic', 'marine', 'luminous', 'cryolake', 'littoral-forest',
  'terraforming', 'reach-100', 'random-legal',
]);
const PREFERENCES = Object.freeze({
  sustainability: ['Freshwater', 'Scarcity', 'Fertility'], freshwater: ['Freshwater'],
  'rich-rush': ['Fertility'], 'scarcity-reclaimer': ['Scarcity'], cryogenic: ['Cryogenic'],
  marine: ['Marine'], luminous: ['Luminous'], cryolake: ['Cryogenic', 'Freshwater'],
  'littoral-forest': ['Marine', 'Fertility', 'Freshwater'],
  terraforming: ['Scarcity', 'Luminous', 'Freshwater'],
  'reach-100': ['Marine', 'Cryogenic', 'Freshwater', 'Scarcity', 'Fertility', 'Luminous'],
});
const TARGET_BUILDS = Object.freeze({ sustainability: ['circular-biosphere', 'lake-garden'],
  freshwater: ['lake-garden', 'bioelectric-wetland'], 'rich-rush': ['rich-rush'],
  'scarcity-reclaimer': ['wasteland-reclaimer', 'depletion-bloom'],
  cryogenic: ['cold-dormancy', 'cryolake-engineer'], marine: ['pelagic-colony', 'littoral-succession', 'brine-harvester'],
  luminous: ['illuminated-biosphere', 'bioelectric-wetland', 'hydrothermal-grid'],
  cryolake: ['cryolake-engineer'], 'littoral-forest': ['littoral-succession'],
  terraforming: ['wasteland-reclaimer', 'cryolake-engineer', 'littoral-succession', 'depletion-bloom'],
  'reach-100': ['world-gardener', 'pelagic-colony', 'cold-dormancy'],
});
const ALIASES = Object.freeze({ scarcity: 'scarcity-reclaimer', reclaimer: 'scarcity-reclaimer',
  expansion: 'rich-rush', resilience: 'sustainability', efficiency: 'scarcity-reclaimer',
  first: 'balanced', random: 'random-legal', autonomous: 'balanced', reach100: 'reach-100' });

export function normalizePolicy(policy) {
  const normalized = ALIASES[policy] ?? policy;
  return AGENT_POLICIES.includes(normalized) ? normalized : 'balanced';
}

export function choosePolicyAction(observation, requestedPolicy = observation?.goals?.selected ?? 'balanced') {
  const policy = normalizePolicy(requestedPolicy);
  const legal = (observation?.availableSkills ?? []).filter((skill) => skill.reachable && skill.affordable);
  if (!legal.length) return Object.freeze({ action: Object.freeze({ type: 'run-world' }),
    rationale: `Ran the next world because no reachable Skill was affordable for ${policy}.`, policy });
  const skill = policy === 'random-legal' ? deterministicChoice(legal, observation)
    : policy === 'balanced' ? balancedChoice(legal, observation) : preferredChoice(legal, policy);
  return Object.freeze({ action: Object.freeze({ type: 'buy-skill', skillId: skill.id }),
    rationale: rationale(skill, policy), policy });
}

function preferredChoice(legal, policy) {
  const preferences = PREFERENCES[policy] ?? [];
  return legal.slice().sort((a, b) => candidateScore(b, preferences, policy)
    - candidateScore(a, preferences, policy) || a.cost - b.cost || a.id.localeCompare(b.id))[0];
}
function balancedChoice(legal, observation) {
  const counts = new Map();
  for (const skill of observation.ownedSkills ?? []) counts.set(skill.affinity, (counts.get(skill.affinity) ?? 0) + 1);
  return legal.slice().sort((a, b) => (counts.get(a.affinity) ?? 0) - (counts.get(b.affinity) ?? 0)
    || kindPriority(b.kind) - kindPriority(a.kind) || a.cost - b.cost || a.id.localeCompare(b.id))[0];
}
function candidateScore(skill, preferences, policy) {
  const affinity = preferences.indexOf(skill.affinity); let score = affinity < 0 ? 0 : 100 - affinity * 12;
  const text = `${skill.tags.join(' ')} ${skill.gameplay.summary}`.toLowerCase();
  const terms = policyTerms(policy); for (const term of terms) if (text.includes(term)) score += 18;
  if (skill.gameplay.unlocks.length) score += policy === 'reach-100' ? 35 : 12;
  const targets = TARGET_BUILDS[policy] ?? [];
  for (const build of skill.buildProgress ?? []) if (targets.includes(build.id))
    score += 120 + (build.progress ?? 0) * 80 + (build.active ? 100 : 0);
  return score + kindPriority(skill.kind) - skill.cost / 1000;
}
function policyTerms(policy) {
  return ({ sustainability: ['renew', 'maintenance', 'resource', 'lake'], freshwater: ['lake', 'moisture', 'wetland'],
    'rich-rush': ['reach', 'uptake', 'frontier'], 'scarcity-reclaimer': ['regrow', 'maintenance', 'scar', 'resource'],
    cryogenic: ['cold', 'tundra', 'snow', 'ice'], marine: ['ocean', 'marine', 'shallow', 'deep'],
    luminous: ['power', 'electric', 'conduct'], cryolake: ['cold', 'lake', 'ice'],
    'littoral-forest': ['shallow', 'forest', 'lake'], terraforming: ['regrow', 'reclaim', 'power'],
    'reach-100': ['permit', 'access', 'reach', 'colonization'] })[policy] ?? [];
}
function deterministicChoice(legal, observation) {
  const ordered = legal.slice().sort((a, b) => a.id.localeCompare(b.id));
  const visible = `${observation.worldOrdinal}:${observation.echoBalance}:${observation.bestScore}:${ordered.map((skill) => skill.id).join('|')}`;
  return ordered[hashStringU32(visible) % ordered.length];
}
function kindPriority(kind) { return ({ capstone: 8, keystone: 6, capability: 5, unlock: 5,
  conditional: 3, major: 2, root: 2, resonance: 1 })[kind] ?? 0; }
function rationale(skill, policy) {
  const unlock = skill.gameplay.unlocks.length ? ` and unlocks ${skill.gameplay.unlocks.join(', ')}` : '';
  return `Bought ${skill.name} because its ${skill.affinity} effect supports ${policy}${unlock}; cost ${skill.cost} Echoes.`;
}
