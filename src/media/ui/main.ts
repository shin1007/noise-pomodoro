import './main.css';
import type {
  AmbientPreset,
  BackgroundConfig,
  BeatConfig,
  BeatMode,
  ExtToUiMessage,
  NoiseType,
  PhaseConfig,
  PlaybackState,
  PomodoroConfig,
  PomodoroState,
  UiToExtMessage,
  WhiteNoiseSettings,
} from '../../protocol';
import { getVsCodeApi } from '../vscodeApi';
import { clone } from '../../utils/clone';
import { button, el, labelRow, rangeSlider, stepper } from './dom';

// 共有 vscode API（同一 Webview 内の engineClient.ts と acquireVsCodeApi() を共用）。
const vscode = getVsCodeApi();

function post(message: UiToExtMessage): void {
  vscode.postMessage(message);
}

// ---- 定数・分類ヘルパー -------------------------------------------------------

const SOLFEGGIO_FREQUENCIES = [174, 285, 396, 417, 528, 639, 741, 852, 963];

function findNearestSolfeggio(freq: number): number {
  return SOLFEGGIO_FREQUENCIES.reduce((prev, curr) => (Math.abs(curr - freq) < Math.abs(prev - freq) ? curr : prev));
}

function stepSolfeggioFrequency(current: number, direction: -1 | 1): number {
  const nearest = findNearestSolfeggio(current);
  const index = SOLFEGGIO_FREQUENCIES.indexOf(nearest);
  const nextIndex = Math.max(0, Math.min(SOLFEGGIO_FREQUENCIES.length - 1, index + direction));
  return SOLFEGGIO_FREQUENCIES[nextIndex];
}

interface BrainwaveBand {
  key: string;
  label: string;
  symbol: string;
  min: number;
  max: number;
  targetHz: number;
}

const BRAINWAVE_BANDS: BrainwaveBand[] = [
  { key: 'delta', label: 'デルタ', symbol: 'Δ', min: 0.5, max: 4, targetHz: 0.5 },
  { key: 'theta', label: 'シータ', symbol: 'θ', min: 4, max: 8, targetHz: 6 },
  { key: 'alpha', label: 'アルファ', symbol: 'α', min: 8, max: 13, targetHz: 10 },
  { key: 'beta', label: 'ベータ', symbol: 'β', min: 13, max: 30, targetHz: 18 },
  { key: 'gamma', label: 'ガンマ', symbol: 'γ', min: 30, max: 40, targetHz: 36 },
];

function bandForFrequency(freq: number): BrainwaveBand {
  return BRAINWAVE_BANDS.find((band) => freq >= band.min && (band.key === 'gamma' ? freq <= band.max : freq < band.max)) ?? BRAINWAVE_BANDS[2];
}

const NOISE_CHIPS: Array<{ key: NoiseType; label: string }> = [
  { key: 'white', label: 'ホワイト' },
  { key: 'pink', label: 'ピンク' },
  { key: 'brown', label: 'ブラウン' },
  { key: 'blue', label: 'ブルー' },
  { key: 'violet', label: 'ヴァイオレット' },
];

function noiseLabel(type: NoiseType): string {
  return NOISE_CHIPS.find((chip) => chip.key === type)?.label ?? type;
}

// ---- モジュール状態 -----------------------------------------------------------

let settings: WhiteNoiseSettings | undefined;
let playback: PlaybackState = { status: 'stopped', backgroundActive: false, beatActive: false, beatMode: 'binaural', activePresetId: null, currentTimeSec: 0 };
let previousPlaybackStatus: PlaybackState['status'] = 'stopped';
let pomodoroState: PomodoroState = { phase: 'idle', runState: 'stopped', phaseStartedAt: null, phaseDurationSec: 0, elapsedBeforePauseSec: 0 };
let pomodoroRemainingSec = 0;
// ext:fileSelected には {fileName, fsPath} しか含まれず、完全な BackgroundConfig.file は渡ってきません。
// stateSync を待たずに表示を即時更新できるよう、ここで別管理しています。
let selectedFileName: string | undefined;

// リスニングタイマー（アンビエント再生の自動停止）は、この Webview だけで完結する
// クライアントサイドのカウントダウンです。ポモドーロタイマーとは独立しています。
let listenTimerMinutes = 30;
let listenTimerRemainingSec: number | null = null;
let listenTimerHandle: number | undefined;

