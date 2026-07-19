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

declare function acquireVsCodeApi(): {
  postMessage(message: UiToExtMessage): void;
  setState(state: unknown): void;
  getState(): unknown;
};

// 音声エンジン (engineClient.ts) と同じ Webview に同居しているため、acquireVsCodeApi() は
// ドキュメント全体で一度しか呼べません。どちらが先に読み込まれても安全なように、
// window 上にキャッシュしたインスタンスを共有します。
function getVsCodeApi(): ReturnType<typeof acquireVsCodeApi> {
  const w = window as unknown as { __vscodeApi__?: ReturnType<typeof acquireVsCodeApi> };
  return (w.__vscodeApi__ ??= acquireVsCodeApi());
}

const vscode = getVsCodeApi();

function post(message: UiToExtMessage): void {
  vscode.postMessage(message);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

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

function renderHeader(app: HTMLElement, s: WhiteNoiseSettings): void {
  const header = document.createElement('div');
  header.className = 'header-row';

  const playButton = document.createElement('button');
  playButton.className = 'play-icon-button' + (playback.status === 'playing' ? ' is-playing' : '');
  playButton.textContent = playback.status === 'playing' ? '■' : '▶';
  playButton.addEventListener('click', () => post({ type: playback.status === 'playing' ? 'ui:stop' : 'ui:play' }));
  header.appendChild(playButton);

  const title = document.createElement('h2');
  title.className = 'app-title';
  title.textContent = 'White Noise';
  header.appendChild(title);

  if (s.lastUsed.beat.enabled) {
    const symbol = document.createElement('span');
    symbol.className = 'wave-symbol';
    symbol.textContent = bandForFrequency(s.lastUsed.beat.beatFrequency).symbol;
    header.appendChild(symbol);
  }

  app.appendChild(header);
}

function renderVolumeControl(app: HTMLElement, s: WhiteNoiseSettings): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-group';

  const labelRow = document.createElement('div');
  labelRow.className = 'label-row';
  const labelText = document.createElement('span');
  labelText.className = 'label-text';
  labelText.textContent = '音量';
  labelRow.appendChild(labelText);

  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'value-display';
  const currentPercent = () => Math.round(s.lastUsed.masterVolume * 100);
  valueDisplay.textContent = `${currentPercent()}%`;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.step = '1';
  slider.value = String(currentPercent());

  function apply(percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    s.lastUsed.masterVolume = clamped / 100;
    valueDisplay.textContent = `${clamped}%`;
    slider.value = String(clamped);
    post({ type: 'ui:setMasterVolume', value: clamped / 100 });
  }

  const stepperWrap = document.createElement('div');
  stepperWrap.className = 'value-with-stepper';
  const minus = document.createElement('button');
  minus.className = 'step-button';
  minus.type = 'button';
  minus.textContent = '-';
  minus.addEventListener('click', () => apply(currentPercent() - 1));
  const plus = document.createElement('button');
  plus.className = 'step-button';
  plus.type = 'button';
  plus.textContent = '+';
  plus.addEventListener('click', () => apply(currentPercent() + 1));
  stepperWrap.append(minus, valueDisplay, plus);
  labelRow.appendChild(stepperWrap);

  slider.addEventListener('input', () => apply(Number(slider.value)));

  wrapper.append(labelRow, slider);
  app.appendChild(wrapper);
}

