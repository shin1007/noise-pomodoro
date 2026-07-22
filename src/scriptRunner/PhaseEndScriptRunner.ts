import * as vscode from 'vscode';
import type { HostStrings } from '../i18n/host';
import { logger } from '../utils/logger';

/**
 * ユーザー作成のフェーズ終了スクリプトを実行します。これは extension host（実際の Node
 * プロセス）内で動くため、音声カスタムコードの sandbox（AudioWorkletGlobalScope には
 * Node / DOM API がない）とは異なり、`new Function` の中身から `process` などの Node
 * グローバルに到達できる可能性があります。リスクは次の4点で抑えています。
 * (1) 明示的な opt-in 設定（whiteNoise.enablePhaseEndScripts）でのみ有効化する、
 * (2) 信頼済みワークスペースでのみ実行する（下記 isTrusted チェック）、
 * (3) スクリプトへ渡す `vscode` 引数は showInformationMessage/showWarningMessage/
 *     executeCommand だけを持つ最小限の API に限定する、
 * (4) 実行内容はすべて出力チャンネルへ記録する。
 * コードはユーザー自身の GUI から保存された globalState の設定だけを使い、ワークスペース内
 * ファイルは参照しないため、リモートリポジトリ起因の RCE ベクターにはなりません。
 */
export function runPhaseEndScript(code: string, phase: 'focus' | 'break', strings: HostStrings): void {
  // 信頼していないワークスペースでは、extension host で任意コードを実行するこの機能を止めます。
  // scriptSource 自体は globalState 由来（ワークスペース外）ですが、この機能は executeCommand で
  // 任意コマンドを起動できるため、信頼済みのワークスペースに限定するのが安全です。
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showWarningMessage(`White Noise: ${strings.scriptRunner.workspaceNotTrusted}`);
    return;
  }
  const enabled = vscode.workspace.getConfiguration('whiteNoise').get<boolean>('enablePhaseEndScripts', false);
  if (!enabled) {
    void vscode.window.showWarningMessage(`White Noise: ${strings.scriptRunner.featureDisabled}`);
    return;
  }

  const api = {
    showInformationMessage: (msg: string) => void vscode.window.showInformationMessage(msg),
    showWarningMessage: (msg: string) => void vscode.window.showWarningMessage(msg),
    executeCommand: (command: string, ...args: unknown[]) => void vscode.commands.executeCommand(command, ...args),
  };

  logger.info(`Running phase-end script for "${phase}" phase.`);
  try {
    // eslint-disable-next-line no-new-func -- ユーザー作成のフェーズ終了スクリプトを意図的に実行します。
    const fn = new Function('vscode', 'phase', code) as (vscodeApi: typeof api, phaseName: string) => void;
    fn(api, phase);
  } catch (err) {
    const message = strings.scriptRunner.scriptError((err as Error).message);
    logger.error(message);
    void vscode.window.showErrorMessage(`White Noise: ${message}`);
  }
}
