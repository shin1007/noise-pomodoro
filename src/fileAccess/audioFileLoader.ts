import * as vscode from 'vscode';
import type { HostStrings } from '../i18n/host';

const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
  aac: 'audio/aac',
};

const MAX_RECOMMENDED_BYTES = 50 * 1024 * 1024;
// 推奨上限を超えても再生自体は許容しますが、拡張機能ホストのメモリを丸ごと使い切って
// クラッシュさせないよう、絶対的な上限を設けます（ファイル全体をバッファに読み込むため）。
const MAX_ALLOWED_BYTES = 250 * 1024 * 1024;

export interface SelectedAudioFile {
  fsPath: string;
  fileName: string;
  mimeType: string;
}

export async function selectAudioFile(strings: HostStrings): Promise<SelectedAudioFile | undefined> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: strings.fileDialog.selectFileLabel,
    filters: { [strings.fileDialog.audioFilesFilterLabel]: Object.keys(MIME_BY_EXTENSION) },
  });
  const uri = uris?.[0];
  if (!uri) {
    return undefined;
  }
  const ext = uri.fsPath.split('.').pop()?.toLowerCase() ?? '';
  return {
    fsPath: uri.fsPath,
    fileName: uri.fsPath.split(/[\\/]/).pop() ?? uri.fsPath,
    mimeType: MIME_BY_EXTENSION[ext] ?? 'application/octet-stream',
  };
}

/**
 * 毎回キャッシュせずにディスクから直接読み直します。そうすることで、ファイルが更新されたときも
 * 再生内容がずれません。また、Settings Sync が fsPath だけを別マシンに持っていった場合も、
 * 古いキャッシュ音声を鳴らすのではなく、分かりやすい「見つからない」エラーになります。
 */
export async function readAudioFile(fsPath: string, strings: HostStrings): Promise<Uint8Array> {
  const uri = vscode.Uri.file(fsPath);
  const stat = await vscode.workspace.fs.stat(uri);
  if (stat.size > MAX_ALLOWED_BYTES) {
    const mb = Math.round(stat.size / (1024 * 1024));
    throw new Error(strings.fileDialog.fileTooLarge(mb, MAX_ALLOWED_BYTES / (1024 * 1024)));
  }
  if (stat.size > MAX_RECOMMENDED_BYTES) {
    void vscode.window.showWarningMessage(`Noise Pomodoro: ${strings.fileDialog.fileLargeWarning(fsPath)}`);
  }
  return vscode.workspace.fs.readFile(uri);
}
