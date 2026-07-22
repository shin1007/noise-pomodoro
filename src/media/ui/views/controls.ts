import type { WhiteNoiseSettings } from '../../../protocol';
import { el, labelRow, rangeSlider, stepper } from '../dom';
import { strings } from '../i18n';
import { post } from '../state';
import { MAX_MASTER_VOLUME } from '../../../utils/volume';

const MAX_PERCENT = MAX_MASTER_VOLUME * 100;

export function renderVolumeControl(app: HTMLElement, s: WhiteNoiseSettings): void {
  // 保存済みの値が上限を超えている場合（アップデート前の設定など）も、表示・スライダー位置は
  // 上限に揃えます（実際の値は次にここを操作したタイミングで揃います）。
  const currentPercent = () => Math.min(MAX_PERCENT, Math.round(s.lastUsed.masterVolume * 100));
  const { group: stepperGroup, value: valueDisplay } = stepper(`${currentPercent()}%`, () => apply(currentPercent() - 1), () => apply(currentPercent() + 1));
  const slider = rangeSlider({ min: 0, max: MAX_PERCENT, step: 1, value: currentPercent(), event: 'input', onChange: apply });

  function apply(percent: number): void {
    const clamped = Math.max(0, Math.min(MAX_PERCENT, percent));
    s.lastUsed.masterVolume = clamped / 100;
    valueDisplay.textContent = `${clamped}%`;
    slider.value = String(clamped);
    post({ type: 'ui:setMasterVolume', value: clamped / 100 });
  }

  app.appendChild(el('div', { className: 'control-group' }, [labelRow(strings.controls.volumeLabel, stepperGroup), slider]));
}
