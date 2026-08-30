/** Deterministic campaign policies over fair, player-visible Evolution cells. */
import { hashStringU32 } from '../core/hash.js';
import { compareProgressionIntegers } from '../core/progression-integer.js';
import { AGENT_GOALS } from './schema.js';
export const AGENT_POLICIES = AGENT_GOALS;
const PREFERENCES = Object.freeze({ sustainability: ['Freshwater', 'Scarcity', 'Foundation'], fertility: ['Fertility'], freshwater: ['Freshwater'],
  scarcity: ['Scarcity'], cryogenic: ['Cryogenic'], marine: ['Marine'], luminous: ['Luminous'], worldmaking: ['Marine', 'Cryogenic', 'Scarcity'],
  'reach-100': ['Marine', 'Cryogenic', 'Freshwater', 'Scarcity', 'Fertility', 'Luminous'], conservative: ['Foundation', 'Freshwater', 'Scarcity'] });
const ALIASES = Object.freeze({ expansion: 'fertility', resilience: 'sustainability', efficiency: 'scarcity', first: 'balanced', random: 'random-legal', autonomous: 'balanced', reach100: 'reach-100' });
export function normalizePolicy(policy) { const normalized = ALIASES[policy] ?? policy; return AGENT_POLICIES.includes(normalized) ? normalized : 'balanced'; }
export function choosePolicyAction(observation, requestedPolicy = observation?.goals?.selected ?? 'balanced') {
  const policy = normalizePolicy(requestedPolicy); if (policy === 'weak') return runDecision(observation, policy, 'Deliberately weak control declined permanent Evolution.');
  const reachable = observation?.availableEvolutionCells ?? [];
  const legal = reachable.filter((cell) => cell.reason === 'ready' && cell.affordable);
  if (!legal.length) return runDecision(observation, policy, 'Started a new Level-0 World because no Evolution level was affordable.');
  const savingsTarget = unaffordableSpecialistTarget(reachable, policy);
  if (savingsTarget) return runDecision(observation, policy, `Saved Echoes for reachable ${savingsTarget.name} rather than diverting this specialist route.`);
  const cell = selectCell(legal, observation, policy); return Object.freeze({ action: Object.freeze({ type: 'buy-evolution-level', cell: cell.cell,
    expectedLocalLevel: cell.localLevel, expectedAggregateRank: cell.aggregateRank,
    expectedRevision: observation.metaRevision }), rationale: rationale(cell, policy), policy });
}
function unaffordableSpecialistTarget(reachable, policy) {
  const domains = PREFERENCES[policy] ?? []; const targets = reachable.filter((cell) => !cell.owned && domains.includes(cell.domain));
  const target = targets.sort(costThenCell)[0]; return target && !target.affordable ? target : null;
}
function runDecision(observation, policy, rationale) { return Object.freeze({ action: Object.freeze({ type: 'run-world', expectedRevision: observation.metaRevision,
  expectedWorldOrdinal: observation.worldOrdinal, budgetTicks: 10_000 }), rationale, policy }); }
function selectCell(legal, observation, policy) {
  if (policy === 'random-legal') return deterministicChoice(legal, observation); if (policy === 'cheapest') return legal.slice().sort(costThenCell)[0];
  if (policy === 'breadth-first') return legal.slice().sort((a, b) => Number(a.owned) - Number(b.owned) || costThenCell(a, b))[0];
  if (policy === 'depth-first') return legal.slice().sort((a, b) => compareProgressionIntegers(b.localLevel, a.localLevel) || costThenCell(a, b))[0];
  if (policy === 'diversity' || policy === 'balanced') return balancedChoice(legal, observation); return preferredChoice(legal, observation, policy);
}
function preferredChoice(legal, observation, policy) { const preferences = PREFERENCES[policy] ?? [];
  return legal.slice().sort((a, b) => candidateScore(b, preferences, policy) - candidateScore(a, preferences, policy) || costThenCell(a, b))[0]; }
function balancedChoice(legal, observation) { const totals = new Map((observation.evolutionSummary?.domains ?? []).map((entry) => [entry.domain, entry.aggregateLevels]));
  return legal.slice().sort((a, b) => compareProgressionIntegers(totals.get(a.domain) ?? '0', totals.get(b.domain) ?? '0')
    || Number(a.owned) - Number(b.owned) || kindPriority(b.kind) - kindPriority(a.kind) || costThenCell(a, b))[0]; }
function candidateScore(cell, preferences, policy) { let score = 0;
  // Public hop counts keep specialist routes deterministic without exposing layout-generation fields.
  for (let index = 0; index < preferences.length; index++) {
    const distance = cell.domainDistance?.[preferences[index]];
    if (Number.isInteger(distance)) score = Math.max(score, 240 - index * 24 - distance * 48);
  }
  score += Math.min(24, cell.rootDistance ?? 0);
  const text = `${cell.summary} ${cell.gameplay?.after ?? ''}`.toLowerCase(); for (const term of policyTerms(policy)) if (text.includes(term)) score += 18;
  if (cell.gameplay?.unlocks?.length) score += policy === 'reach-100' ? 35 : 12; return score + kindPriority(cell.kind) + (cell.owned ? 8 : 20); }
function policyTerms(policy) { return ({ sustainability: ['maintenance', 'resource', 'recycl'], fertility: ['bud', 'uptake', 'divide'],
  freshwater: ['freshwater', 'lake', 'wet'], scarcity: ['scarcity', 'recycl', 'reserve'], cryogenic: ['cold', 'glacial', 'ice'],
  marine: ['marine', 'ocean', 'coast'], luminous: ['charge', 'powered', 'luminous'], worldmaking: ['reclaim', 'basin', 'coast'],
  'reach-100': ['habitat', 'access', 'reach', 'marine'] })[policy] ?? []; }
function deterministicChoice(legal, observation) { const ordered = legal.slice().sort((a, b) => a.cell - b.cell);
  const visible = `${observation.worldOrdinal}:${observation.bestEnvironmentLevelReached}:${observation.echoBalance}:${observation.bestScore}:${ordered.map((cell) => `${cell.cell}@${cell.localLevel}`).join('|')}`;
  return ordered[hashStringU32(visible) % ordered.length]; }
function costThenCell(a, b) { return compareProgressionIntegers(a.nextCost, b.nextCost) || a.cell - b.cell; }
function kindPriority(kind) { return ({ capstone: 8, specialization: 3, root: 2 })[kind] ?? 0; }
function rationale(cell, policy) { const unlock = cell.gameplay?.unlocks?.length ? ` and opens ${cell.gameplay.unlocks.join(', ')}` : '';
  return `${cell.owned ? 'Strengthened' : 'Established'} cell ${cell.cell + 1}, ${cell.name}, to Local Level ${cell.nextLocalLevel} and shared rank ${cell.nextAggregateRank} because its ${cell.domain} ecology supports ${policy}${unlock}; cost ${cell.nextCost} Echoes.`; }
