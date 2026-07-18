// UIPanelWebview、extension.ts、AudioEngineWebview 間で共有する postMessage プロトコルです。
// 型のみで構成しているため、Node / DOM / Worklet いずれの tsconfig にも安全に含められます。

export type NoiseAlgorithm = 'white' | 'pink' | 'brown' | 'isochronic' | 'binaural' | 'solfeggio';

export type PresetMode = 'procedural' | 'file' | 'custom';

export interface PresetConfig {
  id: string;
  name: string;
  icon?: string;
  mode: PresetMode;
  volume: number;
  procedural?: {
    algorithm: NoiseAlgorithm;
    params: Record<string, number>;
  };
  file?: {
    fsPath: string;
    mimeType: string;
    loop: boolean;
  };
  custom?: {
    code: string;
    params: Record<string, number>;
  };
}

export interface PhaseEndAction {
  showToast: boolean;
  toastMessage?: string;
  /** soundPresetId 経由で短いワンショット音を鳴らします（組み込みチャイム、または任意のユーザープリセット）。 */
  playSound: boolean;
  soundPresetId?: string | null;
  runScript: boolean;
  scriptSource?: string;
}

export interface PhaseConfig {
  durationSec: number;
  presetId: string | null;
  autoAdvance: boolean;
  endAction: PhaseEndAction;
}

export interface PomodoroConfig {
  focus: PhaseConfig;
  break: PhaseConfig;
}

export type PomodoroPhase = 'idle' | 'focus' | 'break';
export type PomodoroRunState = 'stopped' | 'running' | 'paused';

export interface PomodoroState {
  phase: PomodoroPhase;
  runState: PomodoroRunState;
  phaseStartedAt: number | null;
  phaseDurationSec: number;
  elapsedBeforePauseSec: number;
}

export interface WhiteNoiseSettings {
  schemaVersion: number;
  presets: PresetConfig[];
  pomodoro: PomodoroConfig;
  lastUsed: {
    manualPresetId: string | null;
    masterVolume: number;
  };
}

export type PlaybackStatus = 'stopped' | 'playing' | 'paused';

export interface PlaybackState {
  status: PlaybackStatus;
  presetId: string | null;
  currentTimeSec: number;
}

// ---- UI から extension へ ----
export type UiToExtMessage =
  | { type: 'ui:ready' }
  | { type: 'ui:requestState' }
  | { type: 'ui:playPreset'; presetId: string }
  | { type: 'ui:stop' }
  | { type: 'ui:pause' }
  | { type: 'ui:resume' }
  | { type: 'ui:setParam'; presetId: string; paramKey: string; value: number }
  | { type: 'ui:savePreset'; preset: PresetConfig }
  | { type: 'ui:deletePreset'; presetId: string }
  | { type: 'ui:selectAudioFile'; presetId: string }
  | { type: 'ui:setCustomCode'; presetId: string; code: string }
  | { type: 'ui:updatePomodoroConfig'; pomodoro: PomodoroConfig }
  | { type: 'ui:pomodoroStart' }
  | { type: 'ui:pomodoroPause' }
  | { type: 'ui:pomodoroReset' }
  | { type: 'ui:pomodoroSkipPhase' };

// ---- extension から UI へ ----
export type ExtToUiMessage =
  | { type: 'ext:stateSync'; settings: WhiteNoiseSettings; pomodoro: PomodoroState; playback: PlaybackState }
  | { type: 'ext:playbackState'; playback: PlaybackState }
  | { type: 'ext:pomodoroTick'; pomodoro: PomodoroState; remainingSec: number; totalSec: number }
  | { type: 'ext:fileSelected'; presetId: string; fileName: string; fsPath: string }
  | { type: 'ext:error'; message: string; code?: string };

// ---- extension から engine へ ----
export type ResolvedEnginePreset = PresetConfig & {
  fileBytes?: Uint8Array;
};

export type ExtToEngineMessage =
  | { type: 'eng:play'; preset: ResolvedEnginePreset }
  | { type: 'eng:playOneShot'; preset: ResolvedEnginePreset }
  | { type: 'eng:stop' }
  | { type: 'eng:pause' }
  | { type: 'eng:resume' }
  | { type: 'eng:setVolume'; volume: number }
  | { type: 'eng:setParam'; presetId: string; paramKey: string; value: number }
  | { type: 'eng:setCustomCode'; presetId: string; code: string; params: Record<string, number> };

// ---- engine から extension へ ----
export type EngineToExtMessage =
  | { type: 'eng:ready' }
  | { type: 'eng:playbackStarted'; presetId: string }
  | { type: 'eng:playbackError'; presetId: string; message: string }
  | { type: 'eng:playbackEnded'; presetId: string };
