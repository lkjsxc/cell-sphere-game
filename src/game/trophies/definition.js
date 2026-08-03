/** Compact authored Trophy schema; conditions are interpreted by evaluator.js. */
export const atLeast = (key, value) => Object.freeze({ rule: 'at-least', key, value });
export const includes = (key, mask) => Object.freeze({ rule: 'includes', key, mask });

/** Rows: slug, name, exact criterion, condition. */
export function defineTrophyFamily(family, rows) {
  if (rows.length !== 16) throw new Error(`${family} must define exactly 16 trophies`);
  return Object.freeze(rows.map((row, index) => Object.freeze({
    id: `${family}-${row[0]}`, nameEn: row[1], criteriaEn: row[2], description: row[2],
    condition: row[3], family: `${family[0].toUpperCase()}${family.slice(1)}`,
    tier: 1 + Math.floor(index / 4), familyIndex: index,
  })));
}
