/**
 * Event family content. Eight families: six damaging crises, one neutral
 * hazard (ash), one positive (bloom). Each has Japanese copy, a mechanical
 * kind consumed by environment.js, and weighting for the schedule.
 */
export const EVENT_FAMILIES = Object.freeze([
  Object.freeze({
    id: 'drought', nameJa: '干ばつ前線', kind: 'moisture', amount: 0.30,
    crisis: true, weight: 1.0,
    descJa: '広域の水分が急速に失われる。',
  }),
  Object.freeze({
    id: 'heat', nameJa: '熱波', kind: 'heat', amount: 0.32,
    crisis: true, weight: 1.0,
    descJa: '表層温度が跳ね上がり、代謝が焼ける。',
  }),
  Object.freeze({
    id: 'freeze', nameJa: '深部凍結', kind: 'cold', amount: 0.34,
    crisis: true, weight: 1.0,
    descJa: '寒冷前線が通過し、輸送が凍りつく。',
  }),
  Object.freeze({
    id: 'toxic-rain', nameJa: '毒性の雨', kind: 'toxin', amount: 0.24,
    crisis: true, weight: 1.0,
    descJa: '毒素が沈着し、適合性を蝕む。',
  }),
  Object.freeze({
    id: 'solar-flare', nameJa: '太陽フレア', kind: 'stress', amount: 0.18,
    crisis: true, weight: 0.8,
    descJa: '放射が露出した枝にストレスを刻む。',
  }),
  Object.freeze({
    id: 'ash', nameJa: '火山灰帯', kind: 'ash', amount: 0.22,
    crisis: true, weight: 0.8,
    descJa: '灰が栄養源を覆い、光を冷ます。',
  }),
  Object.freeze({
    id: 'bloom', nameJa: '栄養開花', kind: 'bloom', amount: 0.34,
    crisis: false, weight: 0.55,
    descJa: '一時的な栄養の湧昇。掴めるかは網次第。',
  }),
  Object.freeze({
    id: 'blight', nameJa: '寄生性病枯れ', kind: 'blight', amount: 0.26,
    crisis: true, weight: 0.7,
    descJa: '寄生体が生体組織を直接分解する。',
  }),
]);

/** @param {string} id @returns {object} family */
export function familyById(id) {
  const f = EVENT_FAMILIES.find((x) => x.id === id);
  if (!f) throw new Error(`unknown event family: ${id}`);
  return f;
}
