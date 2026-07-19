import * as assert from 'assert';
import { backgroundLabel } from '../../state/labels';

describe('backgroundLabel', () => {
  it('returns the noise type for procedural background', () => {
    assert.strictEqual(backgroundLabel({ mode: 'procedural', noiseType: 'brown' }), 'brown');
  });

  it('returns an empty string when procedural has no noise type', () => {
    assert.strictEqual(backgroundLabel({ mode: 'procedural' }), '');
  });

  it('returns a fixed label for file background', () => {
    assert.strictEqual(backgroundLabel({ mode: 'file' }), 'ファイル');
  });

  it('returns a fixed label for custom background', () => {
    assert.strictEqual(backgroundLabel({ mode: 'custom' }), 'カスタム');
  });

  it('returns an empty string when background is off', () => {
    assert.strictEqual(backgroundLabel({ mode: 'off' }), '');
  });
});
