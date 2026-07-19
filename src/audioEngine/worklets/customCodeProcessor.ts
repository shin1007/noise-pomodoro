import type { WorkletInMessage, WorkletOutMessage } from './messages';
import { clamp, clampFinite } from './dsp';

type CompiledFn = (t: number, params: Record<string, number>) => number;

/**
 * ポリシーではなくスコープで隔離しています。ここでの `new Function` は AudioWorkletGlobalScope
 * 内で動き、window / document / fetch / filesystem / Node API に到達できません。
 * ユーザーの式が何をしても、この worklet の外側には出られません。対応する CSP の説明は appHtml.ts を参照してください。
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
        this.volume = clampFinite(message.value, 0, 1, this.volume);
        break;
      case 'setCustomCode':
        this.params = message.params;
        this.hasReportedError = false;
        try {
          // eslint-disable-next-line no-new-func -- カスタムコード機能として意図的に使用しています。
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
    // 1 つのコード版につき最初のエラーだけを報告します。毎サンプルで例外が出る式だと、
    // 1 秒あたり数万件の同一メッセージでポートが埋まってしまうためです。
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
