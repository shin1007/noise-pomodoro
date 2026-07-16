import * as vscode from 'vscode';
import type { WhiteNoiseSettings } from '../protocol';
import { SETTINGS_KEY } from './settings';
import { migrateSettings } from './migrations';

/**
 * Single globalState key holding the whole settings blob as JSON, roamed via setKeysForSync
 * (only actually syncs across machines if the user has Settings Sync turned on; otherwise it
 * still persists per-machine via VS Code's normal global state storage).
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

  /** Writes whatever is currently referenced by get() -- callers mutate preset/pomodoro objects
   * in place (same pattern used throughout extension.ts) and then call this to persist. */
  async persist(): Promise<void> {
    await this.context.globalState.update(SETTINGS_KEY, this.settings);
  }

  async save(next: WhiteNoiseSettings): Promise<void> {
    this.settings = next;
    await this.persist();
  }
}
