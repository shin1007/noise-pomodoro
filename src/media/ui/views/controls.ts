import type { NoisePomodoroSettings } from '../../../protocol';
import { button, el, labelRow, rangeSlider, stepper } from '../dom';
import { strings } from '../i18n';
import { post, requestRender } from '../state';

// 出力音量の上限は普段調整しない項目のため、既定では行ごと隠し、Volume 欄のボタンで
// 必要なときだけ出し入れする表示にしています。
let outputLimiterExpanded = false;

export function renderVolumeControl(app: HTMLElement, s: NoisePomodoroSettings): void {
  const currentPercent = () => Math.round(s.lastUsed.masterVolume * 100);
  const { group: stepperGroup, value: valueDisplay } = stepper(`${currentPercent()}%`, () => apply(currentPercent() - 1), () => apply(currentPercent() + 1));
  const slider = rangeSlider({ min: 0, max: 100, step: 1, value: currentPercent(), event: 'input', onChange: apply });

  function apply(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    s.lastUsed.masterVolume = clamped / 100;
    valueDisplay.textContent = `${clamped}%`;
    slider.value = String(clamped);
    post({ type: 'ui:setMasterVolume', value: clamped / 100 });
  }

  const limiterToggle = button(outputLimiterExpanded ? '▾' : '▸', 'icon-button', () => {
    outputLimiterExpanded = !outputLimiterExpanded;
    requestRender();
  });
  limiterToggle.title = strings.controls.outputLimiterLabel;
  stepperGroup.appendChild(limiterToggle);

  app.appendChild(el('div', { className: 'control-group' }, [labelRow(strings.controls.volumeLabel, stepperGroup), slider]));
}

/** 全レイヤー共通で最終的にスピーカーへ出す音量の上限（settings.audioOutputScale）です。
 * 音量スライダー・プリセット音量の表示には影響せず、実際に耳に届く音量だけを絞ります。
 * 普段使わない設定のため、Volume 欄のボタンで開くまでは行ごと表示しません。 */
export function renderOutputLimiterControl(app: HTMLElement, s: NoisePomodoroSettings): void {
  if (!outputLimiterExpanded) {
    return;
  }
  const currentPercent = () => Math.round(s.audioOutputScale * 100);
  const { group: stepperGroup, value: valueDisplay } = stepper(`${currentPercent()}%`, () => apply(currentPercent() - 1), () => apply(currentPercent() + 1));
  const slider = rangeSlider({ min: 0, max: 100, step: 1, value: currentPercent(), event: 'input', onChange: apply });

  function apply(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    s.audioOutputScale = clamped / 100;
    valueDisplay.textContent = `${clamped}%`;
    slider.value = String(clamped);
    post({ type: 'ui:setAudioOutputScale', value: clamped / 100 });
  }

  app.appendChild(el('div', { className: 'control-group' }, [labelRow(strings.controls.outputLimiterLabel, stepperGroup), slider]));
}
