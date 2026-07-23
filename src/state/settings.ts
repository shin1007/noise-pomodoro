import type { AmbientPreset, PhaseConfig, PresetConfig, NoisePomodoroSettings } from '../protocol';
import type { Locale } from '../i18n/locale';
import { DEFAULT_SETTINGS_STRINGS } from '../i18n/defaultSettings';

export const SETTINGS_SCHEMA_VERSION = 3;
export const SETTINGS_KEY = 'noisePomodoro.settings';

// デルタ 0.5-4Hz / シータ 4-8Hz / アルファ 8-13Hz / ベータ 13-30Hz / ガンマ 30-40Hz の
// 代表周波数です。プリセット定義や UI の帯域チップから参照します。
export const BEAT_FREQUENCY_BY_BAND = {
  delta: 0.5,
  theta: 6,
  alpha: 10,
  beta: 18,
  gamma: 36,
} as const;

// プリセット名・説明文はロケール依存のため、初回シード時にのみ使う文言を
// src/i18n/defaultSettings から差し込みます。一度永続化された後はユーザーデータのため、
// ロケールを変えても既存のプリセットは遡って翻訳し直しません。
export function buildDefaultAmbientPresets(locale: Locale): AmbientPreset[] {
  const t = DEFAULT_SETTINGS_STRINGS[locale].presets;
  return [
    {
      id: 'focus',
      name: t.focus.name,
      icon: '🧠',
      description: t.focus.description,
      background: { mode: 'procedural', noiseType: 'brown' },
      beat: { enabled: true, baseFrequency: 417, beatFrequency: BEAT_FREQUENCY_BY_BAND.beta },
      volume: 0.55,
    },
    {
      id: 'creative',
      name: t.creative.name,
      icon: '🎨',
      description: t.creative.description,
      background: { mode: 'procedural', noiseType: 'pink' },
      beat: { enabled: true, baseFrequency: 528, beatFrequency: BEAT_FREQUENCY_BY_BAND.alpha },
      volume: 0.55,
    },
    {
      id: 'study',
      name: t.study.name,
      icon: '📚',
      description: t.study.description,
      background: { mode: 'procedural', noiseType: 'white' },
      beat: { enabled: true, baseFrequency: 741, beatFrequency: BEAT_FREQUENCY_BY_BAND.gamma },
      volume: 0.55,
    },
    {
      id: 'meditation',
      name: t.meditation.name,
      icon: '🧘',
      description: t.meditation.description,
      background: { mode: 'off' },
      beat: { enabled: true, baseFrequency: 396, beatFrequency: BEAT_FREQUENCY_BY_BAND.theta },
      volume: 0.5,
    },
    {
      id: 'sleep',
      name: t.sleep.name,
      icon: '😴',
      description: t.sleep.description,
      background: { mode: 'procedural', noiseType: 'brown' },
      beat: { enabled: true, baseFrequency: 174, beatFrequency: BEAT_FREQUENCY_BY_BAND.delta },
      volume: 0.5,
    },
    {
      id: 'file1',
      name: t.file1.name,
      icon: '📁',
      description: t.file1.description,
      background: { mode: 'file' },
      beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
      volume: 0.7,
    },
    {
      id: 'custom1',
      name: t.custom1.name,
      icon: '🧪',
      description: t.custom1.description,
      background: { mode: 'custom', custom: { code: 'return Math.sin(2 * Math.PI * 220 * t);', params: {} } },
      beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
      volume: 0.5,
    },
  ];
}

export const SOLFEGGIO_FREQUENCIES = [174, 285, 396, 417, 528, 639, 741, 852, 963] as const;

// 終了時に鳴らす組み込みのワンショット音 3 種です。PhaseEndAction.soundPresetId は、
// ユーザー自身のカスタムコードやファイルのプリセットなど、他の任意の chime preset id に
// 差し替えられます。ここにあるのは「無難な初期値」であり、唯一の選択肢ではありません。
export function buildChimePresets(locale: Locale): PresetConfig[] {
  const t = DEFAULT_SETTINGS_STRINGS[locale].chimes;
  return [
    {
      id: 'chime-bell',
      name: t.bell,
      icon: '🔔',
      mode: 'custom',
      volume: 0.7,
      custom: { code: 'const decay = Math.exp(-t * 3); return Math.sin(2 * Math.PI * 880 * t) * decay;', params: {} },
    },
    {
      id: 'chime-beep',
      name: t.beep,
      icon: '📟',
      mode: 'custom',
      volume: 0.7,
      custom: {
        code: 'const local = t % 0.3; const decay = Math.exp(-local * 25); return t < 0.6 ? Math.sin(2 * Math.PI * 1000 * t) * decay : 0;',
        params: {},
      },
    },
    {
      id: 'chime-marimba',
      name: t.marimba,
      icon: '🎶',
      mode: 'custom',
      volume: 0.7,
      custom: {
        code: 'const decay = Math.exp(-t * 4); return (Math.sin(2 * Math.PI * 523 * t) + 0.5 * Math.sin(2 * Math.PI * 1046 * t)) * decay * 0.6;',
        params: {},
      },
    },
  ];
}

function buildDefaultFocusPhase(locale: Locale): PhaseConfig {
  return {
    durationSec: 25 * 60,
    presetId: 'focus',
    autoAdvance: true,
    endAction: { showToast: true, toastMessage: DEFAULT_SETTINGS_STRINGS[locale].phaseEnd.focusToastMessage, playSound: true, soundPresetId: 'chime-bell', runScript: false },
  };
}

function buildDefaultBreakPhase(locale: Locale): PhaseConfig {
  return {
    durationSec: 5 * 60,
    presetId: null,
    autoAdvance: true,
    endAction: { showToast: true, toastMessage: DEFAULT_SETTINGS_STRINGS[locale].phaseEnd.breakToastMessage, playSound: true, soundPresetId: 'chime-marimba', runScript: false },
  };
}

export function buildDefaultSettings(locale: Locale): NoisePomodoroSettings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    ambientPresets: buildDefaultAmbientPresets(locale),
    chimePresets: buildChimePresets(locale),
    pomodoro: { focus: buildDefaultFocusPhase(locale), break: buildDefaultBreakPhase(locale) },
    audioOutputScale: 0.25,
    lastUsed: {
      background: { mode: 'procedural', noiseType: 'white' },
      beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
      beatMode: 'binaural',
      masterVolume: 0.6,
      activePresetId: null,
    },
  };
}