function renderTimerControl(app: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-group';

  const labelRow = document.createElement('div');
  labelRow.className = 'label-row';
  const labelText = document.createElement('span');
  labelText.className = 'label-text';
  labelText.textContent = 'タイマー';
  labelRow.appendChild(labelText);

  const timerValues = document.createElement('div');
  timerValues.className = 'timer-values';
  if (listenTimerRemainingSec !== null) {
    const pill = document.createElement('span');
    pill.className = 'status-pill timer-pill';
    pill.id = 'listen-timer-pill';
    pill.textContent = formatRemaining(listenTimerRemainingSec);
    timerValues.appendChild(pill);
  }

  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'value-display';
  const label = () => (listenTimerMinutes === 0 ? 'なし' : `${listenTimerMinutes}分`);
  valueDisplay.textContent = label();

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '60';
  slider.step = '5';
  slider.value = String(listenTimerMinutes);

  function apply(minutes: number): void {
    listenTimerMinutes = Math.max(0, Math.min(60, minutes));
    valueDisplay.textContent = label();
    slider.value = String(listenTimerMinutes);
  }

  const stepperWrap = document.createElement('div');
  stepperWrap.className = 'value-with-stepper';
  const minus = document.createElement('button');
  minus.className = 'step-button';
  minus.type = 'button';
  minus.textContent = '-';
  minus.addEventListener('click', () => apply(listenTimerMinutes - 5));
  const plus = document.createElement('button');
  plus.className = 'step-button';
  plus.type = 'button';
  plus.textContent = '+';
  plus.addEventListener('click', () => apply(listenTimerMinutes + 5));
  stepperWrap.append(minus, valueDisplay, plus);
  timerValues.appendChild(stepperWrap);
  labelRow.appendChild(timerValues);

  slider.addEventListener('input', () => apply(Number(slider.value)));

  wrapper.append(labelRow, slider);
  app.appendChild(wrapper);
}

function renderFileControls(container: HTMLElement, s: WhiteNoiseSettings): void {
  const fileName = selectedFileName ?? s.lastUsed.background.file?.fsPath.split(/[\\/]/).pop();
  const info = document.createElement('p');
  info.className = 'status-line';
  info.textContent = fileName ? `ファイル: ${fileName}` : 'ファイルが未選択です';
  container.appendChild(info);

  const button = document.createElement('button');
  button.className = 'preset-button';
  button.type = 'button';
  button.textContent = fileName ? 'ファイルを変更' : 'ファイルを選択';
  button.addEventListener('click', () => post({ type: 'ui:selectAudioFile' }));
  container.appendChild(button);
}

function renderCustomCodeControls(container: HTMLElement, s: WhiteNoiseSettings): void {
  const hint = document.createElement('p');
  hint.className = 'status-line';
  hint.textContent = 't: 経過秒数, params: カスタムパラメータ。-1〜1 の値を return してください。';
  container.appendChild(hint);

  const textarea = document.createElement('textarea');
  textarea.className = 'code-editor';
  textarea.rows = 6;
  textarea.spellcheck = false;
  textarea.value = s.lastUsed.background.custom?.code ?? '';
  container.appendChild(textarea);

  const applyButton = document.createElement('button');
  applyButton.className = 'preset-button';
  applyButton.type = 'button';
  applyButton.textContent = '適用';
  applyButton.addEventListener('click', () => {
    const code = textarea.value;
    const params = s.lastUsed.background.custom?.params ?? {};
    s.lastUsed.background = { mode: 'custom', custom: { code, params } };
    post({ type: 'ui:setCustomCode', code, params });
  });
  container.appendChild(applyButton);
}

function renderBackgroundSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const section = document.createElement('div');
  section.className = 'section';
  const heading = document.createElement('h3');
  heading.textContent = '背景音';
  section.appendChild(heading);

  const chips = document.createElement('div');
  chips.className = 'chip-row';
  for (const chip of NOISE_CHIPS) {
    const button = document.createElement('button');
    const isActive = s.lastUsed.background.mode === 'procedural' && s.lastUsed.background.noiseType === chip.key;
    button.className = `noise-chip noise-${chip.key}` + (isActive ? ' selected' : '');
    button.type = 'button';
    button.textContent = chip.label;
    button.addEventListener('click', () => setBackground({ mode: 'procedural', noiseType: chip.key }));
    chips.appendChild(button);
  }
  const offButton = document.createElement('button');
  offButton.className = 'noise-chip noise-off' + (s.lastUsed.background.mode === 'off' ? ' selected' : '');
  offButton.type = 'button';
  offButton.textContent = 'オフ';
  offButton.addEventListener('click', () => setBackground({ mode: 'off' }));
  chips.appendChild(offButton);
  section.appendChild(chips);

  const modeRow = document.createElement('div');
  modeRow.className = 'chip-row';
  const fileButton = document.createElement('button');
  fileButton.className = 'text-button' + (s.lastUsed.background.mode === 'file' ? ' selected' : '');
  fileButton.type = 'button';
  fileButton.textContent = '📁 音声ファイル';
  fileButton.addEventListener('click', () => post({ type: 'ui:selectAudioFile' }));
  modeRow.appendChild(fileButton);

  const customButton = document.createElement('button');
  customButton.className = 'text-button' + (s.lastUsed.background.mode === 'custom' ? ' selected' : '');
  customButton.type = 'button';
  customButton.textContent = '🧪 カスタムコード';
  customButton.addEventListener('click', () => {
    if (s.lastUsed.background.mode !== 'custom') {
      setBackground({ mode: 'custom', custom: { code: 'return Math.sin(2 * Math.PI * 220 * t);', params: {} } });
    }
  });
  modeRow.appendChild(customButton);
  section.appendChild(modeRow);

  if (s.lastUsed.background.mode === 'file') {
    renderFileControls(section, s);
  } else if (s.lastUsed.background.mode === 'custom') {
    renderCustomCodeControls(section, s);
  }

  app.appendChild(section);
}

function renderBaseFrequencyControl(container: HTMLElement, s: WhiteNoiseSettings): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'control-group';
  const labelRow = document.createElement('div');
  labelRow.className = 'label-row';
  const labelText = document.createElement('span');
  labelText.className = 'label-text';
  labelText.textContent = 'ベース周波数';
  labelRow.appendChild(labelText);

  const baseFreq = s.lastUsed.beat.baseFrequency;
  const stepperWrap = document.createElement('div');
  stepperWrap.className = 'value-with-stepper';
  const minus = document.createElement('button');
  minus.className = 'step-button';
  minus.type = 'button';
  minus.textContent = '-';
  minus.addEventListener('click', () => setBeat({ ...s.lastUsed.beat, baseFrequency: stepSolfeggioFrequency(baseFreq, -1) }));
  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'value-display';
  valueDisplay.textContent = `${baseFreq}Hz`;
  const plus = document.createElement('button');
  plus.className = 'step-button';
  plus.type = 'button';
  plus.textContent = '+';
  plus.addEventListener('click', () => setBeat({ ...s.lastUsed.beat, baseFrequency: stepSolfeggioFrequency(baseFreq, 1) }));
  stepperWrap.append(minus, valueDisplay, plus);
  labelRow.appendChild(stepperWrap);
  wrapper.appendChild(labelRow);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '174';
  slider.max = '963';
  slider.step = '1';
  slider.value = String(baseFreq);
  // ソルフェジオ周波数へのスナップは離散的なため、ドラッグ中ではなく確定時 (change) に反映します。
  slider.addEventListener('change', () => setBeat({ ...s.lastUsed.beat, baseFrequency: findNearestSolfeggio(Number(slider.value)) }));
  wrapper.appendChild(slider);

  container.appendChild(wrapper);
}

function renderBeatSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const section = document.createElement('div');
  section.className = 'section';
  const heading = document.createElement('h3');
  heading.textContent = 'ビート';
  section.appendChild(heading);

  const modeToggle = document.createElement('div');
  modeToggle.className = 'mode-toggle-group';
  const binauralButton = document.createElement('button');
  binauralButton.className = 'mode-button' + (s.lastUsed.beatMode === 'binaural' ? ' active' : '');
  binauralButton.type = 'button';
  binauralButton.textContent = 'イヤホン（バイノーラル）';
  binauralButton.addEventListener('click', () => setBeatMode('binaural'));
  const isochronicButton = document.createElement('button');
  isochronicButton.className = 'mode-button' + (s.lastUsed.beatMode === 'isochronic' ? ' active' : '');
  isochronicButton.type = 'button';
  isochronicButton.textContent = 'スピーカー（アイソクロニック）';
  isochronicButton.addEventListener('click', () => setBeatMode('isochronic'));
  modeToggle.append(binauralButton, isochronicButton);
  section.appendChild(modeToggle);

  const bandRow = document.createElement('div');
  bandRow.className = 'chip-row';
  for (const band of BRAINWAVE_BANDS) {
    const button = document.createElement('button');
    const isSelected = s.lastUsed.beat.enabled && bandForFrequency(s.lastUsed.beat.beatFrequency).key === band.key;
    button.className = 'band-chip' + (isSelected ? ' selected' : '');
    button.type = 'button';
    button.textContent = `${band.symbol} ${band.label}`;
    button.addEventListener('click', () => setBeat({ ...s.lastUsed.beat, enabled: true, beatFrequency: band.targetHz }));
    bandRow.appendChild(button);
  }
  const offButton = document.createElement('button');
  offButton.className = 'band-chip noise-off' + (!s.lastUsed.beat.enabled ? ' selected' : '');
  offButton.type = 'button';
  offButton.textContent = 'オフ';
  offButton.addEventListener('click', () => setBeat({ ...s.lastUsed.beat, enabled: false }));
  bandRow.appendChild(offButton);
  section.appendChild(bandRow);

  if (s.lastUsed.beat.enabled) {
    renderBaseFrequencyControl(section, s);
  }

  app.appendChild(section);
}

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