interface PresetEditorDraft {
  id: string;
  name: string;
  description: string;
  icon?: string;
}
let editingPresetId: string | null = null;
let editingDraft: PresetEditorDraft | null = null;
let editorInitialLastUsed: WhiteNoiseSettings['lastUsed'] | null = null;

// ---- 設定変更（extension へ送信しつつ再描画） ---------------------------------

function setBackground(background: BackgroundConfig): void {
  if (!settings) return;
  settings.lastUsed.background = background;
  settings.lastUsed.activePresetId = null;
  post({ type: 'ui:setBackground', background });
  render();
}

function setBeat(beat: BeatConfig): void {
  if (!settings) return;
  settings.lastUsed.beat = beat;
  settings.lastUsed.activePresetId = null;
  post({ type: 'ui:setBeat', beat });
  render();
}

function setBeatMode(mode: BeatMode): void {
  if (!settings) return;
  settings.lastUsed.beatMode = mode;
  settings.lastUsed.activePresetId = null;
  post({ type: 'ui:setBeatMode', mode });
  render();
}

// ---- リスニングタイマー -------------------------------------------------------

function formatRemaining(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function clearListenTimer(): void {
  if (listenTimerHandle !== undefined) {
    window.clearInterval(listenTimerHandle);
    listenTimerHandle = undefined;
  }
  listenTimerRemainingSec = null;
}

function startListenTimerIfNeeded(): void {
  clearListenTimer();
  if (listenTimerMinutes <= 0) {
    return;
  }
  listenTimerRemainingSec = listenTimerMinutes * 60;
  listenTimerHandle = window.setInterval(() => {
    if (listenTimerRemainingSec === null) {
      return;
    }
    listenTimerRemainingSec -= 1;
    const pill = document.getElementById('listen-timer-pill');
    if (pill) {
      pill.textContent = formatRemaining(listenTimerRemainingSec);
    }
    if (listenTimerRemainingSec <= 0) {
      clearListenTimer();
      post({ type: 'ui:stop' });
    }
  }, 1000);
}

function handlePlaybackUpdate(next: PlaybackState): void {
  if (next.status === 'playing' && previousPlaybackStatus !== 'playing') {
    startListenTimerIfNeeded();
  } else if (next.status !== 'playing') {
    clearListenTimer();
  }
  previousPlaybackStatus = next.status;
  playback = next;
}

// ---- 描画（各セクション） -----------------------------------------------------

function renderHeader(app: HTMLElement, s: WhiteNoiseSettings): void {
  const playButton = button(
    playback.status === 'playing' ? '■' : '▶',
    'play-icon-button' + (playback.status === 'playing' ? ' is-playing' : ''),
    () => post({ type: playback.status === 'playing' ? 'ui:stop' : 'ui:play' }),
  );

  const children: HTMLElement[] = [playButton, el('h2', { className: 'app-title', text: 'White Noise' })];
  if (s.lastUsed.beat.enabled) {
    children.push(el('span', { className: 'wave-symbol', text: bandForFrequency(s.lastUsed.beat.beatFrequency).symbol }));
  }
  app.appendChild(el('div', { className: 'header-row' }, children));
}

function renderVolumeControl(app: HTMLElement, s: WhiteNoiseSettings): void {
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

function renderTimerControl(app: HTMLElement): void {
  const label = () => (listenTimerMinutes === 0 ? 'なし' : `${listenTimerMinutes}分`);
  const { group: stepperGroup, value: valueDisplay } = stepper(label(), () => apply(listenTimerMinutes - 5), () => apply(listenTimerMinutes + 5));
  const slider = rangeSlider({ min: 0, max: 60, step: 5, value: listenTimerMinutes, event: 'input', onChange: apply });

  function apply(minutes: number): void {
    listenTimerMinutes = Math.max(0, Math.min(60, minutes));
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

function renderFileControls(container: HTMLElement, s: WhiteNoiseSettings): void {
  const fileName = selectedFileName ?? s.lastUsed.background.file?.fsPath.split(/[\\/]/).pop();
  container.appendChild(el('p', { className: 'status-line', text: fileName ? `ファイル: ${fileName}` : 'ファイルが未選択です' }));
  container.appendChild(button(fileName ? 'ファイルを変更' : 'ファイルを選択', 'preset-button', () => post({ type: 'ui:selectAudioFile' })));
}

function renderCustomCodeControls(container: HTMLElement, s: WhiteNoiseSettings): void {
  container.appendChild(el('p', { className: 'status-line', text: 't: 経過秒数, params: カスタムパラメータ。-1〜1 の値を return してください。' }));

  const textarea = el('textarea', { className: 'code-editor' });
  textarea.rows = 6;
  textarea.spellcheck = false;
  textarea.value = s.lastUsed.background.custom?.code ?? '';
  container.appendChild(textarea);

  container.appendChild(
    button('適用', 'preset-button', () => {
      const code = textarea.value;
      const params = s.lastUsed.background.custom?.params ?? {};
      s.lastUsed.background = { mode: 'custom', custom: { code, params } };
      post({ type: 'ui:setCustomCode', code, params });
    }),
  );
}

function renderBackgroundSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const section = el('div', { className: 'section' }, [el('h3', { text: '背景音' })]);

  const chips = el('div', { className: 'chip-row' });
  for (const chip of NOISE_CHIPS) {
    const isActive = s.lastUsed.background.mode === 'procedural' && s.lastUsed.background.noiseType === chip.key;
    chips.appendChild(button(chip.label, `noise-chip noise-${chip.key}` + (isActive ? ' selected' : ''), () => setBackground({ mode: 'procedural', noiseType: chip.key })));
  }
  chips.appendChild(button('オフ', 'noise-chip noise-off' + (s.lastUsed.background.mode === 'off' ? ' selected' : ''), () => setBackground({ mode: 'off' })));
  section.appendChild(chips);

  const fileButton = button('📁 音声ファイル', 'text-button' + (s.lastUsed.background.mode === 'file' ? ' selected' : ''), () => post({ type: 'ui:selectAudioFile' }));
  const customButton = button('🧪 カスタムコード', 'text-button' + (s.lastUsed.background.mode === 'custom' ? ' selected' : ''), () => {
    if (s.lastUsed.background.mode !== 'custom') {
      setBackground({ mode: 'custom', custom: { code: 'return Math.sin(2 * Math.PI * 220 * t);', params: {} } });
    }
  });
  section.appendChild(el('div', { className: 'chip-row' }, [fileButton, customButton]));

  if (s.lastUsed.background.mode === 'file') {
    renderFileControls(section, s);
  } else if (s.lastUsed.background.mode === 'custom') {
    renderCustomCodeControls(section, s);
  }

  app.appendChild(section);
}

function renderBaseFrequencyControl(container: HTMLElement, s: WhiteNoiseSettings): void {
  const baseFreq = s.lastUsed.beat.baseFrequency;
  const { group } = stepper(
    `${baseFreq}Hz`,
    () => setBeat({ ...s.lastUsed.beat, baseFrequency: stepSolfeggioFrequency(baseFreq, -1) }),
    () => setBeat({ ...s.lastUsed.beat, baseFrequency: stepSolfeggioFrequency(baseFreq, 1) }),
  );

  // ソルフェジオ周波数へのスナップは離散的なため、ドラッグ中ではなく確定時 (change) に反映します。
  const slider = rangeSlider({
    min: 174,
    max: 963,
    step: 1,
    value: baseFreq,
    event: 'change',
    onChange: (value) => setBeat({ ...s.lastUsed.beat, baseFrequency: findNearestSolfeggio(value) }),
  });

  container.appendChild(el('div', { className: 'control-group' }, [labelRow('ベース周波数', group), slider]));
}

function renderBeatSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const section = el('div', { className: 'section' }, [el('h3', { text: 'ビート' })]);

  section.appendChild(
    el('div', { className: 'mode-toggle-group' }, [
      button('イヤホン（バイノーラル）', 'mode-button' + (s.lastUsed.beatMode === 'binaural' ? ' active' : ''), () => setBeatMode('binaural')),
      button('スピーカー（アイソクロニック）', 'mode-button' + (s.lastUsed.beatMode === 'isochronic' ? ' active' : ''), () => setBeatMode('isochronic')),
    ]),
  );

  const bandRow = el('div', { className: 'chip-row' });
  for (const band of BRAINWAVE_BANDS) {
    const isSelected = s.lastUsed.beat.enabled && bandForFrequency(s.lastUsed.beat.beatFrequency).key === band.key;
    bandRow.appendChild(button(`${band.symbol} ${band.label}`, 'band-chip' + (isSelected ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: true, beatFrequency: band.targetHz })));
  }
  bandRow.appendChild(button('オフ', 'band-chip noise-off' + (!s.lastUsed.beat.enabled ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: false })));
  section.appendChild(bandRow);

  if (s.lastUsed.beat.enabled) {
    renderBaseFrequencyControl(section, s);
  }

  app.appendChild(section);
}

