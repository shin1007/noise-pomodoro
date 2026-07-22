import * as vscode from 'vscode';
import { formatMMSS } from './pomodoro/format';

export class StatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'whiteNoise.statusBar.action';
    this.renderIdle(false);
    this.item.show();
  }

  renderIdle(canQuickPlay: boolean): void {
    this.item.text = '$(headphones) White Noise';
    this.item.tooltip = canQuickPlay ? 'Click to play the last used sound' : 'Click to open the White Noise & Pomodoro panel';
  }

  /** listenTimerRemainingSec はスリープタイマー（リスニングタイマー）の残り秒数です。
   * ポモドーロと違い extension 側では状態を持たないクライアント駆動のタイマーのため、
   * webview から届く ui:listenTimerTick の値をそのまま渡してもらいます。 */
  renderPreset(icon: string | undefined, name: string, listenTimerRemainingSec?: number | null): void {
    const timerSuffix = listenTimerRemainingSec != null ? ` $(watch) ${formatMMSS(listenTimerRemainingSec)}` : '';
    this.item.text = `${icon ?? '$(headphones)'} ${name}${timerSuffix}`;
    this.item.tooltip =
      listenTimerRemainingSec != null
        ? `Playing: ${name} (stops in ${formatMMSS(listenTimerRemainingSec)}) — click to stop`
        : `Playing: ${name} — click to stop`;
  }

  renderPomodoro(barText: string, mmss: string, phase: 'focus' | 'break', paused: boolean): void {
    const icon = paused ? '$(debug-pause)' : phase === 'break' ? '$(coffee)' : '$(flame)';
    this.item.text = `${icon} [${barText}] ${mmss}`;
    this.item.tooltip = `Pomodoro ${phase} — click to open panel`;
  }

  dispose(): void {
    this.item.dispose();
  }
}
