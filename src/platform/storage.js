/**
 * Progress persistence: compact, versioned, validated. Stores only cross-run
 * progression (best score, earned Echoes, run count, onboarding flags).
 * Preferences (language, speed, motion) live in settings.js; this module is
 * game progress, not preferences.
 *
 * Corruption-safe: any unparseable or out-of-shape value falls back to safe
 * defaults field-by-field; a bad save never throws or white-screens.
 */

const KEY = 'incremental-network-game:meta:v1';

/** @returns {Meta} */
export function defaultMeta() {
  return {
    schema: 3,
    bestScore: 0,
    totalEchoes: 0,
    echoBalance: 0,
    runs: 0,
    signalHintShown: false,
    memoryNodes: [],
    imprints: [],
  };
}

/** @param {unknown} raw @returns {Meta} */
export function validateMeta(raw) {
  const base = defaultMeta();
  if (raw === null || typeof raw !== 'object') return base;
  const r = /** @type {Record<string, unknown>} */ (raw);
  const out = { ...base };
  if (Number.isFinite(r.bestScore) && r.bestScore >= 0) out.bestScore = Math.floor(r.bestScore);
  if (Number.isFinite(r.totalEchoes) && r.totalEchoes >= 0) out.totalEchoes = Math.floor(r.totalEchoes);
  if (Number.isFinite(r.echoBalance) && r.echoBalance >= 0) out.echoBalance = Math.floor(r.echoBalance);
  else if (r.schema === 1) out.echoBalance = out.totalEchoes;
  if (Number.isFinite(r.runs) && r.runs >= 0) out.runs = Math.floor(r.runs);
  if (typeof r.signalHintShown === 'boolean') out.signalHintShown = r.signalHintShown;
  if (Array.isArray(r.memoryNodes)) out.memoryNodes = r.memoryNodes
    .filter((id, index, all) => typeof id === 'string' && /^[a-z-]{1,40}$/.test(id)
      && all.indexOf(id) === index).slice(0, 64);
  if (Array.isArray(r.imprints)) out.imprints = r.imprints
    .map(validateImprint).filter(Boolean).slice(-8);
  return out;
}

function validateImprint(raw) {
  if (!raw || typeof raw !== 'object' || raw.kind !== 'strongest-corridor') return null;
  if (!Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed >= 0x40000000) return null;
  if (!Array.isArray(raw.edges)) return null;
  const edges = raw.edges.filter((edge, index, all) => Number.isInteger(edge)
    && edge >= 0 && edge <= 0xffff && all.indexOf(edge) === index).slice(0, 28);
  return edges.length ? { kind: 'strongest-corridor', seed: raw.seed, edges } : null;
}

/** @returns {Meta} */
export function loadMeta() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return validateMeta(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultMeta();
  }
}

/** @param {Meta} meta */
export function saveMeta(meta) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(meta));
  } catch {
    // Storage may be unavailable (private mode); progress stays in-memory.
  }
}

/** @typedef {ReturnType<typeof defaultMeta>} Meta */
