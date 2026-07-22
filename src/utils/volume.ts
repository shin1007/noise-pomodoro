/**
 * 音量（masterVolume, 0〜1）のハード上限です。大音量による耳への負担を避けるため、
 * スライダー操作・プリセット選択・保存済み設定の適用のいずれでもこれを超えないようにします。
 * extension host（extension.ts）と Webview（controls.ts / state.ts）の両方から参照します。
 */
export const MAX_MASTER_VOLUME = 0.5;
