/** Deterministic campaign policies. Inputs are fair observations only. */
import { hashStringU32 } from '../core/hash.js';
import { compareProgressionIntegers } from '../core/progression-integer.js';
import { AGENT_GOALS } from './schema.js';

export const AGENT_POLICIES = AGENT_GOALS;
const PREFERENCES = Object.freeze({
  sustainability:['Freshwater','Scarcity','Fertility'], freshwater:['Freshwater'],
  'rich-rush':['Fertility'], 'scarcity-reclaimer':['Scarcity'], cryogenic:['Cryogenic'],
  marine:['Marine'], luminous:['Luminous'], 'luminous-infrastructure':['Luminous','Freshwater','Marine'],
  cryolake:['Cryogenic','Freshwater'], 'littoral-forest':['Marine','Fertility','Freshwater'],
  terraforming:['Scarcity','Luminous','Freshwater'],
  'reach-100':['Marine','Cryogenic','Freshwater','Scarcity','Fertility','Luminous'],
});
const TARGET_BUILDS = Object.freeze({ sustainability:['circular-biosphere','lake-garden'],
  freshwater:['lake-garden','bioelectric-wetland'], 'rich-rush':['rich-rush'],
  'scarcity-reclaimer':['wasteland-reclaimer','depletion-bloom'],
  cryogenic:['cold-dormancy','cryolake-engineer'], marine:['pelagic-colony','littoral-succession','brine-harvester'],
  luminous:['illuminated-biosphere','bioelectric-wetland','hydrothermal-grid'],
  'luminous-infrastructure':['illuminated-biosphere','bioelectric-wetland','hydrothermal-grid','lake-to-light-network'],
  cryolake:['cryolake-engineer'], 'littoral-forest':['littoral-succession'],
  terraforming:['wasteland-reclaimer','cryolake-engineer','littoral-succession','depletion-bloom'],
  'reach-100':['world-gardener','pelagic-colony','cold-dormancy'],
});
const ALIASES = Object.freeze({ scarcity:'scarcity-reclaimer', reclaimer:'scarcity-reclaimer',
  expansion:'rich-rush', resilience:'sustainability', efficiency:'scarcity-reclaimer',
  first:'balanced', random:'random-legal', autonomous:'balanced', reach100:'reach-100' });

export function normalizePolicy(policy) {
  const normalized = ALIASES[policy] ?? policy;
  return AGENT_POLICIES.includes(normalized) ? normalized : 'balanced';
}

export function choosePolicyAction(observation, requestedPolicy = observation?.goals?.selected ?? 'balanced') {
  const policy = normalizePolicy(requestedPolicy);
  if(policy==='weak')return runDecision(observation,policy,false,'Deliberately weak control declined permanent Evolution.');
  const legal = (observation?.availableEvolutionCells ?? observation?.availableSkills ?? [])
    .filter((cell) => cell.reason === 'ready' && cell.affordable);
  if (!legal.length) {
    const retry = policy === 'conservative-retry' && observation.lastResult
      && observation.lastResult.survivalSeconds < 240 && observation.environmentLevel !== '0';
    return runDecision(observation,policy,retry,retry
      ? `Retried Environment Level ${observation.lastResult.environmentLevel} after a short exposed world.`
      : `Ran Environment Level ${observation.environmentLevel} because no Evolution level was affordable.`);
  }
  const cell = selectCell(legal, observation, policy);
  return Object.freeze({ action:Object.freeze({ type:'buy-evolution-level', cellId:cell.id,
    expectedLevel:cell.currentLevel, expectedRevision:observation.metaRevision }),
    rationale:rationale(cell, policy), policy });
}

function runDecision(observation,policy,retry,rationale){const guard={expectedRevision:observation.metaRevision,expectedWorldOrdinal:observation.worldOrdinal};
 return Object.freeze({action:Object.freeze(retry?{type:'retry-environment-level',...guard}:{type:'run-world',...guard}),rationale,policy})}
