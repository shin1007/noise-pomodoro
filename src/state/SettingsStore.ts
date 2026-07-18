import * as vscode from 'vscode';
import type { WhiteNoiseSettings } from '../protocol';
import { SETTINGS_KEY } from './settings';
import { migrateSettings } from './migrations';

/**
 * 設定全体を JSON として 1 つの globalState キーに保存します。setKeysForSync で同期候補には
 * しますが、Settings Sync が有効な場合にだけマシン間で実際に同期されます。無効でも VS Code
 * の通常の global state 保存先には端末ごとに永続化されます。
 */
export class SettingsStore {
  private settings: WhiteNoiseSettings;

  constructor(private readonly context: vscode.ExtensionContext) {
    context.globalState.setKeysForSync([SETTINGS_KEY]);
    this.settings = migrateSettings(context.globalState.get<unknown>(SETTINGS_KEY));
  }

  get(): WhiteNoiseSettings {
    return this.settings;
  }

  /** get() が指している現在の内容を書き込みます。呼び出し側は preset / pomodoro を
   * その場で更新し（extension.ts 全体で同じ方針）、最後にこれを呼んで永続化します。 */
  async persist(): Promise<void> {
    await this.context.globalState.update(SETTINGS_KEY, this.settings);
  }

  async save(next: WhiteNoiseSettings): Promise<void> {
    this.settings = next;
    await this.persist();
  }
}
