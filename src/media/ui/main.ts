import './main.css';
import type { ExtToUiMessage, PhaseConfig, PlaybackState, PomodoroConfig, PomodoroState, PresetConfig, UiToExtMessage } from '../../protocol';

declare function acquireVsCodeApi(): {
  postMessage(message: UiToExtMessage): void;
  setState(state: unknown): void;
  getState(): unknown;
};

const vscode = acquireVsCodeApi();

const SOLFEGGIO_FREQUENCIES = [174, 285, 396, 417, 528, 639, 741, 852, 963];

const PARAM_RANGES: Record<string, { min: number; max: number; step: number; label: string }> = {
  carrierFreq: { min: 40, max: 1000, step: 1, label: 'キャリア周波数 (Hz)' },
  beatFreq: { min: 0.5, max: 40, step: 0.5, label: 'ビート周波数 (Hz)' },
  pulseFreq: { min: 0.5, max: 40, step: 0.5, label: 'パルス周波数 (Hz)' },
};

function post(message: UiToExtMessage): void {
  vscode.postMessage(message);
}

let presets: PresetConfig[] = [];
let playback: PlaybackState = { status: 'stopped', presetId: null, currentTimeSec: 0 };
let pomodoroConfig: PomodoroConfig | undefined;
let pomodoroState: PomodoroState = { phase: 'idle', runState: 'stopped', phaseStartedAt: null, phaseDurationSec: 0, elapsedBeforePauseSec: 0 };
let pomodoroRemainingSec = 0;
let selectedPresetId: string | null = null;
// ext:fileSelected only carries {presetId, fileName, fsPath}, not a full PresetConfig.file --
// tracked separately here so the display updates immediately without waiting for a stateSync.
const selectedFileNames: Record<string, string> = {};

function ambientPresets(): PresetConfig[] {
  return presets.filter((p) => !p.id.startsWith('chime-'));
}

function hasFile(preset: PresetConfig): boolean {
  return Boolean(preset.file) || Boolean(selectedFileNames[preset.id]);
}

function renderFileControls(container: HTMLElement, preset: PresetConfig): void {
  const fileName = selectedFileNames[preset.id] ?? preset.file?.fsPath.split(/[\\/]/).pop();
  const info = document.createElement('p');
  info.className = 'status-line';
  info.textContent = fileName ? `ファイル: ${fileName}` : 'ファイルが未選択です';
  container.appendChild(info);

  const button = document.createElement('button');
  button.className = 'preset-button';
  button.textContent = fileName ? 'ファイルを変更' : 'ファイルを選択';
  button.addEventListener('click', () => post({ type: 'ui:selectAudioFile', presetId: preset.id }));
  container.appendChild(button);
}

function renderParamControls(container: HTMLElement, preset: PresetConfig): void {
  if (!preset.procedural) {
    return;
  }
  const { algorithm, params } = preset.procedural;

  if (algorithm === 'binaural') {
    const hint = document.createElement('p');
    hint.className = 'status-line';
    hint.textContent = '⚠️ バイノーラルビートはヘッドホン使用時のみ効果があります';
    container.appendChild(hint);
  }

  if (algorithm === 'solfeggio') {
    const label = document.createElement('label');
    label.textContent = '周波数: ';
    const select = document.createElement('select');
    for (const freq of SOLFEGGIO_FREQUENCIES) {
      const option = document.createElement('option');
      option.value = String(freq);
      option.textContent = `${freq} Hz`;
      if (params?.solfeggioFreq === freq) {
        option.selected = true;
      }
      select.appendChild(option);
    }
    select.addEventListener('change', () => post({ type: 'ui:setParam', presetId: preset.id, paramKey: 'solfeggioFreq', value: Number(select.value) }));
    label.appendChild(select);
    container.appendChild(label);
    return;
  }

  for (const [key, value] of Object.entries(params ?? {})) {
    const range = PARAM_RANGES[key];
    if (!range) {
      continue;
    }
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = `${range.label}: ${value}`;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    slider.value = String(value);
    slider.addEventListener('input', () => {
      label.textContent = `${range.label}: ${slider.value}`;
      post({ type: 'ui:setParam', presetId: preset.id, paramKey: key, value: Number(slider.value) });
    });
    wrapper.appendChild(label);
    wrapper.appendChild(slider);
    container.appendChild(wrapper);
  }
}