function selectCell(legal, observation, policy) {
  if (policy === 'random-legal') return deterministicChoice(legal, observation);
  if (policy === 'cheapest') return legal.slice().sort(costThenId)[0];
  if (policy === 'breadth-first') return legal.slice().sort((a,b) => Number(a.owned)-Number(b.owned) || costThenId(a,b))[0];
  if (policy === 'depth-first') return legal.slice().sort((a,b) => compareProgressionIntegers(b.currentLevel,a.currentLevel) || costThenId(a,b))[0];
  if (policy === 'marginal-value') return legal.slice().sort((a,b) => compareProgressionIntegers(b.worldPotential.delta,a.worldPotential.delta) || costThenId(a,b))[0];
  if (policy === 'diversity' || policy === 'balanced') return balancedChoice(legal, observation);
  if (policy === 'harshness-push') return legal.slice().sort((a,b) => Number(a.owned)-Number(b.owned)
    || kindPriority(b.kind)-kindPriority(a.kind) || costThenId(a,b))[0];
  return preferredChoice(legal, policy);
}
function preferredChoice(legal, policy) {
  const preferences=PREFERENCES[policy] ?? [];
  return legal.slice().sort((a,b) => candidateScore(b,preferences,policy)-candidateScore(a,preferences,policy)
    || costThenId(a,b))[0];
}
function balancedChoice(legal, observation) {
  const totals=new Map((observation.affinities ?? []).map((entry)=>[entry.affinity,entry.totalLevels]));
  return legal.slice().sort((a,b)=>compareProgressionIntegers(totals.get(a.affinity) ?? '0',totals.get(b.affinity) ?? '0')
    || Number(a.owned)-Number(b.owned) || kindPriority(b.kind)-kindPriority(a.kind) || costThenId(a,b))[0];
}
function candidateScore(cell, preferences, policy) {
  const affinity=preferences.indexOf(cell.affinity); let score=affinity<0?0:100-affinity*12;
  const text=`${cell.tags.join(' ')} ${cell.gameplay.summary}`.toLowerCase();
  for(const term of policyTerms(policy)) if(text.includes(term)) score+=18;
  if(cell.gameplay.unlocks.length) score+=policy==='reach-100'?35:12;
  const targets=TARGET_BUILDS[policy] ?? [];
  for(const build of cell.buildProgress ?? []) if(targets.includes(build.id))
    score+=120+(build.progress??0)*80+(build.active?100:0);
  return score+kindPriority(cell.kind)+(cell.owned?8:20);
}
function policyTerms(policy) { return ({ sustainability:['renew','maintenance','resource','lake'],
  freshwater:['lake','moisture','wetland'], 'rich-rush':['reach','uptake','frontier'],
  'scarcity-reclaimer':['regrow','maintenance','scar','resource'], cryogenic:['cold','tundra','snow','ice'],
  marine:['ocean','marine','shallow','deep'], luminous:['power','electric','conduct'],
  'luminous-infrastructure':['power','electric','conduct','lake'], cryolake:['cold','lake','ice'],
  'littoral-forest':['shallow','forest','lake'], terraforming:['regrow','reclaim','power'],
  'reach-100':['permit','access','reach','colonization'] })[policy] ?? []; }
function deterministicChoice(legal, observation) {
  const ordered=legal.slice().sort((a,b)=>a.id.localeCompare(b.id));
  const visible=`${observation.worldOrdinal}:${observation.environmentLevel}:${observation.echoBalance}:${observation.bestScore}:${ordered.map((cell)=>`${cell.id}@${cell.currentLevel}`).join('|')}`;
  return ordered[hashStringU32(visible)%ordered.length];
}
function costThenId(a,b){return compareProgressionIntegers(a.nextCost,b.nextCost)||a.id.localeCompare(b.id)}
function kindPriority(kind){return({capstone:8,keystone:6,capability:5,unlock:5,conditional:3,major:2,root:2,resonance:1})[kind]??0}
function rationale(cell,policy){const unlock=cell.gameplay.unlocks.length?` and unlocks ${cell.gameplay.unlocks.join(', ')}`:'';
 return `${cell.owned?'Upgraded':'Unlocked'} ${cell.name} to Level ${cell.nextLevel} because its ${cell.affinity} effect supports ${policy}${unlock}; cost ${cell.nextCost} Echoes.`}
