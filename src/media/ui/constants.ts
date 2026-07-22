// Webview UI 全体で使う定数・分類ヘルパーです。状態を持たない純粋な値のみを置きます。

import type { NoiseType } from '../../protocol';

export const SOLFEGGIO_FREQUENCIES = [174, 285, 396, 417, 528, 639, 741, 852, 963];

export function findNearestSolfeggio(freq: number): number {
  return SOLFEGGIO_FREQUENCIES.reduce((prev, curr) => (Math.abs(curr - freq) < Math.abs(prev - freq) ? curr : prev));
}

export function stepSolfeggioFrequency(current: number, direction: -1 | 1): number {
  const nearest = findNearestSolfeggio(current);
  const index = SOLFEGGIO_FREQUENCIES.indexOf(nearest);
  const nextIndex = Math.max(0, Math.min(SOLFEGGIO_FREQUENCIES.length - 1, index + direction));
  return SOLFEGGIO_FREQUENCIES[nextIndex];
}

export type BandKey = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface BrainwaveBand {
  key: BandKey;
  symbol: string;
  min: number;
  max: number;
  targetHz: number;
}

// 表示ラベルは言語依存のため i18n/ui 側の brainwaveBands 辞書に持たせ、ここには
// キー・記号・周波数帯という言語非依存のデータだけを置きます。
export const BRAINWAVE_BANDS: BrainwaveBand[] = [
  { key: 'delta', symbol: 'Δ', min: 0.5, max: 4, targetHz: 0.5 },
  { key: 'theta', symbol: 'θ', min: 4, max: 8, targetHz: 6 },
  { key: 'alpha', symbol: 'α', min: 8, max: 13, targetHz: 10 },
  { key: 'beta', symbol: 'β', min: 13, max: 30, targetHz: 18 },
  { key: 'gamma', symbol: 'γ', min: 30, max: 40, targetHz: 36 },
];

export function bandForFrequency(freq: number): BrainwaveBand {
  return BRAINWAVE_BANDS.find((band) => freq >= band.min && (band.key === 'gamma' ? freq <= band.max : freq < band.max)) ?? BRAINWAVE_BANDS[2];
}

export const NOISE_CHIPS: Array<{ key: NoiseType }> = [{ key: 'white' }, { key: 'pink' }, { key: 'brown' }, { key: 'blue' }, { key: 'violet' }];
