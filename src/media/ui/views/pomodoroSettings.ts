import type { PhaseConfig, NoisePomodoroSettings } from '../../../protocol';
import { button, el } from '../dom';
import { strings } from '../i18n';
import { closePomodoroSettings, post, updatePomodoroConfig } from '../state';
import { TIMER_SEEKBAR_MAX_MINUTES } from './timerSeekbar';

function renderCheckboxLabel(checked: boolean, text: string, onChange: (checked: boolean) => void, trailing?: HTMLElement): HTMLLabelElement {
  const checkbox = el('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.addEventListener('change', () => onChange(checkbox.checked));
  const label = el('label', {}, [checkbox]);
  label.append(text);
  if (trailing) {
    label.appendChild(trailing);
  }
  return label;
}

function renderPhaseConfigEditor(container: HTMLElement, s: NoisePomodoroSettings, phaseKey: 'focus' | 'break', config: PhaseConfig, label: string): void {
  const section = el('div', { className: 'phase-config' }, [el('h4', { text: label })]);

  // ステータスバーの表示幅（statusBar.ts の MAX_LABEL_LEN）は残り時間が "MM:SS" の5文字に
  // 収まる前提で計算しているため、分数は他のタイマー入力と同じ TIMER_SEEKBAR_MAX_MINUTES
  // （60分、mm が2桁に収まる上限）で揃えます。
  const durationInput = el('input');
  durationInput.type = 'number';
  durationInput.min = '1';
  durationInput.max = String(TIMER_SEEKBAR_MAX_MINUTES);
  durationInput.value = String(Math.round(config.durationSec / 60));
  durationInput.addEventListener('change', () => {
    const clamped = Math.min(TIMER_SEEKBAR_MAX_MINUTES, Math.max(1, Number(durationInput.value)));
    durationInput.value = String(clamped);
    updatePomodoroConfig((c) => (c[phaseKey].durationSec = clamped * 60));
  });
  section.appendChild(el('label', { text: strings.pomodoroSettings.timeMinutesLabel }, [durationInput]));

  const presetSelect = el('select');
  const noneOption = el('option', { text: strings.pomodoroSettings.noneOption });
  noneOption.value = '';
  presetSelect.appendChild(noneOption);
  for (const preset of s.ambientPresets) {
    const option = el('option', { text: preset.name });
    option.value = preset.id;
    if (config.presetId === preset.id) {
      option.selected = true;
    }
    presetSelect.appendChild(option);
  }
  presetSelect.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].presetId = presetSelect.value || null)));
  section.appendChild(el('label', { text: strings.pomodoroSettings.soundLabel }, [presetSelect]));

  section.appendChild(renderCheckboxLabel(config.autoAdvance, strings.pomodoroSettings.autoAdvanceLabel, (checked) => updatePomodoroConfig((c) => (c[phaseKey].autoAdvance = checked))));
  section.appendChild(
    renderCheckboxLabel(config.endAction.showToast, strings.pomodoroSettings.toastOnEndLabel, (checked) => updatePomodoroConfig((c) => (c[phaseKey].endAction.showToast = checked))),
  );

  const soundSelect = el('select');
  for (const chime of s.chimePresets) {
    const option = el('option', { text: chime.name });
    option.value = chime.id;
    if (config.endAction.soundPresetId === chime.id) {
      option.selected = true;
    }
    soundSelect.appendChild(option);
  }
  soundSelect.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].endAction.soundPresetId = soundSelect.value)));
  const previewButton = button('▶', 'icon-button', () => post({ type: 'ui:previewChime', presetId: soundSelect.value }));
  const soundControls = el('span', { className: 'chime-preview-row' }, [soundSelect, previewButton]);
  section.appendChild(
    renderCheckboxLabel(config.endAction.playSound, strings.pomodoroSettings.playEndSoundLabel, (checked) => updatePomodoroConfig((c) => (c[phaseKey].endAction.playSound = checked)), soundControls),
  );

  container.appendChild(section);
}

/** ポモドーロの集中/休憩フェーズ詳細設定です。タイマーセクションの ⚙ 設定ボタンから開くモーダルとして表示します。 */
export function renderPomodoroSettingsModal(app: HTMLElement, s: NoisePomodoroSettings): void {
  const body = el('div', { className: 'modal-body' });
  renderPhaseConfigEditor(body, s, 'focus', s.pomodoro.focus, strings.pomodoroSettings.focusDuration);
  renderPhaseConfigEditor(body, s, 'break', s.pomodoro.break, strings.pomodoroSettings.breakDuration);

  const header = el('div', { className: 'modal-header' }, [el('h2', { text: strings.pomodoroSettings.modalTitle }), button('×', 'close-modal', closePomodoroSettings)]);
  const modal = el('div', { className: 'modal-content' }, [header, body]);
  modal.addEventListener('click', (event) => event.stopPropagation());

  const overlay = el('div', { className: 'modal-overlay' }, [modal]);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closePomodoroSettings();
    }
  });
  app.appendChild(overlay);
}
