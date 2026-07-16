import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * Runs a user-authored phase-end script. This executes inside the extension host (a real Node
 * process), so unlike the audio custom-code sandbox (AudioWorkletGlobalScope, no Node/DOM APIs)
 * this is NOT meaningfully sandboxed -- `new Function` bodies can still reach Node globals like
 * `process`. It is gated behind an explicit opt-in setting for that reason, and every run is
 * logged to the output channel. Code only ever comes from the user's own globalState-stored
 * config (via their own GUI), never from a workspace file, so this is not a remote-repo RCE
 * vector -- see the design notes in the implementation plan for the full risk discussion.
 */
export function runPhaseEndScript(code: string, phase: 'focus' | 'break'): void {
  const enabled = vscode.workspace.getConfiguration('whiteNoise').get<boolean>('enablePhaseEndScripts', false);
  if (!enabled) {
    void vscode.window.showWarningMessage('White Noise: a phase-end script is configured but disabled. Enable "whiteNoise.enablePhaseEndScripts" in settings to run it.');
    return;
  }

  const api = {
    showInformationMessage: (msg: string) => void vscode.window.showInformationMessage(msg),
    showWarningMessage: (msg: string) => void vscode.window.showWarningMessage(msg),
    executeCommand: (command: string, ...args: unknown[]) => void vscode.commands.executeCommand(command, ...args),
  };

  logger.info(`Running phase-end script for "${phase}" phase.`);
  try {
    // eslint-disable-next-line no-new-func -- intentional: user-authored phase-end script.
    const fn = new Function('vscode', 'phase', code) as (vscodeApi: typeof api, phaseName: string) => void;
    fn(api, phase);
  } catch (err) {
    const message = `Phase-end script error: ${(err as Error).message}`;
    logger.error(message);
    void vscode.window.showErrorMessage(`White Noise: ${message}`);
  }
}
