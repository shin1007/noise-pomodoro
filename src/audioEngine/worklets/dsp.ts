// noiseProcessor.ts で使う共通 DSP ヘルパーです。小さな状態付きクラスにしておくことで、
// 各出力チャンネルが独立したインスタンスを持てます（L/R が相関したステレオノイズは聴感上よくありません）。

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

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
