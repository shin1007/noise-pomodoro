// Messages exchanged over AudioWorkletNode.port between engineClient.ts (webview) and the
// worklet processors. Separate from protocol.ts, which covers the extension<->webview boundary.

export type NoiseType = 'white' | 'pink' | 'brown';
export type ToneType = 'isochronic' | 'binaural' | 'solfeggio';

export type WorkletInMessage =
  | { type: 'setNoiseType'; value: NoiseType }
  | { type: 'setToneType'; value: ToneType }
  | { type: 'setVolume'; value: number }
  | { type: 'setParam'; key: string; value: number }
  | { type: 'setCustomCode'; code: string; params: Record<string, number> };

export type WorkletOutMessage = { type: 'customCodeError'; message: string };
