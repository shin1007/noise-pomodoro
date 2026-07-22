// Webview UI（dist/media/ui.js）だけが使う文言辞書です。拡張機能ホスト側の文言（statusBar・
// トースト等）は src/i18n/host にあり、意図的に共有しません（バンドルごとに完結させるため）。

import type { NoiseType } from '../../protocol';
import type { Locale } from '../locale';
import ja from './ja';
import en from './en';
import fr from './fr';
import zh from './zh';
import es from './es';

export type BandKey = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface UiStrings {
  loading: string;
  common: {
    off: string;
  };
  brainwaveBands: Record<BandKey, string>;
  noiseTypes: Record<NoiseType, string>;
  background: {
    heading: string;
    fileMode: string;
    customMode: string;
    fileLabel: (fileName: string) => string;
    noFileSelected: string;
    changeFile: string;
    selectFile: string;
    customCodeHint: string;
    apply: string;
  };
  beat: {
    heading: string;
    baseFrequencyLabel: string;
    binauralMode: string;
    isochronicMode: string;
  };
  controls: {
    volumeLabel: string;
  };
  header: {
    noNoise: string;
    fileBackgroundLabel: string;
    customBackgroundLabel: string;
    iconPlaceholder: string;
    namePlaceholder: string;
    descriptionPlaceholder: string;
    resetPresetsButton: string;
    applyToPresetButton: string;
  };
  pomodoroSettings: {
    modalTitle: string;
    focusDuration: string;
    breakDuration: string;
    timeMinutesLabel: string;
    noneOption: string;
    soundLabel: string;
    autoAdvanceLabel: string;
    toastOnEndLabel: string;
    playEndSoundLabel: string;
  };
  timer: {
    heading: string;
    none: string;
    minutesUnit: (n: number) => string;
    start: string;
    resume: string;
    pause: string;
    reset: string;
    skipPhase: string;
    pomodoroToggle: (on: boolean) => string;
  };
}

export const UI_STRINGS: Record<Locale, UiStrings> = { ja, en, fr, zh, es };
