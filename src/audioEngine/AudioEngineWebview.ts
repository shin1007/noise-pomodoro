import * as vscode from 'vscode';
import { buildEngineHtml } from './engineHtml';
import type { EngineToExtMessage, ExtToEngineMessage, ResolvedEnginePreset } from '../protocol';
import { logger } from '../utils/logger';

export interface AudioEngineCallbacks {
  onPlaybackStarted(presetId: string): void;
  onPlaybackError(presetId: string, message: string): void;
  /** ループしないファイルが、明示的な停止以外で自然に再生終了したときに呼びます。 */
  onPlaybackEnded(presetId: string): void;
  /** 再生中の可能性がある状態で、バックグラウンドタブが閉じられたときに呼びます。 */
  onEngineClosed(): void;
}

/**
 * 実際の Web Audio / AudioWorklet グラフを持つバックグラウンド用 WebviewPanel を管理します。
 * VS Code には完全に隠した webview がないため、実質的に裏で持つ形です。初回再生時に遅延生成します。
 */
export class AudioEngineWebview {
  private static current: AudioEngineWebview | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly callbacks: AudioEngineCallbacks;
  private ready = false;
  private pending: ExtToEngineMessage[] = [];
  private disposed = false;

  static getOrCreate(context: vscode.ExtensionContext, callbacks: AudioEngineCallbacks): AudioEngineWebview {
    if (AudioEngineWebview.current && !AudioEngineWebview.current.disposed) {
      return AudioEngineWebview.current;
    }
    AudioEngineWebview.current = new AudioEngineWebview(context, callbacks);
    return AudioEngineWebview.current;
  }

  static hasInstance(): boolean {
    return !!AudioEngineWebview.current && !AudioEngineWebview.current.disposed;
  }

  static disposeInstance(): void {
    AudioEngineWebview.current?.panel.dispose();
  }

  private constructor(context: vscode.ExtensionContext, callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
    this.panel = vscode.window.createWebviewPanel(
      'whiteNoise.audioEngine',
      'White Noise Engine (do not close)',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist')],
      },
    );
    this.panel.webview.html = buildEngineHtml(this.panel.webview, context.extensionUri);
    this.panel.webview.onDidReceiveMessage((message: EngineToExtMessage) => this.handleMessage(message), null, this.disposables);
    this.panel.onDidDispose(() => this.handleDispose(), null, this.disposables);
    logger.info('AudioEngineWebview を作成しました（遅延読み込み）。');
  }

  play(preset: ResolvedEnginePreset): void {
    this.send({ type: 'eng:play', preset });
  }

  /** 背景再生を邪魔せず、短いワンショット音（フェーズ終了音など）を鳴らします。 */
  playOneShot(preset: ResolvedEnginePreset): void {
    this.send({ type: 'eng:playOneShot', preset });
  }

  stop(): void {
    this.send({ type: 'eng:stop' });
  }

  pause(): void {
    this.send({ type: 'eng:pause' });
  }

  resume(): void {
    this.send({ type: 'eng:resume' });
  }

  setVolume(volume: number): void {
    this.send({ type: 'eng:setVolume', volume });
  }

  setParam(presetId: string, paramKey: string, value: number): void {
    this.send({ type: 'eng:setParam', presetId, paramKey, value });
  }

  setCustomCode(presetId: string, code: string, params: Record<string, number>): void {
    this.send({ type: 'eng:setCustomCode', presetId, code, params });
  }

  private send(message: ExtToEngineMessage): void {
    if (!this.ready) {
      this.pending.push(message);
      return;
    }
    void this.panel.webview.postMessage(message);
  }

  private handleMessage(message: EngineToExtMessage): void {
    switch (message.type) {
      case 'eng:ready':
        this.ready = true;
        logger.info('AudioEngineWebview が ready を通知しました。');
        for (const queued of this.pending) {
          void this.panel.webview.postMessage(queued);
        }
        this.pending = [];
        break;
      case 'eng:playbackStarted':
        this.callbacks.onPlaybackStarted(message.presetId);
        break;
      case 'eng:playbackError':
        this.callbacks.onPlaybackError(message.presetId, message.message);
        break;
      case 'eng:playbackEnded':
        this.callbacks.onPlaybackEnded(message.presetId);
        break;
      default:
        break;
    }
  }

  private handleDispose(): void {
    this.disposed = true;
    this.ready = false;
    if (AudioEngineWebview.current === this) {
      AudioEngineWebview.current = undefined;
    }
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
    logger.warn('AudioEngineWebview のタブが閉じられたため、音声再生を停止しました。');
    this.callbacks.onEngineClosed();
  }
}