// ---- プリセット（一覧・編集） -------------------------------------------------

function buildPresetSummary(preset: AmbientPreset): string {
  const bgLabel =
    preset.background.mode === 'off'
      ? 'ノイズなし'
      : preset.background.mode === 'procedural' && preset.background.noiseType
        ? noiseLabel(preset.background.noiseType)
        : preset.background.mode === 'file'
          ? 'ファイル'
          : 'カスタム';
  if (!preset.beat.enabled) {
    return bgLabel;
  }
  const band = bandForFrequency(preset.beat.beatFrequency);
  return `${bgLabel} · ${preset.beat.baseFrequency}Hz (${band.label}${band.symbol})`;
}

function openPresetEditor(preset: AmbientPreset): void {
  if (!settings) return;
  editingPresetId = preset.id;
  editingDraft = { id: preset.id, name: preset.name, description: preset.description ?? '', icon: preset.icon };
  editorInitialLastUsed = clone(settings.lastUsed);
  setBackground(preset.background);
  setBeat({ ...preset.beat });
  settings.lastUsed.masterVolume = preset.volume;
  post({ type: 'ui:setMasterVolume', value: preset.volume });
  render();
}

function closePresetEditor(): void {
  editingPresetId = null;
  editingDraft = null;
  editorInitialLastUsed = null;
  render();
}

