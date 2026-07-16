import * as vscode from 'vscode';
import { buildUiHtml } from './uiHtml';
import type { ExtToUiMessage, UiToExtMessage } from '../protocol';
import { logger } from '../utils/logger';

/**
 * Owns the visible GUI WebviewPanel. Holds no playback/settings state itself -- extension.ts
 * is the single source of truth so that audio keeps running (and the status bar keeps working)
 * even when this panel is closed, per the Zen Mode requirement.
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

  /** No-op if the panel isn't currently open -- callers should not need to check first. */
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
    logger.info('UIPanelWebview closed (audio engine, if running, keeps playing).');
  }
}
