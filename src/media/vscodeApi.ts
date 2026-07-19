// UI (ui/main.ts) と 音声エンジン (audioEngine/engineClient.ts) は同一の Webview ドキュメントに
// 同居しているため、acquireVsCodeApi() はドキュメント全体で一度しか呼べません。どちらのスクリプトが
// 先に読み込まれても安全なように、取得済みインスタンスを window 上にキャッシュして共有します。
// postMessage の型は呼び出し側で絞るため、ここでは unknown で受けます。

interface VsCodeApi {
  postMessage(message: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
}

declare function acquireVsCodeApi(): VsCodeApi;

export function getVsCodeApi(): VsCodeApi {
  const w = window as unknown as { __vscodeApi__?: VsCodeApi };
  return (w.__vscodeApi__ ??= acquireVsCodeApi());
}
