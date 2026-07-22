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
import { TIMER_SEEKBAR_MAX_MINUTES, updateTimerSeekbar } from './views/timerSeekbar';

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

// 「タイマー」セクション内のタブ選択（スリープ / ポモドーロ）。両方を同時に動かすと
// どちらが再生を止めているのか分かりづらくなるため、UI 上は排他的に切り替える表示にしています。
export type TimerTab = 'sleep' | 'pomodoro';
export let timerTab: TimerTab = 'sleep';
let timerTabAutoSelected = false;

export function setTimerTab(tab: TimerTab): void {
  timerTab = tab;
  requestRender();
}

export let pomodoroSettingsOpen = false;
export function openPomodoroSettings(): void {
  pomodoroSettingsOpen = true;
  requestRender();
}
export function closePomodoroSettings(): void {
  pomodoroSettingsOpen = false;
  requestRender();
}

// ヘッダーのプリセット選択欄が指す「適用先」のプリセットIDと、名前・アイコン・説明文の下書きです。
// 背景音/ビートを個別に調整すると lastUsed.activePresetId は null に戻ってしまう
// （＝プリセットと完全一致でなくなったことを示す）ため、"どのプリセットへ保存するか" は
// activePresetId とは別にここで保持し続けます（選び直すまで維持）。
export let selectedPresetId: string | null = null;
export let presetNameDraft = '';
export let presetIconDraft = '';
export let presetDescriptionDraft = '';
let presetSelectionInitialized = false;
let refreshDraftOnNextSync = false;

/** リスニングタイマーの分数を [0, 60] に収めて更新します（外部から直接代入できない export let の setter）。 */
export function setListenTimerMinutes(minutes: number): number {
  listenTimerMinutes = Math.max(0, Math.min(60, minutes));
  return listenTimerMinutes;
}

/** カウントダウン中にシークバーをドラッグしたときの、残り秒数の直接上書きです。 */
export function setListenTimerRemainingSec(seconds: number): void {
  if (listenTimerRemainingSec === null) {
    return;
  }
  listenTimerRemainingSec = Math.max(0, Math.min(TIMER_SEEKBAR_MAX_MINUTES * 60, seconds));
  updateTimerSeekbar('sleep-timer-seekbar', listenTimerRemainingSec, formatRemaining(listenTimerRemainingSec));
  post({ type: 'ui:listenTimerTick', remainingSec: listenTimerRemainingSec });
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
  const wasRunning = listenTimerRemainingSec !== null;
  listenTimerRemainingSec = null;
  // ステータスバー（extension 側）にも残り時間を表示しているため、カウント終了時は
  // こちらからクリアを知らせないと表示が残り続けてしまいます。
  if (wasRunning) {
    post({ type: 'ui:listenTimerTick', remainingSec: null });
  }
}

