import * as assert from 'assert';
import { BEAT_GAIN, beatParamKey, mixLevels, paramsEqual, safeFrequency, safeGain } from '../../media/audioEngine/mixParams';

describe('safeGain', () => {
  it('passes through valid gains', () => {
    assert.strictEqual(safeGain(0.6), 0.6);
  });

  it('clamps out-of-range and falls back to 0 for non-finite values', () => {
    assert.strictEqual(safeGain(1.5), 1);
    assert.strictEqual(safeGain(-1), 0);
    assert.strictEqual(safeGain(NaN), 0);
    assert.strictEqual(safeGain(Infinity), 0);
  });
});

describe('safeFrequency', () => {
  it('passes through valid frequencies', () => {
    assert.strictEqual(safeFrequency(440, 528), 440);
  });

  it('falls back to the provided default for non-finite values', () => {
    assert.strictEqual(safeFrequency(NaN, 528), 528);
  });

  it('clamps to the [0, 20000] audible range', () => {
    assert.strictEqual(safeFrequency(-10, 528), 0);
    assert.strictEqual(safeFrequency(50000, 528), 20000);
  });
});

describe('beatParamKey', () => {
  it('maps binaural to beatFreq', () => {
    assert.strictEqual(beatParamKey('binaural'), 'beatFreq');
  });

  it('maps isochronic to pulseFreq', () => {
    assert.strictEqual(beatParamKey('isochronic'), 'pulseFreq');
  });
});

describe('mixLevels', () => {
  it('plays background alone at full level when beat is disabled', () => {
    const { backgroundLevel, beatLevel } = mixLevels(false);
    assert.strictEqual(backgroundLevel, 1.0);
    assert.strictEqual(beatLevel, 0);
  });

  it('mixes background and beat at the fixed ratio when beat is enabled', () => {
    const { backgroundLevel, beatLevel } = mixLevels(true);
    assert.strictEqual(backgroundLevel, 0.86);
    assert.strictEqual(beatLevel, BEAT_GAIN);
  });
});

describe('paramsEqual', () => {
  it('treats identical params as equal', () => {
    assert.strictEqual(paramsEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true);
  });

  it('treats empty params objects as equal', () => {
    assert.strictEqual(paramsEqual({}, {}), true);
  });

  it('detects a changed value', () => {
    assert.strictEqual(paramsEqual({ a: 1 }, { a: 2 }), false);
  });

  it('detects a different key count', () => {
    assert.strictEqual(paramsEqual({ a: 1 }, { a: 1, b: 2 }), false);
  });

  it('detects a different key name at the same count', () => {
    assert.strictEqual(paramsEqual({ a: 1 }, { b: 1 }), false);
  });
});
