// @vscode/test-electron の runTests() は Windows で `shell: true` と未クオートの
// 文字列連結で子プロセスを起動するため、リポジトリのパスにスペースが含まれていると
// （このリポジトリの "local repos" のように）そこで引数が分割されて壊れます。
// ここでは downloadAndUnzipVSCode() だけを借りて、実際の起動は shell を使わず
// 配列のまま spawn することで、パス中のスペースをそのまま 1 引数として扱います。
const path = require('path');
const os = require('os');
const cp = require('child_process');
const { downloadAndUnzipVSCode } = require('@vscode/test-electron');

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '..');
  const extensionTestsPath = path.resolve(__dirname, '..', 'out', 'test', 'integration', 'index.js');

  const vscodeExecutablePath = await downloadAndUnzipVSCode();

  const userDataDir = path.join(os.tmpdir(), 'white-noise-vscode-test-user-data');
  const extensionsDir = path.join(os.tmpdir(), 'white-noise-vscode-test-extensions');

  const args = [
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    `--extensionDevelopmentPath=${extensionDevelopmentPath}`,
    `--extensionTestsPath=${extensionTestsPath}`,
    `--user-data-dir=${userDataDir}`,
    `--extensions-dir=${extensionsDir}`,
  ];

  // ELECTRON_RUN_AS_NODE が継承されていると、Code.exe（実体は Electron）が
  // アプリを起動せずただの Node.js として動いてしまうため明示的に外します。
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const child = cp.spawn(vscodeExecutablePath, args, { stdio: 'inherit', env });

  const exitCode = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', resolve);
  });

  process.exit(exitCode ?? 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
