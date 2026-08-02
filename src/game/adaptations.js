/**
 * Adaptation cards. Data-driven content consumed by passive offers.
 *
 * Effect semantics match memory effects: multiplier traits multiply the
 * current value; additive traits/flags add. Every card carries a real
 * tradeoff and concise Japanese copy. Categories: reach, metabolism,
 * resilience, transport, symbiosis, memory.
 */
export const ADAPTATIONS = Object.freeze([
  card('long-filaments', '長糸状突起', ['reach'],
    '前線の到達が速くなる。', '維持コストが上がる。',
    { reach: 1.35, maintenance: 1.1 }, 1.0),
  card('frugal-cytoplasm', '倹約細胞質', ['metabolism'],
    '維持コストが大きく下がる。', '瞬間的な成長は鈍る。',
    { maintenance: 0.8, reach: 0.9 }, 1.0),
  card('anastomosis', '吻合再接続', ['transport'],
    '分断された枝が自動的に再接続する。', '輸送路の維持がわずかに重い。',
    { anastomosis: 1, maintenance: 1.04 }, 0.9),
  card('thermal-proteins', '耐熱タンパク', ['resilience'],
    '熱と冷気のストレスに強くなる。', '栄養吸収が落ちる。',
    { heatTol: 1.35, uptake: 0.92 }, 1.0),
  card('dormant-cysts', '休眠嚢', ['resilience'],
    '終末期、低ストレスの組織が長く耐える。', '平時の代謝がわずかに重い。',
    { dormantCysts: 1, maintenance: 1.05 }, 0.8),
  card('salt-vesicles', '塩類液胞', ['resilience'],
    '毒素と干ばつへの耐性が上がる。', '輸送速度が落ちる。',
    { toxinTol: 1.4, droughtTol: 1.25, conductance: 0.88 }, 1.0),
  card('exploratory-fans', '探索扇', ['reach'],
    '各節点が同時に複数の枝を伸ばせる。', '個々の枝は細い。',
    { growthCap: 1, conductance: 0.92 }, 0.9),
  card('pulsed-transport', '拍動輸送', ['transport'],
    '周期的な高流量で輸送路が早く太る。', '拍動の谷では流量が落ちる。',
    { pulsedTransport: 1 }, 0.85),
  card('cannibal-reclamation', '共食い回収', ['symbiosis'],
    '死んだ組織からエネルギーを回収する。', 'ストレス回復がわずかに遅い。',
    { cannibal: 1, stressResist: 0.95 }, 0.85),
  card('symbiotic-film', '共生膜', ['symbiosis'],
    '占有地域の栄養更新が改善される。', '拡散速度がわずかに落ちる。',
    { symbioticFilm: 1, reach: 0.95 }, 0.85),
  card('adaptive-membrane', '適応膜', ['resilience'],
    'ストレス曝露の記憶が耐性を育てる。', '初期の耐性は標準。',
    { adaptiveMembrane: 1 }, 0.8),
  card('hollow-veins', '空洞静脈', ['transport'],
    '新しい輸送路のコストが下がる。', '最大容量が下がる。',
    { growCost: 0.8, conductance: 0.85 }, 0.9),
  card('dense-cords', '高密度索', ['transport'],
    '輸送容量と強化速度が大きく上がる。', '展開が遅くなる。',
    { conductance: 1.4, reinforce: 1.2, reach: 0.85 }, 0.95),
  card('migratory-core', '移動核', ['reach', 'resilience'],
    '死んだ豊かな地域へ再成長しやすくなる。', '維持が重い。',
    { migratoryCore: 1, maintenance: 1.08 }, 0.7),
  card('spore-memory', '胞子記憶', ['memory'],
    'スコアに小さな記憶ボーナスが加算される。', '直接的な生存能力は変わらない。',
    { sporeMemory: 1, scoreRate: 1.03 }, 0.6),
  card('distributed-sensing', '分散感覚', ['memory', 'reach'],
    '危機の予報が早く届く。', '吸収効率がわずかに落ちる。',
    { distributedSensing: 1, uptake: 0.96 }, 0.75),
  card('local-sacrifice', '局所犠牲', ['resilience'],
    '致命的ストレスの前に弱い枝を自ら切り離す。', 'ネットワーク質量を失う。',
    { localSacrifice: 1 }, 0.8),
  card('redundant-loops', '冗長輪', ['transport'],
    '輸送路が減衰しにくく、分断に強い。', '強化の効率がわずかに落ちる。',
    { redundantLoops: 1, reinforce: 0.94 }, 0.85),
  card('opportunistic-uptake', '機会吸収', ['metabolism', 'symbiosis'],
    '一時的な栄養開花から多くを得る。', '平時の吸収は標準。',
    { opportunisticUptake: 1 }, 0.8),
  card('quiet-metabolism', '静寂代謝', ['metabolism'],
    '維持が軽く、長く生き延びやすい。', 'スコア倍率がわずかに下がる。',
    { maintenance: 0.85, scoreRate: 0.9 }, 0.75),
  card('fever-growth', '発熱成長', ['metabolism', 'reach'],
    '危機の開始時に前線へエネルギーが走る。', '平時の貯蔵がわずかに減る。',
    { feverGrowth: 1, energyCap: 0.94 }, 0.7),
  card('cold-reserve', '寒冷貯蔵', ['metabolism', 'resilience'],
    '繁栄期のエネルギー上限が上がる。', '終盤の上限は標準に戻る。',
    { coldReserve: 1 }, 0.7),
  card('toxin-catalysis', '毒素分解', ['symbiosis', 'metabolism'],
    '毒素圧の一部をエネルギーへ変換する。', '毒素耐性そのものは上がらない。',
    { toxinCatalysis: 1 }, 0.7),
  card('fractal-frontier', 'フラクタル前線', ['reach'],
    'より多くの先端で探索する。', '個々の枝は弱い。',
    { fractalFrontier: 1, reach: 1.15, conductance: 0.9 }, 0.85),
]);

