import * as vscode from 'vscode';
import { getNonce } from '../utils/nonce';

/**
 * UI と音声エンジンを同一の Webview に統合した HTML を組み立てます。
 * AudioContext の resume() はユーザー操作（クリック等）が発生した Webview と
 * 同一ドキュメント内でなければブラウザの自動再生ポリシーによりブロックされ続けるため、
 * 操作系（ui.js）と音声エンジン（engine.js）は同じ Webview に同居させる必要があります。
 */
export function buildAppHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'media', 'ui.css'));
  const uiScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'media', 'ui.js'));
  const engineScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'media', 'engine.js'));
  const workletUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'worklets', 'processors.js'));
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} data:`,
    `style-src ${webview.cspSource}`,
    // `unsafe-eval` が必要なのはカスタムコードプリセットが AudioWorkletGlobalScope 内で
    // new Function によりユーザー定義式をコンパイルするためです。
    // `worklet-src` はこの Webview の CSP パーサーに認識されず script-src にフォールバックするため、
    // AudioWorklet.addModule() が読み込む processors.js を許可するには webview.cspSource を
    // script-src 自体に含める必要があります（addModule のリクエストには nonce が付与できません）。
    `script-src 'nonce-${nonce}' 'unsafe-eval' ${webview.cspSource}`,
    `media-src ${webview.cspSource} blob:`,
    `font-src ${webview.cspSource}`,
    `connect-src ${webview.cspSource}`,
  ].join('; ');

  return /* html */ `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
  <title>White Noise & Pomodoro</title>
</head>
<body>
  <div id="app">
    <p class="loading">Loading…</p>
  </div>
  <script nonce="${nonce}">window.__WORKLET_URI__ = ${JSON.stringify(workletUri.toString())};</script>
  <script nonce="${nonce}" src="${engineScriptUri}"></script>
  <script nonce="${nonce}" src="${uiScriptUri}"></script>
</body>
</html>`;
}
