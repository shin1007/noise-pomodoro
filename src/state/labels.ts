import type { BackgroundConfig } from '../protocol';

/** 背景音設定を、ステータスバー表示などで使う短い日本語ラベルに変換します。 */
export function backgroundLabel(background: BackgroundConfig): string {
  switch (background.mode) {
    case 'procedural':
      return background.noiseType ?? '';
    case 'file':
      return 'ファイル';
    case 'custom':
      return 'カスタム';
    case 'off':
      return '';
  }
}
