// engineClient.ts（webview）と worklet プロセッサ間でやり取りするメッセージです。
// extension <-> webview の境界を定義する protocol.ts とは別に管理します。

export type NoiseType = 'white' | 'pink' | 'brown';
export type ToneType = 'isochronic' | 'binaural' | 'solfeggio';

export type WorkletInMessage =
  | { type: 'setNoiseType'; value: NoiseType }
  | { type: 'setToneType'; value: ToneType }
  | { type: 'setVolume'; value: number }
  | { type: 'setParam'; key: string; value: number }
  | { type: 'setCustomCode'; code: string; params: Record<string, number> };

export type WorkletOutMessage = { type: 'customCodeError'; message: string };
