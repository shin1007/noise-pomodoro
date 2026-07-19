import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * ユーザー作成のフェーズ終了スクリプトを実行します。これは extension host（実際の Node
 * プロセス）内で動くため、音声カスタムコードの sandbox（AudioWorkletGlobalScope には
 * Node / DOM API がない）とは異なり、`new Function` の中身から `process` などの Node
 * グローバルに到達できる可能性があります。そのため明示的な opt-in 設定で有効化し、
 * 実行内容はすべて出力チャンネルへ記録します。コードはユーザー自身の GUI から保存された
 * globalState の設定だけを使い、ワークスペース内ファイルは参照しないため、リモートリポジトリ
 * 起因の RCE ベクターにはなりません。詳細なリスク整理は実装計画の設計メモを参照してください。
 */
export function runPhaseEndScript(code: string, phase: 'focus' | 'break'): void {
  // 信頼していないワークスペースでは、extension host で任意コードを実行するこの機能を止めます。
  // scriptSource 自体は globalState 由来（ワークスペース外）ですが、この機能は executeCommand で
  // 任意コマンドを起動できるため、信頼済みのワークスペースに限定するのが安全です。
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showWarningMessage('White Noise: フェーズ終了スクリプトは、信頼済みのワークスペースでのみ実行されます。現在のワークスペースは信頼されていないためスキップしました。');
    return;
  }
  const enabled = vscode.workspace.getConfiguration('whiteNoise').get<boolean>('enablePhaseEndScripts', false);
  if (!enabled) {
    void vscode.window.showWarningMessage('White Noise: フェーズ終了スクリプトは設定されていますが無効です。実行するには設定で "whiteNoise.enablePhaseEndScripts" を有効にしてください。');
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
    const message = `フェーズ終了スクリプトのエラー: ${(err as Error).message}`;
    logger.error(message);
    void vscode.window.showErrorMessage(`White Noise: ${message}`);
  }
}
