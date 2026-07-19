import type { WhiteNoiseSettings } from '../protocol';
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA_VERSION } from './settings';
import { clone } from '../utils/clone';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// 各要素の「形」を軽く検証するための述語です。数値の範囲は再生直前でクランプするため、
// ここでは実行時に TypeError を起こしうる欠落・型不一致（id が無い / background が
// オブジェクトでない 等）だけを弾き、少しでも壊れていれば既定値に戻します。
function isValidBackground(value: unknown): boolean {
  return isRecord(value) && (value.mode === 'off' || value.mode === 'procedural' || value.mode === 'file' || value.mode === 'custom');
}

function isValidBeat(value: unknown): boolean {
  return isRecord(value) && typeof value.enabled === 'boolean';
}

function isValidAmbientPreset(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && isValidBackground(value.background) && isValidBeat(value.beat);
}

function isValidChimePreset(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && (value.mode === 'procedural' || value.mode === 'file' || value.mode === 'custom');
}

function isValidPhaseConfig(value: unknown): boolean {
  return isRecord(value) && isRecord(value.endAction);
}

function isValidPomodoro(value: unknown): boolean {
  return isRecord(value) && isValidPhaseConfig(value.focus) && isValidPhaseConfig(value.break);
}

/**
 * 永続化された globalState データを検証し、形が少しでも違えば既定値に戻します。
 * 壊れた blob やプレリリース版の残骸で activate() が落ちるのを避けるための、安価な保険です。
 * 現在の schema version は SETTINGS_SCHEMA_VERSION（=2）です。これと一致しない古い版のデータは
 * 段階的な移行を行わず既定値にリセットします（プレリリース段階のため許容）。将来、保存済みデータを
 * 保持したまま移行する必要が出たら、バージョンごとの変換をここに追加します。
 * なお音量や周波数など数値の範囲は、再生直前（engineClient.ts / 各 worklet）と PomodoroTimer で
 * クランプするため、ここでは形（スキーマ）の検証に集中します。
 */
export function migrateSettings(raw: unknown): WhiteNoiseSettings {
  if (!raw || typeof raw !== 'object') {
    return clone(DEFAULT_SETTINGS);
  }
  const data = raw as Partial<WhiteNoiseSettings>;
  if (
    data.schemaVersion !== SETTINGS_SCHEMA_VERSION ||
    !Array.isArray(data.ambientPresets) ||
    !data.ambientPresets.every(isValidAmbientPreset) ||
    !Array.isArray(data.chimePresets) ||
    !data.chimePresets.every(isValidChimePreset) ||
    !isValidPomodoro(data.pomodoro) ||
    !isValidBackground(data.lastUsed?.background) ||
    !isValidBeat(data.lastUsed?.beat) ||
    (data.lastUsed?.beatMode !== 'binaural' && data.lastUsed?.beatMode !== 'isochronic')
  ) {
    return clone(DEFAULT_SETTINGS);
  }
  return data as WhiteNoiseSettings;
}
