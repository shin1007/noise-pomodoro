import type { ToneType, WorkletInMessage } from './messages';

const ENVELOPE_RAMP_SEC = 0.005; // 5ms smoothing on the isochronic gate to avoid clicks
const TWO_PI = Math.PI * 2;

/** One node, three oscillator-based tone types switchable at runtime via port messages. */
class ToneProcessor extends AudioWorkletProcessor {
  private toneType: ToneType = 'solfeggio';
  private volume = 0.5;
  private carrierFreq = 528; // also used as the solfeggio frequency
  private beatFreq = 10; // binaural L/R difference, Hz
  private pulseFreq = 10; // isochronic gate rate, Hz

  private phaseLeft = 0;
  private phaseRight = 0;
  private pulsePhase = 0;
  private envelope = 0;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<WorkletInMessage>) => this.handleMessage(event.data);
  }

  private handleMessage(message: WorkletInMessage): void {
    switch (message.type) {
      case 'setToneType':
        this.toneType = message.value;
        break;
      case 'setVolume':
        this.volume = message.value;
        break;
      case 'setParam':
        this.setParam(message.key, message.value);
        break;
      default:
        break;
    }
  }

  private setParam(key: string, value: number): void {
    switch (key) {
      case 'carrierFreq':
      case 'solfeggioFreq':
        this.carrierFreq = value;
        break;
      case 'beatFreq':
        this.beatFreq = value;
        break;
      case 'pulseFreq':
        this.pulseFreq = value;
        break;
      default:
        break;
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0];
    const left = output[0];
    const right = output[1] ?? output[0];
    const dt = 1 / sampleRate;

    for (let i = 0; i < left.length; i++) {
      if (this.toneType === 'binaural') {
        this.phaseLeft = (this.phaseLeft + TWO_PI * this.carrierFreq * dt) % TWO_PI;
        this.phaseRight = (this.phaseRight + TWO_PI * (this.carrierFreq + this.beatFreq) * dt) % TWO_PI;
        left[i] = Math.sin(this.phaseLeft) * this.volume;
        right[i] = Math.sin(this.phaseRight) * this.volume;
      } else if (this.toneType === 'isochronic') {
        this.phaseLeft = (this.phaseLeft + TWO_PI * this.carrierFreq * dt) % TWO_PI;
        const carrier = Math.sin(this.phaseLeft);

        this.pulsePhase = (this.pulsePhase + this.pulseFreq * dt) % 1;
        const gateOn = this.pulsePhase < 0.5 ? 1 : 0;
        const rampCoeff = Math.min(1, dt / ENVELOPE_RAMP_SEC);
        this.envelope += (gateOn - this.envelope) * rampCoeff;

        const sample = carrier * this.envelope * this.volume;
        left[i] = sample;
        right[i] = sample;
      } else {
        this.phaseLeft = (this.phaseLeft + TWO_PI * this.carrierFreq * dt) % TWO_PI;
        const sample = Math.sin(this.phaseLeft) * this.volume;
        left[i] = sample;
        right[i] = sample;
      }
    }
    return true;
  }
}

registerProcessor('tone-processor', ToneProcessor);
