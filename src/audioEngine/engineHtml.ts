import * as vscode from 'vscode';
import { getNonce } from '../utils/nonce';

export function buildEngineHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'media', 'engine.js'));
  const workletUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'worklets', 'processors.js'));
  const csp = [
    `default-src 'none'`,
    // 'unsafe-eval' is required only here (never in the UI panel's CSP): custom-code presets
    // compile a user-authored formula via `new Function` inside the AudioWorkletGlobalScope,
    // which inherits this document's CSP. That scope has no window/document/fetch/Node APIs of
    // its own, so it's a meaningfully sandboxed place to allow eval.
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
  <p>White Noise audio engine — do not close this tab while sound is playing. Control playback from the status bar or the White Noise panel.</p>
  <script nonce="${nonce}">window.__WORKLET_URI__ = ${JSON.stringify(workletUri.toString())};</script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
