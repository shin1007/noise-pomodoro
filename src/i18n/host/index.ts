// 拡張機能ホスト（dist/extension.js）だけが使う文言辞書です。Webview 側の文言（src/i18n/ui）
// とは意図的に共有しません（バンドルごとに完結させるため）。"Noise Pomodoro" というブランド名
// 自体は VS Code 本体を翻訳しないのと同様、各ロケールでも訳さず据え置いています。

import type { Locale } from '../locale';
import ja from './ja';
import en from './en';
import fr from './fr';
import zh from './zh';
import es from './es';

export interface HostStrings {
  chrome: {
    /** <html lang="..."> に使う BCP47 タグです。 */
    htmlLang: string;
    /** Webview パネルのタブタイトル / <title> です。 */
    panelTitle: string;
    loading: string;
  };
  statusBar: {
    idleTooltipQuickPlay: string;
    idleTooltipOpenPanel: (panelTitle: string) => string;
    presetPlayingTooltip: (name: string) => string;
    presetPlayingTooltipWithTimer: (name: string, mmss: string) => string;
    pomodoroTooltip: (phaseLabel: string) => string;
    phaseLabel: {
      focus: string;
      break: string;
    };
  };
  toast: {
    panelClosedStoppedPlayback: string;
    cannotPlay: (message: string) => string;
    unknownPreset: (presetId: string) => string;
    binauralLabel: string;
    isochronicLabel: string;
    focusPhaseEndDefault: string;
    breakPhaseEndDefault: string;
  };
  fileDialog: {
    selectFileLabel: string;
    audioFilesFilterLabel: string;
    fileTooLarge: (mb: number, maxMb: number) => string;
    fileLargeWarning: (fsPath: string) => string;
  };
  scriptRunner: {
    workspaceNotTrusted: string;
    featureDisabled: string;
    scriptError: (message: string) => string;
  };
  backgroundLabel: {
    file: string;
    custom: string;
  };
}

export const HOST_STRINGS: Record<Locale, HostStrings> = { ja, en, fr, zh, es };
