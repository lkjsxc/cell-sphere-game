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
  const cell = selectCell(legal, observation, policy); return Object.freeze({ action: Object.freeze({ type: 'buy-evolution-level', cellId: cell.id,
    expectedLevel: cell.currentLevel, expectedRevision: observation.metaRevision }), rationale: rationale(cell, policy), policy });
}
function unaffordableSpecialistTarget(reachable, policy) {
  const domains = PREFERENCES[policy] ?? []; const targets = reachable.filter((cell) => !cell.owned && domains.includes(cell.domain));
  const target = targets.sort(costThenId)[0]; return target && !target.affordable ? target : null;
}
function runDecision(observation, policy, rationale) { return Object.freeze({ action: Object.freeze({ type: 'run-world', expectedRevision: observation.metaRevision,
  expectedWorldOrdinal: observation.worldOrdinal, budgetTicks: 10_000 }), rationale, policy }); }
function selectCell(legal, observation, policy) {
  if (policy === 'random-legal') return deterministicChoice(legal, observation); if (policy === 'cheapest') return legal.slice().sort(costThenId)[0];
  if (policy === 'breadth-first') return legal.slice().sort((a, b) => Number(a.owned) - Number(b.owned) || costThenId(a, b))[0];
  if (policy === 'depth-first') return legal.slice().sort((a, b) => compareProgressionIntegers(b.currentLevel, a.currentLevel) || costThenId(a, b))[0];
  if (policy === 'diversity' || policy === 'balanced') return balancedChoice(legal, observation); return preferredChoice(legal, observation, policy);
}
function preferredChoice(legal, observation, policy) { const preferences = PREFERENCES[policy] ?? [];
  return legal.slice().sort((a, b) => candidateScore(b, preferences, policy, observation.evolutionCells) - candidateScore(a, preferences, policy, observation.evolutionCells) || costThenId(a, b))[0]; }
function balancedChoice(legal, observation) { const totals = new Map((observation.evolutionSummary?.domains ?? []).map((entry) => [entry.domain, entry.levels]));
  return legal.slice().sort((a, b) => compareProgressionIntegers(totals.get(a.domain) ?? '0', totals.get(b.domain) ?? '0')
    || Number(a.owned) - Number(b.owned) || kindPriority(b.kind) - kindPriority(a.kind) || costThenId(a, b))[0]; }
function candidateScore(cell, preferences, policy, visibleCells = []) { const index = preferences.indexOf(cell.domain); let score = index < 0 ? 0 : 100 - index * 12;
  // The public sphere exposes physical neighbors, so specialists may plan an
  // adjacent route instead of repeatedly buying an unrelated cheap foundation cell.
  const route = routeDistance(cell.id, visibleCells, preferences);
  if (route !== null) score += Math.max(0, 64 - route * 16);
  const text = `${cell.summary} ${cell.gameplay?.after ?? ''}`.toLowerCase(); for (const term of policyTerms(policy)) if (text.includes(term)) score += 18;
  if (cell.gameplay?.unlocks?.length) score += policy === 'reach-100' ? 35 : 12; return score + kindPriority(cell.kind) + (cell.owned ? 8 : 20); }
function routeDistance(start, visibleCells, domains) {
  if (!domains.length) return null; const byId = new Map(visibleCells.map((cell) => [cell.id, cell])); const pending = [[start, 0]]; const seen = new Set([start]);
  for (let index = 0; index < pending.length; index++) { const [id, distance] = pending[index]; const cell = byId.get(id);
    if (!cell) continue; if (domains.includes(cell.domain)) return distance;
    for (const neighbor of cell.neighbors ?? []) if (!seen.has(neighbor)) { seen.add(neighbor); pending.push([neighbor, distance + 1]); }
  }
  return null;
}
function policyTerms(policy) { return ({ sustainability: ['maintenance', 'resource', 'recycl'], fertility: ['bud', 'uptake', 'divide'],
  freshwater: ['freshwater', 'lake', 'wet'], scarcity: ['scarcity', 'recycl', 'reserve'], cryogenic: ['cold', 'glacial', 'ice'],
  marine: ['marine', 'ocean', 'coast'], luminous: ['charge', 'powered', 'luminous'], worldmaking: ['reclaim', 'basin', 'coast'],
  'reach-100': ['habitat', 'access', 'reach', 'marine'] })[policy] ?? []; }
function deterministicChoice(legal, observation) { const ordered = legal.slice().sort((a, b) => a.id.localeCompare(b.id));
  const visible = `${observation.worldOrdinal}:${observation.bestEnvironmentLevelReached}:${observation.echoBalance}:${observation.bestScore}:${ordered.map((cell) => `${cell.id}@${cell.currentLevel}`).join('|')}`;
  return ordered[hashStringU32(visible) % ordered.length]; }
function costThenId(a, b) { return compareProgressionIntegers(a.nextCost, b.nextCost) || a.id.localeCompare(b.id); }
function kindPriority(kind) { return ({ capstone: 8, specialization: 3, root: 2 })[kind] ?? 0; }
function rationale(cell, policy) { const unlock = cell.gameplay?.unlocks?.length ? ` and opens ${cell.gameplay.unlocks.join(', ')}` : '';
  return `${cell.owned ? 'Upgraded' : 'Unlocked'} ${cell.name} to Level ${cell.nextLevel} because its ${cell.domain} ecology supports ${policy}${unlock}; cost ${cell.nextCost} Echoes.`; }