function cancelPresetEditor(): void {
  if (settings && editorInitialLastUsed) {
    settings.lastUsed = clone(editorInitialLastUsed);
    post({ type: 'ui:setBackground', background: settings.lastUsed.background });
    post({ type: 'ui:setBeat', beat: settings.lastUsed.beat });
    post({ type: 'ui:setMasterVolume', value: settings.lastUsed.masterVolume });
  }
  closePresetEditor();
}

function saveEditingPreset(): void {
  if (!settings || !editingDraft) return;
  const updated: AmbientPreset = {
    id: editingDraft.id,
    name: editingDraft.name,
    description: editingDraft.description,
    icon: editingDraft.icon,
    background: settings.lastUsed.background,
    beat: { ...settings.lastUsed.beat },
    volume: settings.lastUsed.masterVolume,
  };
  post({ type: 'ui:savePreset', preset: updated });
  post({ type: 'ui:applyPreset', presetId: updated.id });

  const index = settings.ambientPresets.findIndex((p) => p.id === updated.id);
  if (index >= 0) {
    settings.ambientPresets[index] = updated;
  } else {
    settings.ambientPresets.push(updated);
  }
  settings.lastUsed.activePresetId = updated.id;
  playback = { ...playback, activePresetId: updated.id };
  closePresetEditor();
}

function renderPresetCard(s: WhiteNoiseSettings, preset: AmbientPreset): HTMLDivElement {
  const card = el('div', { className: 'preset-card' + (s.lastUsed.activePresetId === preset.id ? ' active' : '') });
  card.setAttribute('role', 'button');
  card.tabIndex = 0;

  const editButton = button('編集', 'preset-edit-button', (event) => {
    event.stopPropagation();
    openPresetEditor(preset);
  });
  const titleRow = el('div', { className: 'preset-card-title-row' }, [el('strong', { text: `${preset.icon ?? ''} ${preset.name}`.trim() }), editButton]);
  card.appendChild(el('div', { className: 'preset-card-head' }, [titleRow, el('span', { className: 'preset-setting-summary', text: buildPresetSummary(preset) })]));

  if (preset.description) {
    card.appendChild(el('p', { className: 'preset-description-readonly', text: preset.description }));
  }

  const activate = () => {
    post({ type: 'ui:applyPreset', presetId: preset.id });
    s.lastUsed = {
      background: preset.background,
      beat: { ...preset.beat },
      beatMode: s.lastUsed.beatMode,
      masterVolume: preset.volume,
      activePresetId: preset.id,
    };
    playback = { ...playback, activePresetId: preset.id };
    render();
  };
  card.addEventListener('click', activate);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  });
  return card;
}

function renderPresetsSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const list = el('div', { className: 'preset-list' });
  for (const preset of s.ambientPresets) {
    list.appendChild(renderPresetCard(s, preset));
  }

  app.appendChild(
    el('div', { className: 'section presets-section' }, [
      el('h3', { className: 'section-title', text: 'プリセット' }),
      list,
      button('プリセットをリセット', 'preset-reset-button', () => post({ type: 'ui:resetPresets' })),
    ]),
  );
}

/** ラベル行（.label-row > .label-text）を見出しに持つ入力欄（プリセット名 / 説明）を生成します。 */
function renderLabeledInput(labelText: string, input: HTMLElement): HTMLLabelElement {
  return el('label', {}, [labelRow(labelText), input]);
}

function renderPresetEditorModal(app: HTMLElement, s: WhiteNoiseSettings): void {
  if (!editingDraft) return;
  const draft = editingDraft;

  const body = el('div', { className: 'modal-body preset-editor-body' });

  const nameInput = el('input', { className: 'preset-name-input' });
  nameInput.value = draft.name;
  nameInput.addEventListener('input', () => {
    draft.name = nameInput.value;
  });
  body.appendChild(renderLabeledInput('プリセット名', nameInput));

  const descInput = el('textarea', { className: 'preset-description-input' });
  descInput.rows = 2;
  descInput.value = draft.description;
  descInput.addEventListener('input', () => {
    draft.description = descInput.value;
  });
  body.appendChild(renderLabeledInput('説明', descInput));

  body.appendChild(el('div', { className: 'preset-control-label', text: '背景音' }));
  const bgGrid = el('div', { className: 'noise-grid preset-noise-grid' });
  for (const chip of NOISE_CHIPS) {
    const isSelected = s.lastUsed.background.mode === 'procedural' && s.lastUsed.background.noiseType === chip.key;
    bgGrid.appendChild(button(chip.label, `noise-chip noise-${chip.key}` + (isSelected ? ' selected' : ''), () => setBackground({ mode: 'procedural', noiseType: chip.key })));
  }
  bgGrid.appendChild(button('オフ', 'noise-chip noise-off' + (s.lastUsed.background.mode === 'off' ? ' selected' : ''), () => setBackground({ mode: 'off' })));
  body.appendChild(bgGrid);

  body.appendChild(el('div', { className: 'preset-control-label', text: 'ビート' }));
  const beatGrid = el('div', { className: 'noise-grid preset-noise-grid preset-beat-grid' });
  for (const band of BRAINWAVE_BANDS) {
    const isSelected = s.lastUsed.beat.enabled && bandForFrequency(s.lastUsed.beat.beatFrequency).key === band.key;
    beatGrid.appendChild(button(`${band.label}波 (${band.targetHz}Hz)`, 'noise-chip' + (isSelected ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: true, beatFrequency: band.targetHz })));
  }
  beatGrid.appendChild(button('オフ', 'noise-chip noise-off' + (!s.lastUsed.beat.enabled ? ' selected' : ''), () => setBeat({ ...s.lastUsed.beat, enabled: false })));
  body.appendChild(beatGrid);

  if (s.lastUsed.beat.enabled) {
    renderBaseFrequencyControl(body, s);
  }

  const { group: volStepper } = stepper(
    `${Math.round(s.lastUsed.masterVolume * 100)}%`,
    () => previewPresetVolume(Math.round(s.lastUsed.masterVolume * 100) - 1),
    () => previewPresetVolume(Math.round(s.lastUsed.masterVolume * 100) + 1),
  );
  body.appendChild(el('div', { className: 'control-group preset-control-group' }, [labelRow('音量', volStepper)]));

  body.appendChild(el('div', { className: 'preset-card-actions' }, [button('適用して保存', 'preset-apply-button', saveEditingPreset)]));

  const header = el('div', { className: 'modal-header' }, [el('h2', { text: 'プリセット編集' }), button('×', 'close-modal', cancelPresetEditor)]);
  const modal = el('div', { className: 'modal-content preset-editor-modal' }, [header, body]);
  modal.addEventListener('click', (event) => event.stopPropagation());

  const overlay = el('div', { className: 'modal-overlay' }, [modal]);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      cancelPresetEditor();
    }
  });
  app.appendChild(overlay);
}

