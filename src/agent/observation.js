/** Fair player-visible projection. Hidden simulation and future-seed state never enter it. */
import { SCORE_MODEL_VERSION } from '../game/scoring.js';
import { TROPHIES } from '../game/trophies/index.js';
import { compileMemory, getMemoryAdjacentIds, groupAccessibleMemory,
  memoryPurchasePreview } from '../game/skills/index.js';
import { AGENT_GOALS } from './schema.js';

export const OBSERVATION_SCHEMA = 1;
export const OBSERVATION_KEYS = Object.freeze([
  'schema', 'worldOrdinal', 'echoBalance', 'scoreModelVersion', 'bestScore',
  'worldPotential', 'evolutionPower', 'ownedSkills', 'availableSkills',
  'activeBuilds', 'nearBuilds', 'habitatCapabilities', 'lastResult',
  'trophySummary', 'goals',
]);
export const PUBLIC_SKILL_KEYS = Object.freeze([
  'id', 'name', 'affinity', 'tags', 'kind', 'tier', 'cost', 'owned',
  'reachable', 'affordable', 'gameplay', 'evolutionPower', 'worldPotential',
  'buildProgress', 'neighbors',
]);
const POWER = Object.freeze({ root: 1, resonance: 1, major: 2, conditional: 2,
  unlock: 3, capability: 3, keystone: 5, capstone: 8 });
const BRANCH_PUBLIC = Object.freeze({ Reach: ['Marine', ['marine', 'frontier']],
  Flow: ['Freshwater', ['freshwater', 'transport']], Reserve: ['Scarcity', ['scarcity', 'storage']],
  Ecology: ['Fertility', ['rich-terrain', 'resilience']], Perception: ['Cryogenic', ['cryogenic', 'sensing']],
  Continuity: ['Luminous', ['luminous', 'continuity']] });

export function buildAgentObservation(state) {
  const compiled = compileMemory(state.meta); const groups = groupAccessibleMemory(state.meta);
  const all = groups.flatMap((group) => group.nodes); const owned = all.filter((node) => node.owned);
  const reachable = all.filter((node) => node.reachable);
  const ownedEntries = Object.freeze(owned.map((node) => publicSkill(state.meta, node, compiled)));
  const availableEntries = Object.freeze(reachable.map((node) => publicSkill(state.meta, node, compiled)));
  const builds = publicBuilds(compiled);
  return Object.freeze({ schema: OBSERVATION_SCHEMA, worldOrdinal: state.meta.runs + 1,
    echoBalance: state.meta.echoBalance, scoreModelVersion: state.meta.scoreModelVersion ?? SCORE_MODEL_VERSION,
    bestScore: state.meta.bestScore, worldPotential: compiled.worldPotential,
    evolutionPower: evolutionPower(compiled, owned), ownedSkills: ownedEntries,
    availableSkills: availableEntries, activeBuilds: builds.active, nearBuilds: builds.near,
    habitatCapabilities: Object.freeze([...(compiled.habitatCapabilities ?? [])]),
    lastResult: state.lastResult, trophySummary: trophySummary(state.meta),
    goals: Object.freeze({ selected: state.goal, available: AGENT_GOALS }),
  });
}

export function publicAffinity(node) {
  const fallback = BRANCH_PUBLIC[node.branch] ?? ['Fertility', []];
  return typeof node.affinity === 'string' && node.affinity ? node.affinity : fallback[0];
}
export function publicTags(node) {
  const fallback = BRANCH_PUBLIC[node.branch]?.[1] ?? [];
  const tags = Array.isArray(node.tags) ? node.tags : Array.isArray(node.secondaryTags) ? node.secondaryTags : fallback;
  return Object.freeze([...new Set(tags.filter((tag) => typeof tag === 'string'))].slice(0, 12));
}
export function skillPower(node) {
  return Number.isFinite(node.evolutionPower) && node.evolutionPower >= 0
    ? node.evolutionPower : (POWER[node.kind] ?? 1);
}

