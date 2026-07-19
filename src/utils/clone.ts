/**
 * JSON シリアライズ可能な値をディープコピーします。設定オブジェクト（lastUsed / preset 等）を
 * 参照共有せずに複製する用途で、extension・Webview の両バンドルから共有します。
 * 関数・undefined・循環参照は保持できない点に注意してください（この用途では発生しません）。
 */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
