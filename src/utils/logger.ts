import * as vscode from 'vscode';

class Logger {
  private channel: vscode.OutputChannel | undefined;

  private get out(): vscode.OutputChannel {
    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel('White Noise & Pomodoro');
    }
    return this.channel;
  }

  info(message: string): void {
    this.out.appendLine(`[info] ${message}`);
  }

  warn(message: string): void {
    this.out.appendLine(`[warn] ${message}`);
  }

  error(message: string): void {
    this.out.appendLine(`[error] ${message}`);
  }

  dispose(): void {
    this.channel?.dispose();
    this.channel = undefined;
  }
}

export const logger = new Logger();
