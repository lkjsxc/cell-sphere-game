/** Risk protected: progression balances, costs, levels, and hashes must remain
 * exact and JSON-safe beyond Number's integer range. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PROGRESSION_DIGITS,
  PROGRESSION_INTEGER_VERSION,
  ProgressionIntegerError,
  addProgressionIntegers,
  canonicalizeProgressionInteger,
  compareProgressionIntegers,
  divideProgressionIntegers,
  fixedPointDivideProgressionInteger,
  fixedPointMultiplyProgressionInteger,
  formatProgressionEngineering,
  formatProgressionInteger,
  formatProgressionScientific,
  hashProgressionInteger,
  incrementProgressionInteger,
  isCanonicalProgressionInteger,
  maxProgressionInteger,
  minProgressionInteger,
  multiplyDivideProgressionInteger,
  multiplyProgressionIntegers,
  normalizeProgressionInteger,
  parseProgressionInteger,
  parseProgressionIntegerRuntime,
  progressionIntegerKey,
  progressionIntegerMagnitude,
  projectProgressionInteger,
  sqrtProgressionInteger,
  subtractProgressionIntegers,
  sumProgressionIntegers,
} from '../../src/core/progression-integer.js';

function hasCode(code) {
  return (error) => error instanceof ProgressionIntegerError && error.code === code;
}

test('version and document security bound are explicit', () => {
  assert.equal(PROGRESSION_INTEGER_VERSION, 1);
  assert.ok(MAX_PROGRESSION_DIGITS >= 4096);
});

test('strict parsing is exact below, at, and above 2^53', () => {
  assert.equal(parseProgressionInteger(Number.MAX_SAFE_INTEGER), '9007199254740991');
  assert.equal(parseProgressionInteger('9007199254740992'), '9007199254740992');
  assert.equal(parseProgressionInteger('9007199254740993'), '9007199254740993');
  assert.equal(canonicalizeProgressionInteger('0'), '0');
  assert.equal(parseProgressionIntegerRuntime('9007199254740993'), 9007199254740993n);
  assert.throws(() => parseProgressionInteger(9007199254740992), hasCode('UNSAFE_NUMBER'));
});

test('malformed and non-JSON inputs are rejected or normalized to fallback', () => {
  for (const value of [
    '', ' 1', '1 ', '+1', '-1', '01', '00', '1e3', '1E3', '1.0',
    -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 1n, null, undefined,
  ]) {
    assert.throws(() => parseProgressionInteger(value));
    assert.equal(normalizeProgressionInteger(value, '7'), '7');
  }
  assert.equal(normalizeProgressionInteger(42), '42');
  assert.equal(isCanonicalProgressionInteger('42'), true);
  assert.equal(isCanonicalProgressionInteger('042'), false);
  assert.throws(
    () => parseProgressionInteger('1'.repeat(MAX_PROGRESSION_DIGITS + 1)),
    hasCode('TOO_MANY_DIGITS'),
  );
});

test('thousand-digit canonical values compare and calculate exactly', () => {
  const power = `1${'0'.repeat(1000)}`;
  const lower = '9'.repeat(1000);
  assert.equal(parseProgressionInteger(power), power);
  assert.equal(compareProgressionIntegers(power, lower), 1);
  assert.equal(addProgressionIntegers(lower, '1'), power);
  assert.equal(subtractProgressionIntegers(power, '1'), lower);
  assert.equal(incrementProgressionInteger(lower), power);
  assert.equal(minProgressionInteger(power, lower), lower);
  assert.equal(maxProgressionInteger(power, lower), power);
});

test('exact debit, credit, sum, and underflow behavior', () => {
  const balance = '900719925474099312345678901234567890';
  const cost = '12345678901234567890';
  const debited = subtractProgressionIntegers(balance, cost);
  assert.equal(debited, '900719925474099300000000000000000000');
  assert.equal(addProgressionIntegers(debited, cost), balance);
  assert.equal(sumProgressionIntegers([]), '0');
  assert.equal(sumProgressionIntegers([balance, cost, 1]), '900719925474099324691357802469135781');
  assert.throws(() => subtractProgressionIntegers('2', '3'), hasCode('UNDERFLOW'));
});

test('multiply, floor divide, fixed point, and integer sqrt stay exact', () => {
  assert.equal(multiplyProgressionIntegers('123456789', '987654321'), '121932631112635269');
  assert.equal(divideProgressionIntegers('121932631112635269', '987654321'), '123456789');
  assert.equal(divideProgressionIntegers('10', '3'), '3');
  assert.equal(multiplyDivideProgressionInteger('100000000000000000001', '125', '100'), '125000000000000000001');
  assert.equal(fixedPointMultiplyProgressionInteger('9007199254740993', '1250', '1000'), '11258999068426241');
  assert.equal(fixedPointDivideProgressionInteger('11258999068426241', '1250', '1000'), '9007199254740992');
  assert.equal(sqrtProgressionInteger('0'), '0');
  assert.equal(sqrtProgressionInteger('1'), '1');
  assert.equal(sqrtProgressionInteger('15241578750190521'), '123456789');
  assert.equal(sqrtProgressionInteger('15241578750190520'), '123456788');
  assert.throws(() => divideProgressionIntegers('1', '0'), hasCode('DIVISION_BY_ZERO'));
  assert.throws(() => fixedPointMultiplyProgressionInteger('1', '1', '0'), hasCode('DIVISION_BY_ZERO'));
});

test('versioned keys and hashes are canonical and stable', () => {
  assert.equal(progressionIntegerKey('12', 34), 'pi1|2:12|2:34');
  assert.equal(progressionIntegerKey('1', '23') === progressionIntegerKey('12', '3'), false);
  assert.equal(hashProgressionInteger('9007199254740993'), '66dfb9a0');
  assert.match(hashProgressionInteger('9007199254740993'), /^[0-9a-f]{8}$/);
  assert.notEqual(hashProgressionInteger('9007199254740993'), hashProgressionInteger('9007199254740994'));
});

test('bounded projection clamps lexically before converting', () => {
  assert.equal(projectProgressionInteger('999', 1000), 999);
  assert.equal(projectProgressionInteger('1000', 1000), 1000);
  assert.equal(projectProgressionInteger('1001', 1000), 1000);
  assert.equal(projectProgressionInteger('9'.repeat(1000), 1000), 1000);
  assert.equal(projectProgressionInteger('9007199254740991'), Number.MAX_SAFE_INTEGER);
  assert.equal(projectProgressionInteger('9007199254740992'), Number.MAX_SAFE_INTEGER);
  assert.throws(() => projectProgressionInteger('1', 1.5), hasCode('INVALID_CEILING'));
});

test('decimal magnitude exposes bounded leading fixed-point data', () => {
  assert.deepEqual(progressionIntegerMagnitude('0'), {
    digits: 1,
    exponent10: 0,
    mantissa: 0,
    mantissaScale: 100000,
  });
  assert.deepEqual(progressionIntegerMagnitude('12345678901234567890', 6), {
    digits: 20,
    exponent10: 19,
    mantissa: 123456,
    mantissaScale: 100000,
  });
  const huge = progressionIntegerMagnitude(`987654${'0'.repeat(1000)}`, 6);
  assert.deepEqual(huge, {
    digits: 1006,
    exponent10: 1005,
    mantissa: 987654,
    mantissaScale: 100000,
  });
});

test('scientific and engineering formatting is stable and locale-independent', () => {
  assert.equal(formatProgressionScientific('0'), '0');
  assert.equal(formatProgressionScientific('12345678901234567890', 6), '1.23457e+19');
  assert.equal(formatProgressionEngineering('12345678901234567890', 6), '12.3457e+18');
  assert.equal(formatProgressionEngineering('999999', 3), '1e+6');
  assert.equal(formatProgressionScientific(`1${'0'.repeat(1000)}`, 6), '1e+1000');
  assert.equal(
    formatProgressionInteger('123456789', { notation: 'scientific', significantDigits: 4 }),
    '1.235e+8',
  );
  assert.equal(
    formatProgressionInteger('123456789', { notation: 'engineering', significantDigits: 4 }),
    '123.5e+6',
  );
});

test('canonical values survive repeated JSON round trips without precision loss', () => {
  const original = {
    balance: `9${'1234567890'.repeat(100)}`,
    level: '9007199254740993',
    zero: '0',
  };
  let copy = original;
  for (let i = 0; i < 100; i++) {
    const decoded = JSON.parse(JSON.stringify(copy));
    copy = {
      balance: normalizeProgressionInteger(decoded.balance),
      level: normalizeProgressionInteger(decoded.level),
      zero: normalizeProgressionInteger(decoded.zero),
    };
  }
  assert.deepEqual(copy, original);
  assert.doesNotThrow(() => JSON.stringify(copy));
});
