/**
 * Network Score: one boastable integer plus a transparent breakdown.
 *
 * The score is a pure function of authoritative run metrics, so it is
 * identical at every speed and on every device. Rendering quality, frame
 * rate, language, and accessibility settings never enter it.
 *
 * Model: six normalized components (0..1) weighted by BALANCE.SCORE_WEIGHTS,
 * summed into a quality factor, scaled, then adjusted by the run's explicit
 * score-rate trait (e.g. Quiet Metabolism) and challenge multiplier. This is
 * the versioned "6-axis transparent" model; a reconciliation to the 5-axis
 * display names (Reach/Flow/Efficiency/Resolve/Form) from the mission spec is
 * deferred to the documented numeric rebaseline; this six-axis display is not
 * a final balance claim.
 */
import { BALANCE as B } from './balance.js';
import { smootherstep, clamp01 } from '../core/math.js';

const W = B.SCORE_WEIGHTS;

/** Component metadata: weight key -> display labels + the metric it reads. */
export const COMPONENTS = Object.freeze([
  Object.freeze({ key: 'survival',          en: 'Survival',   ja: '生存' }),
  Object.freeze({ key: 'peakCoverage',      en: 'Reach',      ja: '到達' }),
  Object.freeze({ key: 'sustainedCoverage', en: 'Spread',     ja: '展開' }),
  Object.freeze({ key: 'connectivity',      en: 'Unity',      ja: '結合' }),
  Object.freeze({ key: 'efficiency',        en: 'Efficiency', ja: '効率' }),
  Object.freeze({ key: 'crisis',            en: 'Resolve',    ja: '耐性' }),
]);

/** Rank ladder (thresholds tuned from early distributions; revisit later). */
export const RANKS = Object.freeze([
  Object.freeze({ min: 0,      en: 'Seedling',         ja: '芽生え' }),
  Object.freeze({ min: 40000,  en: 'Pathfinder',       ja: '探索者' }),
  Object.freeze({ min: 90000,  en: 'Conductor',        ja: '導き手' }),
  Object.freeze({ min: 180000, en: 'Worldweaver',      ja: '世界織り' }),
  Object.freeze({ min: 320000, en: 'Lasting Web',      ja: '永き網' }),
  Object.freeze({ min: 520000, en: 'Planetary Memory', ja: '惑星記憶' }),
]);

/** @param {number} total @returns {{en:string,ja:string}} */
export function rankFor(total) {
  let r = RANKS[0];
  for (const x of RANKS) if (total >= x.min) r = x;
  return r;
}

/**
 * Normalized component values (each 0..1) from raw metrics. Shared by the
 * live HUD projection and the terminal result so the number only ever climbs
 * coherently during a run.
 * @param {object} m raw metrics (see metricsFromState / metricsFromResult)
 */
export function componentValues(m) {
  const efficiency = m.totalUptake > 0
    ? clamp01(m.totalUptake / (m.totalUptake + m.totalMaintenance * 1.5))
    : 0;
  return {
    survival: smootherstep(clamp01(m.survivalSeconds / (B.RUN_TARGET_TICKS / B.TICKS_PER_SECOND))),
    peakCoverage: Math.sqrt(clamp01(m.peakCoverage)),
    sustainedCoverage: Math.sqrt(clamp01(m.sustainedCoverage)),
    connectivity: clamp01(m.peakConnectedShare),
    efficiency,
    crisis: clamp01(m.crisisQ),
  };
}

/** @param {object} state live run state @returns {object} raw metrics */
export function metricsFromState(s) {
  const sustained = s.sustainedSamples ? s.sustainedSum / s.sustainedSamples : 0;
  let started = 0;
  for (const ev of s.events) if (ev.announced & 2) started++;
  return {
    survivalSeconds: s.tick / B.TICKS_PER_SECOND,
    peakCoverage: s.peakCoverage,
    sustainedCoverage: sustained,
    peakConnectedShare: s.peakConnectedShare,
    totalUptake: s.totalUptake,
    totalMaintenance: s.totalMaintenance,
    crisisQ: started > 0 ? s.crisesEndured / started : 0,
    scoreRate: s.traits.scoreRate,
    challengeMult: s.challenge?.scoreMult ?? 1,
  };
}

/** @param {object} r terminal result @returns {object} raw metrics */
export function metricsFromResult(r) {
  return {
    survivalSeconds: r.survivalSeconds,
    peakCoverage: r.peakCoverage,
    sustainedCoverage: r.sustainedCoverage,
    peakConnectedShare: r.peakConnectedShare,
    totalUptake: r.totalUptake,
    totalMaintenance: r.totalMaintenance,
    crisisQ: r.crisesTotal > 0 ? r.crisesEndured / r.crisesTotal : 0,
    scoreRate: r.scoreRate ?? 1,
    challengeMult: r.challengeMult ?? 1,
  };
}

/**
 * Full score evaluation.
 * @param {object} metrics raw metrics from metricsFromState/Result
 * @returns {{total:number, quality:number, rate:number, mult:number,
 *   rank:{en:string,ja:string}, echoes:number,
 *   breakdown:Array<{key:string,en:string,ja:string,q:number,points:number}>}}
 */
export function evaluate(metrics) {
  const q = componentValues(metrics);
  const rate = metrics.scoreRate ?? 1;
  const mult = metrics.challengeMult ?? 1;
  let quality = 0;
  const breakdown = COMPONENTS.map((c) => {
    const w = W[c.key];
    const qv = q[c.key];
    quality += w * qv;
    return { key: c.key, en: c.en, ja: c.ja, q: qv, points: Math.round(w * qv * B.SCORE_SCALE) };
  });
  const total = Math.max(0, Math.round(B.SCORE_SCALE * quality * rate * mult));
  return {
    total,
    quality,
    rate,
    mult,
    rank: rankFor(total),
    echoes: echoesFor(total),
    breakdown,
  };
}

/** Integer live score for the HUD (no breakdown). @param {object} state */
export function liveScore(state) {
  return evaluate(metricsFromState(state)).total;
}

/** Score + breakdown for the result screen. @param {object} result */
export function scoreResult(result) {
  return evaluate(metricsFromResult(result));
}

/** Diminishing Echo income from a final score. @param {number} total */
export function echoesFor(total) {
  return B.ECHO_BASE + Math.floor(Math.sqrt(Math.max(0, total) / B.ECHO_DIVISOR));
}