function previewPresetVolume(percent: number): void {
  if (!settings) return;
  const clamped = Math.max(0, Math.min(100, percent));
  settings.lastUsed.masterVolume = clamped / 100;
  post({ type: 'ui:setMasterVolume', value: clamped / 100 });
  render();
}

// ---- ポモドーロ ---------------------------------------------------------------

function updatePomodoroConfig(mutate: (config: PomodoroConfig) => void): void {
  if (!settings) {
    return;
  }
  const next: PomodoroConfig = {
    focus: { ...settings.pomodoro.focus, endAction: { ...settings.pomodoro.focus.endAction } },
    break: { ...settings.pomodoro.break, endAction: { ...settings.pomodoro.break.endAction } },
  };
  mutate(next);
  settings.pomodoro = next;
  post({ type: 'ui:updatePomodoroConfig', pomodoro: next });
}

/** チェックボックス＋後置ラベル文言（例: 「☑ 自動的に次のフェーズへ」）を生成します。 */
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

function formatPomodoroStatus(): string {
  const mm = Math.floor(pomodoroRemainingSec / 60).toString().padStart(2, '0');
  const ss = Math.floor(pomodoroRemainingSec % 60).toString().padStart(2, '0');
  const phaseLabel = pomodoroState.phase === 'focus' ? '集中中' : pomodoroState.phase === 'break' ? '休憩中' : '停止中';
  return pomodoroState.phase === 'idle' ? phaseLabel : `${phaseLabel} (${pomodoroState.runState}) ${mm}:${ss}`;
}

function renderPomodoroSection(app: HTMLElement, s: WhiteNoiseSettings): void {
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

// ---- 描画エントリ・メッセージ受信 ---------------------------------------------

function render(): void {
  const app = document.getElementById('app');
  if (!app) {
    return;
  }
  if (!settings) {
    app.innerHTML = '<p class="loading">Loading…</p>';
    return;
  }
  const s = settings;
  app.innerHTML = '';
  renderHeader(app, s);
  renderVolumeControl(app, s);
  renderTimerControl(app);
  renderBackgroundSection(app, s);
  renderBeatSection(app, s);
  renderPresetsSection(app, s);
  renderPomodoroSection(app, s);
  if (editingPresetId && editingDraft) {
    renderPresetEditorModal(app, s);
  }
}

window.addEventListener('message', (event: MessageEvent<ExtToUiMessage>) => {
  const message = event.data;
  switch (message.type) {
    case 'ext:stateSync':
      settings = message.settings;
      handlePlaybackUpdate(message.playback);
      pomodoroState = message.pomodoro;
      pomodoroRemainingSec = message.pomodoro.phaseDurationSec;
      render();
      break;
    case 'ext:playbackState':
      handlePlaybackUpdate(message.playback);
      render();
      break;
    case 'ext:pomodoroTick': {
      pomodoroState = message.pomodoro;
      pomodoroRemainingSec = message.remainingSec;
      // status テキストだけを差し替え、全面 render() は避けます。
      // これはパネル表示中に毎秒発火するため、DOM を丸ごと再構築すると
      // カスタムコード入力中の編集内容が飛んだり、ちらつきが目立ったりします。
      const statusEl = document.getElementById('pomodoro-status');
      if (statusEl) {
        statusEl.textContent = formatPomodoroStatus();
      } else {
        render();
      }
      break;
    }
    case 'ext:fileSelected':
      selectedFileName = message.fileName;
      render();
      post({ type: 'ui:play' });
      break;
    case 'ext:error':
      console.error('[white-noise]', message.message);
      break;
    default:
      break;
  }
});

post({ type: 'ui:ready' });