function renderCustomCodeControls(container: HTMLElement, preset: PresetConfig): void {
  const hint = document.createElement('p');
  hint.className = 'status-line';
  hint.textContent = 't: 経過秒数, params: カスタムパラメータ。-1〜1 の値を return してください。';
  container.appendChild(hint);

  const textarea = document.createElement('textarea');
  textarea.className = 'code-editor';
  textarea.rows = 6;
  textarea.spellcheck = false;
  textarea.value = preset.custom?.code ?? '';
  container.appendChild(textarea);

  const applyButton = document.createElement('button');
  applyButton.className = 'preset-button';
  applyButton.textContent = '適用';
  applyButton.addEventListener('click', () => post({ type: 'ui:setCustomCode', presetId: preset.id, code: textarea.value }));
  container.appendChild(applyButton);
}

function renderAmbientSection(app: HTMLElement): void {
  const heading = document.createElement('h3');
  heading.textContent = 'サウンド';
  app.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'preset-list';

  for (const preset of ambientPresets()) {
    const button = document.createElement('button');
    button.className = 'preset-button' + (playback.presetId === preset.id && playback.status === 'playing' ? ' active' : '');
    button.textContent = `${preset.icon ?? '🎧'} ${preset.name}`;
    button.addEventListener('click', () => {
      selectedPresetId = preset.id;
      if (preset.mode === 'file' && !hasFile(preset)) {
        post({ type: 'ui:selectAudioFile', presetId: preset.id });
      } else {
        post({ type: 'ui:playPreset', presetId: preset.id });
      }
      render();
    });
    list.appendChild(button);
  }
  app.appendChild(list);

  const selected = presets.find((p) => p.id === (selectedPresetId ?? playback.presetId));
  if (selected) {
    const details = document.createElement('div');
    details.className = 'param-controls';
    if (selected.mode === 'file') {
      renderFileControls(details, selected);
    } else if (selected.mode === 'custom') {
      renderCustomCodeControls(details, selected);
    } else {
      renderParamControls(details, selected);
    }
    app.appendChild(details);
  }

  const status = document.createElement('div');
  status.className = 'status-line';
  status.textContent = playback.status === 'playing' ? `再生中: ${presets.find((p) => p.id === playback.presetId)?.name ?? playback.presetId}` : '停止中';
  app.appendChild(status);
}

function updatePomodoroConfig(mutate: (config: PomodoroConfig) => void): void {
  if (!pomodoroConfig) {
    return;
  }
  const next: PomodoroConfig = { focus: { ...pomodoroConfig.focus, endAction: { ...pomodoroConfig.focus.endAction } }, break: { ...pomodoroConfig.break, endAction: { ...pomodoroConfig.break.endAction } } };
  mutate(next);
  pomodoroConfig = next;
  post({ type: 'ui:updatePomodoroConfig', pomodoro: next });
}

function renderPhaseConfigEditor(container: HTMLElement, phaseKey: 'focus' | 'break', config: PhaseConfig, label: string): void {
  const section = document.createElement('div');
  section.className = 'phase-config';

  const heading = document.createElement('h4');
  heading.textContent = label;
  section.appendChild(heading);

  const durationLabel = document.createElement('label');
  durationLabel.textContent = '時間 (分): ';
  const durationInput = document.createElement('input');
  durationInput.type = 'number';
  durationInput.min = '1';
  durationInput.value = String(Math.round(config.durationSec / 60));
  durationInput.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].durationSec = Math.max(1, Number(durationInput.value)) * 60)));
  durationLabel.appendChild(durationInput);
  section.appendChild(durationLabel);

  const presetLabel = document.createElement('label');
  presetLabel.textContent = ' サウンド: ';
  const presetSelect = document.createElement('select');
  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.textContent = '(なし)';
  presetSelect.appendChild(noneOption);
  for (const preset of ambientPresets()) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    if (config.presetId === preset.id) {
      option.selected = true;
    }
    presetSelect.appendChild(option);
  }
  presetSelect.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].presetId = presetSelect.value || null)));
  presetLabel.appendChild(presetSelect);
  section.appendChild(presetLabel);

  const autoAdvanceLabel = document.createElement('label');
  const autoAdvanceCheckbox = document.createElement('input');
  autoAdvanceCheckbox.type = 'checkbox';
  autoAdvanceCheckbox.checked = config.autoAdvance;
  autoAdvanceCheckbox.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].autoAdvance = autoAdvanceCheckbox.checked)));
  autoAdvanceLabel.appendChild(autoAdvanceCheckbox);
  autoAdvanceLabel.append(' 自動的に次のフェーズへ');
  section.appendChild(autoAdvanceLabel);

  const toastLabel = document.createElement('label');
  const toastCheckbox = document.createElement('input');
  toastCheckbox.type = 'checkbox';
  toastCheckbox.checked = config.endAction.showToast;
  toastCheckbox.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].endAction.showToast = toastCheckbox.checked)));
  toastLabel.appendChild(toastCheckbox);
  toastLabel.append(' 終了時にトースト通知');
  section.appendChild(toastLabel);

  const soundLabel = document.createElement('label');
  const soundCheckbox = document.createElement('input');
  soundCheckbox.type = 'checkbox';
  soundCheckbox.checked = config.endAction.playSound;
  soundCheckbox.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].endAction.playSound = soundCheckbox.checked)));
  soundLabel.appendChild(soundCheckbox);
  soundLabel.append(' 終了音を鳴らす: ');
  const soundSelect = document.createElement('select');
  for (const preset of presets) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    if (config.endAction.soundPresetId === preset.id) {
      option.selected = true;
    }
    soundSelect.appendChild(option);
  }
  soundSelect.addEventListener('change', () => updatePomodoroConfig((c) => (c[phaseKey].endAction.soundPresetId = soundSelect.value)));
  soundLabel.appendChild(soundSelect);
  section.appendChild(soundLabel);

  container.appendChild(section);
}

