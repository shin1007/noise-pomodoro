import * as assert from 'assert';
import { migrateSettings } from '../../state/migrations';
import { buildDefaultSettings, SETTINGS_SCHEMA_VERSION } from '../../state/settings';

const DEFAULT_SETTINGS = buildDefaultSettings('ja');

describe('migrateSettings', () => {
  it('returns defaults when raw is undefined', () => {
    assert.deepStrictEqual(migrateSettings(undefined, 'ja'), DEFAULT_SETTINGS);
  });

  it('returns defaults when raw is not an object', () => {
    assert.deepStrictEqual(migrateSettings('nonsense', 'ja'), DEFAULT_SETTINGS);
    assert.deepStrictEqual(migrateSettings(42, 'ja'), DEFAULT_SETTINGS);
  });

  it('returns defaults when schemaVersion does not match', () => {
    const result = migrateSettings({ schemaVersion: 999, ambientPresets: [], chimePresets: [], pomodoro: {}, lastUsed: {} }, 'ja');
    assert.deepStrictEqual(result, DEFAULT_SETTINGS);
  });

  it('returns defaults when required fields are missing or malformed', () => {
    assert.deepStrictEqual(migrateSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION }, 'ja'), DEFAULT_SETTINGS);
    assert.deepStrictEqual(
      migrateSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION, ambientPresets: 'not-an-array', chimePresets: [], pomodoro: {}, lastUsed: {} }, 'ja'),
      DEFAULT_SETTINGS,
    );
    assert.deepStrictEqual(
      migrateSettings(
        {
          schemaVersion: SETTINGS_SCHEMA_VERSION,
          ambientPresets: [],
          chimePresets: [],
          pomodoro: {},
          lastUsed: { background: { mode: 'off' } },
        },
        'ja',
      ),
      DEFAULT_SETTINGS,
    );
  });

  it('returns defaults when preset arrays contain malformed elements', () => {
    const base = {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      chimePresets: [],
      pomodoro: DEFAULT_SETTINGS.pomodoro,
      lastUsed: {
        background: { mode: 'procedural', noiseType: 'white' },
        beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
        beatMode: 'binaural',
        masterVolume: 0.3,
        activePresetId: null,
      },
    };
    // null 要素、必須フィールド欠落は、実行時の TypeError を招くため既定値へ戻します。
    assert.deepStrictEqual(migrateSettings({ ...base, ambientPresets: [null] }, 'ja'), DEFAULT_SETTINGS);
    assert.deepStrictEqual(migrateSettings({ ...base, ambientPresets: [{ id: 'x', name: 'x' }] }, 'ja'), DEFAULT_SETTINGS);
    assert.deepStrictEqual(migrateSettings({ ...base, chimePresets: [{ id: 'c', name: 'c' }] }, 'ja'), DEFAULT_SETTINGS);
  });

  it('returns defaults when pomodoro phase config or beatMode is malformed', () => {
    const lastUsed = {
      background: { mode: 'procedural', noiseType: 'white' },
      beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
      beatMode: 'binaural',
      masterVolume: 0.3,
      activePresetId: null,
    };
    assert.deepStrictEqual(
      migrateSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION, ambientPresets: [], chimePresets: [], pomodoro: { focus: {}, break: {} }, lastUsed }, 'ja'),
      DEFAULT_SETTINGS,
    );
    assert.deepStrictEqual(
      migrateSettings(
        { schemaVersion: SETTINGS_SCHEMA_VERSION, ambientPresets: [], chimePresets: [], pomodoro: DEFAULT_SETTINGS.pomodoro, lastUsed: { ...lastUsed, beatMode: 'bogus' } },
        'ja',
      ),
      DEFAULT_SETTINGS,
    );
  });

  it('passes through settings that carry the real default presets', () => {
    const valid = {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      ambientPresets: DEFAULT_SETTINGS.ambientPresets,
      chimePresets: DEFAULT_SETTINGS.chimePresets,
      pomodoro: DEFAULT_SETTINGS.pomodoro,
      lastUsed: {
        background: { mode: 'file', file: { fsPath: '/tmp/a.wav', mimeType: 'audio/wav', loop: true } },
        beat: { enabled: true, baseFrequency: 528, beatFrequency: 10 },
        beatMode: 'isochronic',
        masterVolume: 0.3,
        activePresetId: null,
      },
    };
    assert.deepStrictEqual(migrateSettings(valid, 'ja'), valid);
  });

  it('passes through settings that match the current schema', () => {
    const valid = {
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      ambientPresets: [],
      chimePresets: [],
      pomodoro: DEFAULT_SETTINGS.pomodoro,
      lastUsed: {
        background: { mode: 'procedural', noiseType: 'white' },
        beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
        beatMode: 'binaural',
        masterVolume: 0.3,
        activePresetId: null,
      },
    };
    assert.deepStrictEqual(migrateSettings(valid, 'ja'), valid);
  });
});
