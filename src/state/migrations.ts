import type { WhiteNoiseSettings } from '../protocol';
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from './settings';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Validates persisted globalState data and falls back to defaults on any shape mismatch --
 * cheap insurance against a corrupted or pre-release blob rather than crashing activate().
 * There's only ever been schema version 1 so far; this is where future version-to-version
 * migrations would be added.
 */
export function migrateSettings(raw: unknown): WhiteNoiseSettings {
  if (!raw || typeof raw !== 'object') {
    return clone(DEFAULT_SETTINGS);
  }
  const data = raw as Partial<WhiteNoiseSettings>;
  if (data.schemaVersion !== SETTINGS_SCHEMA_VERSION || !Array.isArray(data.presets) || !data.pomodoro || !data.lastUsed) {
    return clone(DEFAULT_SETTINGS);
  }
  return data as WhiteNoiseSettings;
}
