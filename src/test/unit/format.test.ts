import * as assert from 'assert';
import { formatMMSS, formatProgressBar } from '../../pomodoro/format';

describe('formatMMSS', () => {
  it('formats whole minutes and seconds', () => {
    assert.strictEqual(formatMMSS(0), '00:00');
    assert.strictEqual(formatMMSS(65), '01:05');
    assert.strictEqual(formatMMSS(3599), '59:59');
  });

  it('rounds fractional seconds', () => {
    assert.strictEqual(formatMMSS(59.6), '01:00');
  });

  it('clamps negative values to zero', () => {
    assert.strictEqual(formatMMSS(-5), '00:00');
  });
});

describe('formatProgressBar', () => {
  it('returns all empty segments when totalSec is zero or negative', () => {
    assert.strictEqual(formatProgressBar(0, 0), '░'.repeat(10));
    assert.strictEqual(formatProgressBar(5, -1), '░'.repeat(10));
  });

  it('fills proportionally to elapsed time', () => {
    assert.strictEqual(formatProgressBar(50, 100), '█████░░░░░');
  });

  it('is fully filled once remaining time reaches zero', () => {
    assert.strictEqual(formatProgressBar(0, 100), '█'.repeat(10));
  });

  it('respects a custom segment count', () => {
    assert.strictEqual(formatProgressBar(0, 100, 4), '████');
    assert.strictEqual(formatProgressBar(100, 100, 4), '░░░░');
  });
});
