import * as assert from 'assert';
import { resolveLocale } from '../../i18n/locale';

describe('resolveLocale', () => {
  it('maps exact and region-qualified language tags to their locale', () => {
    assert.strictEqual(resolveLocale('en'), 'en');
    assert.strictEqual(resolveLocale('en-US'), 'en');
    assert.strictEqual(resolveLocale('fr'), 'fr');
    assert.strictEqual(resolveLocale('fr-FR'), 'fr');
    assert.strictEqual(resolveLocale('es'), 'es');
    assert.strictEqual(resolveLocale('es-ES'), 'es');
    assert.strictEqual(resolveLocale('ja'), 'ja');
  });

  it('folds all Chinese variants into the single zh locale', () => {
    assert.strictEqual(resolveLocale('zh-cn'), 'zh');
    assert.strictEqual(resolveLocale('zh-tw'), 'zh');
    assert.strictEqual(resolveLocale('zh-hk'), 'zh');
  });

  it('is case-insensitive', () => {
    assert.strictEqual(resolveLocale('EN-US'), 'en');
  });

  it('falls back to ja for unsupported or missing language tags', () => {
    assert.strictEqual(resolveLocale('de'), 'ja');
    assert.strictEqual(resolveLocale('ko'), 'ja');
    assert.strictEqual(resolveLocale(undefined), 'ja');
    assert.strictEqual(resolveLocale(''), 'ja');
  });
});
