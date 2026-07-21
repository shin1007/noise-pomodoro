// AppWebview（UI + 音声エンジン）と extension.ts の間で共有する postMessage プロトコルです。
// 型のみで構成しているため、Node / DOM / Worklet いずれの tsconfig にも安全に含められます。

export type NoiseType = 'white' | 'pink' | 'brown' | 'blue' | 'violet';
export type BeatMode = 'binaural' | 'isochronic';
export type BackgroundMode = 'off' | 'procedural' | 'file' | 'custom';

export interface BackgroundConfig {
  mode: BackgroundMode;
  /** mode === 'procedural' のときのノイズ種類です。 */
  noiseType?: NoiseType;
  /** mode === 'file' のときの音声ファイルです。 */
  file?: { fsPath: string; mimeType: string; loop: boolean };
  /** mode === 'custom' のときのカスタムコードです。 */
  custom?: { code: string; params: Record<string, number> };
}

/**
 * バイノーラルビート / アイソクロニックトーンのレイヤーです。背景音（BackgroundConfig）とは
 * 独立して有効・無効を切り替えられ、両方が有効なら同時にミックスされて再生されます。
 * ビートモード（binaural / isochronic）自体はレイヤー間で共有するグローバルな切り替えのため、
 * ここには含みません（lastUsed.beatMode を参照）。
 */
export interface BeatConfig {
  enabled: boolean;
  /** ベース（キャリア）周波数 (Hz)。UI 側でソルフェジオ周波数にスナップされます。 */
  baseFrequency: number;
  /** 差分 / パルス周波数 (Hz, 0-40)。UI 側でデルタ〜ガンマの帯域に分類されます。 */
  beatFrequency: number;
}

/** 背景音とビートの組み合わせをまとめて保存・呼び出しできるプリセットです。 */
export interface AmbientPreset {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  background: BackgroundConfig;
  beat: BeatConfig;
  volume: number;
}

export type PresetMode = 'procedural' | 'file' | 'custom';

/** フェーズ終了時などに鳴らす、短いワンショット音の設定です（アンビエントレイヤーとは独立）。 */
export interface PresetConfig {
  id: string;
  name: string;
  icon?: string;
  mode: PresetMode;
  volume: number;
  procedural?: {
    algorithm: NoiseType;
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
  ambientPresets: AmbientPreset[];
  chimePresets: PresetConfig[];
  pomodoro: PomodoroConfig;
  lastUsed: {
    background: BackgroundConfig;
    beat: BeatConfig;
    beatMode: BeatMode;
    masterVolume: number;
    /** ユーザーが手動でコントロールを操作すると null になります。 */
    activePresetId: string | null;
  };
}

export type PlaybackStatus = 'stopped' | 'playing';

export interface PlaybackState {
  status: PlaybackStatus;
  /** 背景音レイヤーが再生中かどうか。ビートレイヤーとは独立しています。 */
  backgroundActive: boolean;
  /** ビートレイヤーが再生中かどうか。背景音レイヤーとは独立しています。 */
  beatActive: boolean;
  beatMode: BeatMode;
  activePresetId: string | null;
  currentTimeSec: number;
}

// ---- UI から extension へ ----
export type UiToExtMessage =
  | { type: 'ui:ready' }
  | { type: 'ui:requestState' }
  | { type: 'ui:applyPreset'; presetId: string }
  | { type: 'ui:play' }
  | { type: 'ui:stop' }
  | { type: 'ui:setBackground'; background: BackgroundConfig }
  | { type: 'ui:setBeat'; beat: BeatConfig }
  | { type: 'ui:setBeatMode'; mode: BeatMode }
  | { type: 'ui:setMasterVolume'; value: number }
  | { type: 'ui:selectAudioFile' }
  | { type: 'ui:setCustomCode'; code: string; params: Record<string, number> }
  | { type: 'ui:savePreset'; preset: AmbientPreset }
  | { type: 'ui:deletePreset'; presetId: string }
  | { type: 'ui:resetPresets' }
  | { type: 'ui:updatePomodoroConfig'; pomodoro: PomodoroConfig }
  | { type: 'ui:pomodoroStart' }
  | { type: 'ui:pomodoroPause' }
  | { type: 'ui:pomodoroReset' }
  | { type: 'ui:pomodoroSkipPhase' }
  | { type: 'ui:pomodoroSetRemaining'; remainingSec: number }
  | { type: 'ui:previewChime'; presetId: string };

// ---- extension から UI へ ----
export type ExtToUiMessage =
  | { type: 'ext:stateSync'; settings: WhiteNoiseSettings; pomodoro: PomodoroState; playback: PlaybackState }
  | { type: 'ext:playbackState'; playback: PlaybackState }
  | { type: 'ext:pomodoroTick'; pomodoro: PomodoroState; remainingSec: number; totalSec: number }
  | { type: 'ext:fileSelected'; fileName: string; fsPath: string }
  | { type: 'ext:error'; message: string; code?: string };

// ---- extension から engine へ ----
export type ResolvedBackgroundConfig = BackgroundConfig & { fileBytes?: Uint8Array };
export interface ResolvedLiveMix {
  background: ResolvedBackgroundConfig;
  beat: BeatConfig;
  beatMode: BeatMode;
  volume: number;
}
export type ResolvedEnginePreset = PresetConfig & { fileBytes?: Uint8Array };

export type ExtToEngineMessage =
  | { type: 'eng:play'; mix: ResolvedLiveMix }
  | { type: 'eng:playOneShot'; preset: ResolvedEnginePreset }
  | { type: 'eng:stop' };

// ---- engine から extension へ ----
export type EngineToExtMessage =
  | { type: 'eng:ready' }
  | { type: 'eng:playbackStarted' }
  | { type: 'eng:playbackError'; layer: 'background' | 'beat'; message: string }
  | { type: 'eng:backgroundEnded' };
