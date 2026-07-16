// Shared DSP helpers for noiseProcessor.ts. Kept as small stateful classes so each output
// channel can own an independent instance (correlated stereo noise sounds noticeably worse).

/** Paul Kellet's refined pink noise filter -- a practical, well-documented approximation of
 * true 1/f (Voss-McCartney octave-band) pink noise, cheap enough to run per-sample. */
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
    return out * 0.11; // empirical normalization, keeps output roughly within [-1, 1]
  }
}

/** Leaky-integrated random walk (brown/red noise). The leak factor prevents unbounded DC
 * drift that a pure random walk would otherwise accumulate. */
export class BrownNoiseGenerator {
  private lastOut = 0;

  next(): number {
    const white = Math.random() * 2 - 1;
    const out = (this.lastOut + 0.02 * white) / 1.02;
    this.lastOut = out;
    return out * 3.5; // empirical gain compensation for brown noise's low-frequency-heavy energy
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
