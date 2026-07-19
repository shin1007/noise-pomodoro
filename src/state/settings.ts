import type { AmbientPreset, PhaseConfig, PresetConfig, WhiteNoiseSettings } from '../protocol';

export const SETTINGS_SCHEMA_VERSION = 2;
export const SETTINGS_KEY = 'whiteNoise.settings';

// デルタ 0.5-4Hz / シータ 4-8Hz / アルファ 8-13Hz / ベータ 13-30Hz / ガンマ 30-40Hz の
// 代表周波数です。プリセット定義や UI の帯域チップから参照します。
export const BEAT_FREQUENCY_BY_BAND = {
  delta: 0.5,
  theta: 6,
  alpha: 10,
  beta: 18,
  gamma: 36,
} as const;

export const DEFAULT_AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'focus',
    name: '集中',
    icon: '🧠',
    description: 'ブラウンノイズにベータ波帯のビートを重ね、集中作業に向けた組み合わせです。',
    background: { mode: 'procedural', noiseType: 'brown' },
    beat: { enabled: true, baseFrequency: 417, beatFrequency: BEAT_FREQUENCY_BY_BAND.beta },
    volume: 0.55,
  },
  {
    id: 'creative',
    name: '発想',
    icon: '🎨',
    description: 'ピンクノイズにアルファ波帯のビートを重ね、リラックスした発想向けの組み合わせです。',
    background: { mode: 'procedural', noiseType: 'pink' },
    beat: { enabled: true, baseFrequency: 528, beatFrequency: BEAT_FREQUENCY_BY_BAND.alpha },
    volume: 0.55,
  },
  {
    id: 'study',
    name: '学習',
    icon: '📚',
    description: 'ホワイトノイズにガンマ波帯のビートを重ね、学習や読解に向けた組み合わせです。',
    background: { mode: 'procedural', noiseType: 'white' },
    beat: { enabled: true, baseFrequency: 741, beatFrequency: BEAT_FREQUENCY_BY_BAND.gamma },
    volume: 0.55,
  },
  {
    id: 'meditation',
    name: '瞑想',
    icon: '🧘',
    description: '背景音なしでシータ波帯のビートのみを流す、瞑想向けの組み合わせです。',
    background: { mode: 'off' },
    beat: { enabled: true, baseFrequency: 396, beatFrequency: BEAT_FREQUENCY_BY_BAND.theta },
    volume: 0.5,
  },
  {
    id: 'sleep',
    name: '睡眠',
    icon: '😴',
    description: 'ブラウンノイズにデルタ波帯のビートを重ね、深い休息に向けた組み合わせです。',
    background: { mode: 'procedural', noiseType: 'brown' },
    beat: { enabled: true, baseFrequency: 174, beatFrequency: BEAT_FREQUENCY_BY_BAND.delta },
    volume: 0.5,
  },
  {
    id: 'file1',
    name: 'カスタム音声ファイル',
    icon: '📁',
    description: '任意の音声ファイルを背景音として再生します。ビートは別途オンにできます。',
    background: { mode: 'file' },
    beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
    volume: 0.7,
  },
  {
    id: 'custom1',
    name: 'カスタムコード',
    icon: '🧪',
    description: '独自の波形コードを背景音として再生します。ビートは別途オンにできます。',
    background: { mode: 'custom', custom: { code: 'return Math.sin(2 * Math.PI * 220 * t);', params: {} } },
    beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
    volume: 0.5,
  },
];

export const SOLFEGGIO_FREQUENCIES = [174, 285, 396, 417, 528, 639, 741, 852, 963] as const;

// 終了時に鳴らす組み込みのワンショット音 3 種です。PhaseEndAction.soundPresetId は、
// ユーザー自身のカスタムコードやファイルのプリセットなど、他の任意の chime preset id に
// 差し替えられます。ここにあるのは「無難な初期値」であり、唯一の選択肢ではありません。
export const CHIME_PRESETS: PresetConfig[] = [
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
  presetId: 'focus',
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
  ambientPresets: DEFAULT_AMBIENT_PRESETS,
  chimePresets: CHIME_PRESETS,
  pomodoro: { focus: DEFAULT_FOCUS_PHASE, break: DEFAULT_BREAK_PHASE },
  lastUsed: {
    background: { mode: 'procedural', noiseType: 'white' },
    beat: { enabled: false, baseFrequency: 528, beatFrequency: 10 },
    beatMode: 'binaural',
    masterVolume: 0.6,
    activePresetId: null,
  },
};