function formatPomodoroStatus(): string {
  const mm = Math.floor(pomodoroRemainingSec / 60).toString().padStart(2, '0');
  const ss = Math.floor(pomodoroRemainingSec % 60).toString().padStart(2, '0');
  const phaseLabel = pomodoroState.phase === 'focus' ? '集中中' : pomodoroState.phase === 'break' ? '休憩中' : '停止中';
  return pomodoroState.phase === 'idle' ? phaseLabel : `${phaseLabel} (${pomodoroState.runState}) ${mm}:${ss}`;
}

function renderPomodoroSection(app: HTMLElement): void {
  const heading = document.createElement('h3');
  heading.textContent = 'ポモドーロタイマー';
  app.appendChild(heading);

  const status = document.createElement('div');
  status.id = 'pomodoro-status';
  status.className = 'status-line';
  status.textContent = formatPomodoroStatus();
  app.appendChild(status);

  const controls = document.createElement('div');
  controls.className = 'preset-list';
  const startButton = document.createElement('button');
  startButton.className = 'preset-button';
  startButton.textContent = pomodoroState.runState === 'paused' ? '再開' : '開始';
  startButton.addEventListener('click', () => post({ type: 'ui:pomodoroStart' }));
  controls.appendChild(startButton);

  const pauseButton = document.createElement('button');
  pauseButton.className = 'preset-button';
  pauseButton.textContent = '一時停止';
  pauseButton.addEventListener('click', () => post({ type: 'ui:pomodoroPause' }));
  controls.appendChild(pauseButton);

  const resetButton = document.createElement('button');
  resetButton.className = 'preset-button';
  resetButton.textContent = 'リセット';
  resetButton.addEventListener('click', () => post({ type: 'ui:pomodoroReset' }));
  controls.appendChild(resetButton);

  const skipButton = document.createElement('button');
  skipButton.className = 'preset-button';
  skipButton.textContent = '次のフェーズへ';
  skipButton.addEventListener('click', () => post({ type: 'ui:pomodoroSkipPhase' }));
  controls.appendChild(skipButton);
  app.appendChild(controls);

  if (pomodoroConfig) {
    renderPhaseConfigEditor(app, 'focus', pomodoroConfig.focus, '集中時間');
    renderPhaseConfigEditor(app, 'break', pomodoroConfig.break, '休憩時間');
  }
}

function render(): void {
  const app = document.getElementById('app');
  if (!app) {
    return;
  }
  app.innerHTML = '';
  renderAmbientSection(app);
  renderPomodoroSection(app);
}

window.addEventListener('message', (event: MessageEvent<ExtToUiMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'ext:stateSync':
      presets = message.settings.presets;
      playback = message.playback;
      pomodoroConfig = message.settings.pomodoro;
      pomodoroState = message.pomodoro;
      pomodoroRemainingSec = message.pomodoro.phaseDurationSec;
      render();
      break;
    case 'ext:playbackState':
      playback = message.playback;
      render();
      break;
    case 'ext:pomodoroTick': {
      pomodoroState = message.pomodoro;
      pomodoroRemainingSec = message.remainingSec;
      // Update the status text in place rather than a full render() -- this fires every second
      // while the panel is visible, and a full DOM rebuild would blow away in-progress edits
      // (e.g. typing in the custom-code textarea) and cause visible flicker.
      const statusEl = document.getElementById('pomodoro-status');
      if (statusEl) {
        statusEl.textContent = formatPomodoroStatus();
      } else {
        render();
      }
      break;
    }
    case 'ext:fileSelected':
      selectedFileNames[message.presetId] = message.fileName;
      selectedPresetId = message.presetId;
      render();
      post({ type: 'ui:playPreset', presetId: message.presetId });
      break;
    case 'ext:error':
      console.error('[white-noise]', message.message);
      break;
    default:
      break;
  }
});

post({ type: 'ui:ready' });