function publicSkill(meta, node, compiled) {
  const preview = memoryPurchasePreview(meta, node.id); const beforePower = evolutionPower(compiled,
    groupAccessibleMemory(meta).flatMap((group) => group.nodes).filter((entry) => entry.owned));
  return Object.freeze({ id: node.id, name: node.name ?? node.nameEn ?? node.id,
    affinity: publicAffinity(node), tags: publicTags(node), kind: node.kind, tier: node.tier,
    cost: node.cost, owned: node.owned, reachable: node.reachable, affordable: node.affordable,
    gameplay: Object.freeze({ before: preview?.changes?.map((change) => `${change.key}: ${format(change.before)}`).join('; ') || 'Current build',
      after: preview?.changes?.map((change) => `${change.key}: ${format(change.after)}`).join('; ')
        || node.effectEn || node.description || 'Permanent production effect',
      summary: node.effectEn ?? node.description ?? 'Permanent production effect',
      unlocks: Object.freeze((preview?.unlocked ?? []).map((entry) => entry.key)) }),
    evolutionPower: Object.freeze({ before: beforePower, after: beforePower + (node.owned ? 0 : skillPower(node)),
      delta: node.owned ? 0 : skillPower(node) }),
    worldPotential: Object.freeze({ before: preview?.potentialBefore ?? compiled.worldPotential,
      after: preview?.potentialAfter ?? compiled.worldPotential,
      delta: preview?.potentialDelta ?? preview?.potentialGain ?? 0 }),
    buildProgress: Object.freeze((preview?.buildProgress ?? []).map(publicBuild).slice(0, 12)),
    neighbors: Object.freeze([...getMemoryAdjacentIds(node.id)]),
  });
}
function evolutionPower(compiled, owned) {
  if (Number.isFinite(compiled.evolutionPower)) return compiled.evolutionPower;
  return owned.reduce((sum, node) => sum + skillPower(node), 0);
}
function publicBuilds(compiled) {
  const source = Array.isArray(compiled.builds) ? compiled.builds : [];
  const activeSource = Array.isArray(compiled.activeBuilds) ? compiled.activeBuilds : source.filter((build) => build.active);
  const nearSource = Array.isArray(compiled.nearBuilds) ? compiled.nearBuilds : source.filter((build) => !build.active && (build.progress ?? 0) > 0);
  return Object.freeze({ active: Object.freeze(activeSource.map(publicBuild).slice(0, 24)),
    near: Object.freeze(nearSource.map(publicBuild).slice(0, 24)) });
}
function publicBuild(build) { return Object.freeze({ id: build.id, name: build.name ?? build.nameEn ?? build.id,
  progress: Number.isFinite(build.after) ? build.after : Number.isFinite(build.progress) ? build.progress : build.active ? 1 : 0,
  active: Boolean(build.active), missing: Object.freeze((build.missing ?? []).map((item) => typeof item === 'string'
    ? item : Object.freeze({ type: item.type, id: item.id, remaining: item.remaining })).slice(0, 12)),
  effects: Object.freeze(Object.entries(build.mechanicalEffects ?? build.effect ?? {}).map(([key, value]) => Object.freeze({ key, value }))),
  tradeoffs: Object.freeze([...(build.tradeoffs ?? [])]), habitats: Object.freeze([...(build.habitats ?? [])]) }); }
function trophySummary(meta) {
  const owned = new Set(meta.trophyIds ?? []); return Object.freeze({ earned: owned.size,
    total: TROPHIES.length, queued: Object.freeze([...(meta.trophyQueue ?? [])]),
    ids: Object.freeze(TROPHIES.filter((trophy) => owned.has(trophy.id)).map((trophy) => trophy.id)) });
}
function format(value) { return Number.isFinite(value) ? `${Math.round(value * 1000) / 1000}` : 'unchanged'; }
