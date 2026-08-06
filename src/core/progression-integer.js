import { hashStringU32, hexU32 } from './hash.js';

/** Version of the canonical progression-integer boundary and derived keys. */
export const PROGRESSION_INTEGER_VERSION = 1;

/**
 * Maximum accepted decimal document field width. This is a malformed-input and
 * storage security bound, not a gameplay or progression design maximum.
 */
export const MAX_PROGRESSION_DIGITS = 4096;

const CANONICAL_DECIMAL = /^(?:0|[1-9][0-9]*)$/;

export class ProgressionIntegerError extends RangeError {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = 'ProgressionIntegerError';
    this.code = code;
  }
}

/** @param {unknown} value @returns {string} */
export function parseProgressionInteger(value) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new ProgressionIntegerError(
        'UNSAFE_NUMBER',
        'progression integer Number must be a non-negative safe integer',
      );
    }
    return String(value);
  }

  if (typeof value !== 'string') {
    throw new ProgressionIntegerError(
      'INVALID_TYPE',
      'progression integer must be a canonical decimal string or non-negative safe integer Number',
    );
  }
  if (value.length > MAX_PROGRESSION_DIGITS) {
    throw new ProgressionIntegerError(
      'TOO_MANY_DIGITS',
      `progression integer exceeds the ${MAX_PROGRESSION_DIGITS}-digit document security bound`,
    );
  }
  if (!CANONICAL_DECIMAL.test(value)) {
    throw new ProgressionIntegerError(
      'NON_CANONICAL',
      'progression integer string must be canonical unsigned base-10 decimal',
    );
  }
  return value;
}

/** Strict canonicalization alias for JSON/storage boundaries. */
export const canonicalizeProgressionInteger = parseProgressionInteger;

/**
 * Forgiving JSON-facing normalizer. Invalid values, including raw bigint, use
 * the supplied valid fallback.
 * @param {unknown} value
 * @param {string|number} [fallback]
 */
export function normalizeProgressionInteger(value, fallback = '0') {
  const canonicalFallback = parseProgressionInteger(fallback);
  try {
    return parseProgressionInteger(value);
  } catch (error) {
    if (error instanceof ProgressionIntegerError) return canonicalFallback;
    throw error;
  }
}

/** @param {unknown} value */
export function isCanonicalProgressionInteger(value) {
  return typeof value === 'string'
    && value.length <= MAX_PROGRESSION_DIGITS
    && CANONICAL_DECIMAL.test(value);
}

/**
 * Explicit runtime-only parser. Bigint must not cross JSON/storage boundaries;
 * all other exported operations return JSON-safe strings, numbers, or objects.
 * @param {string|number} value
 * @returns {bigint}
 */
export function parseProgressionIntegerRuntime(value) {
  return BigInt(parseProgressionInteger(value));
}

/** @param {bigint} value */
function fromRuntime(value) {
  if (value < 0n) {
    throw new ProgressionIntegerError('NEGATIVE_RESULT', 'progression integer result cannot be negative');
  }
  const canonical = value.toString(10);
  if (canonical.length > MAX_PROGRESSION_DIGITS) {
    throw new ProgressionIntegerError(
      'TOO_MANY_DIGITS',
      `progression integer result exceeds the ${MAX_PROGRESSION_DIGITS}-digit document security bound`,
    );
  }
  return canonical;
}

/** @param {string|number} left @param {string|number} right */
export function compareProgressionIntegers(left, right) {
  const a = parseProgressionInteger(left);
  const b = parseProgressionInteger(right);
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a === b ? 0 : a < b ? -1 : 1;
}

/** @param {string|number} left @param {string|number} right */
export function addProgressionIntegers(left, right) {
  return fromRuntime(parseProgressionIntegerRuntime(left) + parseProgressionIntegerRuntime(right));
}

/** @param {string|number} left @param {string|number} right */
export function subtractProgressionIntegers(left, right) {
  const a = parseProgressionIntegerRuntime(left);
  const b = parseProgressionIntegerRuntime(right);
  if (b > a) {
    throw new ProgressionIntegerError('UNDERFLOW', 'progression integer subtraction cannot underflow');
  }
  return fromRuntime(a - b);
}

/** @param {string|number} left @param {string|number} right */
export function multiplyProgressionIntegers(left, right) {
  return fromRuntime(parseProgressionIntegerRuntime(left) * parseProgressionIntegerRuntime(right));
}