function card(id, nameJa, cats, effectJa, costJa, effects, weight) {
  return Object.freeze({ id, nameJa, cats: Object.freeze(cats), effectJa, costJa, effects: Object.freeze(effects), weight });
}

const BY_ID = new Map(ADAPTATIONS.map((c) => [c.id, c]));

/** Trait keys that merge additively; all others merge multiplicatively. */
const ADDITIVE_TRAITS = new Set(['growthCap', 'anastomosis', 'dormantCysts',
  'cannibal', 'symbioticFilm', 'adaptiveMembrane', 'migratoryCore', 'pulsedTransport',
  'feverGrowth', 'coldReserve', 'toxinCatalysis', 'fractalFrontier', 'redundantLoops',
  'localSacrifice', 'distributedSensing', 'opportunisticUptake', 'sporeMemory']);

/**
 * Apply a card's effects to a live trait block (same merge semantics as
 * memory effects). Throws on unknown trait keys.
 * @param {object} traits mutable trait block
 * @param {string} cardId
 */
export function applyCardEffects(traits, cardId) {
  const card = cardById(cardId);
  for (const [key, value] of Object.entries(card.effects)) {
    if (!(key in traits)) throw new Error(`unknown trait: ${key}`);
    traits[key] = ADDITIVE_TRAITS.has(key) ? traits[key] + value : traits[key] * value;
  }
}

/** @param {string} id @returns {object} card */
export function cardById(id) {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`unknown adaptation: ${id}`);
  return c;
}

/**
 * Draw offer options: weighted, no repeats of owned cards, no immediate
 * repeat of the previous offer, crisis-aware boosting.
 * @param {import('../core/prng.js').Rng} rng content stream
 * @param {object} opts {owned: string[], lastOffered: string[], crisisCats: string[]}
 * @param {number} count
 * @returns {string[]} card ids
 */
export function drawAdaptationOptions(rng, opts, count = 3) {
  const excluded = new Set([...opts.owned, ...opts.lastOffered]);
  const pool = ADAPTATIONS.filter((c) => !excluded.has(c.id));
  const source = pool.length >= count ? pool : ADAPTATIONS.filter((c) => !opts.owned.includes(c.id));

  let total = 0;
  const weights = source.map((c) => {
    let w = c.weight;
    if (opts.crisisCats && c.cats.some((cat) => opts.crisisCats.includes(cat))) w *= 2;
    total += w;
    return w;
  });

  const picked = [];
  const used = new Set();
  while (picked.length < count && used.size < source.length) {
    let roll = rng.float() * total;
    for (let i = 0; i < source.length; i++) {
      if (used.has(i)) continue;
      roll -= weights[i];
      if (roll <= 0) {
        picked.push(source[i].id);
        used.add(i);
        total -= weights[i];
        break;
      }
    }
  }
  return picked;
}

/** Exact-uniform integer draw using rejection rather than modulo reduction. */
export function uniformIndex(rng, count) {
  if (!Number.isInteger(count) || count <= 0 || count > 0x100000000) {
    throw new Error(`invalid uniform count: ${count}`);
  }
  const limit = 0x100000000 - (0x100000000 % count);
  let value;
  do value = rng.nextU32(); while (value >= limit);
  return value % count;
}

/** Select one of an offer's fixed options exactly uniformly. */
export function selectRandomOption(rng, options) {
  if (!Array.isArray(options) || options.length !== 3) {
    throw new Error('adaptation offer requires exactly three options');
  }
  return options[uniformIndex(rng, options.length)];
}
