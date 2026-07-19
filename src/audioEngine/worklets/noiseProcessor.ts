import type { NoiseType, WorkletInMessage } from './messages';
import { BlueNoiseGenerator, BrownNoiseGenerator, PinkNoiseGenerator, VioletNoiseGenerator, clampFinite } from './dsp';

interface ColoredNoiseGenerator {
  next(): number;
}

type ColoredNoiseType = Exclude<NoiseType, 'white'>;

// チャンネルごとに独立した生成器を使います。L/R で相関した同一ノイズは聴感上よくありません。
const COLORED_NOISE_FACTORIES: Record<ColoredNoiseType, () => ColoredNoiseGenerator> = {
  pink: () => new PinkNoiseGenerator(),
  brown: () => new BrownNoiseGenerator(),
  blue: () => new BlueNoiseGenerator(),
  violet: () => new VioletNoiseGenerator(),
};

/**
 * 1 つのノードで 3 種類のノイズを port メッセージ経由で切り替えます。
 * プリセット変更のたびに AudioWorkletNode を作り直すと、フィルタや積分状態が失われるためです。
 */
class NoiseProcessor extends AudioWorkletProcessor {
  private noiseType: NoiseType = 'white';
  private volume = 0.6;
  private readonly generatorsByType = new Map<ColoredNoiseType, ColoredNoiseGenerator[]>();

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<WorkletInMessage>) => this.handleMessage(event.data);
  }

  private handleMessage(message: WorkletInMessage): void {
    switch (message.type) {
      case 'setNoiseType':
        this.noiseType = message.value;
        break;
      case 'setVolume':
        this.volume = clampFinite(message.value, 0, 1, this.volume);
        break;
      default:
        break;
    }
  }

  private generatorFor(type: ColoredNoiseType, channel: number): ColoredNoiseGenerator {
    const perChannel = this.generatorsByType.get(type) ?? this.generatorsByType.set(type, []).get(type)!;
    return (perChannel[channel] ??= COLORED_NOISE_FACTORIES[type]());
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; channel++) {
      const data = output[channel];
      if (this.noiseType === 'white') {
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * this.volume;
        }
        continue;
      }
      const gen = this.generatorFor(this.noiseType, channel);
      for (let i = 0; i < data.length; i++) {
        data[i] = gen.next() * this.volume;
      }
    }
    return true;
  }
}

registerProcessor('noise-processor', NoiseProcessor);
