// Webview UI の共有状態（設定・再生状態・ポモドーロ・エディタ下書き等）と、それを変更する
// アクション群です。render() の実体は main.ts が持ちますが、ここから再描画をトリガーできるよう
// setRenderCallback() で注入してもらいます（views/*.ts ⇄ state.ts の循環 import を避けるため）。

import type {
  AmbientPreset,
  BackgroundConfig,
  BeatConfig,
  BeatMode,
  ExtToUiMessage,
  PlaybackState,
  PomodoroConfig,
  PomodoroState,
  UiToExtMessage,
  WhiteNoiseSettings,
} from '../../protocol';
import { getVsCodeApi } from '../vscodeApi';
import { clone } from '../../utils/clone';

// 共有 vscode API（同一 Webview 内の engineClient.ts と acquireVsCodeApi() を共用）。
const vscode = getVsCodeApi();

export function post(message: UiToExtMessage): void {
  vscode.postMessage(message);
}

let renderCallback: () => void = () => {};
export function setRenderCallback(fn: () => void): void {
  renderCallback = fn;
}
export function requestRender(): void {
  renderCallback();
}

// ---- モジュール状態 -----------------------------------------------------------

export let settings: WhiteNoiseSettings | undefined;
export let playback: PlaybackState = { status: 'stopped', backgroundActive: false, beatActive: false, beatMode: 'binaural', activePresetId: null, currentTimeSec: 0 };
let previousPlaybackStatus: PlaybackState['status'] = 'stopped';
export let pomodoroState: PomodoroState = { phase: 'idle', runState: 'stopped', phaseStartedAt: null, phaseDurationSec: 0, elapsedBeforePauseSec: 0 };
export let pomodoroRemainingSec = 0;
// ext:fileSelected には {fileName, fsPath} しか含まれず、完全な BackgroundConfig.file は渡ってきません。
// stateSync を待たずに表示を即時更新できるよう、ここで別管理しています。
export let selectedFileName: string | undefined;

// リスニングタイマー（アンビエント再生の自動停止）は、この Webview だけで完結する
// クライアントサイドのカウントダウンです。ポモドーロタイマーとは独立しています。
export let listenTimerMinutes = 30;
export let listenTimerRemainingSec: number | null = null;
let listenTimerHandle: number | undefined;

export interface PresetEditorDraft {
  id: string;
  name: string;
  description: string;
  icon?: string;
}
export let editingPresetId: string | null = null;
export let editingDraft: PresetEditorDraft | null = null;
let editorInitialLastUsed: WhiteNoiseSettings['lastUsed'] | null = null;

/** リスニングタイマーの分数を [0, 60] に収めて更新します（外部から直接代入できない export let の setter）。 */
export function setListenTimerMinutes(minutes: number): number {
  listenTimerMinutes = Math.max(0, Math.min(60, minutes));
  return listenTimerMinutes;
}

// ---- 設定変更（extension へ送信しつつ再描画） ---------------------------------

export function setBackground(background: BackgroundConfig): void {
  if (!settings) return;
  settings.lastUsed.background = background;
  settings.lastUsed.activePresetId = null;
  post({ type: 'ui:setBackground', background });
  requestRender();
}

export function setBeat(beat: BeatConfig): void {
  if (!settings) return;
  settings.lastUsed.beat = beat;
  settings.lastUsed.activePresetId = null;
  post({ type: 'ui:setBeat', beat });
  requestRender();
}

export function setBeatMode(mode: BeatMode): void {
  if (!settings) return;
  settings.lastUsed.beatMode = mode;
  settings.lastUsed.activePresetId = null;
  post({ type: 'ui:setBeatMode', mode });
  requestRender();
}

/** プリセットカードのクリックによる即時反映です（post 後、stateSync を待たずローカルにも適用します）。 */
export function applyPresetLocally(s: WhiteNoiseSettings, preset: AmbientPreset): void {
  s.lastUsed = {
    background: preset.background,
    beat: { ...preset.beat },
    beatMode: s.lastUsed.beatMode,
    masterVolume: preset.volume,
    activePresetId: preset.id,
  };
  playback = { ...playback, activePresetId: preset.id };
}

// ---- リスニングタイマー -------------------------------------------------------

export function formatRemaining(totalSeconds: number): string {
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

// ---- プリセット編集 ------------------------------------------------------------

export function openPresetEditor(preset: AmbientPreset): void {
  if (!settings) return;
  editingPresetId = preset.id;
  editingDraft = { id: preset.id, name: preset.name, description: preset.description ?? '', icon: preset.icon };
  editorInitialLastUsed = clone(settings.lastUsed);
  setBackground(preset.background);
  setBeat({ ...preset.beat });
  settings.lastUsed.masterVolume = preset.volume;
  post({ type: 'ui:setMasterVolume', value: preset.volume });
  requestRender();
}

export function closePresetEditor(): void {
  editingPresetId = null;
  editingDraft = null;
  editorInitialLastUsed = null;
  requestRender();
}

export function cancelPresetEditor(): void {
  if (settings && editorInitialLastUsed) {
    settings.lastUsed = clone(editorInitialLastUsed);
    post({ type: 'ui:setBackground', background: settings.lastUsed.background });
    post({ type: 'ui:setBeat', beat: settings.lastUsed.beat });
    post({ type: 'ui:setMasterVolume', value: settings.lastUsed.masterVolume });
  }
  closePresetEditor();
}

export function saveEditingPreset(): void {
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

export function previewPresetVolume(percent: number): void {
  if (!settings) return;
  const clamped = Math.max(0, Math.min(100, percent));
  settings.lastUsed.masterVolume = clamped / 100;
  post({ type: 'ui:setMasterVolume', value: clamped / 100 });
  requestRender();
}

// ---- ポモドーロ ---------------------------------------------------------------

export function updatePomodoroConfig(mutate: (config: PomodoroConfig) => void): void {
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

export function formatPomodoroStatus(): string {
  const mm = Math.floor(pomodoroRemainingSec / 60).toString().padStart(2, '0');
  const ss = Math.floor(pomodoroRemainingSec % 60).toString().padStart(2, '0');
  const phaseLabel = pomodoroState.phase === 'focus' ? '集中中' : pomodoroState.phase === 'break' ? '休憩中' : '停止中';
  return pomodoroState.phase === 'idle' ? phaseLabel : `${phaseLabel} (${pomodoroState.runState}) ${mm}:${ss}`;
}

// ---- extension からのメッセージ受信 --------------------------------------------

export function handleExtMessage(message: ExtToUiMessage): void {
  switch (message.type) {
    case 'ext:stateSync':
      settings = message.settings;
      handlePlaybackUpdate(message.playback);
      pomodoroState = message.pomodoro;
      pomodoroRemainingSec = message.pomodoro.phaseDurationSec;
      requestRender();
      break;
    case 'ext:playbackState':
      handlePlaybackUpdate(message.playback);
      requestRender();
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
        requestRender();
      }
      break;
    }
    case 'ext:fileSelected':
      selectedFileName = message.fileName;
      requestRender();
      post({ type: 'ui:play' });
      break;
    case 'ext:error':
      console.error('[white-noise]', message.message);
      break;
    default:
      break;
  }
}
