import * as vscode from 'vscode';
import { buildUiHtml } from './uiHtml';
import type { ExtToUiMessage, UiToExtMessage } from '../protocol';
import { logger } from '../utils/logger';

/**
 * 表示用の GUI WebviewPanel を管理します。再生や設定の状態はここでは持たず、
 * extension.ts を単一の truth source にしているため、このパネルを閉じても音声再生や
 * ステータスバーは動き続けます。Zen Mode 要件にも対応しやすい構成です。
 */
export class UIPanelWebview {
  private static current: UIPanelWebview | undefined;
  private static readonly viewType = 'whiteNoise.uiPanel';

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  static createOrShow(context: vscode.ExtensionContext, dispatch: (message: UiToExtMessage) => void): void {
    if (UIPanelWebview.current) {
      UIPanelWebview.current.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(UIPanelWebview.viewType, 'White Noise & Pomodoro', vscode.ViewColumn.Beside, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
    });

    UIPanelWebview.current = new UIPanelWebview(panel, context, dispatch);
  }

  /** パネルが開いていなくても何もしません。呼び出し側が事前確認する必要はありません。 */
  static postMessage(message: ExtToUiMessage): void {
    void UIPanelWebview.current?.panel.webview.postMessage(message);
  }

  static isVisible(): boolean {
    return !!UIPanelWebview.current?.panel.visible;
  }

  static disposeInstance(): void {
    UIPanelWebview.current?.panel.dispose();
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, private readonly dispatch: (message: UiToExtMessage) => void) {
    this.panel = panel;
    this.panel.webview.html = buildUiHtml(this.panel.webview, context.extensionUri);

    this.panel.webview.onDidReceiveMessage((message: UiToExtMessage) => this.dispatch(message), null, this.disposables);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private dispose(): void {
    UIPanelWebview.current = undefined;
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
    logger.info('UIPanelWebview を閉じました（音声エンジンは起動中なら再生を継続します）。');
  }
}
