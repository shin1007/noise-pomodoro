import type { WorkletInMessage, WorkletOutMessage } from './messages';
import { clamp } from './dsp';

type CompiledFn = (t: number, params: Record<string, number>) => number;

/**
 * Sandboxed by scope, not by policy: `new Function` here runs inside the AudioWorkletGlobalScope,
 * which has no window/document/fetch/filesystem/Node APIs -- it cannot reach outside this worklet
 * regardless of what the user's formula does. See engineHtml.ts for the corresponding CSP note.
 */
class CustomCodeProcessor extends AudioWorkletProcessor {
  private volume = 0.6;
  private params: Record<string, number> = {};
  private compiled: CompiledFn | undefined;
  private hasReportedError = false;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<WorkletInMessage>) => this.handleMessage(event.data);
  }

  private handleMessage(message: WorkletInMessage): void {
    switch (message.type) {
      case 'setVolume':
        this.volume = message.value;
        break;
      case 'setCustomCode':
        this.params = message.params;
        this.hasReportedError = false;
        try {
          // eslint-disable-next-line no-new-func -- intentional: this is the custom-code feature.
          this.compiled = new Function('t', 'params', message.code) as CompiledFn;
        } catch (err) {
          this.compiled = undefined;
          this.reportError(`Compile error: ${(err as Error).message}`);
        }
        break;
      default:
        break;
    }
  }

  private reportError(message: string): void {
    // Only the first error per code version is reported -- otherwise a formula that throws every
    // sample would flood the port with tens of thousands of identical messages per second.
    if (this.hasReportedError) {
      return;
    }
    this.hasReportedError = true;
    const out: WorkletOutMessage = { type: 'customCodeError', message };
    this.port.postMessage(out);
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0];
    if (!this.compiled) {
      for (const channel of output) {
        channel.fill(0);
      }
      return true;
    }

    for (let i = 0; i < output[0].length; i++) {
      const t = (currentFrame + i) / sampleRate;
      let sample = 0;
      try {
        sample = clamp(this.compiled(t, this.params), -1, 1);
      } catch (err) {
        this.reportError(`Runtime error: ${(err as Error).message}`);
        sample = 0;
      }
      sample *= this.volume;
      for (const channel of output) {
        channel[i] = sample;
      }
    }
    return true;
  }
}

registerProcessor('custom-code-processor', CustomCodeProcessor);
