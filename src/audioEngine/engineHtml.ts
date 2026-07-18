import * as vscode from 'vscode';
import { getNonce } from '../utils/nonce';

export function buildEngineHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'media', 'engine.js'));
  const workletUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'worklets', 'processors.js'));
  const csp = [
    `default-src 'none'`,
    // `unsafe-eval` が必要なのはここだけです。UI パネルの CSP には入れません。
    // カスタムコードのプリセットは AudioWorkletGlobalScope 内で `new Function` により
    // ユーザー定義の式をコンパイルしますが、そのスコープには window / document /
    // fetch / Node API がないため、実用上の分離は維持できます。
    `script-src 'nonce-${nonce}' 'unsafe-eval'`,
    `worklet-src ${webview.cspSource} blob:`,
    `media-src ${webview.cspSource} blob:`,
  ].join('; ');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <title>White Noise Engine</title>
</head>
<body>
  <p>White Noise の音声エンジンです。再生中はこのタブを閉じないでください。操作はステータスバーか White Noise パネルから行えます。</p>
  <script nonce="${nonce}">window.__WORKLET_URI__ = ${JSON.stringify(workletUri.toString())};</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
