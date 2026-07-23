import type { UiStrings } from './index';

const strings: UiStrings = {
  loading: '読み込み中…',
  common: {
    off: 'オフ',
  },
  brainwaveBands: {
    delta: 'デルタ',
    theta: 'シータ',
    alpha: 'アルファ',
    beta: 'ベータ',
    gamma: 'ガンマ',
  },
  noiseTypes: {
    white: 'ホワイト',
    pink: 'ピンク',
    brown: 'ブラウン',
    blue: 'ブルー',
    violet: 'ヴァイオレット',
  },
  background: {
    heading: '背景音',
    fileMode: '📁 音声ファイル',
    customMode: '🧪 カスタムコード',
    fileLabel: (fileName) => `ファイル: ${fileName}`,
    noFileSelected: 'ファイルが未選択です',
    changeFile: 'ファイルを変更',
    selectFile: 'ファイルを選択',
    customCodeHint: 't: 経過秒数, params: カスタムパラメータ。-1〜1 の値を return してください。',
    apply: '適用',
  },
  beat: {
    heading: 'ビート',
    baseFrequencyLabel: 'ベース周波数',
    binauralMode: 'イヤホン（バイノーラル）',
    isochronicMode: 'スピーカー（アイソクロニック）',
  },
  controls: {
    volumeLabel: '音量',
    outputLimiterLabel: '出力音量の上限',
  },
  header: {
    noNoise: 'ノイズなし',
    fileBackgroundLabel: 'ファイル',
    customBackgroundLabel: 'カスタム',
    iconPlaceholder: 'アイコン',
    namePlaceholder: '名前',
    descriptionPlaceholder: '説明',
    resetPresetsButton: 'プリセットを既定に戻す',
    applyToPresetButton: '現在の設定をプリセットに適用',
  },
  pomodoroSettings: {
    modalTitle: 'ポモドーロ設定',
    focusDuration: '集中時間',
    breakDuration: '休憩時間',
    timeMinutesLabel: '時間 (分): ',
    noneOption: '(なし)',
    soundLabel: ' サウンド: ',
    autoAdvanceLabel: ' 自動的に次のフェーズへ',
    toastOnEndLabel: ' 終了時にトースト通知',
    playEndSoundLabel: ' 終了音を鳴らす: ',
  },
  timer: {
    heading: 'タイマー',
    none: 'なし',
    minutesUnit: (n) => `${n}分`,
    start: '開始',
    resume: '再開',
    pause: '一時停止',
    reset: 'リセット',
    skipPhase: '次のフェーズへ',
    pomodoroToggle: (on) => `ポモドーロ ${on ? 'ON' : 'OFF'}`,
  },
};

export default strings;
