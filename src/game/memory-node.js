/** Shared immutable schema for Memory atlas content modules. */
const TIERS = Object.freeze([1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 8]);
const KINDS = Object.freeze([
  ...Array(8).fill('micro'), ...Array(4).fill('conditional'),
  ...Array(3).fill('unlock'), 'keystone', 'connector', 'capstone',
]);
const LOCAL_REQUIRES = Object.freeze([
  [], [0], [0], [1], [1, 2], [2], [3, 4], [4, 5], [6], [6, 7], [7],
  [8, 9, 10], [8], [9], [10], [11, 12, 13, 14], [15], [16],
]);

export const scalar = (key, value, operation = 'multiply') =>
  Object.freeze({ type: 'scalar', key, value, operation });
export const conditional = (trigger, key, value, operation = 'multiply') =>
  Object.freeze({ type: 'conditional', trigger, key, value, operation });
export const unlock = (key, mode, bonus = null) => Object.freeze({
  type: 'unlock', key, mode, ...(bonus ? { bonus } : {}),
});

/** Rows: slug, name, summary, description, cost, effect, cell. */
export function defineBranch(branch, connectorPrerequisite, rows) {
  if (rows.length !== 18) throw new Error(`${branch} must define 18 Memory nodes`);
  const ids = rows.map((row) => `${branch}-${row[0]}`);
  return Object.freeze(rows.map((row, index) => {
    const requires = LOCAL_REQUIRES[index].map((required) => ids[required]);
    if (index === 16) requires.push(connectorPrerequisite);
    const effect = row[5];
    const effects = effect.type === 'scalar' ? { [effect.key]: effect.value } : {};
    return Object.freeze({
      id: ids[index], nameEn: row[1], effectEn: row[2], description: row[3],
      cost: row[4], requires: Object.freeze(requires),
      branch: `${branch[0].toUpperCase()}${branch.slice(1)}`, tier: TIERS[index],
      kind: KINDS[index], cell: row[6], effect, effects: Object.freeze(effects),
    });
  }));
}
