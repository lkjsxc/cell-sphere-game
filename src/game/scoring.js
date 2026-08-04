/** SCORE v3: monotone cumulative authoritative merit × fixed World Potential. */
import { BALANCE as B } from './balance.js';
import { clamp01 } from '../core/math.js';

export const SCORE_MODEL_VERSION = 3;
const W = B.SCORE_WEIGHTS;
const TARGET = Object.freeze({ survival: 300, exploration: 800, presence: 44,
  coherence: 40, stewardship: 780, worldmaking: 220 });

export const COMPONENTS = Object.freeze([
  Object.freeze({ key: 'survival', en: 'Survival', ja: '生存' }),
  Object.freeze({ key: 'exploration', en: 'Exploration', ja: '探索' }),
  Object.freeze({ key: 'presence', en: 'Presence', ja: '生存圏' }),
  Object.freeze({ key: 'coherence', en: 'Coherence', ja: '結合' }),
  Object.freeze({ key: 'stewardship', en: 'Stewardship', ja: '資源管理' }),
  Object.freeze({ key: 'worldmaking', en: 'Worldmaking', ja: '世界形成' }),
]);

export const RANKS = Object.freeze([
  Object.freeze({ min: 0, en: 'Seed', ja: '種' }),
  Object.freeze({ min: 10000, en: 'Rooted', ja: '根付き' }),
  Object.freeze({ min: 25000, en: 'Explorer', ja: '探索者' }),
  Object.freeze({ min: 50000, en: 'Cartographer', ja: '地図師' }),
  Object.freeze({ min: 100000, en: 'Worldweaver', ja: '世界織り' }),
  Object.freeze({ min: 250000, en: 'Planetary', ja: '惑星級' }),
  Object.freeze({ min: 500000, en: 'Biosphere', ja: '生物圏' }),
  Object.freeze({ min: 750000, en: 'World Gardener', ja: '世界庭師' }),
  Object.freeze({ min: 1000000, en: 'Living World', ja: '生きた世界' }),
]);

export function rankFor(total) { let rank = RANKS[0]; for (const candidate of RANKS) if (total >= candidate.min) rank = candidate; return rank; }

export function createScoreMerit() {
  return { modelVersion: SCORE_MODEL_VERSION,
    raw: { survival: 0, exploration: 0, presence: 0, coherence: 0, stewardship: 0, worldmaking: 0 },
    normalized: { survival: 0, exploration: 0, presence: 0, coherence: 0, stewardship: 0, worldmaking: 0 },
    total: 0, quality: 0, lastUpdateTick: 0 };
}

/** Called once per authoritative summary second. All source counters are monotone. */
export function recordScoreSummary(state) {
  const merit = state.scoreMerit;
  merit.raw.survival = Math.max(merit.raw.survival, state.tick / B.TICKS_PER_SECOND);
  merit.raw.presence += state.aliveCount / state.topo.nodeCount;
  merit.raw.coherence += Math.max(0, state.largestComponent) / state.topo.nodeCount;
  merit.raw.stewardship = Math.max(merit.raw.stewardship,
    state.totalUptake + state.resourceReclaimed * 1.5 + state.resourceRecoveredCells * 2);
  merit.raw.worldmaking = Math.max(merit.raw.worldmaking,
    state.resourceRecoveredCells * 8 + state.transformedCells * 12 + count(state.everPowered) * 2
      + state.glacialLakeCells * 10 + state.maritimeForestCells * 12 + (state.reach100Achieved ? 120 : 0));
  return refreshScoreMerit(state);
}

/** Birth authority records unique, difficulty-weighted exploration directly. */
export function recordScoreExploration(state, cell, weight = 1) {
  if (!state.everColonized || state.everColonized[cell]) return false;
  state.everColonized[cell] = 1; state.scoreMerit.raw.exploration += Math.max(.25, weight); return true;
}

export function refreshScoreMerit(state) {
  const projection = evaluate({ scoreMerit: state.scoreMerit, worldPotential: state.worldPotential,
    challengeMult: state.challenge?.scoreMult ?? 1 });
  state.scoreMerit.normalized = Object.fromEntries(projection.breakdown.map((part) => [part.key, part.q]));
  state.scoreMerit.quality = projection.quality;
  state.scoreMerit.total = Math.max(state.scoreMerit.total, projection.total);
  state.scoreMerit.lastUpdateTick = state.tick;
  return { ...projection, total: state.scoreMerit.total, echoes: echoesFor(state.scoreMerit.total), rank: rankFor(state.scoreMerit.total) };
}

