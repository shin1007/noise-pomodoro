import * as vscode from 'vscode';

const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
  aac: 'audio/aac',
};

const MAX_RECOMMENDED_BYTES = 50 * 1024 * 1024;

export interface SelectedAudioFile {
  fsPath: string;
  fileName: string;
  mimeType: string;
}

export async function selectAudioFile(): Promise<SelectedAudioFile | undefined> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: '音声ファイルを選択',
    filters: { 'Audio files': Object.keys(MIME_BY_EXTENSION) },
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
 * Reads bytes fresh from disk on every call (rather than caching) so playback stays correct
 * if the file changes or -- after Settings Sync roams only the fsPath to another machine --
 * fails with a clear "not found" error instead of playing stale cached audio.
 */
export async function readAudioFile(fsPath: string): Promise<Uint8Array> {
  const uri = vscode.Uri.file(fsPath);
  const stat = await vscode.workspace.fs.stat(uri);
  if (stat.size > MAX_RECOMMENDED_BYTES) {
    void vscode.window.showWarningMessage(`White Noise: "${fsPath}" is larger than 50MB — ambient loop files are usually much shorter.`);
  }
  return vscode.workspace.fs.readFile(uri);
}
