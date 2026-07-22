import * as vscode from 'vscode';
import type { HostStrings } from './i18n/host';
import { formatMMSS } from './pomodoro/format';

// ブランド名自体は VS Code 本体を翻訳しないのと同様、ロケールに関係なく据え置きます。
const BRAND = 'White Noise';

export class StatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor(private readonly strings: HostStrings) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'whiteNoise.statusBar.action';
    this.renderIdle(false);
    this.item.show();
  }

  renderIdle(canQuickPlay: boolean): void {
    this.item.text = `$(headphones) ${BRAND}`;
    this.item.tooltip = canQuickPlay ? this.strings.statusBar.idleTooltipQuickPlay : this.strings.statusBar.idleTooltipOpenPanel(this.strings.chrome.panelTitle);
  }

  /** listenTimerRemainingSec はスリープタイマー（リスニングタイマー）の残り秒数です。
   * ポモドーロと違い extension 側では状態を持たないクライアント駆動のタイマーのため、
   * webview から届く ui:listenTimerTick の値をそのまま渡してもらいます。 */
  renderPreset(icon: string | undefined, name: string, listenTimerRemainingSec?: number | null): void {
    const timerSuffix = listenTimerRemainingSec != null ? ` $(watch) ${formatMMSS(listenTimerRemainingSec)}` : '';
    this.item.text = `${icon ?? '$(headphones)'} ${name}${timerSuffix}`;
    this.item.tooltip =
      listenTimerRemainingSec != null
        ? this.strings.statusBar.presetPlayingTooltipWithTimer(name, formatMMSS(listenTimerRemainingSec))
        : this.strings.statusBar.presetPlayingTooltip(name);
  }

  renderPomodoro(barText: string, mmss: string, phase: 'focus' | 'break', paused: boolean): void {
    const icon = paused ? '$(debug-pause)' : phase === 'break' ? '$(coffee)' : '$(flame)';
    this.item.text = `${icon} [${barText}] ${mmss}`;
    this.item.tooltip = this.strings.statusBar.pomodoroTooltip(this.strings.statusBar.phaseLabel[phase]);
  }

  dispose(): void {
    this.item.dispose();
  }
}