function renderPresetsSection(app: HTMLElement, s: WhiteNoiseSettings): void {
  const section = document.createElement('div');
  section.className = 'section presets-section';
  const heading = document.createElement('h3');
  heading.className = 'section-title';
  heading.textContent = 'プリセット';
  section.appendChild(heading);

  const list = document.createElement('div');
  list.className = 'preset-list';
  for (const preset of s.ambientPresets) {
    const card = document.createElement('div');
    card.className = 'preset-card' + (s.lastUsed.activePresetId === preset.id ? ' active' : '');
    card.setAttribute('role', 'button');
    card.tabIndex = 0;

    const head = document.createElement('div');
    head.className = 'preset-card-head';
    const titleRow = document.createElement('div');
    titleRow.className = 'preset-card-title-row';
    const strong = document.createElement('strong');
    strong.textContent = `${preset.icon ?? ''} ${preset.name}`.trim();
    titleRow.appendChild(strong);

    const editButton = document.createElement('button');
    editButton.className = 'preset-edit-button';
    editButton.type = 'button';
    editButton.textContent = '編集';
    editButton.addEventListener('click', (event) => {
      event.stopPropagation();
      openPresetEditor(preset);
    });
    titleRow.appendChild(editButton);
    head.appendChild(titleRow);

    const summary = document.createElement('span');
    summary.className = 'preset-setting-summary';
    summary.textContent = buildPresetSummary(preset);
    head.appendChild(summary);
    card.appendChild(head);

    if (preset.description) {
      const desc = document.createElement('p');
      desc.className = 'preset-description-readonly';
      desc.textContent = preset.description;
      card.appendChild(desc);
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

    list.appendChild(card);
  }
  section.appendChild(list);

  const resetButton = document.createElement('button');
  resetButton.className = 'preset-reset-button';
  resetButton.type = 'button';
  resetButton.textContent = 'プリセットをリセット';
  resetButton.addEventListener('click', () => post({ type: 'ui:resetPresets' }));
  section.appendChild(resetButton);

  app.appendChild(section);
}

function renderPresetEditorModal(app: HTMLElement, s: WhiteNoiseSettings): void {
  if (!editingDraft) return;
  const draft = editingDraft;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      cancelPresetEditor();
    }
  });

  const modal = document.createElement('div');
  modal.className = 'modal-content preset-editor-modal';
  modal.addEventListener('click', (event) => event.stopPropagation());

  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('h2');
  title.textContent = 'プリセット編集';
  const closeButton = document.createElement('button');
  closeButton.className = 'close-modal';
  closeButton.type = 'button';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', cancelPresetEditor);
  header.append(title, closeButton);
  modal.appendChild(header);

  const body = document.createElement('div');
  body.className = 'modal-body preset-editor-body';

  const nameLabel = document.createElement('label');
  const nameLabelText = document.createElement('div');
  nameLabelText.className = 'label-row';
  const nameLabelSpan = document.createElement('span');
  nameLabelSpan.className = 'label-text';
  nameLabelSpan.textContent = 'プリセット名';
  nameLabelText.appendChild(nameLabelSpan);
  nameLabel.appendChild(nameLabelText);
  const nameInput = document.createElement('input');
  nameInput.className = 'preset-name-input';
  nameInput.value = draft.name;
  nameInput.addEventListener('input', () => {
    draft.name = nameInput.value;
  });
  nameLabel.appendChild(nameInput);
  body.appendChild(nameLabel);

  const descLabel = document.createElement('label');
  const descLabelText = document.createElement('div');
  descLabelText.className = 'label-row';
  const descLabelSpan = document.createElement('span');
  descLabelSpan.className = 'label-text';
  descLabelSpan.textContent = '説明';
  descLabelText.appendChild(descLabelSpan);
  descLabel.appendChild(descLabelText);
  const descInput = document.createElement('textarea');
  descInput.className = 'preset-description-input';
  descInput.rows = 2;
  descInput.value = draft.description;
  descInput.addEventListener('input', () => {
    draft.description = descInput.value;
  });
  descLabel.appendChild(descInput);
  body.appendChild(descLabel);

  const bgLabelEl = document.createElement('div');
  bgLabelEl.className = 'preset-control-label';
  bgLabelEl.textContent = '背景音';
  body.appendChild(bgLabelEl);
  const bgGrid = document.createElement('div');
  bgGrid.className = 'noise-grid preset-noise-grid';
  for (const chip of NOISE_CHIPS) {
    const button = document.createElement('button');
    const isSelected = s.lastUsed.background.mode === 'procedural' && s.lastUsed.background.noiseType === chip.key;
    button.className = `noise-chip noise-${chip.key}` + (isSelected ? ' selected' : '');
    button.type = 'button';
    button.textContent = chip.label;
    button.addEventListener('click', () => setBackground({ mode: 'procedural', noiseType: chip.key }));
    bgGrid.appendChild(button);
  }
  const bgOffButton = document.createElement('button');
  bgOffButton.className = 'noise-chip noise-off' + (s.lastUsed.background.mode === 'off' ? ' selected' : '');
  bgOffButton.type = 'button';
  bgOffButton.textContent = 'オフ';
  bgOffButton.addEventListener('click', () => setBackground({ mode: 'off' }));
  bgGrid.appendChild(bgOffButton);
  body.appendChild(bgGrid);

  const beatLabelEl = document.createElement('div');
  beatLabelEl.className = 'preset-control-label';
  beatLabelEl.textContent = 'ビート';
  body.appendChild(beatLabelEl);
  const beatGrid = document.createElement('div');
  beatGrid.className = 'noise-grid preset-noise-grid preset-beat-grid';
  for (const band of BRAINWAVE_BANDS) {
    const button = document.createElement('button');
    const isSelected = s.lastUsed.beat.enabled && bandForFrequency(s.lastUsed.beat.beatFrequency).key === band.key;
    button.className = 'noise-chip' + (isSelected ? ' selected' : '');
    button.type = 'button';
    button.textContent = `${band.label}波 (${band.targetHz}Hz)`;
    button.addEventListener('click', () => setBeat({ ...s.lastUsed.beat, enabled: true, beatFrequency: band.targetHz }));
    beatGrid.appendChild(button);
  }
  const beatOffButton = document.createElement('button');
  beatOffButton.className = 'noise-chip noise-off' + (!s.lastUsed.beat.enabled ? ' selected' : '');
  beatOffButton.type = 'button';
  beatOffButton.textContent = 'オフ';
  beatOffButton.addEventListener('click', () => setBeat({ ...s.lastUsed.beat, enabled: false }));
  beatGrid.appendChild(beatOffButton);
  body.appendChild(beatGrid);

  if (s.lastUsed.beat.enabled) {
    renderBaseFrequencyControl(body, s);
  }

  const volWrapper = document.createElement('div');
  volWrapper.className = 'control-group preset-control-group';
  const volLabelRow = document.createElement('div');
  volLabelRow.className = 'label-row';
  const volLabelText = document.createElement('span');
  volLabelText.className = 'label-text';
  volLabelText.textContent = '音量';
  volLabelRow.appendChild(volLabelText);
  const volStepperWrap = document.createElement('div');
  volStepperWrap.className = 'value-with-stepper';
  const volMinus = document.createElement('button');
  volMinus.className = 'step-button';
  volMinus.type = 'button';
  volMinus.textContent = '-';
  volMinus.addEventListener('click', () => previewPresetVolume(Math.round(s.lastUsed.masterVolume * 100) - 1));
  const volValueDisplay = document.createElement('span');
  volValueDisplay.className = 'value-display';
  volValueDisplay.textContent = `${Math.round(s.lastUsed.masterVolume * 100)}%`;
  const volPlus = document.createElement('button');
  volPlus.className = 'step-button';
  volPlus.type = 'button';
  volPlus.textContent = '+';
  volPlus.addEventListener('click', () => previewPresetVolume(Math.round(s.lastUsed.masterVolume * 100) + 1));
  volStepperWrap.append(volMinus, volValueDisplay, volPlus);
  volLabelRow.appendChild(volStepperWrap);
  volWrapper.appendChild(volLabelRow);
  body.appendChild(volWrapper);

  const actions = document.createElement('div');
  actions.className = 'preset-card-actions';
  const applyButton = document.createElement('button');
  applyButton.className = 'preset-apply-button';
  applyButton.type = 'button';
  applyButton.textContent = '適用して保存';
  applyButton.addEventListener('click', saveEditingPreset);
  actions.appendChild(applyButton);
  body.appendChild(actions);

  modal.appendChild(body);
  overlay.appendChild(modal);
  app.appendChild(overlay);
}

