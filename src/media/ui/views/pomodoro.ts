import type { PhaseConfig, WhiteNoiseSettings } from '../../../protocol';
import { button, el } from '../dom';
import { formatPomodoroStatus, pomodoroState, post, updatePomodoroConfig } from '../state';

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

function renderPhaseConfigEditor(container: HTMLElement, s: WhiteNoiseSettings, phaseKey: 'focus' | 'break', config: PhaseConfig, label: string): void {
  const section = el('div', { className: 'phase-config' }, [el('h4', { text: label })]);

  const durationInput = el('input');
  durationInput.type = 'number';
  durationInput.min = '1';
  durationInput.value = String(Math.round(config.durationSec / 60));
  durationInput.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].durationSec = Math.max(1, Number(durationInput.value)) * 60)));
  section.appendChild(el('label', { text: '時間 (分): ' }, [durationInput]));

  const presetSelect = el('select');
  const noneOption = el('option', { text: '(なし)' });
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
  section.appendChild(el('label', { text: ' サウンド: ' }, [presetSelect]));

  section.appendChild(renderCheckboxLabel(config.autoAdvance, ' 自動的に次のフェーズへ', (checked) => updatePomodoroConfig((c) => (c[phaseKey].autoAdvance = checked))));
  section.appendChild(renderCheckboxLabel(config.endAction.showToast, ' 終了時にトースト通知', (checked) => updatePomodoroConfig((c) => (c[phaseKey].endAction.showToast = checked))));

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
  section.appendChild(renderCheckboxLabel(config.endAction.playSound, ' 終了音を鳴らす: ', (checked) => updatePomodoroConfig((c) => (c[phaseKey].endAction.playSound = checked)), soundSelect));

  container.appendChild(section);
}

export function renderPomodoroSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  app.appendChild(el('h3', { text: 'ポモドーロタイマー' }));
  app.appendChild(el('div', { className: 'status-line', id: 'pomodoro-status', text: formatPomodoroStatus() }));

  app.appendChild(
    el('div', { className: 'preset-list' }, [
      button(pomodoroState.runState === 'paused' ? '再開' : '開始', 'preset-button', () => post({ type: 'ui:pomodoroStart' })),
      button('一時停止', 'preset-button', () => post({ type: 'ui:pomodoroPause' })),
      button('リセット', 'preset-button', () => post({ type: 'ui:pomodoroReset' })),
      button('次のフェーズへ', 'preset-button', () => post({ type: 'ui:pomodoroSkipPhase' })),
    ]),
  );

  renderPhaseConfigEditor(app, s, 'focus', s.pomodoro.focus, '集中時間');
  renderPhaseConfigEditor(app, s, 'break', s.pomodoro.break, '休憩時間');
}
