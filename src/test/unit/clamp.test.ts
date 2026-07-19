import * as assert from 'assert';
import { clampFinite } from '../../utils/clamp';

describe('clampFinite', () => {
  it('passes through values already within range', () => {
    assert.strictEqual(clampFinite(0.5, 0, 1, 0), 0.5);
  });

  it('clamps values above the range to max', () => {
    assert.strictEqual(clampFinite(5, 0, 1, 0), 1);
  });

  it('clamps values below the range to min', () => {
    assert.strictEqual(clampFinite(-5, 0, 1, 0), 0);
  });

  it('falls back for NaN', () => {
    assert.strictEqual(clampFinite(NaN, 0, 1, 0.6), 0.6);
  });

  it('falls back for +Infinity and -Infinity', () => {
    assert.strictEqual(clampFinite(Infinity, 0, 20000, 528), 528);
    assert.strictEqual(clampFinite(-Infinity, 0, 20000, 528), 528);
  });

  it('does not clamp the fallback itself when it is out of range', () => {
    // fallback は「壊れた入力のときにそのまま使う値」なので、ここでは range に丸めません。
    assert.strictEqual(clampFinite(NaN, 0, 1, 42), 42);
  });
});
