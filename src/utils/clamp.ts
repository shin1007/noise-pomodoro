/**
 * 破損した globalState / Settings Sync / postMessage 経由で NaN・Infinity・範囲外の値が
 * 届きうるパラメータ用のクランプです。有限でなければ fallback を、有限なら [min, max] に
 * 収めた値を返します。音量・周波数・フェーズ時間など「壊れた値を安全側へ丸めたい」箇所で、
 * 3 つのバンドル（extension host / Webview / AudioWorklet）が共有します。
 */
export function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
}
