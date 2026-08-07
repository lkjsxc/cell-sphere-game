/** SCORE v5: exact merit × sustained dynamic Environment exposure. */
import { BALANCE as B } from './balance.js';
import { clamp01 } from '../core/math.js';
import {
  addProgressionIntegers,
  compareProgressionIntegers,
  divideProgressionIntegers,
  formatProgressionEngineering,
  incrementProgressionInteger,
  maxProgressionInteger,
  multiplyDivideProgressionInteger,
  multiplyProgressionIntegers,
  normalizeProgressionInteger,
  projectProgressionInteger,
  sqrtProgressionInteger,
} from '../core/progression-integer.js';

export const SCORE_MODEL_VERSION = 5;
export const SCORE_FORMULA_VERSION = 5;
const QUALITY_SCALE = '1000000000';
const MULTIPLIER_SCALE = '1000000';
const COMBINED_SCALE = '1000000000000000';
// Dynamic pressure is meaningful but cannot overturn established breadth SCORE anchors.
const ENVIRONMENT_BONUS_LIMIT = 0.005;
const W = B.SCORE_WEIGHTS;
const TARGET = Object.freeze({ survival: 300, exploration: 800, presence: 44,
  coherence: 40, stewardship: 780, worldmaking: 220 });
const COMPONENT_CAP = Object.freeze({ survival: 1, exploration: .90, presence: .90,
  coherence: .90, stewardship: .90, worldmaking: .88 });

export const COMPONENTS = Object.freeze([
  Object.freeze({ key: 'survival', en: 'Survival', ja: '生存' }),
  Object.freeze({ key: 'exploration', en: 'Exploration', ja: '探索' }),
  Object.freeze({ key: 'presence', en: 'Presence', ja: '生存圏' }),
  Object.freeze({ key: 'coherence', en: 'Coherence', ja: '結合' }),
  Object.freeze({ key: 'stewardship', en: 'Stewardship', ja: '資源管理' }),
  Object.freeze({ key: 'worldmaking', en: 'Worldmaking', ja: '世界形成' }),
]);

export const RANKS = Object.freeze([
  Object.freeze({ min: '0', en: 'Seed', ja: '種' }),
  Object.freeze({ min: '10000', en: 'Rooted', ja: '根付き' }),
  Object.freeze({ min: '25000', en: 'Explorer', ja: '探索者' }),
  Object.freeze({ min: '50000', en: 'Cartographer', ja: '地図師' }),
  Object.freeze({ min: '100000', en: 'Worldweaver', ja: '世界織り' }),
  Object.freeze({ min: '250000', en: 'Planetary', ja: '惑星級' }),
  Object.freeze({ min: '500000', en: 'Biosphere', ja: '生物圏' }),
  Object.freeze({ min: '750000', en: 'World Gardener', ja: '世界庭師' }),
  Object.freeze({ min: '1000000', en: 'Living World', ja: '生きた世界' }),
]);

export function rankFor(total) {
  const exact = normalizeProgressionInteger(total, '0'); let rank = RANKS[0];
  for (const candidate of RANKS) if (compareProgressionIntegers(exact, candidate.min) >= 0) rank = candidate;
  if (compareProgressionIntegers(exact, RANKS.at(-1).min) < 0) return rank;
  const cycle = divideProgressionIntegers(exact, RANKS.at(-1).min);
  const cycleLabel = cycle.length <= 12 ? cycle : formatProgressionEngineering(cycle, 5);
  return Object.freeze({ min: multiplyProgressionIntegers(cycle, RANKS.at(-1).min),
    en: cycle === '1' ? 'Living World' : `Living World · Cycle ${cycleLabel}`,
    ja: cycle === '1' ? '生きた世界' : `生きた世界 · 周期 ${cycleLabel}`, cycle });
}

export function createScoreMerit() {
  return { modelVersion: SCORE_MODEL_VERSION,
    raw: { survival: 0, exploration: 0, presence: 0, coherence: 0, stewardship: 0, worldmaking: 0 },
    normalized: { survival: 0, exploration: 0, presence: 0, coherence: 0, stewardship: 0, worldmaking: 0 },
    total: '0', quality: 0, environmentBonusQ: 0, lastUpdateTick: 0 };
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
  const current = evaluate(metricsFromState(state));
  const currentBonusQ = Math.max(0, Math.min(Number(MULTIPLIER_SCALE) - 1,
    Math.round(current.environmentCredit.bonus * Number(MULTIPLIER_SCALE))));
  state.scoreMerit.environmentBonusQ = Math.max(state.scoreMerit.environmentBonusQ ?? 0, currentBonusQ);
  const projection = evaluate(metricsFromState(state), { environmentBonusQ: state.scoreMerit.environmentBonusQ });
  state.scoreMerit.normalized = Object.fromEntries(projection.breakdown.map((part) => [part.key, part.q]));
  state.scoreMerit.quality = projection.quality;
  state.scoreMerit.total = maxProgressionInteger(state.scoreMerit.total, projection.total);
  state.scoreMerit.lastUpdateTick = state.tick;
  return { ...projection, total: state.scoreMerit.total, echoes: echoesFor(state.scoreMerit.total), rank: rankFor(state.scoreMerit.total) };
}

