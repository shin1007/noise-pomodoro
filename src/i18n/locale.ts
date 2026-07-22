// UI（Webview）と拡張機能ホストの両バンドルから参照する、対応ロケールの定義です。
// protocol.ts と同じ階層に置き、型のみでなく実行時ロジック（resolveLocale）も含みますが、
// DOM / vscode API に依存しない純粋な関数のため、どちらのバンドルに含めても問題ありません。

export type Locale = 'ja' | 'en' | 'fr' | 'zh' | 'es';

// 未対応言語・判別不能な場合は英語にフォールバックします。
export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['ja', 'en', 'fr', 'zh', 'es'];

// vscode.env.language は 'en-us' や 'zh-cn' のような BCP47 タグを返すため、前方一致で判定します。
// 中国語は簡体字のみ対応し、'zh-tw' 等も含めて 'zh' 一系統に丸めます。
const PREFIX_TO_LOCALE: ReadonlyArray<readonly [string, Locale]> = [
  ['en', 'en'],
  ['fr', 'fr'],
  ['zh', 'zh'],
  ['es', 'es'],
  ['ja', 'ja'],
];

export function resolveLocale(raw: string | undefined): Locale {
  const lower = (raw ?? '').toLowerCase();
  for (const [prefix, locale] of PREFIX_TO_LOCALE) {
    if (lower.startsWith(prefix)) {
      return locale;
    }
  }
  return DEFAULT_LOCALE;
}
