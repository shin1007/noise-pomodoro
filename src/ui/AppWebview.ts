import * as vscode from 'vscode';
import { buildAppHtml } from './appHtml';
import type { EngineToExtMessage, ExtToEngineMessage, ExtToUiMessage, ResolvedEnginePreset, ResolvedLiveMix, UiToExtMessage } from '../protocol';
import type { Locale } from '../i18n/locale';
import type { HostStrings } from '../i18n/host';
import { logger } from '../utils/logger';

export interface AppWebviewCallbacks {
  dispatch(message: UiToExtMessage): void;
  onPlaybackStarted(): void;
  /** 背景音レイヤーまたはビートレイヤーの再生に失敗したときに呼びます。もう片方のレイヤーは影響を受けません。 */
  onPlaybackError(layer: 'background' | 'beat', message: string): void;
  /** ループしないファイルが、明示的な停止以外で自然に再生終了したときに呼びます。ビートレイヤーは継続します。 */
  onBackgroundEnded(): void;
  /** 再生中の可能性がある状態で、パネルが閉じられたときに呼びます。 */
  onPanelClosed(): void;
}

/**
 * 操作用 UI と Web Audio / AudioWorklet エンジンを同一の WebviewPanel に同居させます。
 * 以前は2つの Webview に分けていましたが、音声エンジン側は一切ユーザー操作を受け取らない
 * ため、ブラウザの自動再生ポリシーにより AudioContext.resume() が常にブロックされたまま
 * になり、音が出ない不具合の原因になっていました。UI のクリックと同じドキュメントで
 * AudioContext を扱うことで、そのクリックがユーザー操作として有効になります。
 */
export class AppWebview {
  private static current: AppWebview | undefined;
  private static readonly viewType = 'noisePomodoro.app';

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly callbacks: AppWebviewCallbacks;
  private engineReady = false;
  private pendingEngineMessages: ExtToEngineMessage[] = [];
  private disposed = false;
  // resume() には実際のクリックに由来するユーザー操作の文脈が必要なため、一度でも
  // 再生に成功していれば、この Webview はそれ以降ブラウザの自動再生ポリシーを
  // 通過済みとみなせます。ステータスバーからの再生要求をパネルを開かず即時実行して
  // よいかどうかの判定に使います。
  private everPlayed = false;

  /** 新規生成が必要な場合、その初期表示列。既存パネルがあれば無視されます（分割位置は生成時にしか決まらないため）。 */
  static ensure(
    context: vscode.ExtensionContext,
    callbacks: AppWebviewCallbacks,
    locale: Locale,
    strings: HostStrings,
    viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside,
  ): AppWebview {
    if (AppWebview.current && !AppWebview.current.disposed) {
      return AppWebview.current;
    }
    AppWebview.current = new AppWebview(context, callbacks, locale, strings, viewColumn);
    return AppWebview.current;
  }

  /** パネルを（必要なら生成した上で）前面に表示します。ユーザーが明示的にパネルを開いたときに使います。 */
  static show(
    context: vscode.ExtensionContext,
    callbacks: AppWebviewCallbacks,
    locale: Locale,
    strings: HostStrings,
    viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside,
  ): void {
    AppWebview.ensure(context, callbacks, locale, strings, viewColumn).panel.reveal(undefined, false);
  }

  static hasInstance(): boolean {
    return !!AppWebview.current && !AppWebview.current.disposed;
  }

  /** この Webview で一度でも再生に成功していれば true。ステータスバーからパネルを開かずに再生してよいかの判定に使います。 */
  static hasEverPlayed(): boolean {
    return !!AppWebview.current?.everPlayed;
  }

  /** パネルが開いていなくても何もしません。呼び出し側が事前確認する必要はありません。 */
  static postMessage(message: ExtToUiMessage): void {
    void AppWebview.current?.panel.webview.postMessage(message);
  }

  static isVisible(): boolean {
    return !!AppWebview.current?.panel.visible;
  }

  static disposeInstance(): void {
    AppWebview.current?.panel.dispose();
  }

  private constructor(context: vscode.ExtensionContext, callbacks: AppWebviewCallbacks, locale: Locale, strings: HostStrings, viewColumn: vscode.ViewColumn) {
    this.callbacks = callbacks;
    this.panel = vscode.window.createWebviewPanel(
      AppWebview.viewType,
      strings.chrome.panelTitle,
      { viewColumn, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
      },
    );
    this.panel.webview.html = buildAppHtml(this.panel.webview, context.extensionUri, locale, strings);
    this.panel.webview.onDidReceiveMessage((message: UiToExtMessage | EngineToExtMessage) => this.handleMessage(message), null, this.disposables);
    this.panel.onDidDispose(() => this.handleDispose(), null, this.disposables);
    logger.info('AppWebview を作成しました。');
  }

  /** 現在のミックス（背景音 + ビート）で再生を開始、または再生中なら差分更新します。 */
  play(mix: ResolvedLiveMix): void {
    this.sendEngine({ type: 'eng:play', mix });
  }

  /** 背景音・ビートの再生を邪魔せず、短いワンショット音（フェーズ終了音など）を鳴らします。 */
  playOneShot(preset: ResolvedEnginePreset): void {
    this.sendEngine({ type: 'eng:playOneShot', preset });
  }

  stop(): void {
    this.sendEngine({ type: 'eng:stop' });
  }

  private sendEngine(message: ExtToEngineMessage): void {
    if (!this.engineReady) {
      this.pendingEngineMessages.push(message);
      return;
    }
    void this.panel.webview.postMessage(message);
  }

  private handleMessage(message: UiToExtMessage | EngineToExtMessage): void {
    if (message.type.startsWith('eng:')) {
      this.handleEngineMessage(message as EngineToExtMessage);
    } else {
      this.callbacks.dispatch(message as UiToExtMessage);
    }
  }

  private handleEngineMessage(message: EngineToExtMessage): void {
    switch (message.type) {
      case 'eng:ready':
        this.engineReady = true;
        logger.info('音声エンジンが ready を通知しました。');
        for (const queued of this.pendingEngineMessages) {
          void this.panel.webview.postMessage(queued);
        }
        this.pendingEngineMessages = [];
        break;
      case 'eng:playbackStarted':
        this.everPlayed = true;
        this.callbacks.onPlaybackStarted();
        break;
      case 'eng:playbackError':
        this.callbacks.onPlaybackError(message.layer, message.message);
        break;
      case 'eng:backgroundEnded':
        this.callbacks.onBackgroundEnded();
        break;
      default:
        break;
    }
  }

  private handleDispose(): void {
    this.disposed = true;
    this.engineReady = false;
    if (AppWebview.current === this) {
      AppWebview.current = undefined;
    }
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
    logger.info('AppWebview のタブが閉じられました。');
    this.callbacks.onPanelClosed();
  }
}