/** Floor division. @param {string|number} dividend @param {string|number} divisor */
export function divideProgressionIntegers(dividend, divisor) {
  const denominator = parseProgressionIntegerRuntime(divisor);
  if (denominator === 0n) {
    throw new ProgressionIntegerError('DIVISION_BY_ZERO', 'progression integer division by zero');
  }
  return fromRuntime(parseProgressionIntegerRuntime(dividend) / denominator);
}

/** @param {string|number} value */
export function incrementProgressionInteger(value) {
  return fromRuntime(parseProgressionIntegerRuntime(value) + 1n);
}

/** @param {string|number} left @param {string|number} right */
export function minProgressionInteger(left, right) {
  return compareProgressionIntegers(left, right) <= 0
    ? parseProgressionInteger(left)
    : parseProgressionInteger(right);
}

/** @param {string|number} left @param {string|number} right */
export function maxProgressionInteger(left, right) {
  return compareProgressionIntegers(left, right) >= 0
    ? parseProgressionInteger(left)
    : parseProgressionInteger(right);
}

/** Exact floor square root. @param {string|number} value */
export function sqrtProgressionInteger(value) {
  const n = parseProgressionIntegerRuntime(value);
  if (n < 2n) return fromRuntime(n);

  let x = 1n << (BigInt(n.toString(2).length) + 1n) / 2n;
  while (true) {
    const next = (x + n / x) >> 1n;
    if (next >= x) return fromRuntime(x);
    x = next;
  }
}

/**
 * Exact multiply followed by floor divide without an intermediate JSON value.
 * Useful for rational and fixed-point coefficients.
 * @param {string|number} value
 * @param {string|number} multiplier
 * @param {string|number} divisor
 */
export function multiplyDivideProgressionInteger(value, multiplier, divisor) {
  const denominator = parseProgressionIntegerRuntime(divisor);
  if (denominator === 0n) {
    throw new ProgressionIntegerError('DIVISION_BY_ZERO', 'progression integer division by zero');
  }
  return fromRuntime(
    (parseProgressionIntegerRuntime(value) * parseProgressionIntegerRuntime(multiplier)) / denominator,
  );
}

/**
 * Apply a non-negative fixed-point factor and floor the result.
 * `factor / scale` is the exact coefficient.
 */
export function fixedPointMultiplyProgressionInteger(value, factor, scale) {
  return multiplyDivideProgressionInteger(value, factor, scale);
}

/**
 * Divide by a non-negative fixed-point factor and floor the result.
 * `divisor / scale` is the exact coefficient.
 */
export function fixedPointDivideProgressionInteger(value, divisor, scale) {
  return multiplyDivideProgressionInteger(value, scale, divisor);
}

/** @param {Iterable<string|number>} values */
export function sumProgressionIntegers(values) {
  let total = 0n;
  for (const value of values) total += parseProgressionIntegerRuntime(value);
  return fromRuntime(total);
}

/** Hex FNV-1a hash of the versioned canonical value. */
export function hashProgressionInteger(value) {
  const canonical = parseProgressionInteger(value);
  return hexU32(hashStringU32(`progression-integer:v${PROGRESSION_INTEGER_VERSION}:${canonical}`));
}

/**
 * Collision-unambiguous canonical key material for one or more values. The full
 * canonical values remain present; the hash is only a compact diagnostic.
 */
export function progressionIntegerKey(...values) {
  const parts = values.map((value) => {
    const canonical = parseProgressionInteger(value);
    return `${canonical.length}:${canonical}`;
  });
  return `pi${PROGRESSION_INTEGER_VERSION}|${parts.join('|')}`;
}

/**
 * Project to a caller-supplied safe Number ceiling. Decimal length and lexical
 * comparison prove safety before Number conversion; an arbitrary full decimal
 * string is never passed to Number().
 * @param {string|number} value
 * @param {number} [ceiling]
 */
export function projectProgressionInteger(value, ceiling = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(ceiling) || ceiling < 0) {
    throw new ProgressionIntegerError(
      'INVALID_CEILING',
      'progression integer projection ceiling must be a non-negative safe integer',
    );
  }
  const canonical = parseProgressionInteger(value);
  const limit = String(ceiling);
  if (canonical.length > limit.length
      || (canonical.length === limit.length && canonical > limit)) {
    return ceiling;
  }
  return Number(canonical);
}