function previewPresetVolume(percent: number): void {
  if (!settings) return;
  const clamped = Math.max(0, Math.min(100, percent));
  settings.lastUsed.masterVolume = clamped / 100;
  post({ type: 'ui:setMasterVolume', value: clamped / 100 });
  render();
}

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

function renderPhaseConfigEditor(container: HTMLElement, s: WhiteNoiseSettings, phaseKey: 'focus' | 'break', config: PhaseConfig, label: string): void {
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
  for (const preset of s.ambientPresets) {
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
  for (const chime of s.chimePresets) {
    const option = document.createElement('option');
    option.value = chime.id;
    option.textContent = chime.name;
    if (config.endAction.soundPresetId === chime.id) {
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

function renderPomodoroSection(app: HTMLElement, s: WhiteNoiseSettings): void {
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
  startButton.type = 'button';
  startButton.textContent = pomodoroState.runState === 'paused' ? '再開' : '開始';
  startButton.addEventListener('click', () => post({ type: 'ui:pomodoroStart' }));
  controls.appendChild(startButton);

  const pauseButton = document.createElement('button');
  pauseButton.className = 'preset-button';
  pauseButton.type = 'button';
  pauseButton.textContent = '一時停止';
  pauseButton.addEventListener('click', () => post({ type: 'ui:pomodoroPause' }));
  controls.appendChild(pauseButton);

  const resetButton = document.createElement('button');
  resetButton.className = 'preset-button';
  resetButton.type = 'button';
  resetButton.textContent = 'リセット';
  resetButton.addEventListener('click', () => post({ type: 'ui:pomodoroReset' }));
  controls.appendChild(resetButton);

  const skipButton = document.createElement('button');
  skipButton.className = 'preset-button';
  skipButton.type = 'button';
  skipButton.textContent = '次のフェーズへ';
  skipButton.addEventListener('click', () => post({ type: 'ui:pomodoroSkipPhase' }));
  controls.appendChild(skipButton);
  app.appendChild(controls);

  renderPhaseConfigEditor(app, s, 'focus', s.pomodoro.focus, '集中時間');
  renderPhaseConfigEditor(app, s, 'break', s.pomodoro.break, '休憩時間');
}

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
