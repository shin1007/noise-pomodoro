import * as vscode from 'vscode';
import { StatusBar } from './statusBar';
import { AppWebview, type AppWebviewCallbacks } from './ui/AppWebview';
import { SettingsStore } from './state/SettingsStore';
import { readAudioFile, selectAudioFile } from './fileAccess/audioFileLoader';
import { PomodoroTimer } from './pomodoro/PomodoroTimer';
import { formatMMSS, formatProgressBar } from './pomodoro/format';
import { runPhaseEndScript } from './scriptRunner/PhaseEndScriptRunner';
import { DEFAULT_AMBIENT_PRESETS } from './state/settings';
import { backgroundLabel } from './state/labels';
import type { BackgroundConfig, PhaseConfig, PlaybackState, ResolvedBackgroundConfig, ResolvedLiveMix, UiToExtMessage, WhiteNoiseSettings } from './protocol';
import { logger } from './utils/logger';
import { clone } from './utils/clone';

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = new StatusBar();
  context.subscriptions.push(statusBar);

  const settingsStore = new SettingsStore(context);

  let playback: PlaybackState = {
    status: 'stopped',
    backgroundActive: false,
    beatActive: false,
    beatMode: settingsStore.get().lastUsed.beatMode,
    activePresetId: null,
    currentTimeSec: 0,
  };

  // ファイル背景音の再デコード・再送信を避けるための、直近送信済み fsPath のメモです。
  // バイト列自体は保持しません（音声ファイルは最大 50MB 想定のため、拡張機能ホスト側に
  // 二重に保持しないようにしています）。パネルが閉じられたら onPanelClosed でリセットします。
  let lastSentFsPath: string | undefined;

  function findAmbientPreset(presetId: string) {
    return settingsStore.get().ambientPresets.find((p) => p.id === presetId);
  }

  function findChimePreset(presetId: string) {
    return settingsStore.get().chimePresets.find((p) => p.id === presetId);
  }

  function playChimePreset(presetId: string): void {
    const chimePreset = findChimePreset(presetId);
    if (!chimePreset) {
      return;
    }
    const resolved =
      chimePreset.mode === 'file' && chimePreset.file
        ? readAudioFile(chimePreset.file.fsPath).then((bytes) => ({ ...chimePreset, fileBytes: bytes }))
        : Promise.resolve(chimePreset);
    void resolved.then((r) => getPanel().playOneShot(r)).catch((err) => logger.error(`Failed to play chime: ${(err as Error).message}`));
  }

  async function resolveBackground(background: BackgroundConfig): Promise<ResolvedBackgroundConfig> {
    if (background.mode !== 'file' || !background.file) {
      // ファイル以外の背景に切り替えると engine 側はファイルノードを破棄します。
      // dedup 用のメモを残したままだと、同じファイルへ戻したときにバイト列を送らず
      // "No audio file data received." になるため、ここでリセットします。
      lastSentFsPath = undefined;
      return background;
    }
    if (background.file.fsPath === lastSentFsPath) {
      return background;
    }
    const bytes = await readAudioFile(background.file.fsPath);
    lastSentFsPath = background.file.fsPath;
    return { ...background, fileBytes: bytes };
  }

  async function buildResolvedMix(): Promise<ResolvedLiveMix> {
    const { lastUsed } = settingsStore.get();
    const background = await resolveBackground(lastUsed.background);
    return { background, beat: lastUsed.beat, beatMode: lastUsed.beatMode, volume: lastUsed.masterVolume };
  }

  function fallbackPlayingLabel(): string {
    const { lastUsed } = settingsStore.get();
    const bgLabel = backgroundLabel(lastUsed.background);
    const beatLabel = lastUsed.beat.enabled ? (lastUsed.beatMode === 'binaural' ? 'バイノーラル' : 'アイソクロニック') : '';
    return [bgLabel, beatLabel].filter(Boolean).join(' + ') || 'White Noise';
  }

  function refreshIdleStatusBar(): void {
    if (playback.status === 'playing') {
      const preset = playback.activePresetId ? findAmbientPreset(playback.activePresetId) : undefined;
      statusBar.renderPreset(preset?.icon, preset?.name ?? fallbackPlayingLabel());
    } else {
      statusBar.renderIdle(AppWebview.hasEverPlayed());
    }
  }

  function updatePlayback(next: PlaybackState): void {
    playback = next;
    AppWebview.postMessage({ type: 'ext:playbackState', playback });
    if (pomodoroTimer.getState().phase === 'idle') {
      refreshIdleStatusBar();
    }
  }

  function stoppedPlaybackState(): PlaybackState {
    return { status: 'stopped', backgroundActive: false, beatActive: false, beatMode: playback.beatMode, activePresetId: null, currentTimeSec: 0 };
  }

  /**
   * engine を停止し、停止状態を反映します。停止時に engine はファイルノードを破棄するため、
   * dedup メモ（lastSentFsPath）もリセットしないと、同じファイルの再再生でバイト列が送られず
   * "No audio file data received." になります。停止は必ずこの関数を通します。
   */
  function stopPlayback(): void {
    if (AppWebview.hasInstance()) {
      getPanel().stop();
    }
    lastSentFsPath = undefined;
    updatePlayback(stoppedPlaybackState());
  }

  function panelCallbacks(): AppWebviewCallbacks {
    return {
      dispatch: dispatchUiMessage,
      onPlaybackStarted: () => {
        const { lastUsed } = settingsStore.get();
        updatePlayback({
          status: 'playing',
          backgroundActive: lastUsed.background.mode !== 'off',
          beatActive: lastUsed.beat.enabled,
          beatMode: lastUsed.beatMode,
          activePresetId: lastUsed.activePresetId,
          currentTimeSec: 0,
        });
      },
      onPlaybackError: (layer, message) => {
        logger.error(`Playback error (${layer}): ${message}`);
        void vscode.window.showErrorMessage(`White Noise: ${message}`);
        if (layer === 'background') {
          // 背景音レイヤーが失われたので、次回同じファイルでも必ずバイト列を送り直します。
          lastSentFsPath = undefined;
          updatePlayback({ ...playback, backgroundActive: false, status: playback.beatActive ? 'playing' : 'stopped' });
        } else {
          updatePlayback({ ...playback, beatActive: false, status: playback.backgroundActive ? 'playing' : 'stopped' });
        }
      },
      onBackgroundEnded: () => {
        // 自然終了で engine はファイルノードを破棄済みのため、dedup メモをリセットします。
        lastSentFsPath = undefined;
        updatePlayback({ ...playback, backgroundActive: false, status: playback.beatActive ? 'playing' : 'stopped' });
      },
      onPanelClosed: () => {
        if (playback.status !== 'stopped') {
          void vscode.window.showWarningMessage('White Noise: パネルを閉じたため、再生を停止しました。');
        }
        lastSentFsPath = undefined;
        updatePlayback(stoppedPlaybackState());
      },
    };
  }

  function getPanel(): AppWebview {
    return AppWebview.ensure(context, panelCallbacks());
  }

  async function pushLiveMixIfPlaying(): Promise<void> {
    if (playback.status === 'playing') {
      getPanel().play(await buildResolvedMix());
    }
  }

  async function playCurrentMix(): Promise<void> {
    try {
      getPanel().play(await buildResolvedMix());
    } catch (err) {
      const errMessage = `再生できません: ${(err as Error).message}`;
      logger.error(errMessage);
      void vscode.window.showErrorMessage(`White Noise: ${errMessage}`);
      AppWebview.postMessage({ type: 'ext:error', message: errMessage });
    }
  }

  async function applyPresetId(presetId: string): Promise<void> {
    const preset = findAmbientPreset(presetId);
    if (!preset) {
      AppWebview.postMessage({ type: 'ext:error', message: `Unknown preset: ${presetId}` });
      return;
    }
    const settings = settingsStore.get();
    settings.lastUsed = {
      background: preset.background,
      beat: { ...preset.beat },
      beatMode: settings.lastUsed.beatMode,
      masterVolume: preset.volume,
      activePresetId: preset.id,
    };
    void settingsStore.persist();
    await playCurrentMix();
  }

  // --- ポモドーロ関連 ---
  const tickIntervalMs = vscode.workspace.getConfiguration('whiteNoise').get<number>('statusBar.updateIntervalMs', 1000);
  const pomodoroTimer = new PomodoroTimer(settingsStore.get().pomodoro, {
    onTick: (state, remainingSec, totalSec) => {
      if (state.phase === 'idle') {
        refreshIdleStatusBar();
      } else {
        statusBar.renderPomodoro(formatProgressBar(remainingSec, totalSec), formatMMSS(remainingSec), state.phase, state.runState === 'paused');
      }
      if (AppWebview.isVisible()) {
        AppWebview.postMessage({ type: 'ext:pomodoroTick', pomodoro: state, remainingSec, totalSec });
      }
    },
    onPhaseChange: (_phase, config: PhaseConfig) => {
      if (config.presetId) {
        void applyPresetId(config.presetId);
      } else if (AppWebview.hasInstance()) {
        stopPlayback();
      }
    },
    onPhaseEnd: (phase, config: PhaseConfig) => {
      const { endAction } = config;
      if (endAction.showToast) {
        const defaultMsg = phase === 'focus' ? '集中時間終了！' : '休憩終了！';
        void vscode.window.showInformationMessage(`White Noise: ${endAction.toastMessage ?? defaultMsg}`);
      }
      if (endAction.playSound && endAction.soundPresetId) {
        playChimePreset(endAction.soundPresetId);
      }
      if (endAction.runScript && endAction.scriptSource) {
        runPhaseEndScript(endAction.scriptSource, phase);
      }
    },
  }, tickIntervalMs);
  context.subscriptions.push({ dispose: () => pomodoroTimer.dispose() });

  function broadcastStateSync(): void {
    AppWebview.postMessage({ type: 'ext:stateSync', settings: settingsStore.get(), pomodoro: pomodoroTimer.getState(), playback });
  }

  /** lastUsed を変更し、永続化してから再生中なら即座に反映します（ui:setXxx 系の共通処理）。 */
  function updateLiveConfig(mutate: (settings: WhiteNoiseSettings) => void): void {
    mutate(settingsStore.get());
    void settingsStore.persist();
    void pushLiveMixIfPlaying();
  }

  /** 設定を変更し、永続化してから全 Webview に stateSync を配信します（プリセット管理系の共通処理）。 */
  function updateSettings(mutate: (settings: WhiteNoiseSettings) => void): void {
    mutate(settingsStore.get());
    void settingsStore.persist();
    broadcastStateSync();
  }

  function dispatchUiMessage(message: UiToExtMessage): void {
    // UI からの操作を、再生・設定更新・ポモドーロ操作に振り分けます。
    switch (message.type) {
      case 'ui:ready':
      case 'ui:requestState':
        broadcastStateSync();
        break;
      case 'ui:applyPreset':
        void applyPresetId(message.presetId);
        break;
      case 'ui:play':
        void playCurrentMix();
        break;
      case 'ui:stop':
        stopPlayback();
        break;
      case 'ui:setBackground':
        updateLiveConfig((s) => {
          s.lastUsed.background = message.background;
          s.lastUsed.activePresetId = null;
        });
        break;
      case 'ui:setBeat':
        updateLiveConfig((s) => {
          s.lastUsed.beat = message.beat;
          s.lastUsed.activePresetId = null;
        });
        break;
      case 'ui:setBeatMode':
        updateLiveConfig((s) => {
          s.lastUsed.beatMode = message.mode;
          s.lastUsed.activePresetId = null;
        });
        break;
      case 'ui:setMasterVolume':
        updateLiveConfig((s) => {
          s.lastUsed.masterVolume = message.value;
        });
        break;
      case 'ui:selectAudioFile': {
        void (async () => {
          const selected = await selectAudioFile();
          if (!selected) {
            return;
          }
          const settings = settingsStore.get();
          settings.lastUsed.background = { mode: 'file', file: { fsPath: selected.fsPath, mimeType: selected.mimeType, loop: true } };
          settings.lastUsed.activePresetId = null;
          void settingsStore.persist();
          AppWebview.postMessage({ type: 'ext:fileSelected', fileName: selected.fileName, fsPath: selected.fsPath });
        })();
        break;
      }
      case 'ui:setCustomCode': {
        if (settingsStore.get().lastUsed.background.mode !== 'custom') {
          return;
        }
        updateLiveConfig((s) => {
          s.lastUsed.background.custom = { code: message.code, params: message.params };
        });
        break;
      }
      case 'ui:savePreset':
        updateSettings((s) => {
          const index = s.ambientPresets.findIndex((p) => p.id === message.preset.id);
          if (index >= 0) {
            s.ambientPresets[index] = message.preset;
          } else {
            s.ambientPresets.push(message.preset);
          }
        });
        break;
      case 'ui:deletePreset':
        updateSettings((s) => {
          s.ambientPresets = s.ambientPresets.filter((p) => p.id !== message.presetId);
        });
        break;
      case 'ui:resetPresets':
        updateSettings((s) => {
          s.ambientPresets = clone(DEFAULT_AMBIENT_PRESETS);
        });
        break;
      case 'ui:updatePomodoroConfig': {
        const settings = settingsStore.get();
        settings.pomodoro = message.pomodoro;
        void settingsStore.persist();
        pomodoroTimer.updateConfig(message.pomodoro);
        broadcastStateSync();
        break;
      }
      case 'ui:pomodoroStart':
        pomodoroTimer.start();
        break;
      case 'ui:pomodoroPause':
        pomodoroTimer.pause();
        break;
      case 'ui:pomodoroReset':
        pomodoroTimer.reset();
        break;
      case 'ui:pomodoroSkipPhase':
        pomodoroTimer.skipPhase();
        break;
      case 'ui:pomodoroSetRemaining':
        pomodoroTimer.setRemainingSec(message.remainingSec);
        break;
      case 'ui:previewChime':
        playChimePreset(message.presetId);
        break;
      default:
        logger.info(`UI メッセージはまだ未接続です（後続実装予定）: ${(message as { type: string }).type}`);
        break;
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('whiteNoise.openPanel', () => {
      AppWebview.show(context, panelCallbacks());
    }),
    // ステータスバーのクリック用。ポモドーロ実行中はパネルを開き、それ以外は
    // 再生中なら停止、停止中はこの Webview で一度でも再生成功していれば
    // パネルを開かず直接トグル再生します（自動再生ポリシーの都合上、
    // 一度もクリックされていない Webview では resume() が完了しないため）。
    vscode.commands.registerCommand('whiteNoise.statusBar.action', () => {
      // ステータスバーからの呼び出しでは、エディタを分割せず現在のエディタ列に開きます。
      if (pomodoroTimer.getState().phase !== 'idle') {
        AppWebview.show(context, panelCallbacks(), vscode.ViewColumn.Active);
        return;
      }
      if (playback.status === 'playing') {
        dispatchUiMessage({ type: 'ui:stop' });
        return;
      }
      if (AppWebview.hasEverPlayed()) {
        dispatchUiMessage({ type: 'ui:play' });
        return;
      }
      AppWebview.show(context, panelCallbacks(), vscode.ViewColumn.Active);
    }),
    vscode.commands.registerCommand('whiteNoise.play', () => dispatchUiMessage({ type: 'ui:play' })),
    vscode.commands.registerCommand('whiteNoise.stop', () => dispatchUiMessage({ type: 'ui:stop' })),
    vscode.commands.registerCommand('whiteNoise.pomodoro.start', () => pomodoroTimer.start()),
    vscode.commands.registerCommand('whiteNoise.pomodoro.pause', () => pomodoroTimer.pause()),
    vscode.commands.registerCommand('whiteNoise.pomodoro.reset', () => pomodoroTimer.reset()),
    vscode.commands.registerCommand('whiteNoise.pomodoro.skipPhase', () => pomodoroTimer.skipPhase()),
  );

  logger.info('White Noise & Pomodoro activated.');
}

export function deactivate(): void {
  AppWebview.disposeInstance();
  logger.dispose();
}