/**
 * Return bounded leading fixed-point magnitude data without converting the
 * complete value. `mantissa / mantissaScale` is in [1, 10) for nonzero values.
 * @param {string|number} value
 * @param {number} [significantDigits]
 */
export function progressionIntegerMagnitude(value, significantDigits = 6) {
  if (!Number.isInteger(significantDigits) || significantDigits < 1 || significantDigits > 15) {
    throw new ProgressionIntegerError(
      'INVALID_PRECISION',
      'progression integer magnitude precision must be an integer from 1 to 15',
    );
  }
  const canonical = parseProgressionInteger(value);
  const mantissaScale = 10 ** (significantDigits - 1);
  if (canonical === '0') {
    return { digits: 1, exponent10: 0, mantissa: 0, mantissaScale };
  }
  const leading = canonical.slice(0, significantDigits).padEnd(significantDigits, '0');
  return {
    digits: canonical.length,
    exponent10: canonical.length - 1,
    mantissa: Number(leading),
    mantissaScale,
  };
}

/** @param {string} canonical @param {number} significantDigits */
function roundedLeading(canonical, significantDigits) {
  let exponent10 = canonical.length - 1;
  if (canonical.length <= significantDigits) return { leading: canonical, exponent10 };

  let leading = canonical.slice(0, significantDigits);
  if (canonical.charCodeAt(significantDigits) >= 53) {
    let carry = 1;
    const digits = leading.split('');
    for (let i = digits.length - 1; i >= 0 && carry; i--) {
      const next = digits[i].charCodeAt(0) - 47;
      digits[i] = String(next % 10);
      carry = next === 10 ? 1 : 0;
    }
    if (carry) {
      leading = `1${'0'.repeat(significantDigits - 1)}`;
      exponent10 += 1;
    } else {
      leading = digits.join('');
    }
  }
  return { leading, exponent10 };
}

/** @param {string} leading @param {number} integerDigits */
function coefficient(leading, integerDigits) {
  const padded = leading.padEnd(integerDigits, '0');
  if (padded.length <= integerDigits) return padded;
  const fraction = padded.slice(integerDigits).replace(/0+$/, '');
  return fraction ? `${padded.slice(0, integerDigits)}.${fraction}` : padded.slice(0, integerDigits);
}

/** Stable locale-independent scientific notation. */
export function formatProgressionScientific(value, significantDigits = 6) {
  const canonical = parseProgressionInteger(value);
  if (canonical === '0') return '0';
  if (!Number.isInteger(significantDigits) || significantDigits < 1 || significantDigits > 15) {
    throw new ProgressionIntegerError(
      'INVALID_PRECISION',
      'progression integer formatting precision must be an integer from 1 to 15',
    );
  }
  const rounded = roundedLeading(canonical, significantDigits);
  return `${coefficient(rounded.leading, 1)}e+${rounded.exponent10}`;
}

/** Stable locale-independent engineering notation (exponent divisible by 3). */
export function formatProgressionEngineering(value, significantDigits = 6) {
  const canonical = parseProgressionInteger(value);
  if (canonical === '0') return '0';
  if (!Number.isInteger(significantDigits) || significantDigits < 1 || significantDigits > 15) {
    throw new ProgressionIntegerError(
      'INVALID_PRECISION',
      'progression integer formatting precision must be an integer from 1 to 15',
    );
  }
  const rounded = roundedLeading(canonical, significantDigits);
  const engineeringExponent = Math.floor(rounded.exponent10 / 3) * 3;
  const integerDigits = rounded.exponent10 - engineeringExponent + 1;
  return `${coefficient(rounded.leading, integerDigits)}e+${engineeringExponent}`;
}

/** Select stable engineering (default) or scientific formatting. */
export function formatProgressionInteger(value, options = {}) {
  const { notation = 'engineering', significantDigits = 6 } = options;
  if (notation === 'engineering') return formatProgressionEngineering(value, significantDigits);
  if (notation === 'scientific') return formatProgressionScientific(value, significantDigits);
  throw new ProgressionIntegerError(
    'INVALID_NOTATION',
    'progression integer notation must be "engineering" or "scientific"',
  );
}
