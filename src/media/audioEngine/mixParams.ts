// engineClient.ts からミックス計算の純粋なロジックだけを切り出したものです。
// engineClient.ts 本体は import 時に acquireVsCodeApi() を呼ぶ副作用があり Node から
// 直接 import できないため、unit テスト対象にしたい計算部分をここへ分離しています。

import type { BeatMode } from '../../protocol';
import { clampFinite } from '../../utils/clamp';

// バックグラウンドとビートの、それぞれのゲインの目標値です。両方が有効なときは
// バックグラウンドを主、ビートを従にした固定比率でミックスします（参考にした
// noise_generator プロジェクトの noiseLevel/toneLevel 比率に合わせています）。
export const BACKGROUND_GAIN_WITH_BEAT = 0.86;
export const BACKGROUND_GAIN_ALONE = 1.0;
export const BEAT_GAIN = 0.12;

// スピーカーへ渡る直前の最後の防波堤です。破損した globalState や Settings Sync 経由で
// 1.0 を超える音量や NaN / Infinity が届いても、突発的な大音量（難聴・機器破損）や
// AudioParam の例外（setTargetAtTime は非有限値で throw する）を起こさないよう [0, 1] に収めます。
// 非有限値は必ず 0（無音）へ倒します。
export function safeGain(value: number): number {
  return clampFinite(value, 0, 1, 0);
}

export function safeFrequency(value: number, fallback: number): number {
  return clampFinite(value, 0, 20000, fallback);
}

export function beatParamKey(mode: BeatMode): 'beatFreq' | 'pulseFreq' {
  return mode === 'binaural' ? 'beatFreq' : 'pulseFreq';
}

/** 背景音・ビートそれぞれの目標ゲインです。ビート有効時のみ両方を混ぜた比率にします。 */
export function mixLevels(beatEnabled: boolean): { backgroundLevel: number; beatLevel: number } {
  return {
    backgroundLevel: beatEnabled ? BACKGROUND_GAIN_WITH_BEAT : BACKGROUND_GAIN_ALONE,
    beatLevel: beatEnabled ? BEAT_GAIN : 0,
  };
}
