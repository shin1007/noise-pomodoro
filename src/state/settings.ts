import type { PhaseConfig, PresetConfig, WhiteNoiseSettings } from '../protocol';

export const SETTINGS_SCHEMA_VERSION = 1;
export const SETTINGS_KEY = 'whiteNoise.settings';

export const DEFAULT_PRESETS: PresetConfig[] = [
  { id: 'white', name: 'ホワイトノイズ', icon: '🎧', mode: 'procedural', volume: 0.6, procedural: { algorithm: 'white', params: {} } },
  { id: 'pink', name: 'ピンクノイズ', icon: '🎧', mode: 'procedural', volume: 0.6, procedural: { algorithm: 'pink', params: {} } },
  { id: 'brown', name: 'ブラウンノイズ', icon: '🎧', mode: 'procedural', volume: 0.6, procedural: { algorithm: 'brown', params: {} } },
  {
    id: 'isochronic',
    name: 'アイソクロニックトーン',
    icon: '🔔',
    mode: 'procedural',
    volume: 0.5,
    procedural: { algorithm: 'isochronic', params: { carrierFreq: 200, pulseFreq: 10 } },
  },
  {
    id: 'binaural',
    name: 'バイノーラルビート',
    icon: '🎧',
    mode: 'procedural',
    volume: 0.5,
    procedural: { algorithm: 'binaural', params: { carrierFreq: 200, beatFreq: 10 } },
  },
  {
    id: 'solfeggio',
    name: 'ソルフェジオ周波数',
    icon: '🎵',
    mode: 'procedural',
    volume: 0.5,
    procedural: { algorithm: 'solfeggio', params: { solfeggioFreq: 528 } },
  },
  { id: 'file1', name: 'カスタム音声ファイル', icon: '📁', mode: 'file', volume: 0.7 },
  {
    id: 'custom1',
    name: 'カスタムコード',
    icon: '🧪',
    mode: 'custom',
    volume: 0.5,
    custom: { code: 'return Math.sin(2 * Math.PI * 220 * t);', params: {} },
  },
];

export const SOLFEGGIO_FREQUENCIES = [174, 285, 396, 417, 528, 639, 741, 852, 963] as const;

// 3 built-in one-shot end-of-phase chimes. Users can repoint PhaseEndAction.soundPresetId at
// any other preset id instead (their own custom-code preset, or a file preset) -- these are
// just sensible defaults, not the only option.
export const BUILTIN_CHIME_PRESETS: PresetConfig[] = [
  {
    id: 'chime-bell',
    name: 'ベル',
    icon: '🔔',
    mode: 'custom',
    volume: 0.7,
    custom: { code: 'const decay = Math.exp(-t * 3); return Math.sin(2 * Math.PI * 880 * t) * decay;', params: {} },
  },
  {
    id: 'chime-beep',
    name: 'ビープ',
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
    name: 'マリンバ',
    icon: '🎶',
    mode: 'custom',
    volume: 0.7,
    custom: {
      code: 'const decay = Math.exp(-t * 4); return (Math.sin(2 * Math.PI * 523 * t) + 0.5 * Math.sin(2 * Math.PI * 1046 * t)) * decay * 0.6;',
      params: {},
    },
  },
];

const DEFAULT_FOCUS_PHASE: PhaseConfig = {
  durationSec: 25 * 60,
  presetId: 'white',
  autoAdvance: true,
  endAction: { showToast: true, toastMessage: '集中時間終了！休憩しましょう。', playSound: true, soundPresetId: 'chime-bell', runScript: false },
};

const DEFAULT_BREAK_PHASE: PhaseConfig = {
  durationSec: 5 * 60,
  presetId: null,
  autoAdvance: true,
  endAction: { showToast: true, toastMessage: '休憩終了！集中を再開しましょう。', playSound: true, soundPresetId: 'chime-marimba', runScript: false },
};

export const DEFAULT_SETTINGS: WhiteNoiseSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  presets: [...DEFAULT_PRESETS, ...BUILTIN_CHIME_PRESETS],
  pomodoro: { focus: DEFAULT_FOCUS_PHASE, break: DEFAULT_BREAK_PHASE },
  lastUsed: { manualPresetId: null, masterVolume: 0.6 },
};
