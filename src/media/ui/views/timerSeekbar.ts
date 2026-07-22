// スリープタイマー／ポモドーロタイマー共通の「シークバー」ウィジェットです。残り時間を
// スライダーの位置とラベルで表示し、ドラッグで値を設定できます（両方が同じウィジェットを
// 使い回すのは見た目・操作感を統一するためです）。毎秒の tick 更新は render() を経由せず
// updateTimerSeekbar() で直接 DOM を書き換えます（state.ts の patchPomodoroTransportButtons()
// と同じ、ちらつき回避のための直接パッチ方式）。

import { el, rangeSlider } from '../dom';

export const TIMER_SEEKBAR_MAX_MINUTES = 60;

export interface TimerSeekbarOptions {
  /** ドラッグでの値変更を許可するか（もう一方のタイマーが動作中は false にして競合を防ぎます）。 */
  interactive: boolean;
  /** ドラッグ中、1分刻みで丸めた分数を継続的に通知します。 */
  onSetMinutes?: (minutes: number) => void;
}

/** シークバーの DOM（id=rootId）を新規生成します。初期表示は呼び出し側が updateTimerSeekbar() で行ってください。 */
export function createTimerSeekbar(rootId: string, options: TimerSeekbarOptions): HTMLElement {
  const label = el('span', { className: 'timer-seekbar-label' });
  const slider = rangeSlider({
    min: 0,
    max: TIMER_SEEKBAR_MAX_MINUTES,
    step: 1,
    value: 0,
    event: 'input',
    onChange: (minutes) => options.onSetMinutes?.(minutes),
  });
  slider.className = 'timer-seekbar-slider';
  slider.disabled = !options.interactive;
  return el('div', { className: 'timer-seekbar', id: rootId }, [label, slider]);
}

/** シークバーのラベルとつまみ位置を、DOM を作り直さずその場で更新します（1秒ごとの tick 用）。 */
export function updateTimerSeekbar(rootId: string, remainingSec: number, labelText: string): void {
  const root = document.getElementById(rootId);
  if (!root) {
    return;
  }
  const label = root.querySelector<HTMLElement>('.timer-seekbar-label');
  const slider = root.querySelector<HTMLInputElement>('.timer-seekbar-slider');
  if (label) {
    label.textContent = labelText;
  }
  if (slider) {
    slider.value = String(Math.round(remainingSec / 60));
  }
}
