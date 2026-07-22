import * as vscode from 'vscode';
import type { HostStrings } from './i18n/host';
import { formatMMSS, formatProgressBar } from './pomodoro/format';

// ブランド名自体は VS Code 本体を翻訳しないのと同様、ロケールに関係なく据え置きます。
const BRAND = 'White Noise';

// アイドル時の "White Noise" を基準に、アイコンの後ろに続くテキスト部分の最大幅とします
// （プリセット名やポモドーロのプログレスバーで、アイドル時より横幅が広がらないようにするため）。
// $(icon) のようなコディコン表記は概算で1文字ぶんとして扱います。
const MAX_LABEL_LEN = BRAND.length;

function truncateLabel(text: string, maxLen: number): string {
  if (maxLen <= 0) {
    return '';
  }
  if (text.length <= maxLen) {
    return text;
  }
  if (maxLen === 1) {
    return '…';
  }
  return `${text.slice(0, maxLen - 1)}…`;
}

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
   * webview から届く ui:listenTimerTick の値をそのまま渡してもらいます。
   * 名前は MAX_LABEL_LEN に収まるよう切り詰めます（タイマー表示中はその分を差し引いた残り幅）。
   * ツールチップには切り詰め前の name をそのまま渡します。 */
  renderPreset(icon: string | undefined, name: string, listenTimerRemainingSec?: number | null): void {
    const hasTimer = listenTimerRemainingSec != null;
    const timerMMSS = hasTimer ? formatMMSS(listenTimerRemainingSec) : '';
    const timerCost = hasTimer ? 3 + timerMMSS.length : 0; // " " + $(watch) + " " + "MM:SS"
    const truncatedName = truncateLabel(name, Math.max(1, MAX_LABEL_LEN - timerCost));
    const timerSuffix = hasTimer ? ` $(watch) ${timerMMSS}` : '';
    this.item.text = `${icon ?? '$(headphones)'} ${truncatedName}${timerSuffix}`;
    this.item.tooltip = hasTimer ? this.strings.statusBar.presetPlayingTooltipWithTimer(name, timerMMSS) : this.strings.statusBar.presetPlayingTooltip(name);
  }

  /** "[bar] mmss" が MAX_LABEL_LEN に収まるよう、mmss とブラケット・区切りぶんを
   * 差し引いた残りをバーのマス目数にします（既定の10マスだとステータスバーが
   * "White Noise" よりかなり広がってしまうため）。 */
  renderPomodoro(remainingSec: number, totalSec: number, phase: 'focus' | 'break', paused: boolean): void {
    const icon = paused ? '$(debug-pause)' : phase === 'break' ? '$(coffee)' : '$(flame)';
    const mmss = formatMMSS(remainingSec);
    const barSegments = Math.max(1, MAX_LABEL_LEN - 3 - mmss.length); // "[" + "]" + " "
    const bar = formatProgressBar(remainingSec, totalSec, barSegments);
    this.item.text = `${icon} [${bar}] ${mmss}`;
    this.item.tooltip = this.strings.statusBar.pomodoroTooltip(this.strings.statusBar.phaseLabel[phase]);
  }

  dispose(): void {
    this.item.dispose();
  }
}
