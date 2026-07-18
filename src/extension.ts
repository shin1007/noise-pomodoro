import * as vscode from 'vscode';
import { StatusBar } from './statusBar';
import { UIPanelWebview } from './ui/UIPanelWebview';
import { AudioEngineWebview } from './audioEngine/AudioEngineWebview';
import { SettingsStore } from './state/SettingsStore';
import { readAudioFile, selectAudioFile } from './fileAccess/audioFileLoader';
import { PomodoroTimer } from './pomodoro/PomodoroTimer';
import { formatMMSS, formatProgressBar } from './pomodoro/format';
import { runPhaseEndScript } from './scriptRunner/PhaseEndScriptRunner';
import type { PhaseConfig, PlaybackState, PresetConfig, ResolvedEnginePreset, UiToExtMessage } from './protocol';
import { logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = new StatusBar();
  context.subscriptions.push(statusBar);

  const settingsStore = new SettingsStore(context);

  let playback: PlaybackState = { status: 'stopped', presetId: null, currentTimeSec: 0 };

  function findPreset(presetId: string): PresetConfig | undefined {
    return settingsStore.get().presets.find((p) => p.id === presetId);
  }

  async function resolvePreset(preset: PresetConfig): Promise<ResolvedEnginePreset> {
    if (preset.mode === 'file' && preset.file) {
      const bytes = await readAudioFile(preset.file.fsPath);
      return { ...preset, fileBytes: bytes };
    }
    return preset;
  }

  function refreshIdleStatusBar(): void {
    if (playback.status === 'playing' && playback.presetId) {
      const preset = findPreset(playback.presetId);
      statusBar.renderPreset(preset?.icon, preset?.name ?? playback.presetId);
    } else {
      statusBar.renderIdle();
    }
  }

  function updatePlayback(next: PlaybackState): void {
    playback = next;
    UIPanelWebview.postMessage({ type: 'ext:playbackState', playback });
    if (pomodoroTimer.getState().phase === 'idle') {
      refreshIdleStatusBar();
    }
  }

  function getEngine(): AudioEngineWebview {
    return AudioEngineWebview.getOrCreate(context, {
      onPlaybackStarted: (presetId) => updatePlayback({ status: 'playing', presetId, currentTimeSec: 0 }),
      onPlaybackError: (presetId, message) => {
        logger.error(`Playback error for ${presetId}: ${message}`);
        void vscode.window.showErrorMessage(`White Noise: ${message}`);
        updatePlayback({ status: 'stopped', presetId: null, currentTimeSec: 0 });
      },
      onPlaybackEnded: () => {
        updatePlayback({ status: 'stopped', presetId: null, currentTimeSec: 0 });
      },
      onEngineClosed: () => {
        if (playback.status !== 'stopped') {
          void vscode.window.showWarningMessage('White Noise: the audio engine tab was closed, so playback stopped.');
        }
        updatePlayback({ status: 'stopped', presetId: null, currentTimeSec: 0 });
      },
    });
  }

  async function playPresetId(presetId: string): Promise<void> {
    const preset = findPreset(presetId);
    if (!preset) {
      UIPanelWebview.postMessage({ type: 'ext:error', message: `Unknown preset: ${presetId}` });
      return;
    }
    if (preset.mode === 'file' && !preset.file) {
      UIPanelWebview.postMessage({ type: 'ext:error', message: 'ファイルが選択されていません。先にファイルを選択してください。' });
      return;
    }
    try {
      const resolved = await resolvePreset(preset);
      getEngine().play(resolved);
      settingsStore.get().lastUsed.manualPresetId = presetId;
      void settingsStore.persist();
    } catch (err) {
      const errMessage = `プリセットを再生できません: ${preset.name} (${(err as Error).message})`;
      logger.error(errMessage);
      void vscode.window.showErrorMessage(`White Noise: ${errMessage}`);
      UIPanelWebview.postMessage({ type: 'ext:error', message: errMessage });
    }
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
      if (UIPanelWebview.isVisible()) {
        UIPanelWebview.postMessage({ type: 'ext:pomodoroTick', pomodoro: state, remainingSec, totalSec });
      }
    },
    onPhaseChange: (_phase, config: PhaseConfig) => {
      if (config.presetId) {
        void playPresetId(config.presetId);
      } else if (AudioEngineWebview.hasInstance()) {
        getEngine().stop();
        updatePlayback({ status: 'stopped', presetId: null, currentTimeSec: 0 });
      }
    },
    onPhaseEnd: (phase, config: PhaseConfig) => {
      const { endAction } = config;
      if (endAction.showToast) {
        const defaultMsg = phase === 'focus' ? '集中時間終了！' : '休憩終了！';
        void vscode.window.showInformationMessage(`White Noise: ${endAction.toastMessage ?? defaultMsg}`);
      }
      if (endAction.playSound && endAction.soundPresetId) {
        const soundPreset = findPreset(endAction.soundPresetId);
        if (soundPreset) {
          void resolvePreset(soundPreset)
            .then((resolved) => getEngine().playOneShot(resolved))
            .catch((err) => logger.error(`Failed to play end-of-phase sound: ${(err as Error).message}`));
        }
      }
      if (endAction.runScript && endAction.scriptSource) {
        runPhaseEndScript(endAction.scriptSource, phase);
      }
    },
  }, tickIntervalMs);
  context.subscriptions.push({ dispose: () => pomodoroTimer.dispose() });

  function dispatchUiMessage(message: UiToExtMessage): void {
    // UI からの操作を、再生・設定更新・ポモドーロ操作に振り分けます。
    switch (message.type) {
      case 'ui:ready':
      case 'ui:requestState':
        UIPanelWebview.postMessage({
          type: 'ext:stateSync',
          settings: settingsStore.get(),
          pomodoro: pomodoroTimer.getState(),
          playback,
        });
        break;
      case 'ui:playPreset':
        void playPresetId(message.presetId);
        break;
      case 'ui:selectAudioFile': {
        void (async () => {
          const preset = findPreset(message.presetId);
          if (!preset) {
            return;
          }
          const selected = await selectAudioFile();
          if (!selected) {
            return;
          }
          preset.mode = 'file';
          preset.file = { fsPath: selected.fsPath, mimeType: selected.mimeType, loop: true };
          void settingsStore.persist();
          UIPanelWebview.postMessage({ type: 'ext:fileSelected', presetId: preset.id, fileName: selected.fileName, fsPath: selected.fsPath });
        })();
        break;
      }
      case 'ui:stop':
        if (AudioEngineWebview.hasInstance()) {
          getEngine().stop();
        }
        updatePlayback({ status: 'stopped', presetId: null, currentTimeSec: 0 });
        break;
      case 'ui:setCustomCode': {
        const preset = findPreset(message.presetId);
        if (!preset || preset.mode !== 'custom') {
          return;
        }
        preset.custom = { code: message.code, params: preset.custom?.params ?? {} };
        void settingsStore.persist();
        if (playback.presetId === message.presetId && playback.status === 'playing' && AudioEngineWebview.hasInstance()) {
          getEngine().setCustomCode(message.presetId, preset.custom.code, preset.custom.params);
        }
        break;
      }
      case 'ui:setParam': {
        const preset = findPreset(message.presetId);
        if (!preset) {
          return;
        }
        if (message.paramKey === 'volume') {
          preset.volume = message.value;
        } else if (preset.procedural) {
          preset.procedural.params[message.paramKey] = message.value;
        }
        void settingsStore.persist();
        if (AudioEngineWebview.hasInstance()) {
          getEngine().setParam(message.presetId, message.paramKey, message.value);
        }
        break;
      }
      case 'ui:updatePomodoroConfig': {
        const settings = settingsStore.get();
        settings.pomodoro = message.pomodoro;
        void settingsStore.persist();
        pomodoroTimer.updateConfig(message.pomodoro);
        UIPanelWebview.postMessage({ type: 'ext:stateSync', settings, pomodoro: pomodoroTimer.getState(), playback });
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
      default:
        logger.info(`UI メッセージはまだ未接続です（後続実装予定）: ${message.type}`);
        break;
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('whiteNoise.openPanel', () => {
      UIPanelWebview.createOrShow(context, dispatchUiMessage);
    }),
    vscode.commands.registerCommand('whiteNoise.play', () => {
      const presetId = settingsStore.get().lastUsed.manualPresetId ?? settingsStore.get().presets[0]?.id;
      if (presetId) {
        void playPresetId(presetId);
      }
    }),
    vscode.commands.registerCommand('whiteNoise.stop', () => dispatchUiMessage({ type: 'ui:stop' })),
    vscode.commands.registerCommand('whiteNoise.pomodoro.start', () => pomodoroTimer.start()),
    vscode.commands.registerCommand('whiteNoise.pomodoro.pause', () => pomodoroTimer.pause()),
    vscode.commands.registerCommand('whiteNoise.pomodoro.reset', () => pomodoroTimer.reset()),
    vscode.commands.registerCommand('whiteNoise.pomodoro.skipPhase', () => pomodoroTimer.skipPhase()),
  );

  logger.info('White Noise & Pomodoro activated.');
}

export function deactivate(): void {
  AudioEngineWebview.disposeInstance();
  UIPanelWebview.disposeInstance();
  logger.dispose();
}
