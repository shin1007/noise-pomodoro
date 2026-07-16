import type { NoiseType, WorkletInMessage } from './messages';
import { BrownNoiseGenerator, PinkNoiseGenerator } from './dsp';

/** One node, three noise types switchable at runtime via port messages -- avoids re-instantiating
 * the AudioWorkletNode (and losing filter/integrator state) whenever the user changes preset. */
class NoiseProcessor extends AudioWorkletProcessor {
  private noiseType: NoiseType = 'white';
  private volume = 0.6;
  // Independent generator per channel: correlated (identical) noise across L/R is audibly worse.
  private readonly pinkGenerators: PinkNoiseGenerator[] = [];
  private readonly brownGenerators: BrownNoiseGenerator[] = [];

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
      }
    }
    return true;
  }
}

registerProcessor('noise-processor', NoiseProcessor);
