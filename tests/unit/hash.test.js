/** Risk protected: run-state hashes detect simulation divergence; they must
 *  be stable and sensitive. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fnv1aBytes, hashStringU32, hashF32, hexU32 } from '../../src/core/hash.js';

test('known FNV-1a vector', () => {
  // FNV-1a 32 of empty input is the offset basis.
  assert.equal(fnv1aBytes(new Uint8Array(0)), 0x811c9dc5);
  // "a" -> 0xe40c292c is the canonical FNV-1a-32 vector.
  assert.equal(fnv1aBytes(new Uint8Array([97])), 0xe40c292c);
});

test('string hash is deterministic and order-sensitive', () => {
  assert.equal(hashStringU32('abc'), hashStringU32('abc'));
  assert.notEqual(hashStringU32('abc'), hashStringU32('abd'));
  assert.notEqual(hashStringU32('ab'), hashStringU32('ba'));
});

test('hashF32 is deterministic and quantization-tolerant', () => {
  const a = new Float32Array([1, 2.5, -3.25, 0]);
  const b = new Float32Array([1, 2.5, -3.25, 0]);
  assert.equal(hashF32(1, a, 1000), hashF32(1, b, 1000));
  // Sub-quantum jitter does not change the hash.
  const c = new Float32Array([1.0001, 2.5001, -3.2501, 0.0001]);
  assert.equal(hashF32(1, a, 1000), hashF32(1, c, 1000));
  // Real change does.
  const d = new Float32Array([1, 2.5, -3.25, 0.01]);
  assert.notEqual(hashF32(1, a, 1000), hashF32(1, d, 1000));
});

test('hexU32 pads to 8 chars', () => {
  assert.equal(hexU32(0), '00000000');
  assert.equal(hexU32(0xdeadbeef), 'deadbeef');
  assert.equal(hexU32(1), '00000001');
});