export function componentValues(metrics) {
  const raw = metrics.scoreMerit?.raw ?? metrics.raw ?? legacyRaw(metrics);
  const maturity = clamp01((raw.survival ?? 0) / 180);
  return Object.freeze(Object.fromEntries(COMPONENTS.map(({ key }) => {
    let value = Math.min(COMPONENT_CAP[key], clamp01((raw[key] ?? 0) / TARGET[key]));
    if (key === 'exploration' || key === 'stewardship') value = Math.min(value, maturity);
    return [key, value];
  })));
}

export function metricsFromState(state) { return { scoreMerit: state.scoreMerit, worldPotential: state.worldPotential,
  environmentExposure: state.environmentExposure, peakEnvironmentLevel: state.peakEnvironmentLevel,
  environmentPressureSummary: state.currentEnvironmentProfile?.score,
  survivalTicks: state.tick }; }
export function metricsFromResult(result) { return { scoreMerit: result.scoreMerit, raw: result.scoreMerit?.raw,
  worldPotential: result.worldPotential, environmentExposure: result.environmentExposure,
  peakEnvironmentLevel: result.peakEnvironmentLevel ?? result.finalEnvironmentLevel,
  environmentPressureSummary: result.environmentPressureSummary,
  survivalTicks:Number.isFinite(result.scoreMerit?.lastUpdateTick)?Math.max(0,result.scoreMerit.lastUpdateTick)
    :Math.max(0,Math.round((result.survivalSeconds??0)*B.TICKS_PER_SECOND)),
  survivalSeconds: result.survivalSeconds, uniqueColonized: sum(result.habitatOccupancy ?? []),
  sustainedCoverage: result.sustainedCoverage, peakConnectedShare: result.peakConnectedShare,
  totalUptake: result.totalUptake, worldmaking: result.worldmakingMerit ?? 0 }; }

export function evaluate(metrics, options = {}) {
  const values = componentValues(metrics); const potential = normalizeProgressionInteger(metrics.worldPotential, '0');
  let quality = 0;
  for (const component of COMPONENTS) quality += W[component.key] * values[component.key];
  quality = clamp01(quality);
  const environmentCredit = environmentCreditFor(metrics, quality, options.environmentBonusQ);
  // Preserve the established early SCORE anchors without perturbing the
  // breadth-complete 1,200,000 Potential calibration. This is fixed by
  // permanent starting Potential, not live difficulty or result timing.
  const earlyCalibration = earlyScoreCalibration(potential);
  const multiplier = (1 + environmentCredit.bonus) * earlyCalibration;
  const multiplierQ = String(Math.max(1, Math.round(multiplier * Number(MULTIPLIER_SCALE))));
  const qualityQ = String(Math.max(0, Math.floor(quality * Number(QUALITY_SCALE))));
  const breakdown = COMPONENTS.map((component) => {
    const weight = W[component.key]; const q = values[component.key];
    const componentQ = String(Math.max(0, Math.floor(weight * q * Number(QUALITY_SCALE))));
    const points = multiplyDivideProgressionInteger(
      potential, multiplyProgressionIntegers(componentQ, multiplierQ), COMBINED_SCALE);
    return Object.freeze({ ...component, q, weight, points });
  });
  const total = multiplyDivideProgressionInteger(
    potential, multiplyProgressionIntegers(qualityQ, multiplierQ), COMBINED_SCALE);
  const rank = rankFor(total);
  return Object.freeze({ modelVersion: SCORE_MODEL_VERSION, formulaVersion: SCORE_FORMULA_VERSION,
    total, quality, worldPotential: potential, mult: multiplier, earlyCalibration, environmentCredit,
    rank, nextRank: nextRankFor(total, rank), echoes: echoesFor(total), breakdown: Object.freeze(breakdown) });
}

export function liveScore(state) { return state.scoreMerit?.total ?? evaluate(metricsFromState(state)).total; }
export function scoreResult(result){return evaluate(metricsFromResult(result), { environmentBonusQ: result.scoreMerit?.environmentBonusQ })}
export function scoreResultMatchesAuthority(result){const authoritative=scoreResult(result);
 const supplied=result.scoreProjection?.modelVersion===SCORE_MODEL_VERSION?result.scoreProjection.total
   :result.scoreModelVersion===SCORE_MODEL_VERSION?result.score:null;
 return supplied===null||supplied===undefined||normalizeProgressionInteger(supplied,'0')===authoritative.total;
}

