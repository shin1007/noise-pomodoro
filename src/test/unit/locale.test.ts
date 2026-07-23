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
    assert.strictEqual(resolveLocale('hi'), 'hi');
    assert.strictEqual(resolveLocale('hi-IN'), 'hi');
    assert.strictEqual(resolveLocale('pt'), 'pt');
    assert.strictEqual(resolveLocale('pt-BR'), 'pt');
    assert.strictEqual(resolveLocale('de'), 'de');
    assert.strictEqual(resolveLocale('de-DE'), 'de');
    assert.strictEqual(resolveLocale('ru'), 'ru');
    assert.strictEqual(resolveLocale('ru-RU'), 'ru');
    assert.strictEqual(resolveLocale('ko'), 'ko');
    assert.strictEqual(resolveLocale('ko-KR'), 'ko');
  });

  it('folds all Chinese variants into the single zh locale', () => {
    assert.strictEqual(resolveLocale('zh-cn'), 'zh');
    assert.strictEqual(resolveLocale('zh-tw'), 'zh');
    assert.strictEqual(resolveLocale('zh-hk'), 'zh');
  });

  it('is case-insensitive', () => {
    assert.strictEqual(resolveLocale('EN-US'), 'en');
  });

  it('falls back to en for unsupported or missing language tags', () => {
    assert.strictEqual(resolveLocale('it'), 'en');
    assert.strictEqual(resolveLocale(undefined), 'en');
    assert.strictEqual(resolveLocale(''), 'en');
  });
});
