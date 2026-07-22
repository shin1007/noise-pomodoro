import * as assert from 'assert';
import { backgroundLabel } from '../../state/labels';
import { HOST_STRINGS } from '../../i18n/host';

const strings = HOST_STRINGS.ja;

describe('backgroundLabel', () => {
  it('returns the noise type for procedural background', () => {
    assert.strictEqual(backgroundLabel({ mode: 'procedural', noiseType: 'brown' }, strings), 'brown');
  });

  it('returns an empty string when procedural has no noise type', () => {
    assert.strictEqual(backgroundLabel({ mode: 'procedural' }, strings), '');
  });

  it('returns a fixed label for file background', () => {
    assert.strictEqual(backgroundLabel({ mode: 'file' }, strings), strings.backgroundLabel.file);
  });

  it('returns a fixed label for custom background', () => {
    assert.strictEqual(backgroundLabel({ mode: 'custom' }, strings), strings.backgroundLabel.custom);
  });

  it('returns an empty string when background is off', () => {
    assert.strictEqual(backgroundLabel({ mode: 'off' }, strings), '');
  });
});