/** Exact v4 continuation of the retained early reward curve. */
export function echoesFor(total) {
  const quotient = divideProgressionIntegers(normalizeProgressionInteger(total, '0'), String(B.ECHO_DIVISOR));
  return addProgressionIntegers(String(B.ECHO_BASE), sqrtProgressionInteger(quotient));
}

function earlyScoreCalibration(potential) {
  const projected = projectProgressionInteger(potential, 100_000);
  const remaining = Math.max(0, Math.min(84_000, 100_000 - projected));
  return 1 + 0.16 * remaining / 84_000;
}

function environmentCreditFor(metrics, quality, bonusOverrideQ = null) {
  const exposure = metrics.environmentExposure && typeof metrics.environmentExposure === 'object'
    ? metrics.environmentExposure : null;
  if (!exposure) return Object.freeze({ pressure: 0, exposure: 0, performance: 0, peakDwell: 0, bonus: 0 });
  const totalTicks = normalizeProgressionInteger(exposure.totalTicks, '0');
  const pressureTicksQ = normalizeProgressionInteger(exposure.pressureTicksQ, '0');
  const qualityPressureTicksQ = normalizeProgressionInteger(exposure.qualityPressureTicksQ, '0');
  const timeAtPeakTicks = normalizeProgressionInteger(exposure.timeAtPeakTicks, '0');
  if (totalTicks === '0' || pressureTicksQ === '0') {
    return Object.freeze({ pressure: 0, exposure: 0, performance: 0, peakDwell: 0, bonus: 0 });
  }
  // Exact division occurs at summary/result boundaries, never inside cell/edge loops.
  const pressureQ = projectProgressionInteger(divideProgressionIntegers(pressureTicksQ, totalTicks), 1_000_000);
  const qualityQ = projectProgressionInteger(multiplyDivideProgressionInteger(
    qualityPressureTicksQ, '1000000', pressureTicksQ,
  ), 1_000_000);
  const pressure = clamp01(pressureQ / 1_000_000);
  const qualityUnderPressure = clamp01(qualityQ / 1_000_000);
  const pressureTimeTicks = projectProgressionInteger(divideProgressionIntegers(pressureTicksQ, '1000000'), 100_000);
  const sustained = clamp01((pressureTimeTicks - 300) / 2100);
  const peakTicks = projectProgressionInteger(timeAtPeakTicks, 2400);
  const peakDwell = clamp01(peakTicks / 600);
  const performance = clamp01(quality) * qualityUnderPressure;
  // Peak only modulates sustained ecological pressure evidence. A threshold
  // touch has zero sustained exposure and cannot farm the bonus.
  const evidence = sustained * (0.75 + 0.25 * peakDwell);
  const currentBonus = Math.min(ENVIRONMENT_BONUS_LIMIT,
    ENVIRONMENT_BONUS_LIMIT * pressure * evidence * performance);
  const override = Number.isInteger(bonusOverrideQ) && bonusOverrideQ >= 0
    ? Math.min(ENVIRONMENT_BONUS_LIMIT, bonusOverrideQ / Number(MULTIPLIER_SCALE)) : null;
  const bonus = override === null ? currentBonus : Math.max(currentBonus, override);
  return Object.freeze({ pressure, exposure: sustained, performance, peakDwell, currentBonus, bonus });
}
function nextRankFor(total, rank) {
  const namedIndex = RANKS.indexOf(rank);
  if (namedIndex >= 0 && namedIndex < RANKS.length - 1) return RANKS[namedIndex + 1];
  const cycle = rank.cycle ?? divideProgressionIntegers(normalizeProgressionInteger(total, '0'), '1000000');
  const nextCycle = incrementProgressionInteger(cycle);
  return Object.freeze({ min: multiplyProgressionIntegers(nextCycle, '1000000'),
    en: `Living World · Cycle ${nextCycle}`, ja: `生きた世界 · 周期 ${nextCycle}`, cycle: nextCycle });
}
function legacyRaw(metrics) {
  const seconds = Math.max(0, metrics.survivalSeconds ?? 0);
  return { survival: seconds, exploration: metrics.uniqueColonized ?? 0,
    presence: Math.max(0, metrics.sustainedCoverage ?? 0) * seconds,
    coherence: Math.max(0, metrics.sustainedCoverage ?? 0) * seconds * clamp01(metrics.peakConnectedShare ?? 0),
    stewardship: Math.max(0, metrics.totalUptake ?? 0), worldmaking: Math.max(0, metrics.worldmaking ?? 0) };
}
function count(values) { let result = 0; if (values) for (const value of values) if (value) result++; return result; }
function sum(values) { let total = 0; for (const value of values) total += value; return total; }
