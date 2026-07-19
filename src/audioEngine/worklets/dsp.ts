// noiseProcessor.ts で使う共通 DSP ヘルパーです。小さな状態付きクラスにしておくことで、
// 各出力チャンネルが独立したインスタンスを持てます（L/R が相関したステレオノイズは聴感上よくありません）。

// パラメータ用のクランプは 3 バンドル共通の実装（utils/clamp.ts）を単一のソースとし、
// worklet 側は従来どおり './dsp' から import できるよう再エクスポートします。
export { clampFinite } from '../../utils/clamp';

/**
 * Paul Kellet の改良版ピンクノイズフィルタです。真の 1/f（Voss-McCartney のオクターブ帯域）
 * ピンクノイズを実用的に近似しており、サンプル単位でも十分軽量です。
 */
export class PinkNoiseGenerator {
  private b0 = 0;
  private b1 = 0;
  private b2 = 0;
  private b3 = 0;
  private b4 = 0;
  private b5 = 0;
  private b6 = 0;

  next(): number {
    const white = Math.random() * 2 - 1;
    this.b0 = 0.99886 * this.b0 + white * 0.0555179;
    this.b1 = 0.99332 * this.b1 + white * 0.0750759;
    this.b2 = 0.969 * this.b2 + white * 0.153852;
    this.b3 = 0.8665 * this.b3 + white * 0.3104856;
    this.b4 = 0.55 * this.b4 + white * 0.5329522;
    this.b5 = -0.7616 * this.b5 - white * 0.016898;
    const out = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362;
    this.b6 = white * 0.115926;
    return out * 0.11; // 経験的な正規化で、出力をおおむね [-1, 1] に収めます。
  }
}

/**
 * 漏れ付き積分のランダムウォーク（ブラウン / レッドノイズ）です。
 * 漏れ係数で、単純なランダムウォークが抱える無制限な DC ドリフトを抑えます。
 */
export class BrownNoiseGenerator {
  private lastOut = 0;

  next(): number {
    const white = Math.random() * 2 - 1;
    const out = (this.lastOut + 0.02 * white) / 1.02;
    this.lastOut = out;
    return out * 3.5; // ブラウンノイズの低域寄りなエネルギーを補う経験的ゲイン補正です。
  }
}

/**
 * ホワイトノイズの一次差分（ハイパスに相当）です。低域が減衰し、高域寄りの
 * 明るい質感になります。
 */
export class BlueNoiseGenerator {
  private previousWhite = 0;

  next(): number {
    const white = Math.random() * 2 - 1;
    const out = white - this.previousWhite;
    this.previousWhite = white;
    return out * 0.5;
  }
}

/**
 * ホワイトノイズの二次差分です。ブルーノイズよりさらに高域寄りで、
 * 長時間の連続再生では耳が疲れやすい特性があります。
 */
export class VioletNoiseGenerator {
  private previousWhite = 0;
  private previousWhite2 = 0;

  next(): number {
    const white = Math.random() * 2 - 1;
    const out = white - 2 * this.previousWhite + this.previousWhite2;
    this.previousWhite2 = this.previousWhite;
    this.previousWhite = white;
    return out * 0.35;
  }
}

export function clamp(value: number, min: number, max: number): number {
  // NaN / Infinity は音声出力に混入させると、スピーカー破損やグラフ全体のミュートなど
  // 予測しづらい挙動を招くため、有限でない値は 0 として扱います（音声用途では常に無音側に倒す）。
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(min, Math.min(max, value));
}
