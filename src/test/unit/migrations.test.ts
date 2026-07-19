import * as assert from 'assert';
import { migrateSettings } from '../../state/migrations';
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from '../../state/settings';

describe('migrateSettings', () => {
  it('returns defaults when raw is undefined', () => {
    assert.deepStrictEqual(migrateSettings(undefined), DEFAULT_SETTINGS);
  });

  it('returns defaults when raw is not an object', () => {
    assert.deepStrictEqual(migrateSettings('nonsense'), DEFAULT_SETTINGS);
    assert.deepStrictEqual(migrateSettings(42), DEFAULT_SETTINGS);
  });

  it('returns defaults when schemaVersion does not match', () => {
    const result = migrateSettings({ schemaVersion: 999, ambientPresets: [], chimePresets: [], pomodoro: {}, lastUsed: {} });
    assert.deepStrictEqual(result, DEFAULT_SETTINGS);
  });

  it('returns defaults when required fields are missing or malformed', () => {
    assert.deepStrictEqual(migrateSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION }), DEFAULT_SETTINGS);
    assert.deepStrictEqual(
      migrateSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION, ambientPresets: 'not-an-array', chimePresets: [], pomodoro: {}, lastUsed: {} }),
      DEFAULT_SETTINGS,
    );
    assert.deepStrictEqual(
      migrateSettings({
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        ambientPresets: [],
        chimePresets: [],
        pomodoro: {},
        lastUsed: { background: { mode: 'off' } },
      }),
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
    assert.deepStrictEqual(migrateSettings({ ...base, ambientPresets: [null] }), DEFAULT_SETTINGS);
    assert.deepStrictEqual(migrateSettings({ ...base, ambientPresets: [{ id: 'x', name: 'x' }] }), DEFAULT_SETTINGS);
    assert.deepStrictEqual(
      migrateSettings({ ...base, chimePresets: [{ id: 'c', name: 'c' }] }),
      DEFAULT_SETTINGS,
    );
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
      migrateSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION, ambientPresets: [], chimePresets: [], pomodoro: { focus: {}, break: {} }, lastUsed }),
      DEFAULT_SETTINGS,
    );
    assert.deepStrictEqual(
      migrateSettings({ schemaVersion: SETTINGS_SCHEMA_VERSION, ambientPresets: [], chimePresets: [], pomodoro: DEFAULT_SETTINGS.pomodoro, lastUsed: { ...lastUsed, beatMode: 'bogus' } }),
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
    assert.deepStrictEqual(migrateSettings(valid), valid);
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
    assert.deepStrictEqual(migrateSettings(valid), valid);
  });
});
