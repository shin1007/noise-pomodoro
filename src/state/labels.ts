import type { BackgroundConfig } from '../protocol';
import type { HostStrings } from '../i18n/host';

/** 背景音設定を、ステータスバー表示などで使う短いラベルに変換します。 */
export function backgroundLabel(background: BackgroundConfig, strings: HostStrings): string {
  switch (background.mode) {
    case 'procedural':
      return background.noiseType ?? '';
    case 'file':
      return strings.backgroundLabel.file;
    case 'custom':
      return strings.backgroundLabel.custom;
    case 'off':
      return '';
  }
}
