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

export interface BrainwaveBand {
  key: string;
  label: string;
  symbol: string;
  min: number;
  max: number;
  targetHz: number;
}

export const BRAINWAVE_BANDS: BrainwaveBand[] = [
  { key: 'delta', label: 'デルタ', symbol: 'Δ', min: 0.5, max: 4, targetHz: 0.5 },
  { key: 'theta', label: 'シータ', symbol: 'θ', min: 4, max: 8, targetHz: 6 },
  { key: 'alpha', label: 'アルファ', symbol: 'α', min: 8, max: 13, targetHz: 10 },
  { key: 'beta', label: 'ベータ', symbol: 'β', min: 13, max: 30, targetHz: 18 },
  { key: 'gamma', label: 'ガンマ', symbol: 'γ', min: 30, max: 40, targetHz: 36 },
];

export function bandForFrequency(freq: number): BrainwaveBand {
  return BRAINWAVE_BANDS.find((band) => freq >= band.min && (band.key === 'gamma' ? freq <= band.max : freq < band.max)) ?? BRAINWAVE_BANDS[2];
}

export const NOISE_CHIPS: Array<{ key: NoiseType; label: string }> = [
  { key: 'white', label: 'ホワイト' },
  { key: 'pink', label: 'ピンク' },
  { key: 'brown', label: 'ブラウン' },
  { key: 'blue', label: 'ブルー' },
  { key: 'violet', label: 'ヴァイオレット' },
];

export function noiseLabel(type: NoiseType): string {
  return NOISE_CHIPS.find((chip) => chip.key === type)?.label ?? type;
}
