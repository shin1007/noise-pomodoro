// Webview 起動時に一度だけロケールを確定し、以後は再解決しません（VS Code の表示言語変更には
// リロードが必要なため、パネル生成のたびに解決すれば十分です）。ロケール自体は appHtml.ts が
// window.__INITIAL_LOCALE__ として注入します（window.__WORKLET_URI__ と同じパターン）。

import type { Locale } from '../../i18n/locale';
import { UI_STRINGS } from '../../i18n/ui';

declare global {
  interface Window {
    __INITIAL_LOCALE__?: string;
  }
}

const locale: Locale = (window.__INITIAL_LOCALE__ as Locale | undefined) ?? 'ja';

export const strings = UI_STRINGS[locale];
