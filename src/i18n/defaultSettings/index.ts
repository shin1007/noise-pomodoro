// state/settings.ts の初期シード（プリセット名・チャイム名・ポモドーロ終了時のデフォルト
// トースト文言）専用の辞書です。これらは初回インストール時（または設定が壊れていて既定値へ
// リセットされる時）にだけ使われ、以後はユーザーが自由に編集できる設定データになります。
// ロケールを変えても、既にシード済みのデータを遡って翻訳し直すことはありません。

import type { Locale } from '../locale';
import ja from './ja';
import en from './en';
import fr from './fr';
import zh from './zh';
import es from './es';

export interface DefaultSettingsStrings {
  presets: {
    focus: { name: string; description: string };
    creative: { name: string; description: string };
    study: { name: string; description: string };
    meditation: { name: string; description: string };
    sleep: { name: string; description: string };
    file1: { name: string; description: string };
    custom1: { name: string; description: string };
  };
  chimes: {
    bell: string;
    beep: string;
    marimba: string;
  };
  phaseEnd: {
    focusToastMessage: string;
    breakToastMessage: string;
  };
}

export const DEFAULT_SETTINGS_STRINGS: Record<Locale, DefaultSettingsStrings> = { ja, en, fr, zh, es };