function startListenTimerIfNeeded(): void {
  clearListenTimer();
  if (listenTimerMinutes <= 0) {
    return;
  }
  listenTimerRemainingSec = listenTimerMinutes * 60;
  post({ type: 'ui:listenTimerTick', remainingSec: listenTimerRemainingSec });
  listenTimerHandle = window.setInterval(() => {
    if (listenTimerRemainingSec === null) {
      return;
    }
    listenTimerRemainingSec -= 1;
    updateTimerSeekbar('sleep-timer-seekbar', listenTimerRemainingSec, formatRemaining(listenTimerRemainingSec));
    post({ type: 'ui:listenTimerTick', remainingSec: listenTimerRemainingSec });
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

// ---- プリセット選択・適用 -------------------------------------------------------

/** ヘッダーのドロップダウンでプリセットを選ぶと、その設定を即座に現在の設定へ反映します。 */
export function selectPreset(s: WhiteNoiseSettings, preset: AmbientPreset): void {
  selectedPresetId = preset.id;
  presetNameDraft = preset.name;
  presetIconDraft = preset.icon ?? '';
  presetDescriptionDraft = preset.description ?? '';
  post({ type: 'ui:applyPreset', presetId: preset.id });
  applyPresetLocally(s, preset);
  requestRender();
}

export function setPresetNameDraft(value: string): void {
  presetNameDraft = value;
}

export function setPresetIconDraft(value: string): void {
  presetIconDraft = value;
}

export function setPresetDescriptionDraft(value: string): void {
  presetDescriptionDraft = value;
}

/** 「現在の設定をプリセットに適用」ボタン。選択中プリセットへ、現在の背景音/ビート/音量と名前・アイコン・説明文の下書きを上書き保存します。 */
export function applyCurrentSettingsToPreset(s: WhiteNoiseSettings): void {
  const target = s.ambientPresets.find((preset) => preset.id === selectedPresetId);
  if (!target) return;
  const updated: AmbientPreset = {
    ...target,
    name: presetNameDraft,
    icon: presetIconDraft || undefined,
    description: presetDescriptionDraft,
    background: s.lastUsed.background,
    beat: { ...s.lastUsed.beat },
    volume: s.lastUsed.masterVolume,
  };
  post({ type: 'ui:savePreset', preset: updated });
  post({ type: 'ui:applyPreset', presetId: updated.id });

  const index = s.ambientPresets.findIndex((p) => p.id === updated.id);
  if (index >= 0) {
    s.ambientPresets[index] = updated;
  }
  s.lastUsed.activePresetId = updated.id;
  playback = { ...playback, activePresetId: updated.id };
  requestRender();
}

export function resetAmbientPresets(): void {
  refreshDraftOnNextSync = true;
  post({ type: 'ui:resetPresets' });
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

/** 実行中/一時停止中のフェーズの残り時間を、シークバーのドラッグで直接上書きします。 */
export function setPomodoroRemainingMinutes(minutes: number): void {
  const remainingSec = Math.max(0, Math.min(TIMER_SEEKBAR_MAX_MINUTES, minutes)) * 60;
  pomodoroRemainingSec = remainingSec;
  updateTimerSeekbar('pomodoro-timer-seekbar', remainingSec, formatRemaining(remainingSec));
  post({ type: 'ui:pomodoroSetRemaining', remainingSec });
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
      // 初回同期時、既にポモドーロが動いていればそちらのタブを開いた状態にします
      // （以降のタブ選択はユーザー操作を優先し、再同期のたびには上書きしません）。
      if (!timerTabAutoSelected) {
        timerTabAutoSelected = true;
        if (message.pomodoro.runState !== 'stopped') {
          timerTab = 'pomodoro';
        }
      }
      // ヘッダーのプリセット選択欄も同様に初回のみ既定値を決めます（以降はユーザーの選択を維持）。
      if (!presetSelectionInitialized) {
        presetSelectionInitialized = true;
        const initial = message.settings.ambientPresets.find((preset) => preset.id === message.settings.lastUsed.activePresetId) ?? message.settings.ambientPresets[0];
        selectedPresetId = initial?.id ?? null;
        presetNameDraft = initial?.name ?? '';
        presetIconDraft = initial?.icon ?? '';
        presetDescriptionDraft = initial?.description ?? '';
      }
      // プリセットのリセット直後は、選択中プリセットの下書きを最新の既定値に合わせ直します。
      if (refreshDraftOnNextSync) {
        refreshDraftOnNextSync = false;
        const target = message.settings.ambientPresets.find((preset) => preset.id === selectedPresetId);
        presetNameDraft = target?.name ?? '';
        presetIconDraft = target?.icon ?? '';
        presetDescriptionDraft = target?.description ?? '';
      }
      requestRender();
      break;
    case 'ext:playbackState':
      handlePlaybackUpdate(message.playback);
      requestRender();
      break;
    case 'ext:pomodoroTick': {
      pomodoroState = message.pomodoro;
      pomodoroRemainingSec = message.remainingSec;
      // DOM 直接パッチのみ行い、全面 render() は避けます。これは毎秒発火するため、
      // DOM を丸ごと再構築するとちらつきや編集中断が起きます。「タイマー」セクションが
      // スリープ表示中（ポモドーロがバックグラウンドで動作中）は対象要素が存在せず、
      // その場合は何もしません — 該当タブに切り替わった時点で最新の state から描画されます。
      const statusEl = document.getElementById('pomodoro-status');
      if (statusEl) {
        statusEl.textContent = formatPomodoroStatus();
      }
      updateTimerSeekbar('pomodoro-timer-seekbar', message.remainingSec, formatRemaining(message.remainingSec));
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
