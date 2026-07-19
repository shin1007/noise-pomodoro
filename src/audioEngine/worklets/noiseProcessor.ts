import type { NoiseType, WorkletInMessage } from './messages';
import { BlueNoiseGenerator, BrownNoiseGenerator, PinkNoiseGenerator, VioletNoiseGenerator } from './dsp';

/**
 * 1 つのノードで 3 種類のノイズを port メッセージ経由で切り替えます。
 * プリセット変更のたびに AudioWorkletNode を作り直すと、フィルタや積分状態が失われるためです。
 */
class NoiseProcessor extends AudioWorkletProcessor {
  private noiseType: NoiseType = 'white';
  private volume = 0.6;
  // チャンネルごとに独立した生成器を使います。L/R で相関した同一ノイズは聴感上よくありません。
  private readonly pinkGenerators: PinkNoiseGenerator[] = [];
  private readonly brownGenerators: BrownNoiseGenerator[] = [];
  private readonly blueGenerators: BlueNoiseGenerator[] = [];
  private readonly violetGenerators: VioletNoiseGenerator[] = [];

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
        this.volume = message.value;
        break;
      default:
        break;
    }
  }

  private pinkGenFor(channel: number): PinkNoiseGenerator {
    return (this.pinkGenerators[channel] ??= new PinkNoiseGenerator());
  }

  private brownGenFor(channel: number): BrownNoiseGenerator {
    return (this.brownGenerators[channel] ??= new BrownNoiseGenerator());
  }

  private blueGenFor(channel: number): BlueNoiseGenerator {
    return (this.blueGenerators[channel] ??= new BlueNoiseGenerator());
  }

  private violetGenFor(channel: number): VioletNoiseGenerator {
    return (this.violetGenerators[channel] ??= new VioletNoiseGenerator());
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0];
    for (let channel = 0; channel < output.length; channel++) {
      const data = output[channel];
      switch (this.noiseType) {
        case 'white':
          for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * this.volume;
          }
          break;
        case 'pink': {
          const gen = this.pinkGenFor(channel);
          for (let i = 0; i < data.length; i++) {
            data[i] = gen.next() * this.volume;
          }
          break;
        }
        case 'brown': {
          const gen = this.brownGenFor(channel);
          for (let i = 0; i < data.length; i++) {
            data[i] = gen.next() * this.volume;
          }
          break;
        }
        case 'blue': {
          const gen = this.blueGenFor(channel);
          for (let i = 0; i < data.length; i++) {
            data[i] = gen.next() * this.volume;
          }
          break;
        }
        case 'violet': {
          const gen = this.violetGenFor(channel);
          for (let i = 0; i < data.length; i++) {
            data[i] = gen.next() * this.volume;
          }
          break;
        }
      }
    }
    return true;
  }
}

registerProcessor('noise-processor', NoiseProcessor);
