import type { DefaultSettingsStrings } from './index';

const strings: DefaultSettingsStrings = {
  presets: {
    focus: { name: '集中', description: 'ブラウンノイズにベータ波帯のビートを重ね、集中作業に向けた組み合わせです。' },
    creative: { name: '発想', description: 'ピンクノイズにアルファ波帯のビートを重ね、リラックスした発想向けの組み合わせです。' },
    study: { name: '学習', description: 'ホワイトノイズにガンマ波帯のビートを重ね、学習や読解に向けた組み合わせです。' },
    meditation: { name: '瞑想', description: '背景音なしでシータ波帯のビートのみを流す、瞑想向けの組み合わせです。' },
    sleep: { name: '睡眠', description: 'ブラウンノイズにデルタ波帯のビートを重ね、深い休息に向けた組み合わせです。' },
    file1: { name: 'カスタム音声ファイル', description: '任意の音声ファイルを背景音として再生します。ビートは別途オンにできます。' },
    custom1: { name: 'カスタムコード', description: '独自の波形コードを背景音として再生します。ビートは別途オンにできます。' },
  },
  chimes: {
    bell: 'ベル',
    beep: 'ビープ',
    marimba: 'マリンバ',
  },
  phaseEnd: {
    focusToastMessage: '集中時間終了！休憩しましょう。',
    breakToastMessage: '休憩終了！集中を再開しましょう。',
  },
};

export default strings;
