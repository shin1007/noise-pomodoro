import type { WhiteNoiseSettings } from '../protocol';
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from './settings';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * 永続化された globalState データを検証し、形が少しでも違えば既定値に戻します。
 * 壊れた blob やプレリリース版の残骸で activate() が落ちるのを避けるための、安価な保険です。
 * いまのところ schema version は 1 のみですが、将来の版間移行はここに追加します。
 */
export function migrateSettings(raw: unknown): WhiteNoiseSettings {
  if (!raw || typeof raw !== 'object') {
    return clone(DEFAULT_SETTINGS);
  }
  const data = raw as Partial<WhiteNoiseSettings>;
  if (
    data.schemaVersion !== SETTINGS_SCHEMA_VERSION ||
    !Array.isArray(data.ambientPresets) ||
    !Array.isArray(data.chimePresets) ||
    !data.pomodoro ||
    !data.lastUsed?.background ||
    !data.lastUsed?.beat ||
    !data.lastUsed?.beatMode
  ) {
    return clone(DEFAULT_SETTINGS);
  }
  return data as WhiteNoiseSettings;
}