export function componentValues(metrics) {
  const raw = metrics.scoreMerit?.raw ?? metrics.raw ?? legacyRaw(metrics);
  const maturity = clamp01((raw.survival ?? 0) / 180);
  return Object.freeze(Object.fromEntries(COMPONENTS.map(({ key }) => {
    let value = clamp01((raw[key] ?? 0) / TARGET[key]);
    if (key === 'exploration' || key === 'stewardship') value = Math.min(value, maturity);
    return [key, value];
  })));
}

export function metricsFromState(state) { return { scoreMerit: state.scoreMerit, worldPotential: state.worldPotential,
  challengeMult: state.challenge?.scoreMult ?? 1 }; }
export function metricsFromResult(result) { return { scoreMerit: result.scoreMerit, raw: result.scoreMerit?.raw,
  worldPotential: result.worldPotential, challengeMult: result.challengeMult ?? 1,
  survivalSeconds: result.survivalSeconds, uniqueColonized: sum(result.habitatOccupancy ?? []),
  sustainedCoverage: result.sustainedCoverage, peakConnectedShare: result.peakConnectedShare,
  totalUptake: result.totalUptake, worldmaking: result.worldmakingMerit ?? 0 }; }

export function evaluate(metrics) {
  const values = componentValues(metrics);
  const potential = Number.isFinite(metrics.worldPotential) && metrics.worldPotential >= 0 ? Math.round(metrics.worldPotential) : 0;
  const mult = Number.isFinite(metrics.challengeMult) && metrics.challengeMult > 0 ? metrics.challengeMult : 1;
  let quality = 0;
  const breakdown = COMPONENTS.map((component) => {
    const weight = W[component.key]; const q = values[component.key]; quality += weight * q;
    return Object.freeze({ ...component, q, weight, points: Math.floor(potential * mult * weight * q) });
  });
  const total = Math.max(0, Math.floor(potential * quality * mult));
  const rank = rankFor(total); const rankIndex = RANKS.indexOf(rank);
  return Object.freeze({ modelVersion: SCORE_MODEL_VERSION, total, quality, worldPotential: potential,
    mult, rank, nextRank: RANKS[rankIndex + 1] ?? null, echoes: echoesFor(total), breakdown: Object.freeze(breakdown) });
}

export function liveScore(state) { return state.scoreMerit?.total ?? evaluate(metricsFromState(state)).total; }
export function scoreResult(result) {
  if (result.scoreProjection?.modelVersion === SCORE_MODEL_VERSION) return freezeProjection(result.scoreProjection);
  const projection = evaluate(metricsFromResult(result));
  if (Number.isFinite(result.score) && result.scoreModelVersion === SCORE_MODEL_VERSION) {
    return Object.freeze({ ...projection, total: Math.max(0, Math.floor(result.score)),
      rank: rankFor(result.score), echoes: echoesFor(result.score) });
  }
  return projection;
}

/** 10k≈19, 25k≈25, 50k≈33, 100k≈43, 500k≈87, 1m≈119. */
export function echoesFor(total) { return B.ECHO_BASE + Math.floor(Math.sqrt(Math.max(0, total) / B.ECHO_DIVISOR)); }

function legacyRaw(metrics) {
  const seconds = Math.max(0, metrics.survivalSeconds ?? 0);
  return { survival: seconds, exploration: metrics.uniqueColonized ?? 0,
    presence: Math.max(0, metrics.sustainedCoverage ?? 0) * seconds,
    coherence: Math.max(0, metrics.sustainedCoverage ?? 0) * seconds * clamp01(metrics.peakConnectedShare ?? 0),
    stewardship: Math.max(0, metrics.totalUptake ?? 0), worldmaking: Math.max(0, metrics.worldmaking ?? 0) };
}
function freezeProjection(value) { const total = Math.max(0, Math.floor(value.total ?? 0)); const rank = rankFor(total);
  return Object.freeze({ ...value, modelVersion: SCORE_MODEL_VERSION, total, rank,
    nextRank: RANKS[RANKS.indexOf(rank) + 1] ?? null, echoes: echoesFor(total),
    breakdown: Object.freeze((value.breakdown ?? []).map((part) => Object.freeze({ ...part }))) }); }
function count(values) { let result = 0; if (values) for (const value of values) if (value) result++; return result; }
function sum(values) { let total = 0; for (const value of values) total += value; return total; }
