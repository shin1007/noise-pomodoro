import * as vscode from 'vscode';

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

  renderPreset(icon: string | undefined, name: string): void {
    this.item.text = `${icon ?? '$(headphones)'} ${name}`;
    this.item.tooltip = `Playing: ${name} — click to stop`;
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
