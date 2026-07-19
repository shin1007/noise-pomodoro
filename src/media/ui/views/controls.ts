import type { WhiteNoiseSettings } from '../../../protocol';
import { el, labelRow, rangeSlider, stepper } from '../dom';
import { formatRemaining, listenTimerMinutes, listenTimerRemainingSec, post, setListenTimerMinutes } from '../state';

export function renderVolumeControl(app: HTMLElement, s: WhiteNoiseSettings): void {
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

  app.appendChild(el('div', { className: 'control-group' }, [labelRow('音量', stepperGroup), slider]));
}

export function renderTimerControl(app: HTMLElement): void {
  const label = () => (listenTimerMinutes === 0 ? 'なし' : `${listenTimerMinutes}分`);
  const { group: stepperGroup, value: valueDisplay } = stepper(label(), () => apply(listenTimerMinutes - 5), () => apply(listenTimerMinutes + 5));
  const slider = rangeSlider({ min: 0, max: 60, step: 5, value: listenTimerMinutes, event: 'input', onChange: apply });

  function apply(minutes: number): void {
    setListenTimerMinutes(minutes);
    valueDisplay.textContent = label();
    slider.value = String(listenTimerMinutes);
  }

  const timerValues = el('div', { className: 'timer-values' });
  if (listenTimerRemainingSec !== null) {
    timerValues.appendChild(el('span', { className: 'status-pill timer-pill', id: 'listen-timer-pill', text: formatRemaining(listenTimerRemainingSec) }));
  }
  timerValues.appendChild(stepperGroup);

  app.appendChild(el('div', { className: 'control-group' }, [labelRow('タイマー', timerValues), slider]));
}
